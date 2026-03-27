/**
 * Channel Controller — CRUD, invites, slowmode
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { publishGatewayEvent } from '../services/gatewayPublisher';
import { generateInviteCode, generateShortId } from '../utils/id';
import { Permissions, hasPermission, computePermissions } from '../utils/permissions';
import { serializeBigInt } from '../utils/serializeBigInt';

export async function createChannel(req: Request, res: Response) {
  const userId = req.user?.id;
  const { guildId, name, type, parentId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Check if user is owner or has MANAGE_CHANNELS
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: { 
        members: { 
          where: { userId },
          include: { roles: true }
        },
        roles: true
      }
    });

    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    // Enforce permissions: Check if owner or has MANAGE_CHANNELS bits
    const member = guild.members[0];
    const isOwner = guild.ownerId === userId;
    // @everyone permissions are already in guild.roles if it's not a specific member role
    const permissions = member ? computePermissions(member.roles as any) : BigInt(0);
    const canManage = hasPermission(permissions, Permissions.MANAGE_CHANNELS);

    if (!isOwner && !canManage) {
      return res.status(403).json({ error: 'You do not have permission to manage channels in this server.' });
    }

    const channel = await prisma.channel.create({
      data: {
        id: generateShortId('c', 12),
        name,
        type: type || 'TEXT',
        guildId,
        parentId,
        position: 0,
      },
      include: { permissionOverwrites: true }
    });

    await publishGatewayEvent('CHANNEL_CREATE', channel);

    return res.status(201).json(serializeBigInt(channel));
  } catch (err) {
    console.error('Create channel error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getChannel(req: Request, res: Response) {
  const { channelId } = req.params;
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { guild: true, permissionOverwrites: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    return res.json(serializeBigInt(channel));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateChannel(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId } = req.params;
  const { name, topic, nsfw, slowmode, position } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { guild: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name !== undefined && { name }),
        ...(topic !== undefined && { topic }),
        ...(nsfw !== undefined && { nsfw }),
        ...(slowmode !== undefined && { slowmode: Math.max(0, Math.min(21600, Number(slowmode))) }),
        ...(position !== undefined && { position }),
      },
      include: { permissionOverwrites: true }
    });

    await publishGatewayEvent('CHANNEL_UPDATE', updated);

    return res.json(serializeBigInt(updated));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteChannel(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await (prisma.channel as any).findUnique({
      where: { id: channelId },
      include: { guild: true },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    await prisma.channel.delete({ where: { id: channelId } });

    await publishGatewayEvent('CHANNEL_DELETE', { id: channelId, guildId: channel.guildId });

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createChannelInvite(req: Request, res: Response) {
  const userId = req.user?.id;
  const { channelId } = req.params;
  const { maxUses = 0, maxAge = 86400, temporary = false } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const code = generateInviteCode(8);
    const invite = await prisma.invite.create({
      data: {
        code,
        guildId: channel.guildId || '',
        channelId: channel.id,
        inviterId: userId,
        maxUses,
        uses: 0,
        expiresAt: maxAge > 0 ? new Date(Date.now() + maxAge * 1000) : undefined,
      },
      include: {
        guild: { select: { id: true, name: true, icon: true } },
        inviter: { select: { id: true, username: true, avatar: true } },
      },
    });

    return res.status(201).json(serializeBigInt(invite));
  } catch (err) {
    console.error('createInvite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getChannelInvites(req: Request, res: Response) {
  const { channelId } = req.params;
  try {
    const invites = await prisma.invite.findMany({
      where: { channelId },
      include: {
        guild: { select: { id: true, name: true, icon: true } },
        inviter: { select: { id: true, username: true, avatar: true } },
      },
    });
    return res.json(serializeBigInt(invites));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
