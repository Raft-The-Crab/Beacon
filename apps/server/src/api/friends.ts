/**
 * Friends System - API Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

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
        user: { select: { id: true, username: true, discriminator: true, avatar: true } },
        friend: { select: { id: true, username: true, discriminator: true, avatar: true } }
      }
    });

    const formatted = friends.map(f => (f.userId === userId ? f.friend : f.user));
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
        user: { select: { id: true, username: true, discriminator: true, avatar: true } }
      }
    });

    return res.json(pending.map(p => p.user));
  } catch (error) {
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
    const { username, discriminator } = req.body;
    if (!username || !discriminator || typeof username !== 'string' || typeof discriminator !== 'string') {
      return res.status(400).json({ error: 'Invalid username or discriminator' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { username, discriminator }
    });

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
      return res.status(400).json({ error: 'Friendship or request already exists' });
    }

    const friendRequest = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetId,
        status: 0
      },
      include: {
        friend: { select: { id: true, username: true, discriminator: true, avatar: true } },
        user: { select: { id: true, username: true, discriminator: true, avatar: true } }
      }
    });

    // Create notification for the recipient
    try {
      const senderName = friendRequest.user.username;
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
        await prisma.notification.create({
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

    // Create notification for the requester
    try {
      const acceptorName = (await prisma.user.findUnique({ where: { id: userId }, select: { username: true, avatar: true } }))?.username || 'Unknown';
      const acceptorAvatar = (await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } }))?.avatar;
      
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: friendId,
          type: 'FRIEND_ACCEPTED',
          read: false,
          metadata: {
            path: ['relatedUserId'],
            equals: userId
          }
        }
      });

      if (!existingNotif) {
        await prisma.notification.create({
          data: {
            userId: friendId,
            type: 'FRIEND_ACCEPTED',
            title: `${acceptorName} accepted your friend request`,
            body: `You're now friends`,
            read: false,
            metadata: { relatedUserId: userId, avatarUrl: acceptorAvatar },
            iconUrl: acceptorAvatar
          }
        });
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
