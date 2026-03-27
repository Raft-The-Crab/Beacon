/**
 * Client v3 — Main bot client with full feature set
 * Caching, commands, interactions, rate limits, presence, health monitoring
 */

import EventEmitter from 'eventemitter3';
import { IntentCalculator } from './utils/IntentCalculator';
import { Gateway, GatewayOptions, Intents, DEFAULT_INTENTS, type ConnectionState, type HealthGrade, type GatewaySessionInfo } from './gateway';
import { RestClient } from './rest/RestClient';
import { Collector, type CollectorOptions } from './structures/Collector';
import { VoiceStateCollector, type VoiceStateCollectorOptions } from './structures/VoiceStateCollector';
import { InteractionContext } from './structures/InteractionContext';
import { MessageBuilder } from './builders/MessageBuilder';
import { CommandBuilder } from './builders/CommandBuilder';
import { InteractionCollector, type InteractionCollectorOptions } from './structures/InteractionCollector';
import type { RawGuild, RawChannel, RawMessage, Embed } from './types/index';
import { Guild } from './structures/Guild';
import { Channel } from './structures/Channel';
import { User } from './structures/User';
import type { RawInteraction } from './types/index';
import { Message } from './structures/Message';
import { GuildManager } from './managers/GuildManager';
import { ChannelManager } from './managers/ChannelManager';
import { MemberManager } from './managers/MemberManager';
import { UserManager } from './managers/UserManager';
import { PresenceManager } from './managers/PresenceManager';
import { InviteManager } from './managers/InviteManager';
import { TTLCache } from './cache/TTLCache';
import { resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from './connection';
import { CommandRegistry, CommandDefinition, AutocompleteContext } from './registry/CommandRegistry';
import { MiddlewarePipeline, type MiddlewareFn } from './middleware/Middleware';

export interface ClientOptions {
  token: string;
  intents?: number;
  gatewayURL?: string;
  apiURL?: string;
  /** Log gateway debug events to console */
  debug?: boolean;
  /** Number of shards (for ShardManager integration). Defaults to 1. */
  shardId?: number;
  shardCount?: number;
}

export type CommandHandler = (ctx: InteractionContext) => void | Promise<void>;


import { VoiceManager } from './voice/VoiceManager';

/**
 * Interface for Beacon SDK plugins.
 * Plugins can register middleware, commands, and other extensions.
 */
export interface BeaconPlugin {
  name: string;
  onInstall(client: Client): void | Promise<void>;
  onTeardown?(client: Client): void | Promise<void>;
}

export class Client extends EventEmitter {
  public readonly token: string;
  public readonly rest: RestClient;
  public readonly Intents = Intents;
  public readonly IntentCalculator = IntentCalculator;
  public readonly voice: VoiceManager;

  // Managers
  public readonly guildManager: GuildManager;
  public readonly channelManager: ChannelManager;
  public readonly memberManager: MemberManager;
  public readonly userManager: UserManager;
  public readonly invites: InviteManager;
  public readonly presences: PresenceManager;

  // Caches (Standardized TTLCache for performance & safety)
  public guilds: TTLCache<string, Guild> = new TTLCache<string, Guild>(3600000, 100);
  public channels: TTLCache<string, Channel> = new TTLCache<string, Channel>(3600000, 500);
  public users: TTLCache<string, User> = new TTLCache<string, User>(3600000, 1000);
  public messages: TTLCache<string, Message> = new TTLCache<string, Message>(600000, 2000);

  public user: User | null = null;
  public applicationId: string | null = null;

  private _gateway: Gateway;
  /** Quick-registered handlers via .command() — used as fallback routing. */
  private _commands: Map<string, CommandHandler> = new Map();
  /** Full-featured command registry with cooldowns, middleware, and autocomplete. */
  public readonly registry = new CommandRegistry();
  /** Gateway event middleware pipeline — intercept/transform/short-circuit events. */
  public readonly middleware = new MiddlewarePipeline();
  private _plugins: Map<string, BeaconPlugin> = new Map();
  private _ready = false;
  private _readyAt = 0;

  /** Current gateway connection state */
  get connectionState(): ConnectionState { return this._gateway.connectionState; }

  /** Whether the gateway is connected and operational */
  get isConnected(): boolean { return this._gateway.isConnected; }

  /** Heartbeat round-trip latency in ms (-1 if not measured) */
  get latency(): number { return this._gateway.latency; }

  /** v3: Bot uptime in ms since the 'ready' event (0 if not ready) */
  get uptime(): number { return this._readyAt > 0 ? Date.now() - this._readyAt : 0; }

  /** v3: Cache size statistics for diagnostics */
  get cacheStats() {
    return {
      guilds: this.guilds.size,
      channels: this.channels.size,
      users: this.users.size,
      messages: this.messages.size,
    };
  }

  /** v3: Gateway connection health score (0-100) */
  get healthScore(): number { return this._gateway.healthScore; }

  /** v3: Gateway connection health grade */
  get healthGrade(): HealthGrade { return this._gateway.healthGrade; }

  /** v3: Full gateway session diagnostics */
  get sessionInfo(): GatewaySessionInfo { return this._gateway.sessionInfo; }

  /** v3: REST client request metrics */
  get restStats() { return this.rest.stats; }

  constructor(options: ClientOptions) {
    super();
    this.token = options.token;
    const apiURL = resolveApiClientBaseUrl(options.apiURL);
    const gatewayURL = resolveApiClientGatewayUrl(options.gatewayURL, apiURL);

    this._gateway = new Gateway({
      token: options.token,
      url: gatewayURL,
      intents: options.intents ?? DEFAULT_INTENTS,
    });

    this.rest = new RestClient({
      token: options.token,
      baseURL: apiURL,
    });
    this.rest.client = this;

    this.voice = new VoiceManager(this);

    // Initialize managers
    this.guildManager = new GuildManager(this.rest);
    this.channelManager = new ChannelManager(this.rest);
    this.memberManager = new MemberManager(this.rest);
    this.userManager = new UserManager(this.rest);
    this.invites = new InviteManager(this);
    this.presences = new PresenceManager();

    if (options.debug) {
      this._gateway.on('debug', (msg: string) => console.debug('[beacon.js]', msg));
    }

    this._setupGatewayEvents();
  }

  /**
   * Register a middleware function or another pipeline for gateway events.
   * Shortcut for client.middleware.use()
   */
  public use(fn: MiddlewareFn | MiddlewarePipeline): this {
    if (fn instanceof MiddlewarePipeline) {
        (fn as any).fns.forEach((f: any) => this.middleware.use(f));
    } else {
        this.middleware.use(fn);
    }
    return this;
  }

  /**
   * Installs a plugin into the client.
   * @param plugin The plugin instance to install
   */
  public async installPlugin(plugin: BeaconPlugin): Promise<this> {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`Plugin with name "${plugin.name}" is already installed.`);
    }
    await plugin.onInstall(this);
    this._plugins.set(plugin.name, plugin);
    if (this._gateway.isConnected) {
        console.debug(`[beacon.js] Plugin "${plugin.name}" installed (hot).`);
    }
    return this;
  }

  /**
   * Gets mutual friends and guilds with a user
   * @param userId The ID of the user
   */
  public async getMutuals(userId: string): Promise<{ friends: User[]; guilds: Guild[] }> {
    const response = await (this.rest as any).request('GET', `/users/${userId}/mutuals`);
    if (!response.success) throw new Error(response.error?.message || 'Failed to fetch mutuals');

    return {
      friends: response.data.friends.map((u: any) => new User(this, u)),
      guilds: response.data.guilds.map((g: any) => new Guild(this, g))
    };
  }

  /**
   * Fetch a user by ID. Checks cache first, falls back to REST API.
   * @param userId The user's ID
   * @param force If true, bypass cache and always fetch from API
   */
  async fetchUser(userId: string, force = false): Promise<User> {
    if (!force) {
      const cached = this.users.get(userId);
      if (cached) return cached;
    }
    const raw = await this.rest.getUser(userId);
    const user = new User(this, raw);
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Fetch a guild by ID. Checks cache first, falls back to REST API.
   * @param guildId The guild's ID
   * @param force If true, bypass cache and always fetch from API
   */
  async fetchGuild(guildId: string, force = false): Promise<Guild> {
    if (!force) {
      const cached = this.guilds.get(guildId);
      if (cached) return cached;
    }
    const raw = await this.rest.getGuild(guildId);
    const guild = new Guild(this, raw);
    this.guilds.set(guild.id, guild);
    return guild;
  }

  /**
   * Fetch a channel by ID. Checks cache first, falls back to REST API.
   * @param channelId The channel's ID
   * @param force If true, bypass cache and always fetch from API
   */
  async fetchChannel(channelId: string, force = false): Promise<Channel> {
    if (!force) {
      const cached = this.channels.get(channelId);
      if (cached) return cached;
    }
    const raw = await this.rest.getChannel(channelId);
    const channel = new Channel(this, raw);
    this.channels.set(channel.id, channel);
    return channel;
  }

  // ─────────────────────────────────────────────────────────────
  // Gateway wiring
  // ─────────────────────────────────────────────────────────────
  private _setupGatewayEvents() {
    // Helper for running middleware and emitting
    const dispatch = async (event: string, raw: any, wrap?: (data: any) => any) => {
      try {
        const allowed = await this.middleware.run(event, raw);
        if (!allowed) return;
        const data = wrap ? wrap(raw) : raw;
        this.emit(event, data);
      } catch (err) {
        this.emit('error', err);
      }
    };

    this._gateway.on('ready', (data: any) => {
      dispatch('ready', data, (d) => {
        if (d.user) this.user = new User(this, d.user);
        this.applicationId = d.application?.id ?? null;
        this._ready = true;
        this._readyAt = Date.now();
        return d;
      });
    });

    // Forward connection lifecycle events
    this._gateway.on('reconnecting', () => dispatch('reconnecting', {}));
    this._gateway.on('reconnected', () => dispatch('reconnected', {}));
    this._gateway.on('disconnect', (data: any) => dispatch('disconnect', data));
    this._gateway.on('connectionStateChange', (data: any) => dispatch('connectionStateChange', data));
    this._gateway.on('healthChange', (data: any) => dispatch('healthChange', data));

    this._gateway.on('messageCreate', (rawMsg: RawMessage) => {
      dispatch('messageCreate', rawMsg, (data) => {
        const msg = new Message(this, data);
        this.messages.set(msg.id, msg);
        return msg;
      });
    });

    this._gateway.on('messageUpdate', (rawMsg: Partial<RawMessage> & { id: string; channel_id: string }) => {
      dispatch('messageUpdate', rawMsg, (data) => {
        const old = this.messages.get(data.id) ?? null;
        if (old) {
          if (data.content !== undefined) old.content = data.content;
          if (data.edited_timestamp) old.editedTimestamp = new Date(data.edited_timestamp);
          if (data.pinned !== undefined) old.pinned = data.pinned;
        }
        return old ?? data; // Emit the updated message structure or the raw data if not cached
      });
    });

    this._gateway.on('messageDelete', (data: { id: string; channel_id: string }) => {
      dispatch('messageDelete', data, (d) => {
        const msg = this.messages.get(d.id) ?? null;
        this.messages.delete(d.id);
        return msg ?? d;
      });
    });

    this._gateway.on('guildCreate', (rawGuild: RawGuild) => {
      dispatch('guildCreate', rawGuild, (data) => {
        const guild = new Guild(this, data);
        this.guilds.set(guild.id, guild);
        for (const rawCh of data.channels ?? []) {
          const ch = new Channel(this, rawCh);
          this.channels.set(ch.id, ch);
        }
        return guild;
      });
    });

    this._gateway.on('guildUpdate', (rawGuild: RawGuild) => {
      dispatch('guildUpdate', rawGuild, (data) => {
        const guild = new Guild(this, data);
        this.guilds.set(guild.id, guild);
        return guild;
      });
    });

    this._gateway.on('guildDelete', (data: { id: string }) => {
      dispatch('guildDelete', data, (d) => {
        const guild = this.guilds.get(d.id) ?? null;
        this.guilds.delete(d.id);
        return guild ?? d;
      });
    });

    this._gateway.on('channelCreate', (rawCh: RawChannel) => {
      dispatch('channelCreate', rawCh, (data) => {
        const ch = new Channel(this, data);
        this.channels.set(ch.id, ch);
        return ch;
      });
    });

    this._gateway.on('channelUpdate', (rawCh: RawChannel) => {
      dispatch('channelUpdate', rawCh, (data) => {
        const ch = new Channel(this, data);
        this.channels.set(ch.id, ch);
        return ch;
      });
    });

    this._gateway.on('channelDelete', (rawCh: RawChannel) => {
      dispatch('channelDelete', rawCh, (data) => {
        this.channels.delete(data.id);
        return data;
      });
    });

    this._gateway.on('guildMemberAdd', (member: any) => {
      dispatch('guildMemberAdd', member, (data) => {
        if (data.user) {
          const user = new User(this, data.user);
          this.users.set(user.id, user);
        }
        return data;
      });
    });

    this._gateway.on('guildMemberRemove', (data: any) => dispatch('guildMemberRemove', data));
    this._gateway.on('voiceStateUpdate', (state: any) => dispatch('voiceStateUpdate', state));
    this._gateway.on('typingStart', (data: any) => dispatch('typingStart', data));
    this._gateway.on('presenceUpdate', (presence: any) => dispatch('presenceUpdate', presence));
    this._gateway.on('messageReactionAdd', (data: any) => dispatch('messageReactionAdd', data));
    this._gateway.on('messageReactionRemove', (data: any) => dispatch('messageReactionRemove', data));

    this._gateway.on('interactionCreate', async (raw: RawInteraction) => {
      await dispatch('interactionCreate', raw, async (data) => {
        const ctx = new InteractionContext(data, this.rest);
        
        const safeRun = (fn: () => Promise<any>) =>
          Promise.resolve(fn()).catch((err) => this.emit('error', err));

        // Type 2 — APPLICATION_COMMAND (slash commands & context menus)
        if (data.type === 2 && data.data) {
          safeRun(async () => {
            const dispatched = await this.registry.dispatch(ctx);
            if (!dispatched) {
              const handler = this._commands.get(data.data!.name);
              if (handler) await handler(ctx);
            }
          });
        }
        // Type 3 — MESSAGE_COMPONENT
        else if (data.type === 3) {
          this.emit('componentInteraction', ctx);
          safeRun(async () => {
            const prefix = ctx.customId.split(':')[0];
            const def = this.registry.get(prefix);
            if (def?.handler) await def.handler(ctx);
            else {
              const handler = this._commands.get(prefix);
              if (handler) await handler(ctx);
            }
          });
        }
        // Type 4 — AUTOCOMPLETE
        else if (data.type === 4 && data.data) {
          safeRun(async () => {
            const def = this.registry.get(data.data!.name);
            if (def?.autocomplete) {
              const focused = data.data!.options?.find((o: any) => o.focused);
              const autocompleteCtx: AutocompleteContext = {
                interactionId: data.id,
                guildId: data.guild_id,
                channelId: data.channel_id,
                commandName: data.data!.name,
                focusedOption: focused?.name ?? '',
                focusedValue: String(focused?.value ?? ''),
                respond: (choices) => ctx.autocomplete(choices),
              };
              await def.autocomplete(autocompleteCtx);
            } else {
              this.emit('autocomplete', ctx);
            }
          });
        }
        // Type 5 — MODAL_SUBMIT
        else if (data.type === 5) {
          this.emit('modalSubmit', ctx);
        }

        return ctx;
      });
    });

    this._gateway.on('error', (err: Error) => this.emit('error', err));
    this._gateway.on('packet', (pkt: any) => this.emit('raw', pkt));
  }

  /**
   * Manually handle an interaction (Serverless/HTTP mode).
   * Passes the interaction through the middleware pipeline and dispatches to registry.
   */
  public async handleInteraction(interaction: RawInteraction): Promise<void> {
    const allowed = await this.middleware.run('interactionCreate', interaction);
    if (!allowed) return;

    const ctx = new InteractionContext(interaction, this.rest);
    this.emit('interactionCreate', ctx);

    if (interaction.type === 2 && interaction.data) {
      const dispatched = await this.registry.dispatch(ctx);
      if (!dispatched) {
        const handler = this._commands.get(interaction.data.name);
        if (handler) await handler(ctx);
      }
    } else if (interaction.type === 3) {
      this.emit('componentInteraction', ctx);
    } else if (interaction.type === 5) {
      this.emit('modalSubmit', ctx);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Event Promisification (Wait For)
  // ─────────────────────────────────────────────────────────────
  /**
   * Promisify event listeners directly. Useful for sequencial logic.
   * @param event The gateway event name to listen for
   * @param filter A function that must return true to resolve the promise
   * @param timeoutMs How long to wait before throwing a timeout error
   */
  waitFor(event: string, filter: (...args: any[]) => boolean = () => true, timeoutMs: number = 60000): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Timeout of ${timeoutMs}ms exceeded while waiting for event: ${event}`));
      }, timeoutMs);

      const listener = (...args: any[]) => {
        if (filter(...args)) {
          clearTimeout(timer);
          this.off(event, listener);
          resolve(args);
        }
      };

      this.on(event, listener);
    });
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

  /** v3: Fetch the bot's own User from the API (or cache). */
  async fetchSelf(force = false): Promise<User> {
    if (!force && this.user) return this.user;
    const raw = await this.rest.getCurrentUser();
    this.user = new User(this, raw);
    return this.user;
  }

  /** v3: Return the current gateway latency in a user-friendly format. */
  ping(): { ws: number; health: number; grade: string } {
    return {
      ws: this.latency,
      health: this.healthScore,
      grade: this.healthGrade,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Slash command registration
  // ─────────────────────────────────────────────────────────────
  /**
   * Register a simple slash command handler (local routing only).
   * For advanced usage with cooldowns, middleware, and autocomplete, use `client.registry.register()` directly.
   */
  command(name: string, handler: CommandHandler): this {
    this._commands.set(name, handler);
    return this;
  }

  /**
   * Register a full command definition on the CommandRegistry.
   * This enables cooldowns, per-command middleware chains, autocomplete, and REST sync via `syncCommands()`.
   */
  registerCommand(definition: CommandDefinition): this {
    this.registry.register(definition);
    return this;
  }

  /**
   * Deploy manually-supplied command payloads to the Beacon API.
   * For deploying registry-managed commands, use `syncCommands()` instead.
   */
  async deployCommands(commands: ReturnType<CommandBuilder['toJSON']>[], guildId?: string): Promise<void> {
    if (!this.applicationId) throw new Error('Client not ready — wait for "ready" event');
    if (guildId) {
      await this.rest.bulkOverwriteGuildCommands(this.applicationId, guildId, commands);
    } else {
      await this.rest.bulkOverwriteGlobalCommands(this.applicationId, commands);
    }
  }

  /**
   * Sync all commands registered via `registerCommand()` / `registry.register()` to the Beacon API.
   * Pass `guildId` for instant guild-scoped registration, or omit for global (may take a few minutes).
   */
  async syncCommands(guildId?: string): Promise<void> {
    if (!this.applicationId) throw new Error('Client not ready — wait for "ready" event');
    await this.registry.syncWithAPI(this.rest, this.applicationId, guildId);
  }

  // ─────────────────────────────────────────────────────────────
  // Message helpers
  // ─────────────────────────────────────────────────────────────
  /**
   * Create a DM channel with one or more users.
   * @param userIds Array of user IDs or a single user ID
   */
  async createDM(userIds: string | string[]): Promise<Channel> {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const raw = await this.rest.createDM(ids);
    const channel = new Channel(this, raw);
    this.channels.set(channel.id, channel);
    return channel;
  }

  /**
   * Send a DM to a user. Shortcuts channel creation.
   */
  async sendDM(userId: string, content: string | MessageBuilder | any) {
    const channel = await this.createDM(userId);
    return this.sendMessage(channel.id, content);
  }
  /**
   * Send a message to a channel. Supports string content, raw objects, or MessageBuilder.
   */
  async sendMessage(channelId: string, content: string | MessageBuilder | { content?: string; embeds?: any[]; components?: any[] } | any) {
    let payload: any;
    if (typeof content === 'string') {
      payload = { content };
    } else if (content instanceof MessageBuilder) {
      payload = content.toJSON();
    } else if (typeof content === 'object' && content !== null && 'toJSON' in (content as any)) {
      payload = (content as any).toJSON();
    } else {
      payload = content;
    }

    // Standardize embeds and components
    if (payload.embeds) {
      payload.embeds = payload.embeds.map((e: any) =>
        typeof e === 'object' && e !== null && 'toJSON' in e ? e.toJSON() : e
      );
    }
    if (payload.components) {
      payload.components = payload.components.map((c: any) =>
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      );
    }

    return this.rest.createMessage(channelId, payload);
  }

  /**
   * Send a typing indicator to a channel.
   */
  async sendTyping(channelId: string) {
    return this.rest.request('POST', `/channels/${channelId}/typing`);
  }

  /**
   * Edit an existing message.
   */
  async editMessage(channelId: string, messageId: string, content: string | MessageBuilder | { content?: string; embeds?: any[]; components?: any[] } | any) {
    let payload: any;
    if (typeof content === 'string') {
      payload = { content };
    } else if (content instanceof MessageBuilder) {
      payload = content.toJSON();
    } else if (typeof content === 'object' && content !== null && 'toJSON' in (content as any)) {
      payload = (content as any).toJSON();
    } else {
      payload = content;
    }

    // Standardize embeds and components
    if (payload.embeds) {
      payload.embeds = payload.embeds.map((e: any) =>
        typeof e === 'object' && e !== null && 'toJSON' in e ? e.toJSON() : e
      );
    }
    if (payload.components) {
      payload.components = payload.components.map((c: any) =>
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      );
    }

    return this.rest.request('PATCH', `/channels/${channelId}/messages/${messageId}`, payload);
  }

  /**
   * Upload an attachment to a channel.
   * @param channelId Target channel ID
   * @param file File Buffer, Blob, or Stream
   * @param filename Display name for the file
   * @param options Additional message options (content, embeds, etc)
   */
  async uploadAttachment(
    channelId: string,
    file: Buffer | Blob | ReadableStream,
    filename: string,
    options: { content?: string; embeds?: any[]; flags?: number } = {}
  ) {
    return this.rest.uploadFile(channelId, file, filename, options);
  }

  // ─────────────────────────────────────────────────────────────
  // Interaction response helpers
  // ─────────────────────────────────────────────────────────────
  /**
   * Respond to an interaction.
   * @param interactionId The interaction ID
   * @param interactionToken The interaction token
   * @param data Response payload (type and data)
   */
  async createInteractionResponse(interactionId: string, interactionToken: string, data: any) {
    return this.rest.request('POST', `/interactions/${interactionId}/${interactionToken}/callback`, data);
  }

  /**
   * Edit the original response to an interaction.
   */
  async editOriginalInteractionResponse(interactionToken: string, data: any) {
    if (!this.applicationId) throw new Error('Client not ready: applicationId is missing');
    return this.rest.request('PATCH', `/webhooks/${this.applicationId}/${interactionToken}/messages/@original`, data);
  }

  /**
   * Create a follow-up message for an interaction.
   */
  async createFollowupMessage(interactionToken: string, data: any) {
    if (!this.applicationId) throw new Error('Client not ready: applicationId is missing');
    return this.rest.request('POST', `/webhooks/${this.applicationId}/${interactionToken}`, data);
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

  /**
   * Fetch messages from a channel.
   * @param channelId The channel ID
   * @param options Pagination options (limit, before, after)
   */
  async fetchMessages(channelId: string, options: { limit?: number; before?: string; after?: string } = {}) {
    const raw = await this.rest.getChannelMessages(channelId, options);
    return raw.map((r: any) => new Message(this, r));
  }

  /**
   * Create a new channel in a guild.
   * @param guildId The guild ID
   * @param data Channel creation data (name, type, topic, etc.)
   */
  async createChannel(guildId: string, data: { name: string; type?: number; topic?: string; parent_id?: string; nsfw?: boolean; position?: number }) {
    const raw = await this.rest.createGuildChannel(guildId, data);
    const channel = new Channel(this, raw);
    this.channels.set(channel.id, channel);
    return channel;
  }

  /**
   * Delete a channel.
   * @param channelId The channel ID
   */
  async deleteChannel(channelId: string) {
    await this.rest.deleteChannel(channelId);
    this.channels.delete(channelId);
  }

  /**
   * Fetch a member from a guild.
   * @param guildId The guild ID
   * @param userId The user ID
   */
  async fetchMember(guildId: string, userId: string) {
    // Member structures are often nested, but we can have a memberManager or just use rest
    const raw = await this.rest.getGuildMember(guildId, userId);
    // Note: Member structure needs the client and raw data
    // For now, returning the raw or a generic object if Member class isn't fully ready to be instantiated here
    // But we have Member.ts, so let's import it if needed.
    return raw;
  }

  /**
   * Add a role to a member.
   * @param guildId The guild ID
   * @param userId The user ID
   * @param roleId The role ID
   */
  async addRoleToMember(guildId: string, userId: string, roleId: string) {
    return this.rest.request('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
  }

  /**
   * Remove a role from a member.
   * @param guildId The guild ID
   * @param userId The user ID
   * @param roleId The role ID
   */
  async removeRoleFromMember(guildId: string, userId: string, roleId: string) {
    return this.rest.request('DELETE', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
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
  createMessageCollector(channelId: string, options: CollectorOptions<Message> = {}): Collector<Message> {
    const collector = new Collector<Message>({
      filter: (msg) => msg.channelId === channelId,
      ...options,
    });
    const listener = (msg: Message) => collector.collect(msg);
    this.on('messageCreate', listener);
    collector.once('end', () => this.off('messageCreate', listener));
    return collector;
  }

  /** Await a single message in a channel matching the filter */
  async awaitMessage(channelId: string, options: CollectorOptions<Message> = {}): Promise<Message | null> {
    const collector = this.createMessageCollector(channelId, { max: 1, ...options });
    const results = await collector.await();
    return results[0] ?? null;
  }

  /** Collect voice state updates */
  createVoiceStateCollector(options: VoiceStateCollectorOptions = {}): VoiceStateCollector {
    return new VoiceStateCollector(this, options);
  }

  /** v3.5: Collect interactions (buttons, selects) */
  createInteractionCollector(options: InteractionCollectorOptions = {}): InteractionCollector {
    return new InteractionCollector(this, options);
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

  /** Remove a previously installed plugin. Calls its `onTeardown()` method if defined. */
  async removePlugin(name: string): Promise<boolean> {
    const plugin = this._plugins.get(name);
    if (!plugin) return false;
    if (plugin.onTeardown) await Promise.resolve(plugin.onTeardown(this));
    this._plugins.delete(name);
    return true;
  }

  /** Check if a plugin is installed. */
  hasPlugin(name: string): boolean {
    return this._plugins.has(name);
  }

  /** Get all installed plugin names. */
  get pluginNames(): string[] {
    return [...this._plugins.keys()];
  }

  /** Destroy the client, teardown all plugins, and disconnect the gateway. */
  async destroyAll(): Promise<void> {
    for (const plugin of this._plugins.values()) {
      if (plugin.onTeardown) await Promise.resolve(plugin.onTeardown(this)).catch(() => { });
    }
    this._plugins.clear();
    this.registry.destroy();
    this.middleware.clear();
    this.destroy();
  }
}
