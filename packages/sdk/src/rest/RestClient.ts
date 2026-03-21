import { resolveApiClientBaseUrl } from '../connection';
import type { Role, AuditLogEntry, RawUser, RawGuild, RawChannel, RawMessage } from '../types/index';
import { RequestSigner } from '../security/RequestSigner';
import { TokenManager } from '../security/TokenManager';

/** SDK version — injected into User-Agent and exported for diagnostics */
export const SDK_VERSION = '3.0.0-beta.1';

/**
 * RestClient — Rate-limit-aware HTTP client for Beacon API
 */

export interface RestClientOptions {
  token: string;
  secret?: string; // For request signing
  baseURL?: string;
  version?: string;
  /** Request timeout in ms. Default: 30000 (30s). */
  timeout?: number;
}

export interface RestMetrics {
  totalRequests: number;
  failedRequests: number;
  totalLatencyMs: number;
  /** Average latency in ms across all completed requests */
  avgLatencyMs: number;
}

interface RateLimitBucket {
  remaining: number;
  resetAt: number;
}

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

export class RestClient {
  public readonly tokenManager: TokenManager;
  private readonly signer?: RequestSigner;
  public baseURL: string;
  private version: string;
  private readonly timeout: number;
  private buckets: Map<string, RateLimitBucket> = new Map();
  private globalReset: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  public client!: any; // Back-reference to main Client (set during init)

  // v3: Request metrics tracking
  private _totalRequests = 0;
  private _failedRequests = 0;
  private _totalLatencyMs = 0;

  /** v3: Live request metrics for diagnostics */
  get stats(): RestMetrics {
    return {
      totalRequests: this._totalRequests,
      failedRequests: this._failedRequests,
      totalLatencyMs: this._totalLatencyMs,
      avgLatencyMs: this._totalRequests > 0 ? Math.round(this._totalLatencyMs / this._totalRequests) : 0,
    };
  }

  constructor(options: RestClientOptions) {
    this.tokenManager = new TokenManager(options.token);
    if (options.secret) {
      this.signer = new RequestSigner(options.secret);
    }
    this.baseURL = resolveApiClientBaseUrl(options.baseURL);
    this.version = options.version ?? 'v1';
    this.timeout = options.timeout ?? 30_000;
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

  // ─── Convenience HTTP methods (used by managers) ───────────
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T = any>(endpoint: string, options?: any): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
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

  private async _executeRequest<T>(method: string, endpoint: string, body?: any, retryCount = 0): Promise<T> {
    const bucketKey = this._getBucketKey(method, endpoint);
    const bucket = this.buckets.get(bucketKey);

    // Per-route rate limit check
    if (bucket && bucket.remaining <= 0 && Date.now() < bucket.resetAt) {
      await this._sleep(bucket.resetAt - Date.now() + 50);
    }

    const url = `${this.baseURL}/${this.version}${endpoint}`;
    const token = this.tokenManager.getToken();
    const timestamp = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': `beacon.js/${SDK_VERSION} (Beacon SDK)`,
      'X-Beacon-Timestamp': timestamp.toString(),
    };

    if (this.signer && body) {
      const signature = await this.signer.sign(JSON.stringify(body), timestamp);
      headers['X-Beacon-Signature'] = signature;
    }

    // v3: AbortController timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      this._totalRequests++;
      this._failedRequests++;
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms: ${method} ${endpoint}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    // v3: Track metrics
    this._totalRequests++;
    this._totalLatencyMs += Date.now() - timestamp;

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
      return this._executeRequest<T>(method, endpoint, body, retryCount);
    }

    // 5xx — exponential backoff retry
    if (res.status >= 500 && retryCount < MAX_RETRIES) {
      const delay = BASE_BACKOFF_MS * Math.pow(2, retryCount);
      await this._sleep(delay);
      return this._executeRequest<T>(method, endpoint, body, retryCount + 1);
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
  getChannel(channelId: string): Promise<RawChannel> {
    return this.request<RawChannel>('GET', `/channels/${channelId}`);
  }

  modifyChannel(channelId: string, data: any) {
    return this.request('PATCH', `/channels/${channelId}`, data);
  }

  deleteChannel(channelId: string) {
    return this.request('DELETE', `/channels/${channelId}`);
  }

  getChannelMessages(channelId: string, options: { limit?: number; before?: string; after?: string; around?: string } = {}): Promise<RawMessage[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', options.before);
    if (options.after) params.set('after', options.after);
    if (options.around) params.set('around', options.around);
    const qs = params.toString();
    return this.request<RawMessage[]>('GET', `/channels/${channelId}/messages${qs ? `?${qs}` : ''}`);
  }

  createMessage(channelId: string, content: string | { content?: string; embeds?: any[]; reply_to?: string; attachments?: any[]; components?: any[] }): Promise<RawMessage> {
    const body = typeof content === 'string' ? { content } : content;
    return this.request<RawMessage>('POST', `/channels/${channelId}/messages`, body);
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
  getGuild(guildId: string): Promise<RawGuild> {
    return this.request<RawGuild>('GET', `/guilds/${guildId}`);
  }

  modifyGuild(guildId: string, data: any) {
    return this.request('PATCH', `/guilds/${guildId}`, data);
  }

  getGuildChannels(guildId: string): Promise<RawChannel[]> {
    return this.request<RawChannel[]>('GET', `/guilds/${guildId}/channels`);
  }

  createGuildChannel(guildId: string, data: any) {
    return this.request('POST', `/guilds/${guildId}/channels`, data);
  }

  getGuildMember(guildId: string, userId: string): Promise<any> {
    return this.request<any>('GET', `/guilds/${guildId}/members/${userId}`);
  }

  listGuildMembers(guildId: string, limit = 1000): Promise<any[]> {
    return this.request<any[]>('GET', `/guilds/${guildId}/members?limit=${limit}`);
  }

  getGuildMembers(guildId: string, limit = 1000): Promise<any[]> {
    return this.listGuildMembers(guildId, limit);
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

  getGuildBans(guildId: string): Promise<any[]> {
    return this.request<any[]>('GET', `/guilds/${guildId}/bans`);
  }

  getGuildRoles(guildId: string): Promise<Role[]> {
    return this.request<Role[]>('GET', `/guilds/${guildId}/roles`);
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

  getAuditLogs(guildId: string, options: { limit?: number; action?: number } = {}): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.action) params.set('action_type', String(options.action));
    return this.request<AuditLogEntry[]>('GET', `/audit-logs/${guildId}?${params}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────
  getCurrentUser(): Promise<RawUser> {
    return this.request<RawUser>('GET', '/users/@me');
  }

  getUser(userId: string): Promise<RawUser> {
    return this.request<RawUser>('GET', `/users/${userId}`);
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

  // ─────────────────────────────────────────────────────────────
  // File / attachment upload (multipart form-data)
  // ─────────────────────────────────────────────────────────────
  /**
   * Upload a file attachment to a channel message.
   * @param channelId  Target channel
   * @param file       File content as Buffer, Blob, or ReadableStream
   * @param filename   Filename shown in the client (e.g. "photo.png")
   * @param options    Additional message fields (content, embeds, etc.)
   */
  async uploadFile(
    channelId: string,
    file: Buffer | Blob | ReadableStream,
    filename: string,
    options: { content?: string; embeds?: any[]; flags?: number } = {}
  ): Promise<any> {
    const formData = new FormData();

    // Append the file
    let blob: Blob;
    if (file instanceof Blob) {
      blob = file;
    } else if (file instanceof Buffer) {
      const ab = (file as Buffer).buffer.slice(
        (file as Buffer).byteOffset,
        (file as Buffer).byteOffset + (file as Buffer).byteLength
      ) as ArrayBuffer;
      blob = new Blob([ab]);
    } else {
      const ab = await this._streamToBuffer(file as ReadableStream);
      blob = new Blob([ab]);
    }

    formData.append('files[0]', blob, filename);

    // Attach JSON payload
    const payload: Record<string, any> = {};
    if (options.content) payload.content = options.content;
    if (options.embeds) payload.embeds = options.embeds;
    if (options.flags !== undefined) payload.flags = options.flags;
    if (Object.keys(payload).length > 0) {
      formData.append('payload_json', JSON.stringify(payload));
    }

    const url = `${this.baseURL}/${this.version}/channels/${channelId}/messages`;
    const token = this.tokenManager.getToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}` }, // no Content-Type — FormData sets boundary
      body: formData as any,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(`Upload failed HTTP ${res.status}: ${err.message ?? res.statusText}`), {
        status: res.status,
        response: err,
      });
    }
    return res.json();
  }

  private async _streamToBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      if (value) chunks.push(value);
      done = d;
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new ArrayBuffer(total);
    const view = new Uint8Array(result);
    let offset = 0;
    for (const chunk of chunks) { view.set(chunk, offset); offset += chunk.length; }
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Threads
  // ─────────────────────────────────────────────────────────────
  createThread(channelId: string, data: { name: string; type?: number; auto_archive_duration?: number; message_id?: string }) {
    const endpoint = data.message_id
      ? `/channels/${channelId}/messages/${data.message_id}/threads`
      : `/channels/${channelId}/threads`;
    return this.request('POST', endpoint, { name: data.name, type: data.type ?? 11, auto_archive_duration: data.auto_archive_duration ?? 1440 });
  }

  joinThread(channelId: string) {
    return this.request('PUT', `/channels/${channelId}/thread-members/@me`);
  }

  leaveThread(channelId: string) {
    return this.request('DELETE', `/channels/${channelId}/thread-members/@me`);
  }

  getThreadMembers(channelId: string) {
    return this.request('GET', `/channels/${channelId}/thread-members`);
  }

  listPublicArchivedThreads(channelId: string, options: { limit?: number; before?: string } = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.before) params.set('before', options.before);
    return this.request('GET', `/channels/${channelId}/threads/archived/public?${params}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Stage channels
  // ─────────────────────────────────────────────────────────────
  createStageInstance(channelId: string, topic: string) {
    return this.request('POST', `/stage-instances`, { channel_id: channelId, topic });
  }

  deleteStageInstance(channelId: string) {
    return this.request('DELETE', `/stage-instances/${channelId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Invites
  // ─────────────────────────────────────────────────────────────
  getChannelInvites(channelId: string) {
    return this.request('GET', `/channels/${channelId}/invites`);
  }

  createChannelInvite(channelId: string, data: { max_age?: number; max_uses?: number; temporary?: boolean } = {}) {
    return this.request('POST', `/channels/${channelId}/invites`, data);
  }

  deleteInvite(code: string) {
    return this.request('DELETE', `/invites/${code}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Scheduled events
  // ─────────────────────────────────────────────────────────────
  listGuildScheduledEvents(guildId: string) {
    return this.request('GET', `/guilds/${guildId}/scheduled-events`);
  }

  createGuildScheduledEvent(guildId: string, data: any) {
    return this.request('POST', `/guilds/${guildId}/scheduled-events`, data);
  }

  modifyGuildScheduledEvent(guildId: string, eventId: string, data: any) {
    return this.request('PATCH', `/guilds/${guildId}/scheduled-events/${eventId}`, data);
  }

  deleteGuildScheduledEvent(guildId: string, eventId: string) {
    return this.request('DELETE', `/guilds/${guildId}/scheduled-events/${eventId}`);
  }
}
