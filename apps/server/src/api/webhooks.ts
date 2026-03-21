/**
 * Beacon Webhooks System
 * Features: Discord-compatible JSON format, token-based authentication
 */

import { Router, Response } from 'express';
import { prisma } from '../db';
import { redis } from '../services/redis';
import { randomBytes } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { InteractionController } from '../controllers/interaction.controller';

const router = Router();

// Only protect API endpoints, execute is public
router.post('/guilds/:guildId/channels/:channelId', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, avatar } = req.body;
  const { channelId, guildId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Verify permission
  const guild = await prisma.guild.findFirst({
    where: { id: guildId, ownerId: userId }
  });
  if (!guild) return res.status(403).json({ error: 'Insufficient permissions' });

  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const token = randomBytes(24).toString('hex');
    const webhook = await prisma.webhook.create({
      data: {
        id: randomBytes(8).toString('hex'), // Friendly short ID
        name: name || 'Beacon Webhook',
        avatar: avatar || null,
        token,
        channelId,
        guildId,
        createdBy: userId,
      }
    });

    return res.status(201).json(webhook);
  } catch (error) {
    console.error('Webhook creation failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute Webhook (Discord-compatible)
router.post('/execute/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  const { content, username, avatar_url, embeds } = req.body;

  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id, token }
    });

    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

    // Broadcast message via Socket.IO/Redis
    const newMessage = {
      id: `webhook-${Date.now()}`,
      content,
      channel_id: webhook.channelId,
      author: {
        id: webhook.id,
        username: username || webhook.name,
        avatar: avatar_url || webhook.avatar,
        bot: true,
        webhook: true
      },
      embeds: embeds || [],
      timestamp: new Date().toISOString()
    };

    // Pub/Sub to WebSocket server
    await redis.publish(`channel:${webhook.channelId}`, JSON.stringify({
      type: 'MESSAGE_CREATE',
      data: newMessage
    }));

    // Persistent storage
    await prisma.message.create({
      data: {
        content: content || '',
        channelId: webhook.channelId,
        webhookId: webhook.id,
      }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Webhook execution failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List Channel Webhooks
router.get('/channels/:channelId', authenticate, async (req, res) => {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!prisma) return res.status(500).json({ error: 'Database not connected' });

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { channelId },
      select: {
        id: true,
        name: true,
        avatar: true,
        channelId: true,
        guildId: true,
      }
    });
    return res.json(webhooks);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SDK INTERACTION WEBHOOKS ---
// These are used by SDK bots to send follow-up messages or edit/delete original interaction responses.

// Edit original interaction response
router.patch('/:applicationId/:token/messages/@original', InteractionController.handleEditOriginal);

// Delete original interaction response
router.delete('/:applicationId/:token/messages/@original', InteractionController.handleDeleteOriginal);

// Send follow-up message
router.post('/:applicationId/:token', InteractionController.handleFollowUp);

export default router;
