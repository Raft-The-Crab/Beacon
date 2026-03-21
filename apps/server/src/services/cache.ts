import { redis } from './redis';
import { prisma } from '../db';
import { logger } from './logger';

export class CacheService {
  /**
   * Get a guild by ID, with caching.
   */
  static async getGuild(guildId: string) {
    const cacheKey = `guild:${guildId}`;
    
    // 1. Try Cache
    const cached = await redis.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Fallback to DB
    if (!prisma) return null;
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        roles: true,
        channels: true,
        emojis: true
      }
    });

    // 3. Update Cache (TTL: 1 hour)
    if (guild) {
      await redis.cache(cacheKey, guild, 3600);
    }

    return guild;
  }

  /**
   * Invalidate guild cache.
   */
  static async invalidateGuild(guildId: string) {
    await redis.invalidate(`guild:${guildId}`);
  }

  /**
   * Get a user by ID, with caching.
   */
  static async getUser(userId: string) {
    const cacheKey = `user:${userId}`;
    
    // 1. Try Cache
    const cached = await redis.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Fallback to DB
    if (!prisma) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
        banner: true,
        bio: true,
        bot: true,
        badges: true,
        createdAt: true,
        status: true,
        customStatus: true
      }
    });

    // 3. Update Cache (TTL: 10 minutes - users change status more often)
    if (user) {
      await redis.cache(cacheKey, user, 600);
    }

    return user;
  }

  /**
   * Invalidate user cache.
   */
  static async invalidateUser(userId: string) {
    await redis.invalidate(`user:${userId}`);
  }

  /**
   * Pattern-based key generation.
   */
  static genKey(...parts: (string | number)[]) {
    return parts.join(':');
  }

  /**
   * Generic cache wrapper for any prisma query.
   * Matches (key, query, ttl) usage in controllers.
   */
  static async wrap<T>(key: string, query: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cached = await redis.getCached(key);
    if (cached) return cached as T;

    const result = await query();
    if (result !== null && result !== undefined) {
      await redis.cache(key, result, ttl);
    }
    return result as T;
  }

  /**
   * Directly get a value from cache.
   */
  static async get<T = any>(key: string): Promise<T | null> {
    return await redis.getCached(key);
  }

  /**
   * Directly set a value in cache.
   */
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.cache(key, value, ttl);
  }

  /**
   * Directly delete a value from cache.
   */
  static async del(key: string): Promise<void> {
    await redis.invalidate(key);
  }
}
