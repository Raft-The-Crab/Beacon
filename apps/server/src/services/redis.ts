import Redis from 'ioredis';

class RedisService {
  private client: Redis;
  private subClient: Redis;
  private offline = false;
  private offlineLogged = false;
  private readonly enabled: boolean;
  private readonly disabledReason: string | null;
  private readonly redisUrl: string;
  private readonly channelSubscribers = new Map<string, Set<(message: any) => void>>();
  private readonly subscribedChannels = new Set<string>();
  private lastOfflineLogAt = 0;
  private lastOfflineSignature = '';

  constructor() {
    const redisUrl = this.resolveRedisUrl();
    this.redisUrl = redisUrl;
    const redisConfig = this.getRedisConfig(redisUrl);
    this.enabled = redisConfig.enabled;
    this.disabledReason = redisConfig.reason;

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

    if (!this.enabled) {
      this.offline = true;
      this.offlineLogged = true;
      if (this.disabledReason) {
        console.warn(`[Redis] disabled: ${this.disabledReason}`);
      }
      return;
    }

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
    this.subClient.on('message', (channel, message) => {
      const subscribers = this.channelSubscribers.get(channel);
      if (!subscribers || subscribers.size === 0) return;

      let parsedMessage: any = message;
      try {
        parsedMessage = JSON.parse(message);
      } catch {
        // Keep raw string payload when the publisher did not send JSON.
      }

      for (const callback of subscribers) {
        callback(parsedMessage);
      }
    });
  }

  private resolveRedisUrl(): string {
    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    const forceEnable = String(process.env.REDIS_FORCE_ENABLE || '').toLowerCase() === 'true';
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_SERVICE_ID);
    const isClawCloud = !!(process.env.CLAWCLOUD_PUBLIC_URL || process.env.CLAWCLOUD_URL);

    const explicit = (process.env.REDIS_URL || '').trim();
    const publicUrl = (process.env.REDIS_URL_PUBLIC || '').trim();
    const privateUrl = (process.env.REDIS_URL_PRIVATE || '').trim();

    if (nodeEnv === 'production') {
      if (isRailway) {
        // Railway cannot resolve private cluster DNS (e.g. *.svc), so prefer public Redis endpoints.
        if (publicUrl) {
          return publicUrl;
        }
        if (explicit && (!this.isInternalClusterHost(explicit) || forceEnable)) {
          return explicit;
        }
        if (privateUrl && forceEnable) {
          return privateUrl;
        }
        return explicit || publicUrl || privateUrl || 'redis://localhost:6379';
      }

      if (isClawCloud) {
        return privateUrl || explicit || publicUrl || 'redis://localhost:6379';
      }

      if (explicit && (!this.isInternalClusterHost(explicit) || forceEnable)) {
        return explicit;
      }
      return privateUrl || publicUrl || explicit || 'redis://localhost:6379';
    }

    if (publicUrl) {
      return publicUrl;
    }

    if (explicit && (!this.isInternalClusterHost(explicit) || forceEnable)) {
      return explicit;
    }

    if (privateUrl) {
      return privateUrl;
    }

    return explicit || 'redis://localhost:6379';
  }

  private isInternalClusterHost(redisUrl: string): boolean {
    try {
      const host = new URL(redisUrl).hostname.toLowerCase();
      return host.endsWith('.svc') || host.endsWith('.cluster.local');
    } catch {
      return false;
    }
  }

  private getRedisConfig(redisUrl: string): { enabled: boolean; reason: string | null } {
    const raw = redisUrl.trim();
    const normalized = raw.toLowerCase();

    if (!normalized) {
      return { enabled: false, reason: 'REDIS_URL is empty' };
    }

    if (normalized.includes('localhost') || normalized.includes('127.0.0.1') || normalized.includes('::1')) {
      return { enabled: false, reason: 'REDIS_URL points to local placeholder' };
    }

    const forceEnable = String(process.env.REDIS_FORCE_ENABLE || '').toLowerCase() === 'true';
    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_SERVICE_ID);

    if (!forceEnable && isRailway && this.isInternalClusterHost(raw)) {
      return {
        enabled: false,
        reason: 'REDIS_URL points to cluster-internal DNS and is unreachable from Railway. Set REDIS_URL_PUBLIC or clear REDIS_URL_PRIVATE for Railway.',
      };
    }

    if (!forceEnable && nodeEnv !== 'production') {
      if (this.isInternalClusterHost(raw)) {
        return {
          enabled: false,
          reason: `REDIS host is cluster-internal and unreachable from local dev. Set REDIS_URL_PUBLIC for local use, or set REDIS_FORCE_ENABLE=true if you are inside that private network.`,
        };
      }
    }

    return { enabled: true, reason: null };
  }

  private markOffline(error: unknown, context: string) {
    this.offline = true;
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const signature = `${context}:${message}`;
    const now = Date.now();
    const shouldLog = !this.offlineLogged || signature !== this.lastOfflineSignature || now - this.lastOfflineLogAt > 60_000;

    if (shouldLog) {
      this.offlineLogged = true;
      this.lastOfflineLogAt = now;
      this.lastOfflineSignature = signature;
      console.warn(`[Redis] ${context} error, entering fallback mode: ${message}`);
    }
  }

  private async safe<T>(op: () => Promise<T>, fallback: T, context: string): Promise<T> {
    try {
      if (!this.enabled || this.offline) return fallback;
      return await op();
    } catch (error) {
      this.markOffline(error, context);
      return fallback;
    }
  }

  private waitForReady(client: Redis, context: string): Promise<void> {
    if ((client as any).status === 'ready') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`[Redis] Timed out waiting for ${context} client to become ready`));
      }, 6000);

      const handleReady = () => {
        cleanup();
        resolve();
      };

      const handleFailure = (error?: Error) => {
        cleanup();
        reject(error || new Error(`[Redis] ${context} client closed before becoming ready`));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        client.off('ready', handleReady);
        client.off('end', handleFailure);
        client.off('close', handleFailure);
        client.off('error', handleFailure);
      };

      client.once('ready', handleReady);
      client.once('end', handleFailure);
      client.once('close', handleFailure);
      client.once('error', handleFailure);
    });
  }

  private async ensureSubscriberReady(): Promise<boolean> {
    if (!this.enabled) {
      this.offline = true;
      return false;
    }

    try {
      const status = (this.subClient as any).status;
      if (status !== 'ready' && status !== 'connecting') {
        await this.subClient.connect();
      }

      await this.waitForReady(this.subClient, 'subscriber');
      this.offline = false;
      this.offlineLogged = false;
      return true;
    } catch (error) {
      this.markOffline(error, 'subscriber');
      return false;
    }
  }

  private async ensureClientReady(): Promise<boolean> {
    if (!this.enabled) {
      this.offline = true;
      return false;
    }

    try {
      const status = (this.client as any).status;
      if (status !== 'ready' && status !== 'connecting') {
        await this.client.connect();
      }

      await this.waitForReady(this.client, 'client');
      this.offline = false;
      this.offlineLogged = false;
      return true;
    } catch (error) {
      this.markOffline(error, 'client');
      return false;
    }
  }

  async connect() {
    if (!this.enabled) {
      this.offline = true;
      return;
    }

    const [clientReady, subscriberReady] = await Promise.all([
      this.ensureClientReady(),
      this.ensureSubscriberReady(),
    ]);

    if (clientReady && subscriberReady) {
      this.offline = false;
      this.offlineLogged = false;
      console.log('Redis Service Connected');
      return;
    }

    this.offline = true;
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
    if (!this.enabled) return;

    const subscribers = this.channelSubscribers.get(channel) || new Set<(message: any) => void>();
    subscribers.add(callback);
    this.channelSubscribers.set(channel, subscribers);

    if (this.subscribedChannels.has(channel)) {
      return;
    }

    void this.ensureSubscriberReady().then((ready) => {
      if (!ready || this.subscribedChannels.has(channel)) return;

      this.subClient.subscribe(channel)
        .then(() => {
          this.subscribedChannels.add(channel);
        })
        .catch((error) => this.markOffline(error, 'subscribe'));
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

  async hmget(key: string, ...fields: string[]) {
    return await this.safe(() => this.client.hmget(key, ...fields), [], 'hmget');
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
    if (!this.enabled || this.offline) return 'offline';
    return (this.client as any).status || 'unknown';
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get disabledConfigReason(): string | null {
    return this.disabledReason;
  }

  async ping(): Promise<'PONG' | null> {
    const ready = await this.ensureClientReady();
    if (!ready) return null;

    try {
      return await this.client.ping();
    } catch (error) {
      this.markOffline(error, 'ping');
      return null;
    }
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
    if (!this.enabled) return this;
    this.subClient.on(event, listener);
    return this;
  }
}

export const redis = new RedisService();
