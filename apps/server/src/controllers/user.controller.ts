/**
 * User Controller — profile, custom status, avatar, settings
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { redis } from '../services/redis';

// GET /users/me
export async function getMe(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        customStatus: true,
        theme: true,
        developerMode: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH /users/me
export async function updateMe(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    username,
    bio,
    avatar,
    banner,
    theme,
    developerMode,
    status,
    customStatus,
  } = req.body;

  const validStatuses = ['online', 'idle', 'dnd', 'invisible'];

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(banner !== undefined && { banner }),
        ...(theme !== undefined && { theme }),
        ...(developerMode !== undefined && { developerMode }),
        ...(status !== undefined && validStatuses.includes(status) && { status }),
        ...(customStatus !== undefined && { customStatus }),
      },
      select: {
        id: true,
        username: true,
        discriminator: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        customStatus: true,
        theme: true,
        developerMode: true,
      },
    });

    // Update Redis presence cache
    if (status) {
      await redis.hset('presence', userId, JSON.stringify({
        status,
        customStatus: customStatus || null,
        lastSeen: Date.now(),
      }));
    }

    return res.json(updated);
  } catch (err) {
    console.error('updateMe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/:userId
export async function getUser(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        customStatus: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/me/guilds
export async function getMyGuilds(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const memberships = await prisma.guildMember.findMany({
      where: { userId },
      include: {
        guild: {
          include: {
            channels: {
              orderBy: { position: 'asc' },
            },
            _count: { select: { members: true } },
          },
        },
      },
    });

    const guilds = memberships.map((m: any) => ({
      ...m.guild,
      memberCount: m.guild._count.members,
    }));

    return res.json(guilds);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/me/friends (presence-enriched)
export async function getMyFriends(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, discriminator: true } },
        friend: { select: { id: true, username: true, avatar: true, discriminator: true } },
      },
    });

    // Enrich with Redis presence
    const presenceData = await redis.hgetall('presence');
    const enriched = friends.map((f: any) => {
      const other = f.userId === userId ? f.friend : f.user;
      const presence = presenceData[other.id] ? JSON.parse(presenceData[other.id]) : null;
      return {
        ...other,
        status: presence?.status || 'offline',
        customStatus: presence?.customStatus || null,
      };
    });

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /users/me  — Account deletion
export async function deleteMe(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH /users/me/e2ee
export async function updateE2EEKeys(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { publicKey, deviceSalt } = req.body;

  if (!publicKey || !deviceSalt) {
    return res.status(400).json({ error: 'publicKey and deviceSalt are required' });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { publicKey, deviceSalt },
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/:userId/e2ee
export async function getE2EEKeys(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true, deviceSalt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
