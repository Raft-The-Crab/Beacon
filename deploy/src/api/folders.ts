/**
 * Beacon Server Folders API
 * Features: High-end folder management, cross-device sync
 */

import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Get user folders
router.get('/', async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const folders = await (prisma as any).serverFolder.findMany({
      where: { userId },
      orderBy: { position: 'asc' }
    });
    return res.json(folders);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update folder
router.post('/', async (req, res) => {
  const userId = (req as any).user?.id;
  const { id, name, color, guildIds, position } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const folder = await (prisma as any).serverFolder.upsert({
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
router.delete('/:id', async (req, res) => {
  const userId = (req as any).user?.id;
  const { id } = req.params;

  try {
    await (prisma as any).serverFolder.deleteMany({
      where: { id, userId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
