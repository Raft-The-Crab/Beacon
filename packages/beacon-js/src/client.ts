/**
 * Client — Main bot client with full feature set
 * Caching, commands, interactions, rate limits, presence
 */

import { EventEmitter } from 'events';
import { Gateway, GatewayOptions, Intents, DEFAULT_INTENTS } from './gateway';
import { RestClient } from './rest/RestClient';
import { Collection } from './structures/Collection';
import { InteractionContext } from './structures/InteractionContext';
import { Collector, CollectorOptions } from './structures/Collector';
import { CommandBuilder } from './builders/CommandBuilder';
import type { RawGuild, RawChannel, RawUser, RawMessage, RawInteraction } from './structures/Message';

export interface ClientOptions {
  token: string;
  intents?: number;
  gatewayURL?: string;
  apiURL?: string;
  /** Log gateway debug events to console */
  debug?: boolean;
}

type CommandHandler = (ctx: InteractionContext) => void | Promise<void>;

import { VoiceManager } from './voice/VoiceManager';

export class Client extends EventEmitter {
  public readonly token: string;
  public readonly rest: RestClient;
  public readonly Intents = Intents;
  public readonly voice: VoiceManager;

  // Caches (Bounded limits to protect memory footprints natively)
  public guilds: Collection<string, RawGuild> = new Collection<string, RawGuild>().setMaxSize(100);
  public channels: Collection<string, RawChannel> = new Collection<string, RawChannel>().setMaxSize(500);
  public users: Collection<string, RawUser> = new Collection<string, RawUser>().setMaxSize(1000);
  public messages: Collection<string, RawMessage> = new Collection<string, RawMessage>().setMaxSize(2000);

  public user: RawUser | null = null;
  public applicationId: string | null = null;

  private _gateway: Gateway;
  private _commands: Map<string, CommandHandler> = new Map();
  private _ready = false;

  constructor(options: ClientOptions) {
    super();
    this.token = options.token;

    this._gateway = new Gateway({
      token: options.token,
      url: options.gatewayURL,
      intents: options.intents ?? DEFAULT_INTENTS,
    });

    this.rest = new RestClient({
      token: options.token,
      baseURL: options.apiURL ?? (process.env.BEACON_API_URL || 'https://api.beacon.chat'),
    });

    this.voice = new VoiceManager(this);

    if (options.debug) {
      this._gateway.on('debug', (msg: string) => console.debug('[beacon.js]', msg));
    }

    this._setupGatewayEvents();
  }

  // ─────────────────────────────────────────────────────────────
  // Gateway wiring
  // ─────────────────────────────────────────────────────────────
  private _setupGatewayEvents() {
    this._gateway.on('ready', (data: any) => {
      this.user = data.user;
      this.applicationId = data.application?.id ?? null;
      this._ready = true;
      this.emit('ready');
    });

    this._gateway.on('messageCreate', (msg: RawMessage) => {
      this.messages.set(msg.id, msg);
      this.emit('messageCreate', msg);
    });

    this._gateway.on('messageUpdate', (msg: Partial<RawMessage> & { id: string; channel_id: string }) => {
      const old = this.messages.get(msg.id) ?? null;
      if (old) this.messages.set(msg.id, { ...old, ...msg });
      this.emit('messageUpdate', old, msg);
    });

    this._gateway.on('messageDelete', (data: { id: string; channel_id: string }) => {
      const msg = this.messages.get(data.id) ?? null;
      this.messages.delete(data.id);
      this.emit('messageDelete', msg ?? data);
    });

    this._gateway.on('guildCreate', (guild: RawGuild) => {
      this.guilds.set(guild.id, guild);
      for (const ch of guild.channels ?? []) this.channels.set(ch.id, ch);
      this.emit('guildCreate', guild);
    });

    this._gateway.on('guildUpdate', (guild: RawGuild) => {
      this.guilds.set(guild.id, guild);
      this.emit('guildUpdate', guild);
    });

    this._gateway.on('guildDelete', (data: { id: string }) => {
      const guild = this.guilds.get(data.id) ?? null;
      this.guilds.delete(data.id);
      this.emit('guildDelete', guild ?? data);
    });

    this._gateway.on('channelCreate', (ch: RawChannel) => {
      this.channels.set(ch.id, ch);
      this.emit('channelCreate', ch);
    });

    this._gateway.on('channelUpdate', (ch: RawChannel) => {
      this.channels.set(ch.id, ch);
      this.emit('channelUpdate', ch);
    });

    this._gateway.on('channelDelete', (ch: RawChannel) => {
      this.channels.delete(ch.id);
      this.emit('channelDelete', ch);
    });

    this._gateway.on('guildMemberAdd', (member: any) => {
      if (member.user) this.users.set(member.user.id, member.user);
      this.emit('guildMemberAdd', member);
    });

    this._gateway.on('guildMemberRemove', (data: any) => {
      this.emit('guildMemberRemove', data);
    });

    this._gateway.on('voiceStateUpdate', (state: any) => {
      this.emit('voiceStateUpdate', state);
    });

    this._gateway.on('typingStart', (data: any) => {
      this.emit('typingStart', data);
    });

    this._gateway.on('presenceUpdate', (presence: any) => {
      this.emit('presenceUpdate', presence);
    });

    this._gateway.on('interactionCreate', (raw: RawInteraction) => {
      const ctx = new InteractionContext(raw, this.rest);
      this.emit('interactionCreate', ctx);
      // Auto-dispatch slash commands
      if (raw.type === 2 && raw.data) {
        const handler = this._commands.get(raw.data.name);
        if (handler) {
          Promise.resolve(handler(ctx)).catch((err) => this.emit('error', err));
        }
      }
    });

    this._gateway.on('messageReactionAdd', (data: any) => this.emit('messageReactionAdd', data));
    this._gateway.on('messageReactionRemove', (data: any) => this.emit('messageReactionRemove', data));

    this._gateway.on('disconnect', (event: any) => this.emit('disconnect', event));
    this._gateway.on('error', (err: Error) => this.emit('error', err));
    this._gateway.on('packet', (pkt: any) => this.emit('raw', pkt));
  }

  // ─────────────────────────────────────────────────────────────
  // Login / logout
  // ─────────────────────────────────────────────────────────────
  async login(token?: string): Promise<this> {
    if (token) (this as any).token = token;
    this._gateway.connect();
    return this;
  }

  destroy() {
    this._ready = false;
    this._gateway.disconnect();
  }

  get isReady(): boolean {
    return this._ready;
  }

  // ─────────────────────────────────────────────────────────────
  // Slash command registration
  // ─────────────────────────────────────────────────────────────
  /** Register a slash command handler (local routing only) */
  command(name: string, handler: CommandHandler): this {
    this._commands.set(name, handler);
    return this;
  }

  /** Deploy all registered slash commands to Beacon API */
  async deployCommands(commands: ReturnType<CommandBuilder['toJSON']>[], guildId?: string): Promise<void> {
    if (!this.applicationId) throw new Error('Client not ready — wait for "ready" event');
    if (guildId) {
      await this.rest.bulkOverwriteGuildCommands(this.applicationId, guildId, commands);
    } else {
      await this.rest.bulkOverwriteGlobalCommands(this.applicationId, commands);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Message helpers
  // ─────────────────────────────────────────────────────────────
  async sendMessage(channelId: string, content: string | { content?: string; embeds?: any[]; reply_to?: string }) {
    return this.rest.createMessage(channelId, content);
  }

  async editMessage(channelId: string, messageId: string, content: string | { content?: string; embeds?: any[] }) {
    return this.rest.request('PATCH', `/channels/${channelId}/messages/${messageId}`,
      typeof content === 'string' ? { content } : content
    );
  }

  async deleteMessage(channelId: string, messageId: string) {
    return this.rest.deleteMessage(channelId, messageId);
  }

  async pinMessage(channelId: string, messageId: string) {
    return this.rest.request('PUT', `/channels/${channelId}/pins/${messageId}`);
  }

  async unpinMessage(channelId: string, messageId: string) {
    return this.rest.request('DELETE', `/channels/${channelId}/pins/${messageId}`);
  }

  async getPinnedMessages(channelId: string) {
    return this.rest.request('GET', `/channels/${channelId}/pins`);
  }

  // ─────────────────────────────────────────────────────────────
  // Reaction helpers
  // ─────────────────────────────────────────────────────────────
  async addReaction(channelId: string, messageId: string, emoji: string) {
    return this.rest.addReaction(channelId, messageId, emoji);
  }

  async removeReaction(channelId: string, messageId: string, emoji: string, userId = '@me') {
    return this.rest.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Collector helpers
  // ─────────────────────────────────────────────────────────────
  /** Collect messages in a channel */
  createMessageCollector(channelId: string, options: CollectorOptions<RawMessage> = {}): Collector<RawMessage> {
    const collector = new Collector<RawMessage>({
      filter: (msg) => msg.channel_id === channelId,
      ...options,
    });
    const listener = (msg: RawMessage) => collector.collect(msg);
    this.on('messageCreate', listener);
    collector.once('end', () => this.off('messageCreate', listener));
    return collector;
  }

  /** Await a single message in a channel matching the filter */
  async awaitMessage(channelId: string, options: CollectorOptions<RawMessage> = {}): Promise<RawMessage | null> {
    const collector = this.createMessageCollector(channelId, { max: 1, ...options });
    const results = await collector.await();
    return results[0] ?? null;
  }

  // ─────────────────────────────────────────────────────────────
  // Guild helpers
  // ─────────────────────────────────────────────────────────────
  async createRole(guildId: string, data: any) {
    return this.rest.createGuildRole(guildId, data);
  }

  async kickMember(guildId: string, userId: string, reason?: string) {
    return this.rest.kickGuildMember(guildId, userId, reason);
  }

  async banMember(guildId: string, userId: string, options: { deleteMessageDays?: number; reason?: string } = {}) {
    return this.rest.banGuildMember(guildId, userId, options.deleteMessageDays, options.reason);
  }

  async unbanMember(guildId: string, userId: string) {
    return this.rest.unbanGuildMember(guildId, userId);
  }

  async setPresence(status: 'online' | 'idle' | 'dnd' | 'invisible', activities: any[] = []) {
    this._gateway.updatePresence(status, activities);
  }
}
