/**
 * Channel Controller — CRUD, invites, slowmode
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { getIO } from '../ws';
import { randomBytes } from 'crypto';

export async function getChannel(req: Request, res: Response) {
  const { channelId } = req.params;
  try {
    const channel = await (prisma.channel as any).findUnique({
      where: { id: channelId },
      include: { guild: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    return res.json(channel);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateChannel(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;
  const { name, topic, nsfw, slowmode, position } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await (prisma.channel as any).findUnique({
      where: { id: channelId },
      include: { guild: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (channel.guild?.ownerId !== userId) return res.status(403).json({ error: 'Insufficient permissions' });

    const updated = await (prisma.channel as any).update({
      where: { id: channelId },
      data: {
        ...(name !== undefined && { name }),
        ...(topic !== undefined && { topic }),
        ...(nsfw !== undefined && { nsfw }),
        ...(slowmode !== undefined && { slowmode: Math.max(0, Math.min(21600, Number(slowmode))) }),
        ...(position !== undefined && { position }),
      },
    });

    try {
      const io = getIO();
      io.to(`guild:${channel.guildId}`).emit('CHANNEL_UPDATE', updated);
    } catch (_) {}

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteChannel(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await (prisma.channel as any).findUnique({
      where: { id: channelId },
      include: { guild: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (channel.guild?.ownerId !== userId) return res.status(403).json({ error: 'Insufficient permissions' });

    await (prisma.channel as any).delete({ where: { id: channelId } });

    try {
      const io = getIO();
      io.to(`guild:${channel.guildId}`).emit('CHANNEL_DELETE', { id: channelId, guildId: channel.guildId });
    } catch (_) {}

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createChannelInvite(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;
  const { maxUses = 0, maxAge = 86400, temporary = false } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await (prisma.channel as any).findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const code = randomBytes(5).toString('base64url');
    const invite = await (prisma.invite as any).create({
      data: {
        code,
        channelId,
        guildId: channel.guildId,
        inviterId: userId,
        maxUses,
        maxAge,
        temporary,
        uses: 0,
        expiresAt: maxAge > 0 ? new Date(Date.now() + maxAge * 1000) : null,
      },
      include: {
        guild: { select: { id: true, name: true, icon: true } },
        channel: { select: { id: true, name: true } },
        inviter: { select: { id: true, username: true, avatar: true } },
      },
    });

    return res.status(201).json(invite);
  } catch (err) {
    console.error('createInvite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getChannelInvites(req: Request, res: Response) {
  const { channelId } = req.params;
  try {
    const invites = await (prisma.invite as any).findMany({
      where: { channelId },
      include: {
        guild: { select: { id: true, name: true, icon: true } },
        channel: { select: { id: true, name: true } },
        inviter: { select: { id: true, username: true, avatar: true } },
      },
    });
    return res.json(invites);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
