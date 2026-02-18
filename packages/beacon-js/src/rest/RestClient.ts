/**
 * RestClient — Rate-limit-aware HTTP client for Beacon API
 */

export interface RestClientOptions {
  token: string;
  baseURL?: string;
  version?: string;
}

interface RateLimitBucket {
  remaining: number;
  resetAt: number;
}

export class RestClient {
  private token: string;
  private baseURL: string;
  private version: string;
  private buckets: Map<string, RateLimitBucket> = new Map();
  private globalReset: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(options: RestClientOptions) {
    this.token = options.token;
    this.baseURL = options.baseURL ?? 'https://api.beacon.chat';
    this.version = options.version ?? 'v1';
  }

  async request<T = any>(method: string, endpoint: string, body?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this._executeRequest<T>(method, endpoint, body);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this._processQueue();
    });
  }

  private async _processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.requestQueue.length > 0) {
      // Global rate limit check
      const now = Date.now();
      if (this.globalReset > now) {
        await this._sleep(this.globalReset - now);
      }

      const task = this.requestQueue.shift();
      if (task) await task();
    }

    this.processing = false;
  }

  private async _executeRequest<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const bucketKey = this._getBucketKey(method, endpoint);
    const bucket = this.buckets.get(bucketKey);
    
    // Per-route rate limit check
    if (bucket && bucket.remaining <= 0 && Date.now() < bucket.resetAt) {
      await this._sleep(bucket.resetAt - Date.now() + 50);
    }

    const url = `${this.baseURL}/${this.version}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bot ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'beacon.js/2.5.0 (https://beacon.chat)',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Update rate limit bucket from headers
    const remaining = Number(res.headers.get('X-RateLimit-Remaining') ?? 1);
    const resetAfter = Number(res.headers.get('X-RateLimit-Reset-After') ?? 0) * 1000;
    this.buckets.set(bucketKey, {
      remaining,
      resetAt: Date.now() + resetAfter,
    });

    // Global rate limit
    if (res.headers.get('X-RateLimit-Global')) {
      this.globalReset = Date.now() + resetAfter;
    }

    // 429 — backoff and retry
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? 1) * 1000;
      await this._sleep(retryAfter);
      return this._executeRequest<T>(method, endpoint, body);
    }

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(`HTTP ${res.status}: ${err.message ?? res.statusText}`), {
        status: res.status,
        code: err.code,
        response: err,
      });
    }

    return res.json() as Promise<T>;
  }

  private _getBucketKey(method: string, endpoint: string): string {
    // Major parameters affect rate limits
    const major = endpoint.match(/\/(guilds|channels|webhooks)\/(\d+)/)?.[2] ?? 'global';
    return `${method}:${major}:${endpoint.replace(/\d{16,}/g, ':id')}`;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, Math.max(0, ms)));
  }

  // ─────────────────────────────────────────────────────────────
  // Channels
  // ─────────────────────────────────────────────────────────────
  getChannel(channelId: string) {
    return this.request('GET', `/channels/${channelId}`);
  }

  modifyChannel(channelId: string, data: any) {
    return this.request('PATCH', `/channels/${channelId}`, data);
  }

  deleteChannel(channelId: string) {
    return this.request('DELETE', `/channels/${channelId}`);
  }

  getChannelMessages(channelId: string, options: { limit?: number; before?: string; after?: string; around?: string } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', options.before);
    if (options.after) params.set('after', options.after);
    if (options.around) params.set('around', options.around);
    const qs = params.toString();
    return this.request('GET', `/channels/${channelId}/messages${qs ? `?${qs}` : ''}`);
  }

  createMessage(channelId: string, content: string | { content?: string; embeds?: any[]; reply_to?: string; attachments?: any[] }) {
    const body = typeof content === 'string' ? { content } : content;
    return this.request('POST', `/channels/${channelId}/messages`, body);
  }

  editMessage(channelId: string, messageId: string, data: any) {
    return this.request('PATCH', `/channels/${channelId}/messages/${messageId}`, data);
  }

  deleteMessage(channelId: string, messageId: string) {
    return this.request('DELETE', `/channels/${channelId}/messages/${messageId}`);
  }

  bulkDeleteMessages(channelId: string, messageIds: string[]) {
    return this.request('POST', `/channels/${channelId}/messages/bulk-delete`, { messages: messageIds });
  }

  addReaction(channelId: string, messageId: string, emoji: string) {
    return this.request('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
  }

  removeReaction(channelId: string, messageId: string, emoji: string, userId = '@me') {
    return this.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`);
  }

  getPinnedMessages(channelId: string) {
    return this.request('GET', `/channels/${channelId}/pins`);
  }

  pinMessage(channelId: string, messageId: string) {
    return this.request('PUT', `/channels/${channelId}/pins/${messageId}`);
  }

  unpinMessage(channelId: string, messageId: string) {
    return this.request('DELETE', `/channels/${channelId}/pins/${messageId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Guilds
  // ─────────────────────────────────────────────────────────────
  getGuild(guildId: string) {
    return this.request('GET', `/guilds/${guildId}`);
  }

  modifyGuild(guildId: string, data: any) {
    return this.request('PATCH', `/guilds/${guildId}`, data);
  }

  getGuildChannels(guildId: string) {
    return this.request('GET', `/guilds/${guildId}/channels`);
  }

  createGuildChannel(guildId: string, data: any) {
    return this.request('POST', `/guilds/${guildId}/channels`, data);
  }

  getGuildMember(guildId: string, userId: string) {
    return this.request('GET', `/guilds/${guildId}/members/${userId}`);
  }

  listGuildMembers(guildId: string, limit = 1000) {
    return this.request('GET', `/guilds/${guildId}/members?limit=${limit}`);
  }

  addGuildMemberRole(guildId: string, userId: string, roleId: string) {
    return this.request('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
  }

  removeGuildMemberRole(guildId: string, userId: string, roleId: string) {
    return this.request('DELETE', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
  }

  kickGuildMember(guildId: string, userId: string, reason?: string) {
    return this.request('DELETE', `/guilds/${guildId}/members/${userId}`, reason ? { reason } : undefined);
  }

  banGuildMember(guildId: string, userId: string, deleteMessageDays = 0, reason?: string) {
    return this.request('PUT', `/guilds/${guildId}/bans/${userId}`, {
      delete_message_days: deleteMessageDays,
      reason,
    });
  }

  unbanGuildMember(guildId: string, userId: string) {
    return this.request('DELETE', `/guilds/${guildId}/bans/${userId}`);
  }

  getGuildBans(guildId: string) {
    return this.request('GET', `/guilds/${guildId}/bans`);
  }

  getGuildRoles(guildId: string) {
    return this.request('GET', `/guilds/${guildId}/roles`);
  }

  createGuildRole(guildId: string, data: any) {
    return this.request('POST', `/guilds/${guildId}/roles`, data);
  }

  modifyGuildRole(guildId: string, roleId: string, data: any) {
    return this.request('PATCH', `/guilds/${guildId}/roles/${roleId}`, data);
  }

  deleteGuildRole(guildId: string, roleId: string) {
    return this.request('DELETE', `/guilds/${guildId}/roles/${roleId}`);
  }

  getAuditLogs(guildId: string, options: { limit?: number; action?: number } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.action) params.set('action_type', String(options.action));
    return this.request('GET', `/audit-logs/${guildId}?${params}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────
  getCurrentUser() {
    return this.request('GET', '/users/@me');
  }

  getUser(userId: string) {
    return this.request('GET', `/users/${userId}`);
  }

  modifyCurrentUser(data: { username?: string; avatar?: string }) {
    return this.request('PATCH', '/users/@me', data);
  }

  // ─────────────────────────────────────────────────────────────
  // Application Commands
  // ─────────────────────────────────────────────────────────────
  getGlobalCommands(applicationId: string) {
    return this.request('GET', `/applications/${applicationId}/commands`);
  }

  createGlobalCommand(applicationId: string, command: any) {
    return this.request('POST', `/applications/${applicationId}/commands`, command);
  }

  bulkOverwriteGlobalCommands(applicationId: string, commands: any[]) {
    return this.request('PUT', `/applications/${applicationId}/commands`, commands);
  }

  deleteGlobalCommand(applicationId: string, commandId: string) {
    return this.request('DELETE', `/applications/${applicationId}/commands/${commandId}`);
  }

  getGuildCommands(applicationId: string, guildId: string) {
    return this.request('GET', `/applications/${applicationId}/guilds/${guildId}/commands`);
  }

  createGuildCommand(applicationId: string, guildId: string, command: any) {
    return this.request('POST', `/applications/${applicationId}/guilds/${guildId}/commands`, command);
  }

  bulkOverwriteGuildCommands(applicationId: string, guildId: string, commands: any[]) {
    return this.request('PUT', `/applications/${applicationId}/guilds/${guildId}/commands`, commands);
  }

  deleteGuildCommand(applicationId: string, guildId: string, commandId: string) {
    return this.request('DELETE', `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Webhooks
  // ─────────────────────────────────────────────────────────────
  getChannelWebhooks(channelId: string) {
    return this.request('GET', `/webhooks/channels/${channelId}`);
  }

  createWebhook(channelId: string, data: { name: string; avatar?: string }) {
    return this.request('POST', `/webhooks/guilds/:guildId/channels/${channelId}`, data);
  }

  executeWebhook(id: string, token: string, data: any) {
    return this.request('POST', `/webhooks/execute/${id}/${token}`, data);
  }
}
