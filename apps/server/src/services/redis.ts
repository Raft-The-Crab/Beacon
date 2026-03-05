import Redis from 'ioredis';

class RedisService {
  private client: Redis;
  private subClient: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const baseOptions = {
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.warn('[Redis] Max retries reached. Continuing in offline mode.');
          return null;
        }
        return Math.min(times * 500, 5000);
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxLoadingRetryTime: 5000,
      reconnectOnError: (err: Error) => err.message.startsWith('READONLY'),
    };

    this.client = new Redis(redisUrl, baseOptions);
    this.subClient = new Redis(redisUrl, baseOptions);

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.subClient.on('error', (err) => console.error('Redis Sub Error:', err));
  }

  async connect() {
    try {
      await Promise.all([this.client.connect(), this.subClient.connect()]);
      console.log('✅ Redis Service Connected');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
    }
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

  async publish(channel: string, message: any) {
    await this.client.publish(channel, JSON.stringify(message));
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
    await this.subClient.quit();
  }

  // Proxy methods for common Redis operations
  async hset(key: string, ...args: any[]) {
    return await (this.client as any).hset(key, ...args);
  }

  async hget(key: string, field: string) {
    return await this.client.hget(key, field);
  }

  async hgetall(key: string) {
    return await this.client.hgetall(key);
  }

  async del(...keys: string[]) {
    return await this.client.del(...keys);
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string | Buffer | number, ...args: any[]) {
    return await (this.client as any).set(key, value, ...args);
  }

  async sadd(key: string, ...members: string[]) {
    return await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]) {
    return await this.client.srem(key, ...members);
  }

  async smembers(key: string) {
    return await this.client.smembers(key);
  }

  async scard(key: string) {
    return await this.client.scard(key);
  }

  async keys(pattern: string) {
    return await this.client.keys(pattern);
  }

  async zremrangebyscore(key: string, min: string | number, max: string | number) {
    return await this.client.zremrangebyscore(key, min, max);
  }

  async zcard(key: string) {
    return await this.client.zcard(key);
  }

  async zadd(key: string, score: number, member: string) {
    return await this.client.zadd(key, score, member);
  }

  // Common Redis operations
  async expire(key: string, seconds: number) {
    return await this.client.expire(key, seconds);
  }

  async hmset(key: string, object: object) {
    return await (this.client as any).hset(key, object);
  }

  get status(): string {
    return (this.client as any).status || 'unknown';
  }

  async ping() {
    return await this.client.ping();
  }

  async sismember(key: string, member: string) {
    return await this.client.sismember(key, member);
  }

  async hdel(key: string, ...fields: string[]) {
    return await this.client.hdel(key, ...fields);
  }

  async incr(key: string) {
    return await this.client.incr(key);
  }

  async ttl(key: string) {
    return await this.client.ttl(key);
  }

  async quit() {
    return await this.client.quit();
  }

  // Event Delegation for Pub/Sub
  on(event: string, listener: (...args: any[]) => void) {
    this.subClient.on(event, listener);
    return this;
  }
}

export const redis = new RedisService();
