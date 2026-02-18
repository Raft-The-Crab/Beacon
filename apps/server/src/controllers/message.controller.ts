/**
 * Message Controller — CRUD, pins, reactions, slowmode enforcement
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { getIO } from '../ws';
import { createAuditLog } from '../api/auditLogs';
import { redis } from '../services/redis';

// ─────────────────────────────────────────────────────────────
// GET /channels/:channelId/messages
// ─────────────────────────────────────────────────────────────
export async function getMessages(req: Request, res: Response) {
  const { channelId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before as string | undefined;
  const after = req.query.after as string | undefined;

  try {
    const messages = await (prisma.message as any).findMany({
      where: {
        channelId,
        ...(before ? { id: { lt: before } } : {}),
        ...(after ? { id: { gt: after } } : {}),
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, discriminator: true } },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json(messages.reverse());
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /channels/:channelId/messages
// ─────────────────────────────────────────────────────────────
export async function createMessage(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;
  const { content, embeds, replyTo, attachments } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!content && (!embeds || embeds.length === 0) && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message must have content, embeds, or attachments' });
  }

  try {
    // Slowmode enforcement
    const channel = await (prisma.channel as any).findUnique({ where: { id: channelId } });
    if (channel?.slowmode > 0) {
      const cacheKey = `slowmode:${channelId}:${userId}`;
      const lastSent = await redis.get(cacheKey);
      if (lastSent) {
        const remaining = channel.slowmode - Math.floor((Date.now() - Number(lastSent)) / 1000);
        if (remaining > 0) {
          return res.status(429).json({
            error: 'Slowmode active',
            retry_after: remaining,
          });
        }
      }
      await redis.set(cacheKey, Date.now().toString(), 'EX', channel.slowmode);
    }

    const message = await (prisma.message as any).create({
      data: {
        content: content || '',
        channelId,
        authorId: userId,
        replyToId: replyTo || null,
        embeds: embeds || [],
        attachments: {
          create: (attachments || []).map((a: any) => ({
            filename: a.filename,
            url: a.url,
            size: a.size,
            contentType: a.contentType,
          })),
        },
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, discriminator: true } },
        reactions: true,
        attachments: true,
        replyTo: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    // Broadcast via Socket.IO
    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_CREATE', message);
    } catch (_) {}

    return res.status(201).json(message);
  } catch (err) {
    console.error('createMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /channels/:channelId/messages/:messageId
// ─────────────────────────────────────────────────────────────
export async function editMessage(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId } = req.params;
  const { content, embeds } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await (prisma.message as any).findUnique({ where: { id: messageId } });
    if (!existing) return res.status(404).json({ error: 'Message not found' });
    if (existing.authorId !== userId) return res.status(403).json({ error: 'Cannot edit others\' messages' });

    const message = await (prisma.message as any).update({
      where: { id: messageId },
      data: {
        content: content !== undefined ? content : existing.content,
        embeds: embeds !== undefined ? embeds : existing.embeds,
        editedAt: new Date(),
      },
      include: {
        author: { select: { id: true, username: true, avatar: true, discriminator: true } },
        reactions: true,
        attachments: true,
      },
    });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_UPDATE', message);
    } catch (_) {}

    return res.json(message);
  } catch (err) {
    console.error('editMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /channels/:channelId/messages/:messageId
// ─────────────────────────────────────────────────────────────
export async function deleteMessage(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await (prisma.message as any).findUnique({
      where: { id: messageId },
      include: { channel: { include: { guild: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    const isOwner = existing.authorId === userId;
    const isAdmin = existing.channel?.guild?.ownerId === userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Insufficient permissions' });

    await (prisma.message as any).delete({ where: { id: messageId } });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_DELETE', { id: messageId, channelId });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    console.error('deleteMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /channels/:channelId/pins/:messageId  — Pin
// ─────────────────────────────────────────────────────────────
export async function pinMessage(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await (prisma.message as any).findUnique({ where: { id: messageId } });
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    await (prisma.message as any).update({
      where: { id: messageId },
      data: { pinned: true },
    });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_PIN_ADD', { channelId, messageId, pinnedBy: userId });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    console.error('pinMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /channels/:channelId/pins/:messageId  — Unpin
// ─────────────────────────────────────────────────────────────
export async function unpinMessage(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await (prisma.message as any).update({
      where: { id: messageId },
      data: { pinned: false },
    });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_PIN_REMOVE', { channelId, messageId });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    console.error('unpinMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /channels/:channelId/pins
// ─────────────────────────────────────────────────────────────
export async function getPinnedMessages(req: Request, res: Response) {
  const { channelId } = req.params;

  try {
    const messages = await (prisma.message as any).findMany({
      where: { channelId, pinned: true },
      include: {
        author: { select: { id: true, username: true, avatar: true, discriminator: true } },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(messages);
  } catch (err) {
    console.error('getPinnedMessages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /channels/:channelId/messages/:messageId/reactions/:emoji/@me
// ─────────────────────────────────────────────────────────────
export async function addReaction(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId, emoji } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedEmoji = decodeURIComponent(emoji);

    await (prisma.reaction as any).upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji: decodedEmoji },
      },
      create: { messageId, userId, emoji: decodedEmoji },
      update: {},
    });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_REACTION_ADD', {
        messageId, channelId, userId, emoji: decodedEmoji,
      });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    console.error('addReaction error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /channels/:channelId/messages/:messageId/reactions/:emoji/@me
// ─────────────────────────────────────────────────────────────
export async function removeReaction(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId, messageId, emoji } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedEmoji = decodeURIComponent(emoji);

    await (prisma.reaction as any).deleteMany({
      where: { messageId, userId, emoji: decodedEmoji },
    });

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('MESSAGE_REACTION_REMOVE', {
        messageId, channelId, userId, emoji: decodedEmoji,
      });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    console.error('removeReaction error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
