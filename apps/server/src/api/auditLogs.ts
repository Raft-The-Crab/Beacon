/**
 * Beacon Audit Logs System
 * Tracks administrative actions (guild settings, roles, bans, kicks)
 */

import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Track Audit Log Entry
export async function createAuditLog(guildId: string, userId: string, action: number, targetId: string, reason: string, changes?: any) {
  try {
    await (prisma as any).auditLog.create({
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
router.get('/:guildId', async (req, res) => {
  const userId = (req as any).user?.id;
  const { guildId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify permission
  const guild = await prisma.guild.findFirst({
    where: { id: guildId, ownerId: userId }
  });
  if (!guild) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const logs = await (prisma as any).auditLog.findMany({
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
