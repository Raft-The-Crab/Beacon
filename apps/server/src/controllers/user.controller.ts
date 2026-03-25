/**
 * User Controller — profile, custom status, avatar, settings
 */
import { Request, Response } from 'express';
import { prisma } from '../db';
import { redis } from '../services/redis';
import { CacheService } from '../services/cache';
import { AuthService } from '../services/auth';
import { validateUsername } from '../middleware/validation';
import { serializeBigInt } from '../utils/serializeBigInt';
import * as node2fa from 'node-2fa';
import QRCode from 'qrcode';

function ensurePrisma(res: Response) {
  if (!prisma) {
    res.status(503).json({ error: 'User service unavailable. Check the database connection.' });
    return false;
  }

  return true;
}

// GET /users/me
export async function getMe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePrisma(res)) return;

  const cacheKey = CacheService.genKey('user', userId, 'me');

  try {
    const user = await CacheService.wrap(cacheKey, async () => {
      try {
        const u = await (prisma.user as any).findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            globalName: true,
            accountTier: true,
            discriminator: true,
            email: true,
            avatar: true,
            banner: true,
            bio: true,
            status: true,
            customStatus: true,
            theme: true,
            developerMode: true,
            badges: true,
            isBeaconPlus: true,
            avatarDecorationId: true,
            profileEffectId: true,
            nameDesign: true,
            bot: true,
            isOfficial: true,
            createdAt: true,
          },
        })
        return u
      } catch (selectErr) {
        console.warn('getMe full select failed, falling back to minimal profile:', selectErr)
        const minimal = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            discriminator: true,
            email: true,
            avatar: true,
            banner: true,
            bio: true,
            status: true,
            customStatus: true,
            createdAt: true,
          },
        })
        return minimal ? {
          ...minimal,
          theme: 'auto',
          developerMode: false,
          badges: [],
          isBeaconPlus: false,
          avatarDecorationId: null,
          profileEffectId: null,
        } : null
      }
    }, 300); // 5 min cache for profile

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(serializeBigInt(AuthService.sanitizeUser(user)));
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import { z } from 'zod';

const UpdateProfileSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  displayName: z.string().min(1).max(32).optional().nullable(),
  globalName: z.string().min(1).max(32).optional().nullable(),
  bio: z.string().max(190).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  banner: z.string().trim().min(1).max(512).optional().nullable(),
  theme: z.enum(['auto', 'light', 'dark', 'midnight', 'oled', 'dracula']).optional(),
  developerMode: z.boolean().optional(),
  status: z.enum(['online', 'idle', 'dnd', 'invisible']).optional(),
  customStatus: z.string().max(128).optional().nullable(),
  avatarDecorationId: z.string().optional().nullable(),
  profileEffectId: z.string().optional().nullable(),
  nameDesign: z.record(z.any()).optional().nullable(),
});

// PATCH /users/me
export async function updateMe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePrisma(res)) return;

  try {
    const data = UpdateProfileSchema.parse(req.body);
    const trimmedUsername = data.username?.trim();
    const trimmedDisplayName = typeof data.displayName === 'string' ? data.displayName.trim() : data.displayName;

    if (trimmedUsername !== undefined) {
      const validation = validateUsername(trimmedUsername);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid username' });
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          username: { equals: trimmedUsername, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    // Beacon+ restriction for Name Design
    if (data.nameDesign && Object.keys(data.nameDesign).length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBeaconPlus: true }
      });
      if (user && !user.isBeaconPlus) {
        // Allow if it's strictly resetting to defaults
        const isDefault = (!data.nameDesign.font || data.nameDesign.font === 'default') &&
                          (!data.nameDesign.glow || data.nameDesign.glow === 'none') &&
                          (!data.nameDesign.animation || data.nameDesign.animation === 'none') &&
                          (!data.nameDesign.color);
        if (!isDefault) {
          return res.status(403).json({ error: 'Custom display name designs require Beacon+' });
        }
      }
    }

    const updated = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        ...(trimmedUsername !== undefined && { username: trimmedUsername }),
        ...(trimmedDisplayName !== undefined && { displayName: trimmedDisplayName || null }),
        ...(data.globalName !== undefined && { globalName: data.globalName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.banner !== undefined && { banner: data.banner }),
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.developerMode !== undefined && { developerMode: data.developerMode }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.customStatus !== undefined && { customStatus: data.customStatus }),
        ...(data.avatarDecorationId !== undefined && { avatarDecorationId: data.avatarDecorationId }),
        ...(data.profileEffectId !== undefined && { profileEffectId: data.profileEffectId }),
        ...(data.nameDesign !== undefined && { nameDesign: data.nameDesign || {} }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        globalName: true,
        accountTier: true,
        discriminator: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        customStatus: true,
        theme: true,
        developerMode: true,
        badges: true,
        isBeaconPlus: true,
        avatarDecorationId: true,
        profileEffectId: true,
        nameDesign: true,
        bot: true,
        isOfficial: true,
        createdAt: true,
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
    await CacheService.del(CacheService.genKey('user', userId, 'me'));
    await CacheService.del(CacheService.genKey('user', userId));

    return res.json(serializeBigInt(AuthService.sanitizeUser(updated)));
  } catch (err: any) {
    console.error('updateMe error:', err);
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid profile update payload' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/:userId
export async function getUser(req: Request, res: Response) {
  const { userId } = req.params;
  if (!ensurePrisma(res)) return;

  try {
    const cached = await CacheService.get(`user:${userId}`);
    if (cached) return res.json(serializeBigInt(cached));

    let user: any = null
    try {
      user = await (prisma.user as any).findUnique({
        where: { id: userId as string },
        select: {
          id: true,
          username: true,
          displayName: true,
          globalName: true,
          accountTier: true,
          discriminator: true,
          avatar: true,
          banner: true,
          bio: true,
          status: true,
          customStatus: true,
          badges: true,
          isBeaconPlus: true,
          avatarDecorationId: true,
          profileEffectId: true,
          nameDesign: true,
          bot: true,
          isOfficial: true,
          createdAt: true,
        },
      })
    } catch (selectErr) {
      console.warn('getUser full select failed, falling back to minimal profile:', selectErr)
      const minimal = await prisma.user.findUnique({
        where: { id: userId as string },
        select: {
          id: true,
          username: true,
          displayName: true,
          discriminator: true,
          avatar: true,
          banner: true,
          bio: true,
          status: true,
          customStatus: true,
          createdAt: true,
        },
      })
      user = minimal ? {
        ...minimal,
        badges: [],
        isBeaconPlus: false,
        avatarDecorationId: null,
        profileEffectId: null,
      } : null
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sanitizedUser = AuthService.sanitizeUser(user)
    await CacheService.set(CacheService.genKey('user', userId), sanitizedUser, 600); // 10 min cache
    return res.json(serializeBigInt(sanitizedUser));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/me/guilds
export async function getMyGuilds(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePrisma(res)) return;

  const cacheKey = CacheService.genKey('user', userId, 'guilds');

  try {
    const guilds = await CacheService.wrap(cacheKey, async () => {
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

      return memberships.map((m: any) => ({
        ...m.guild,
        memberCount: m.guild._count.members,
      }));
    }, 300); // 5 min cache

    return res.json(serializeBigInt(guilds));
  } catch (err) {
    console.error('getMyGuilds error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /users/me/friends (presence-enriched)
export async function getMyFriends(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePrisma(res)) return;

  const friendUserSelect = {
    id: true,
    username: true,
    displayName: true,
    avatar: true,
    discriminator: true,
    banner: true,
    bio: true,
    badges: true,
    isBeaconPlus: true,
    avatarDecorationId: true,
    profileEffectId: true,
    createdAt: true,
  } as const

  try {
    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 1 },
          { friendId: userId, status: 1 },
        ],
      },
      include: {
        user: { select: friendUserSelect },
        friend: { select: friendUserSelect },
      },
    });

    // Enrich with Redis presence (Optimized: fetch only friend IDs)
    const friendEntities = friends.map((f: any) => f.userId === userId ? f.friend : f.user);
    const friendIds = friendEntities.map((f: any) => f?.id).filter(Boolean);
    const presenceValues = friendIds.length > 0 ? await (redis as any).hmget('presence', ...friendIds) : [];
    
    const enrichedWithPresence = friendEntities.map((other: any, index: number) => {
      let presence = null;
      const rawPresence = presenceValues[index];
      if (rawPresence) {
        try {
          presence = JSON.parse(rawPresence);
        } catch {
          presence = null;
        }
      }
      return {
        ...other,
        status: presence?.status || 'offline',
        customStatus: presence?.customStatus || other?.customStatus || null,
      };
    });

    const deduped = Array.from(new Map(enrichedWithPresence.map((entry: any) => [entry.id, entry])).values())
    return res.json(serializeBigInt(deduped));
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

const UpdateE2EESchema = z.object({
  publicKey: z.string().min(1),
  deviceSalt: z.string().min(1)
});

// PATCH /users/me/e2ee
export async function updateE2EEKeys(req: Request, res: Response) {
  const userId = req.user?.id;
  
  try {
    const { publicKey, deviceSalt } = UpdateE2EESchema.parse(req.body);
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

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '8', 10);

const UpdateEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function updateEmail(req: Request, res: Response) {
  const userId = req.user?.id;

  try {
    const { email, password } = UpdateEmailSchema.parse(req.body);
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
    return res.json(serializeBigInt(updated));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const UpdatePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export async function updatePassword(req: Request, res: Response) {
  const userId = req.user?.id;

  try {
    const { oldPassword, newPassword } = UpdatePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hasExistingPassword = !!user.password && user.password.length > 0;
    
    if (hasExistingPassword) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new one' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid current password' });
    }

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

// 2FA methods removed — centralized in AuthController

export async function getMutuals(req: Request, res: Response) {
  const userId = req.user?.id;
  const { id: targetUserId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (userId === targetUserId) {
    return res.json({ friends: [], guilds: [] });
  }

  try {
    // 1. Mutual Guilds
    const [userGuilds, targetGuilds] = await Promise.all([
      prisma.guildMember.findMany({ where: { userId }, select: { guildId: true } }),
      prisma.guildMember.findMany({ where: { userId: targetUserId }, select: { guildId: true } })
    ]);

    const userGuildIds = new Set(userGuilds.map(mg => mg.guildId));
    const mutualGuildIds = targetGuilds
      .map(mg => mg.guildId)
      .filter(id => userGuildIds.has(id));

    const mutualGuilds = await prisma.guild.findMany({
      where: { id: { in: mutualGuildIds } },
      select: { id: true, name: true, icon: true }
    });

    // 2. Mutual Friends
    const [userFriends, targetFriends] = await Promise.all([
      prisma.friendship.findMany({ 
        where: { 
          OR: [
            { userId, status: 1 },
            { friendId: userId, status: 1 }
          ]
        },
        select: { userId: true, friendId: true }
      }),
      prisma.friendship.findMany({ 
        where: { 
          OR: [
            { userId: targetUserId, status: 1 },
            { friendId: targetUserId, status: 1 }
          ]
        },
        select: { userId: true, friendId: true }
      })
    ]);

    const getUserFriendId = (f: any, current: string) => f.userId === current ? f.friendId : f.userId;
    const userFriendIds = new Set(userFriends.map(f => getUserFriendId(f, userId)));
    const mutualFriendIds = targetFriends
      .map(f => getUserFriendId(f, targetUserId))
      .filter(id => userFriendIds.has(id));

    const mutualFriends = await (prisma.user as any).findMany({
      where: { id: { in: mutualFriendIds } },
      select: { id: true, username: true, globalName: true, avatar: true, discriminator: true }
    });

    return res.json(serializeBigInt({
      friends: mutualFriends,
      guilds: mutualGuilds
    }));
  } catch (err) {
    console.error('getMutuals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// -- BLOCKING --
export async function blockUser(req: Request, res: Response) {
  const userId = req.user?.id;
  const { targetId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!targetId) return res.status(400).json({ error: 'Target user ID is required' });
  if (userId === targetId) return res.status(400).json({ error: 'You cannot block yourself' });

  try {
    const existing = await prisma.block.findUnique({
      where: { userId_blockedId: { userId, blockedId: targetId } }
    });

    if (existing) return res.json({ success: true, message: 'User already blocked' });

    await prisma.$transaction([
      prisma.block.create({
        data: { userId, blockedId: targetId }
      }),
      // Remove friendship if exists
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId: targetId },
            { userId: targetId, friendId: userId }
          ]
        }
      })
    ]);

    await CacheService.del(`user:${userId}`);
    return res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unblockUser(req: Request, res: Response) {
  const userId = req.user?.id;
  const { targetId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!targetId) return res.status(400).json({ error: 'Target user ID is required' });

  try {
    await prisma.block.deleteMany({
      where: { userId, blockedId: targetId }
    });
    return res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBlockedUsers(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const blocked = await prisma.block.findMany({
      where: { userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            discriminator: true,
            avatar: true
          }
        }
      }
    });

    return res.json(blocked.map(b => b.blocked));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
