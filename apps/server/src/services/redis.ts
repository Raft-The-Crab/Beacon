import Redis from 'ioredis';

class RedisService {
  private client: Redis;
  private subClient: Redis;
  private offline = false;
  private offlineLogged = false;

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
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxLoadingRetryTime: 5000,
      reconnectOnError: (err: Error) => err.message.startsWith('READONLY'),
    };

    this.client = new Redis(redisUrl, baseOptions);
    this.subClient = new Redis(redisUrl, baseOptions);

    this.client.on('ready', () => {
      this.offline = false;
      this.offlineLogged = false;
      console.log('Redis Client Ready');
    });
    this.subClient.on('ready', () => {
      this.offline = false;
      this.offlineLogged = false;
    });

    this.client.on('error', (err) => this.markOffline(err, 'client'));
    this.subClient.on('error', (err) => this.markOffline(err, 'subscriber'));
  }

  private markOffline(error: unknown, context: string) {
    this.offline = true;
    if (!this.offlineLogged) {
      this.offlineLogged = true;
      console.error(`[Redis] ${context} error, entering fallback mode:`, error);
    }
  }

  private async safe<T>(op: () => Promise<T>, fallback: T, context: string): Promise<T> {
    try {
      if (this.offline) return fallback;
      return await op();
    } catch (error) {
      this.markOffline(error, context);
      return fallback;
    }
  }

  async connect() {
    try {
      await Promise.all([this.client.connect(), this.subClient.connect()]);
      this.offline = false;
      this.offlineLogged = false;
      console.log('Redis Service Connected');
    } catch (error) {
      this.markOffline(error, 'connect');
    }
  }

  // Presence Management
  async setPresence(userId: string, status: string, customStatus?: string) {
    const key = `presence:${userId}`;
    await this.safe(
      async () => {
        await this.client.hset(key, {
          status,
          customStatus: customStatus || '',
          lastSeen: Date.now(),
        });
        await this.client.expire(key, 300);
      },
      undefined,
      'setPresence'
    );
  }

  async getPresence(userId: string) {
    const key = `presence:${userId}`;
    return await this.safe(() => this.client.hgetall(key), {}, 'getPresence');
  }

  async getAllPresences(userIds: string[]) {
    return await this.safe(async () => {
      const pipeline = this.client.pipeline();
      userIds.forEach((id) => pipeline.hgetall(`presence:${id}`));
      const results = await pipeline.exec();
      if (!results) return [];
      return results.map(([err, data]) => (err ? {} : data || {}));
    }, [], 'getAllPresences');
  }

  // Session Management
  async setSession(sessionId: string, userId: string, data: any) {
    const key = `session:${sessionId}`;
    await this.safe(
      () => this.client.set(key, JSON.stringify({ userId, ...data }), 'EX', 86400),
      'OK',
      'setSession'
    );
  }

  async getSession(sessionId: string) {
    const key = `session:${sessionId}`;
    const data = await this.safe(() => this.client.get(key), null, 'getSession');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async deleteSession(sessionId: string) {
    await this.safe(() => this.client.del(`session:${sessionId}`), 0, 'deleteSession');
  }

  // Rate Limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    if (this.offline) return true;

    const now = Date.now();
    const windowStart = now - window;

    return await this.safe(async () => {
      await this.client.zremrangebyscore(key, 0, windowStart);
      const count = await this.client.zcard(key);

      if (count >= limit) {
        return false;
      }

      await this.client.zadd(key, now, `${now}`);
      await this.client.expire(key, Math.ceil(window / 1000));
      return true;
    }, true, 'checkRateLimit');
  }

  // Caching
  async cache(key: string, value: any, ttl: number = 3600) {
    await this.safe(() => this.client.set(key, JSON.stringify(value), 'EX', ttl), 'OK', 'cache');
  }

  async getCached(key: string) {
    const data = await this.safe(() => this.client.get(key), null, 'getCached');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async invalidate(key: string) {
    await this.safe(() => this.client.del(key), 0, 'invalidate');
  }

  async invalidatePattern(pattern: string) {
    await this.safe(async () => {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    }, undefined, 'invalidatePattern');
  }

  async publish(channel: string, message: any) {
    await this.safe(() => this.client.publish(channel, JSON.stringify(message)), 0, 'publish');
  }

  subscribe(channel: string, callback: (message: any) => void) {
    if (this.offline) return;

    this.subClient.subscribe(channel).catch((error) => this.markOffline(error, 'subscribe'));
    this.subClient.on('message', (ch, msg) => {
      if (ch !== channel) return;
      try {
        callback(JSON.parse(msg));
      } catch {
        callback(msg);
      }
    });
  }

  // Slowmode & Cooldowns
  async checkSlowmode(
    channelId: string,
    userId: string,
    cooldownMs: number
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    if (this.offline) return { allowed: true };

    const key = `slowmode:${channelId}:${userId}`;
    return await this.safe(async () => {
      const lastMessageAt = await this.client.get(key);

      if (lastMessageAt) {
        const remaining = cooldownMs - (Date.now() - parseInt(lastMessageAt, 10));
        if (remaining > 0) {
          return { allowed: false, retryAfter: Math.ceil(remaining / 1000) };
        }
      }

      await this.client.set(key, Date.now().toString(), 'PX', cooldownMs);
      return { allowed: true };
    }, { allowed: true }, 'checkSlowmode');
  }

  // Voice State Management
  async setVoiceState(userId: string, guildId: string, channelId: string | null, state: any) {
    const key = `voice:${guildId}:${userId}`;
    await this.safe(async () => {
      if (channelId) {
        await this.client.hset(key, {
          channelId,
          ...state,
          timestamp: Date.now(),
        });
      } else {
        await this.client.del(key);
      }
    }, undefined, 'setVoiceState');
  }

  async getVoiceStates(guildId: string) {
    return await this.safe(async () => {
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
    }, {}, 'getVoiceStates');
  }

  async disconnect() {
    await this.safe(async () => {
      await this.client.quit();
      await this.subClient.quit();
    }, undefined, 'disconnect');
  }

  // Proxy methods for common Redis operations
  async hset(key: string, ...args: any[]) {
    return await this.safe(() => (this.client as any).hset(key, ...args), 0, 'hset');
  }

  async hget(key: string, field: string) {
    return await this.safe(() => this.client.hget(key, field), null, 'hget');
  }

  async hgetall(key: string) {
    return await this.safe(() => this.client.hgetall(key), {}, 'hgetall');
  }

  async del(...keys: string[]) {
    return await this.safe(() => this.client.del(...keys), 0, 'del');
  }

  async get(key: string) {
    return await this.safe(() => this.client.get(key), null, 'get');
  }

  async set(key: string, value: string | Buffer | number, ...args: any[]) {
    return await this.safe(() => (this.client as any).set(key, value, ...args), 'OK', 'set');
  }

  async sadd(key: string, ...members: string[]) {
    return await this.safe(() => this.client.sadd(key, ...members), 0, 'sadd');
  }

  async srem(key: string, ...members: string[]) {
    return await this.safe(() => this.client.srem(key, ...members), 0, 'srem');
  }

  async smembers(key: string) {
    return await this.safe(() => this.client.smembers(key), [], 'smembers');
  }

  async scard(key: string) {
    return await this.safe(() => this.client.scard(key), 0, 'scard');
  }

  async keys(pattern: string) {
    return await this.safe(() => this.client.keys(pattern), [], 'keys');
  }

  async zremrangebyscore(key: string, min: string | number, max: string | number) {
    return await this.safe(() => this.client.zremrangebyscore(key, min, max), 0, 'zremrangebyscore');
  }

  async zcard(key: string) {
    return await this.safe(() => this.client.zcard(key), 0, 'zcard');
  }

  async zadd(key: string, score: number, member: string) {
    return await this.safe(() => this.client.zadd(key, score, member), 0, 'zadd');
  }

  async expire(key: string, seconds: number) {
    return await this.safe(() => this.client.expire(key, seconds), 0, 'expire');
  }

  async hmset(key: string, object: object) {
    return await this.safe(() => (this.client as any).hset(key, object), 0, 'hmset');
  }

  get status(): string {
    if (this.offline) return 'offline';
    return (this.client as any).status || 'unknown';
  }

  async ping() {
    return await this.safe(() => this.client.ping(), 'PONG', 'ping');
  }

  async sismember(key: string, member: string) {
    return await this.safe(() => this.client.sismember(key, member), 0, 'sismember');
  }

  async hdel(key: string, ...fields: string[]) {
    return await this.safe(() => this.client.hdel(key, ...fields), 0, 'hdel');
  }

  async incr(key: string) {
    return await this.safe(() => this.client.incr(key), 0, 'incr');
  }

  async ttl(key: string) {
    return await this.safe(() => this.client.ttl(key), -1, 'ttl');
  }

  async quit() {
    return await this.safe(() => this.client.quit(), 'OK', 'quit');
  }

  // Event Delegation for Pub/Sub
  on(event: string, listener: (...args: any[]) => void) {
    this.subClient.on(event, listener);
    return this;
  }
}

export const redis = new RedisService();
