/**
 * Friends System - API Routes
 */

import { Router, Request } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get user's friends
router.get('/', authenticate, async (req: Request, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
router.get('/pending', authenticate, async (req: Request, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
router.post('/request', authenticate, async (req: Request, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { username, discriminator } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
          { userId: userId, friendId: targetId },
          { userId: targetId, friendId: userId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Request already exists' });
    }

    const friendRequest = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetId,
        status: 0
      },
      include: {
        friend: { select: { id: true, username: true, discriminator: true, avatar: true } }
      }
    });

    return res.json(friendRequest);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.put('/:friendId/accept', authenticate, async (req: Request, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { friendId } = req.params;
    if (typeof friendId !== 'string') return res.status(400).json({ error: 'Invalid friendId' });

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const friendRequest = await prisma.friendship.findFirst({
      where: { userId: friendId, friendId: userId, status: 0 }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friendship.update({
      where: { id: friendRequest.id },
      data: { status: 1 }
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend / decline request
router.delete('/:friendId', authenticate, async (req: Request, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { friendId } = req.params;
    if (typeof friendId !== 'string') return res.status(400).json({ error: 'Invalid friendId' });

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
