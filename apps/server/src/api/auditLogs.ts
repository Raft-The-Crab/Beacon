/**
 * Beacon Audit Logs System
 * Tracks administrative actions (guild settings, roles, bans, kicks)
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Track Audit Log Entry
export async function createAuditLog(guildId: string, userId: string, action: number, targetId: string, reason: string, changes?: any) {
  try {
    if (!prisma) return;
    await prisma.auditLog.create({
      data: {
        guildId,
        userId,
        action,
        targetId,
        reason,
        changes: changes || null,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log', error);
  }
}

// Get Audit Logs
router.get('/:guildId', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { guildId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  // Verify permission
  const guild = await prisma.guild.findFirst({
    where: { id: guildId, ownerId: userId }
  });
  if (!guild) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where: { guildId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return res.json(logs);
  } catch (error) {
    console.error('Audit log fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
