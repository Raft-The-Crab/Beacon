import Redis from 'ioredis';

class RedisService {
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.pubClient.on('error', (err) => console.error('Redis Pub Error:', err));
    this.subClient.on('error', (err) => console.error('Redis Sub Error:', err));

    console.log('✅ Redis Service Initialized');
  }

  // Presence Management
  async setPresence(userId: string, status: string, customStatus?: string) {
    const key = `presence:${userId}`;
    await this.client.hset(key, {
      status,
      customStatus: customStatus || '',
      lastSeen: Date.now(),
    });
    await this.client.expire(key, 300); // 5 minutes TTL
  }

  async getPresence(userId: string) {
    const key = `presence:${userId}`;
    return await this.client.hgetall(key);
  }

  async getAllPresences(userIds: string[]) {
    const pipeline = this.client.pipeline();
    userIds.forEach(id => pipeline.hgetall(`presence:${id}`));
    const results = await pipeline.exec();
    return results?.map(([, data]) => data) || [];
  }

  // Session Management
  async setSession(sessionId: string, userId: string, data: any) {
    const key = `session:${sessionId}`;
    await this.client.set(key, JSON.stringify({ userId, ...data }), 'EX', 86400); // 24 hours
  }

  async getSession(sessionId: string) {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string) {
    await this.client.del(`session:${sessionId}`);
  }

  // Rate Limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - window;

    await this.client.zremrangebyscore(key, 0, windowStart);
    const count = await this.client.zcard(key);

    if (count >= limit) {
      return false;
    }

    await this.client.zadd(key, now, `${now}`);
    await this.client.expire(key, Math.ceil(window / 1000));
    return true;
  }

  // Caching
  async cache(key: string, value: any, ttl: number = 3600) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async getCached(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidate(key: string) {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Pub/Sub for distributed WebSocket
  async publish(channel: string, message: any) {
    await this.pubClient.publish(channel, JSON.stringify(message));
  }

  subscribe(channel: string, callback: (message: any) => void) {
    this.subClient.subscribe(channel);
    this.subClient.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch (err) {
          callback(msg);
        }
      }
    });
  }

  // Slowmode & Cooldowns
  async checkSlowmode(channelId: string, userId: string, cooldownMs: number): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `slowmode:${channelId}:${userId}`;
    const lastMessageAt = await this.client.get(key);

    if (lastMessageAt) {
      const remaining = cooldownMs - (Date.now() - parseInt(lastMessageAt));
      if (remaining > 0) {
        return { allowed: false, retryAfter: Math.ceil(remaining / 1000) };
      }
    }

    await this.client.set(key, Date.now().toString(), 'PX', cooldownMs);
    return { allowed: true };
  }

  // Voice State Management
  async setVoiceState(userId: string, guildId: string, channelId: string | null, state: any) {
    const key = `voice:${guildId}:${userId}`;
    if (channelId) {
      await this.client.hset(key, {
        channelId,
        ...state,
        timestamp: Date.now(),
      });
    } else {
      await this.client.del(key);
    }
  }

  async getVoiceStates(guildId: string) {
    const pattern = `voice:${guildId}:*`;
    const keys = await this.client.keys(pattern);
    const states: Record<string, any> = {};
    for (const key of keys) {
      const userId = key.split(':')[2];
      if (userId) {
        states[userId] = await this.client.hgetall(key);
      }
    }
    return states;
  }

  async disconnect() {
    await this.client.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}

export const redis = new RedisService();
