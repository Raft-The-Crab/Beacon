/**
 * Beacon Server Folders API
 * Features: High-end folder management, cross-device sync
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get user folders
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const folders = await prisma.serverFolder.findMany({
      where: { userId },
      orderBy: { position: 'asc' }
    });
    return res.json(folders);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update folder
router.post('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id, name, color, guildIds, position } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const folder = await prisma.serverFolder.upsert({
      where: { id: id || 'new' },
      update: {
        name,
        color,
        guildIds,
        position
      },
      create: {
        name,
        color,
        userId,
        guildIds: guildIds || [],
        position: position || 0
      }
    });
    return res.json(folder);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete folder
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    await prisma.serverFolder.deleteMany({
      where: { id, userId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
