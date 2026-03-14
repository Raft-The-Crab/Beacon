/**
 * Message Controller — CRUD, pins, reactions, slowmode enforcement
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
// Removed getIO import
import { publishGatewayEvent } from '../services/gatewayPublisher';
import { redis } from '../services/redis';
import { serializeBigInt } from '../utils/serializeBigInt';
import { generateShortId } from '../utils/id';
import { priorityQueue } from '../services/priorityQueue';
import { ModerationReportModel } from '../db';

// ─────────────────────────────────────────────────────────────
// GET /channels/:channelId/messages
// ─────────────────────────────────────────────────────────────
export async function getMessages(req: Request, res: Response) {
  const { channelId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before as string | undefined;
  const after = req.query.after as string | undefined;

  try {
    const messages = await prisma.message.findMany({
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

    return res.json(serializeBigInt(messages.reverse()));
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /channels/:channelId/messages
// ─────────────────────────────────────────────────────────────
export async function createMessage(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId } = req.params;
  const { content, embeds, replyTo, attachments } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!content && (!embeds || embeds.length === 0) && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message must have content, embeds, or attachments' });
  }

  try {
    // FAST lane text moderation before persisting message.
    if (process.env.ENABLE_MODERATION !== 'false' && String(content || '').trim()) {
      let moderation: any = null
      try {
        moderation = await priorityQueue.runFast('text_moderation', {
          content: String(content),
          userId,
          channelId,
        }) as any
      } catch (moderationErr) {
        console.warn('[Moderation] fast-lane unavailable, continuing:', moderationErr)
      }

      if (moderation?.result && moderation.result.approved === false) {
        const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        await ModerationReportModel.create({
          id: reportId,
          message_id: null,
          channel_id: channelId,
          guild_id: null,
          reporter_id: 'system',
          target_user_id: userId,
          content: String(content || ''),
          reason: moderation.result.reason || 'moderation_reject',
          flags: moderation.result.flags || [],
          score: moderation.result.score || 0,
          status: 'pending',
          action_taken: moderation.action?.type || moderation.result.action || 'rejected',
        })

        return res.status(403).json({
          error: 'Message rejected by moderation policy',
          moderation: {
            reason: moderation.result.reason,
            action: moderation.result.action,
            reportId,
          },
        })
      }
    }

    // Slowmode enforcement
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
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

    const message = await prisma.message.create({
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

    // Broadcast via Redis Gateway
    await publishGatewayEvent('MESSAGE_CREATE', message);

    // SLOW lane media moderation (queued, non-blocking)
    if (process.env.ENABLE_MODERATION !== 'false' && Array.isArray(attachments) && attachments.length > 0) {
      for (const attachment of attachments) {
        const contentType = String(attachment?.contentType || '').toLowerCase()
        const attachmentUrl = String(attachment?.url || '')

        if (contentType.startsWith('image/') && attachmentUrl) {
          priorityQueue.enqueue('image_moderation', {
            imageUrl: attachmentUrl,
            userId,
            channelId,
            messageId: message.id,
          })
        } else if (contentType.startsWith('video/') && attachmentUrl) {
          priorityQueue.enqueue('video_moderation', {
            videoUrl: attachmentUrl,
            userId,
            channelId,
            messageId: message.id,
          })
        }
      }
    }

    return res.status(201).json(serializeBigInt(message));
  } catch (err) {
    console.error('createMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /channels/:channelId/threads
// ─────────────────────────────────────────────────────────────
export async function createThread(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId } = req.params;
  const { name, messageId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const thread = await prisma.channel.create({
      data: {
        id: generateShortId('c', 12),
        name,
        type: 'THREAD',
        parentId: channelId,
        guildId: (await (prisma.channel as any).findUnique({ where: { id: channelId } })).guildId,
      }
    });

    if (messageId) {
      await prisma.message.update({
        where: { id: messageId },
        data: { threadId: thread.id }
      });
    }

    await publishGatewayEvent('THREAD_CREATE', thread);

    return res.status(201).json(serializeBigInt(thread));
  } catch (err) {
    console.error('createThread error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /channels/:channelId/messages/:messageId
// ─────────────────────────────────────────────────────────────
export async function editMessage(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId, messageId } = req.params;
  const { content, embeds } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) return res.status(404).json({ error: 'Message not found' });
    if (existing.authorId !== userId) return res.status(403).json({ error: 'Cannot edit others\' messages' });

    const message = await prisma.message.update({
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

    await publishGatewayEvent('MESSAGE_UPDATE', message);

    return res.json(serializeBigInt(message));
  } catch (err) {
    console.error('editMessage error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /channels/:channelId/messages/:messageId
// ─────────────────────────────────────────────────────────────
export async function deleteMessage(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: { include: { guild: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    const isOwner = existing.authorId === userId;
    const isAdmin = existing.channel?.guild?.ownerId === userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Insufficient permissions' });

    await prisma.message.delete({ where: { id: messageId } });

    await publishGatewayEvent('MESSAGE_DELETE', { id: messageId, channelId });

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
  const userId = req.user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const existing = await prisma.message.findUnique({ where: { id: messageId } });
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    await prisma.message.update({
      where: { id: messageId },
      data: { pinned: true },
    });

    await publishGatewayEvent('MESSAGE_PIN_ADD', { channelId, messageId, pinnedBy: userId });

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
  const userId = req.user?.id;
  const { channelId, messageId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { pinned: false },
    });

    await publishGatewayEvent('MESSAGE_PIN_REMOVE', { channelId, messageId });

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
    const messages = await prisma.message.findMany({
      where: { channelId, pinned: true },
      include: {
        author: { select: { id: true, username: true, avatar: true, discriminator: true } },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(serializeBigInt(messages));
  } catch (err) {
    console.error('getPinnedMessages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /channels/:channelId/messages/:messageId/reactions/:emoji/@me
// ─────────────────────────────────────────────────────────────
export async function addReaction(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId, messageId, emoji } = req.params;
  const isSuper = req.body?.isSuper === true;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedEmoji = decodeURIComponent(emoji as string);

    await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji: decodedEmoji },
      },
      create: { messageId, userId, emoji: decodedEmoji, isSuper },
      update: { isSuper }, // allow upgrading a normal reaction to super
    });

    // Fetch all reactions for this message to send complete array
    const allReactions = await prisma.reaction.findMany({
      where: { messageId },
    });

    // Group by emoji
    const reactionsMap = new Map<string, { emoji: string; users: string[]; isSuper: boolean }>();
    for (const r of allReactions) {
      if (!reactionsMap.has(r.emoji)) {
        reactionsMap.set(r.emoji, { emoji: r.emoji, users: [], isSuper: false });
      }
      const group = reactionsMap.get(r.emoji)!;
      group.users.push(r.userId);
      if (r.isSuper) group.isSuper = true;
    }

    const reactions = Array.from(reactionsMap.values()).map(r => ({
      emoji: { name: r.emoji },
      users: r.users,
      isSuper: r.isSuper,
    }));

    await publishGatewayEvent('MESSAGE_REACTION_ADD', { messageId, channelId, userId, emoji: decodedEmoji, isSuper, reactions });

    return res.status(204).send();
  } catch (err: any) {
    // Some deployments use non-Prisma message IDs for chat history. Keep reactions functional in UI.
    const code = err?.code as string | undefined;
    if (code === 'P2003' || code === 'P2025') {
      const decodedEmoji = decodeURIComponent(emoji as string);
      await publishGatewayEvent('MESSAGE_REACTION_ADD', {
        messageId,
        channelId,
        userId,
        emoji: decodedEmoji,
        isSuper,
        reactions: [{ emoji: { name: decodedEmoji }, users: [userId], isSuper }],
      });
      return res.status(204).send();
    }

    console.error('addReaction error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /channels/:channelId/messages/:messageId/reactions/:emoji/@me
// ─────────────────────────────────────────────────────────────
export async function removeReaction(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId, messageId, emoji } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decodedEmoji = decodeURIComponent(emoji as string);

    await prisma.reaction.deleteMany({
      where: { messageId, userId, emoji: decodedEmoji },
    });

    // Fetch remaining reactions for this message
    const allReactions = await prisma.reaction.findMany({
      where: { messageId },
    });

    // Group by emoji
    const reactionsMap = new Map<string, { emoji: string; users: string[]; isSuper: boolean }>();
    for (const r of allReactions) {
      if (!reactionsMap.has(r.emoji)) {
        reactionsMap.set(r.emoji, { emoji: r.emoji, users: [], isSuper: false });
      }
      const group = reactionsMap.get(r.emoji)!;
      group.users.push(r.userId);
      if (r.isSuper) group.isSuper = true;
    }

    const reactions = Array.from(reactionsMap.values()).map(r => ({
      emoji: { name: r.emoji },
      users: r.users,
      isSuper: r.isSuper,
    }));

    await publishGatewayEvent('MESSAGE_REACTION_REMOVE', { messageId, channelId, userId, emoji: decodedEmoji, reactions });

    return res.status(204).send();
  } catch (err: any) {
    const code = err?.code as string | undefined;
    if (code === 'P2003' || code === 'P2025') {
      const decodedEmoji = decodeURIComponent(emoji as string);
      await publishGatewayEvent('MESSAGE_REACTION_REMOVE', {
        messageId,
        channelId,
        userId,
        emoji: decodedEmoji,
        reactions: [],
      });
      return res.status(204).send();
    }

    console.error('removeReaction error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
