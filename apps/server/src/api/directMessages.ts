/**
 * Beacon Direct Messages API
 * Features: 1-on-1 and Group DMs
 */

import { Router, Request } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all DM channels for current user
router.get('/', authenticate, async (req: Request, res) => {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const dmChannels = await (prisma.channel as any).findMany({
      where: {
        OR: [
          { type: 8 }, // DM
          { type: 9 }  // GROUP_DM
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
        // @ts-ignore
        lastMessageAt: 'desc'
      }
    });

    return res.json(dmChannels);
  } catch (error) {
    console.error('Failed to get DM channels', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create 1-on-1 or Group DM
router.post('/', authenticate, async (req: Request, res) => {
  // @ts-ignore
  const userId = req.user?.id;
  const { userIds, name } = req.body; // array of user IDs

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: 'Single recipient or array required' });

  const allMembers = [...new Set([...userIds, userId])];

  try {
    // If it's 1-on-1, check if channel already exists
    if (allMembers.length === 2) {
      const existing = await (prisma.channel as any).findFirst({
        where: {
          type: 8, // DM
          AND: [
             { recipients: { some: { id: allMembers[0] } } },
             { recipients: { some: { id: allMembers[1] } } }
          ]
        }
      });
      if (existing) return res.json(existing);
    }

    // Create new DM channel
    const channel = await (prisma.channel as any).create({
      data: {
        name: name || '',
        type: allMembers.length > 2 ? 9 : 8, // GROUP_DM : DM
        recipients: {
          connect: allMembers.map(id => ({ id }))
        }
      },
      include: {
        recipients: true
      }
    });

    return res.status(201).json(channel);
  } catch (error) {
    console.error('Failed to create DM channel', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
