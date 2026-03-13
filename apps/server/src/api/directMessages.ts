/**
 * Beacon Direct Messages API
 * Features: 1-on-1 and Group DMs
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ChannelType } from '@prisma/client';

const router = Router();

function orderRecipientsForClient<T extends { id: string }>(recipients: T[], currentUserId: string) {
  return [...recipients].sort((left, right) => {
    const leftIsSelf = left.id === currentUserId
    const rightIsSelf = right.id === currentUserId
    if (leftIsSelf === rightIsSelf) return 0
    return leftIsSelf ? 1 : -1
  })
}

function serializeDmChannel<T extends { recipients?: Array<{ id: string }> }>(channel: T, currentUserId: string) {
  return {
    ...channel,
    recipients: orderRecipientsForClient(channel.recipients || [], currentUserId)
  }
}

// Get all DM channels for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const dmChannels = await prisma.channel.findMany({
      where: {
        OR: [
          { type: ChannelType.DM },
          { type: ChannelType.GROUP_DM }
        ],
        recipients: {
          some: { id: userId }
        }
      },
      include: {
        recipients: {
          select: {
            id: true,
            username: true,
            avatar: true,
            customStatus: true,
          }
        },
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    return res.json(dmChannels.map((channel) => serializeDmChannel(channel, userId)));
  } catch (error: any) {
    console.error('Failed to get DM channels. name:', error.name, 'message:', error.message);
    if (error.meta) console.error('Prisma Meta:', error.meta);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create 1-on-1 or Group DM
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { userIds, name } = req.body; // array of user IDs

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: 'Recipient array required' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  const allMembers = [...new Set([...userIds, userId])];

  try {
    // If it's 1-on-1, check if channel already exists
    if (allMembers.length === 2) {
      const existing = await prisma.channel.findFirst({
        where: {
          type: ChannelType.DM,
          AND: [
            { recipients: { some: { id: allMembers[0] } } },
            { recipients: { some: { id: allMembers[1] } } }
          ]
        },
        include: {
          recipients: {
            select: {
              id: true,
              username: true,
              avatar: true,
              customStatus: true,
            }
          },
        }
      });
      if (existing) return res.json(serializeDmChannel(existing, userId));
    }

    // Create new DM channel
    const channel = await prisma.channel.create({
      data: {
        name: name || '',
        type: allMembers.length > 2 ? ChannelType.GROUP_DM : ChannelType.DM,
        recipients: {
          connect: allMembers.map(id => ({ id }))
        }
      },
      include: {
        recipients: true
      }
    });

    return res.status(201).json(serializeDmChannel(channel, userId));
  } catch (error) {
    console.error('Failed to create DM channel', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
