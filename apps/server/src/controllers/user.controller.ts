/**
 * User Controller — profile, custom status, avatar, settings
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { redis } from '../services/redis';
import { CacheService } from '../services/cache';

// GET /users/me
export async function getMe(req: Request, res: Response) {
  const userId = req.user?.id;
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
        avatarDecorationId: true,
        profileEffectId: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { z } from 'zod';

const UpdateProfileSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  bio: z.string().max(190).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  theme: z.enum(['auto', 'light', 'dark', 'midnight', 'oled', 'dracula']).optional(),
  developerMode: z.boolean().optional(),
  status: z.enum(['online', 'idle', 'dnd', 'invisible']).optional(),
  customStatus: z.string().max(128).optional().nullable(),
  avatarDecorationId: z.string().optional().nullable(),
  profileEffectId: z.string().optional().nullable(),
});

// PATCH /users/me
export async function updateMe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const data = UpdateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.banner !== undefined && { banner: data.banner }),
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.developerMode !== undefined && { developerMode: data.developerMode }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.customStatus !== undefined && { customStatus: data.customStatus }),
        ...(data.avatarDecorationId !== undefined && { avatarDecorationId: data.avatarDecorationId }),
        ...(data.profileEffectId !== undefined && { profileEffectId: data.profileEffectId }),
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
        avatarDecorationId: true,
        profileEffectId: true,
      },
    });

    // Update Redis presence cache
    if (data.status) {
      await redis.hset('presence', userId, JSON.stringify({
        status: data.status,
        customStatus: data.customStatus || null,
        lastSeen: Date.now(),
      }));
    }

    // Invalidate profile cache
    await CacheService.del(`user:${userId}`);

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
    const cached = await CacheService.get(`user:${userId}`);
    if (cached) return res.json(cached);

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        customStatus: true,
        avatarDecorationId: true,
        profileEffectId: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await CacheService.set(`user:${userId}`, user, 600); // 10 min cache
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/me/guilds
export async function getMyGuilds(req: Request, res: Response) {
  const userId = req.user?.id;
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
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' } as any,
          { friendId: userId, status: 'accepted' } as any,
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
      const presenceKey = other?.id ? other.id : 'unknown';
      const presence = presenceData && presenceData[presenceKey] ? JSON.parse(presenceData[presenceKey]!) : null;
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
  const userId = req.user?.id;
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
  const userId = req.user?.id;
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
      where: { id: userId as string },
      select: { publicKey: true, deviceSalt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// -- SECURITY --
import bcrypt from 'bcryptjs';
import node2fa from 'node-2fa';
import QRCode from 'qrcode';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '8', 10);

export async function updateEmail(req: Request, res: Response) {
  const userId = req.user?.id;
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    // Check if email is already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) return res.status(409).json({ error: 'Email already in use' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email },
      select: { id: true, email: true }
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePassword(req: Request, res: Response) {
  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Both old and new passwords are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.password === undefined) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid current password' });

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function enable2FA(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) return res.status(400).json({ error: '2FA is already enabled' });

    // Generate a real TOTP secret
    const result = node2fa.generateSecret({
      name: 'Beacon',
      account: user.email
    });

    // Store the secret temporarily (user must verify before it activates)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: result.secret }
    });

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(result.uri);

    return res.json({
      secret: result.secret,
      qrCode
    });
  } catch (err) {
    console.error('enable2FA error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verify2FA(req: Request, res: Response) {
  const userId = req.user?.id;
  const { code } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Verification code is required' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFactorSecret) return res.status(400).json({ error: '2FA setup not initiated. Call enable2FA first.' });

    // Verify the TOTP token against the stored secret
    const isValid = node2fa.verifyToken(user.twoFactorSecret, code, 1);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Activate 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return res.json({ success: true, message: '2FA has been enabled successfully.' });
  } catch (err) {
    console.error('verify2FA error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
