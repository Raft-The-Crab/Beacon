/**
 * Friends System - API Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { publishGatewayEvent } from '../services/gatewayPublisher';
import { ChannelType } from '@prisma/client';
import { generateShortId } from '../utils/id';

const router = Router();

const friendUserSelect = {
  id: true,
  username: true,
  displayName: true,
  discriminator: true,
  avatar: true,
  banner: true,
  bio: true,
  customStatus: true,
  badges: true,
  isBeaconPlus: true,
  avatarDecorationId: true,
  profileEffectId: true,
  createdAt: true,
} as const

// Get user's friends
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 1 },
          { friendId: userId, status: 1 }
        ]
      },
      include: {
        user: { select: friendUserSelect },
        friend: { select: friendUserSelect }
      }
    });

    const byId = new Map<string, any>()
    for (const friendship of friends) {
      const other = friendship.userId === userId ? friendship.friend : friendship.user
      if (other?.id) byId.set(other.id, other)
    }

    const formatted = Array.from(byId.values())
    return res.json(formatted);
  } catch (error) {
    console.error('Get friends error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending friend requests
router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    const pending = await prisma.friendship.findMany({
      where: { friendId: userId, status: 0 },
      include: {
        user: { select: friendUserSelect }
      }
    });

    return res.json(pending.map(p => p.user));
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Search current user's friends by username/tag
router.get('/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const query = String(req.query?.query || '').trim().toLowerCase();
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 1 },
          { friendId: userId, status: 1 }
        ]
      },
      include: {
        user: { select: friendUserSelect },
        friend: { select: friendUserSelect }
      }
    });

    const deduped = new Map<string, any>();
    for (const relation of friendships) {
      const candidate = relation.userId === userId ? relation.friend : relation.user;
      if (candidate?.id) deduped.set(candidate.id, candidate);
    }

    const rows = Array.from(deduped.values());
    if (!query) return res.json(rows);

    const filtered = rows.filter((friend) => {
      const username = String(friend?.username || '').toLowerCase();
      const discriminator = String(friend?.discriminator || '0000').toLowerCase();
      return username.includes(query) || `${username}#${discriminator}`.includes(query);
    });

    return res.json(filtered);
  } catch (error) {
    console.error('Search friends error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request
router.post('/request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    // Validate input
    const rawUsername = req.body?.username;
    const rawDiscriminator = req.body?.discriminator;

    if (!rawUsername || typeof rawUsername !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const username = rawUsername.trim();
    const discriminator = typeof rawDiscriminator === 'string' ? rawDiscriminator.trim() : '';

    let targetUser: any = null;

    if (discriminator) {
      targetUser = await prisma.user.findFirst({
        where: {
          username: { equals: username, mode: 'insensitive' },
          discriminator,
        }
      });
    } else {
      const matches = await prisma.user.findMany({
        where: { username: { equals: username, mode: 'insensitive' } },
        take: 2,
      });

      if (matches.length > 1) {
        return res.status(409).json({ error: 'Multiple users match this username. Include discriminator (name#0000).' });
      }

      targetUser = matches[0] || null;
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: 'Cannot add yourself' });
    }

    const targetId = targetUser.id;
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetId },
          { userId: targetId, friendId: userId }
        ]
      }
    });

    if (existing) {
      // If the target already sent a pending request to the current user, accept it.
      if (existing.status === 0 && existing.userId === targetId && existing.friendId === userId) {
        await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 1 },
        })

        // Auto-create DM channel
        try {
          const extant = await prisma.channel.findFirst({
            where: {
              type: ChannelType.DM,
              AND: [
                { recipients: { some: { id: userId } } },
                { recipients: { some: { id: targetId } } }
              ]
            }
          });
          if (!extant) {
            const newChannel = await prisma.channel.create({
              data: {
                id: generateShortId('c', 12),
                name: '',
                type: ChannelType.DM,
                recipients: { connect: [{ id: userId }, { id: targetId }] }
              },
              include: { recipients: { select: friendUserSelect } }
            });
            await publishGatewayEvent('CHANNEL_CREATE', newChannel, null, [userId, targetId]);
          }
        } catch (dmErr) {
          console.error('Failed to auto-create DM channel:', dmErr);
        }

        return res.json({
          success: true,
          accepted: true,
          friendshipId: existing.id,
          userId,
          friendId: targetId,
        })
      }

      if (existing.status === 0) {
        return res.status(409).json({ error: 'Friend request already pending' })
      }

      return res.status(409).json({ error: 'Users are already friends' });
    }

    const friendRequest = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetId,
        status: 0
      },
      include: {
        friend: { select: { id: true, username: true, displayName: true, discriminator: true, avatar: true } },
        user: { select: { id: true, username: true, displayName: true, discriminator: true, avatar: true } }
      }
    });

    // Create notification for the recipient
    try {
      const senderName = friendRequest.user.displayName || friendRequest.user.username;
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: targetId,
          type: 'FRIEND_REQUEST',
          read: false,
          metadata: {
            path: ['relatedUserId'],
            equals: userId
          }
        }
      });

      if (!existingNotif) {
        const notification = await prisma.notification.create({
          data: {
            userId: targetId,
            type: 'FRIEND_REQUEST',
            title: `${senderName} sent you a friend request`,
            body: `Accept or decline to manage your friendship`,
            read: false,
            metadata: { relatedUserId: userId, avatarUrl: friendRequest.user.avatar },
            iconUrl: friendRequest.user.avatar
          }
        });

        await publishGatewayEvent('NOTIFICATION_CREATE', {
          id: notification.id,
          type: 'friend_request',
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
          avatarUrl: notification.iconUrl,
          userId,
        }, null, [targetId]);
      }
    } catch (notifError) {
      console.error('Failed to create friend request notification:', notifError);
      // Continue even if notification creation fails
    }

    return res.json(friendRequest);
  } catch (error) {
    console.error('Send friend request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.put('/:friendId/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { friendId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    if (!friendId || typeof friendId !== 'string') {
      return res.status(400).json({ error: 'Invalid friend ID' });
    }

    const friendRequest = await prisma.friendship.findFirst({
      where: { userId: friendId, friendId: userId, status: 0 },
      include: { user: { select: { username: true, avatar: true } } }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friendship.update({
      where: { id: friendRequest.id },
      data: { status: 1 }
    });

    // Auto-create DM channel
    try {
      const extant = await prisma.channel.findFirst({
        where: {
          type: ChannelType.DM,
          AND: [
            { recipients: { some: { id: userId } } },
            { recipients: { some: { id: friendId } } }
          ]
        }
      });
      if (!extant) {
        const newChannel = await prisma.channel.create({
          data: {
            id: generateShortId('c', 12),
            name: '',
            type: ChannelType.DM,
            recipients: { connect: [{ id: userId }, { id: friendId }] }
          },
          include: { recipients: { select: friendUserSelect } }
        });
        await publishGatewayEvent('CHANNEL_CREATE', newChannel, null, [userId, friendId]);
      }
    } catch (dmErr) {
      console.error('Failed to auto-create DM channel on accept:', dmErr);
    }

    // Create notification for the requester
    try {
      const acceptor = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true, avatar: true } });
      const acceptorName = acceptor?.displayName || acceptor?.username || 'Unknown';
      const acceptorAvatar = acceptor?.avatar;
      
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: friendId,
          type: 'SYSTEM_ALERT',
          read: false,
          metadata: {
            path: ['relatedUserId'],
            equals: userId
          }
        }
      });

      if (!existingNotif) {
        const notification = await prisma.notification.create({
          data: {
            userId: friendId,
            type: 'SYSTEM_ALERT',
            title: `${acceptorName} accepted your friend request`,
            body: `You're now friends`,
            read: false,
            metadata: { relatedUserId: userId, avatarUrl: acceptorAvatar },
            iconUrl: acceptorAvatar
          }
        });

        await publishGatewayEvent('NOTIFICATION_CREATE', {
          id: notification.id,
          type: 'friend_accept',
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
          avatarUrl: notification.iconUrl,
          userId,
        }, null, [friendId]);
      }
    } catch (notifError) {
      console.error('Failed to create friend accepted notification:', notifError);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Accept friend request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend / decline request
router.delete('/:friendId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { friendId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
