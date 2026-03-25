/**
 * InteractionContext — Wraps a slash command interaction with helper methods
 */
import { RestClient } from '../rest/RestClient';
import { EmbedBuilder } from '../builders/EmbedBuilder';
import { User } from './User';
import { GuildMember } from './GuildMember';
import type { ActionRowData } from '../builders/ActionRowBuilder';
import type { CardData } from '../builders/CardBuilder';
import type { RawInteraction, InteractionOption } from '../types/index';
import { InteractionCollector } from './InteractionCollector';

export interface ReplyOptions {
  content?: string;
  embeds?: ReturnType<EmbedBuilder['toJSON']>[];
  components?: ActionRowData[];
  cards?: CardData[];
  ephemeral?: boolean;
}

export class InteractionContext {
  public readonly id: string;
  public readonly token: string;
  public readonly applicationId: string;
  public readonly guildId?: string;
  public readonly channelId: string;
  public readonly commandName: string;
  public readonly commandId: string;
  private readonly _options: Map<string, InteractionOption>;
  private readonly _rest: RestClient;
  private readonly _raw: RawInteraction;
  private _replied = false;
  private _deferred = false;
  private readonly _userId: string;

  constructor(raw: RawInteraction, rest: RestClient) {
    this.id = raw.id;
    this.token = raw.token;
    this.applicationId = raw.application_id;
    this.guildId = raw.guild_id;
    this.channelId = raw.channel_id;
    this._userId = raw.member?.user?.id || raw.user?.id || '';
    this.commandName = raw.data?.name ?? '';
    this.commandId = raw.data?.id ?? '';
    this._rest = rest;
    this._raw = raw;

    this._options = new Map();
    for (const opt of raw.data?.options ?? []) {
      this._options.set(opt.name, opt);
    }
  }

  /** Get a string option value */
  getString(name: string, required: true): string;
  getString(name: string, required?: false): string | null;
  getString(name: string, required = false): string | null {
    const opt = this._options.get(name);
    if (!opt || opt.value === undefined) {
      if (required) throw new Error(`Missing required option: ${name}`);
      return null;
    }
    return String(opt.value);
  }

  /** Get an integer option value */
  getInteger(name: string, required?: boolean): number | null {
    const opt = this._options.get(name);
    if (!opt || opt.value === undefined) {
      if (required) throw new Error(`Missing required option: ${name}`);
      return null;
    }
    return Number(opt.value);
  }

  /** Get a boolean option value */
  getBoolean(name: string, required?: boolean): boolean | null {
    const opt = this._options.get(name);
    if (!opt || opt.value === undefined) {
      if (required) throw new Error(`Missing required option: ${name}`);
      return null;
    }
    return Boolean(opt.value);
  }

  /** Get a user/channel/role ID option */
  getId(name: string, required?: boolean): string | null {
    const opt = this._options.get(name);
    if (!opt || opt.value === undefined) {
      if (required) throw new Error(`Missing required option: ${name}`);
      return null;
    }
    return String(opt.value);
  }

  /** Reply to the interaction */
  async reply(options: ReplyOptions | string | any): Promise<void> {
    if (this._replied) throw new Error('Already replied to this interaction');
    this._replied = true;

    let data: any = typeof options === 'string' ? { content: options } : options;
    if (typeof options === 'object' && options !== null && 'toJSON' in options) {
      data = options.toJSON();
    }

    const flags = data.ephemeral ? 64 : 0;

    // Standardize embeds and components
    if (data.embeds) {
      data.embeds = data.embeds.map((e: any) => 
        typeof e === 'object' && e !== null && 'toJSON' in e ? e.toJSON() : e
      );
    }
    if (data.components) {
      data.components = data.components.map((c: any) => 
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      );
    }

    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: data.content,
        embeds: data.embeds,
        components: data.components,
        cards: data.cards,
        flags,
      },
    });
  }

  /** Defer the reply (shows "Bot is thinking...") */
  async deferReply(ephemeral = false): Promise<void> {
    if (this._replied || this._deferred) return;
    this._deferred = true;
    this._replied = true;

    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: { flags: ephemeral ? 64 : 0 },
    });
  }

  /** Edit the deferred reply or original response */
  async editReply(options: ReplyOptions | string | any): Promise<void> {
    let data: any = typeof options === 'string' ? { content: options } : options;
    if (typeof options === 'object' && options !== null && 'toJSON' in options) {
      data = options.toJSON();
    }

    // Standardize embeds and components
    if (data.embeds) {
      data.embeds = data.embeds.map((e: any) => 
        typeof e === 'object' && e !== null && 'toJSON' in e ? e.toJSON() : e
      );
    }
    if (data.components) {
      data.components = data.components.map((c: any) => 
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      );
    }

    await this._rest.request('PATCH', `/webhooks/${this.applicationId}/${this.token}/messages/@original`, {
      content: data.content,
      embeds: data.embeds,
      components: data.components,
      cards: data.cards,
    });
  }

  /** Follow-up message after a reply */
  async followUp(options: ReplyOptions | string | any): Promise<void> {
    let data: any = typeof options === 'string' ? { content: options } : options;
    if (typeof options === 'object' && options !== null && 'toJSON' in options) {
      data = options.toJSON();
    }
    const flags = data.ephemeral ? 64 : 0;

    // Standardize embeds and components
    if (data.embeds) {
      data.embeds = data.embeds.map((e: any) => 
        typeof e === 'object' && e !== null && 'toJSON' in e ? e.toJSON() : e
      );
    }
    if (data.components) {
      data.components = data.components.map((c: any) => 
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      );
    }

    await this._rest.request('POST', `/webhooks/${this.applicationId}/${this.token}`, {
      content: data.content,
      embeds: data.embeds,
      components: data.components,
      cards: data.cards,
      flags,
    });
  }

  /** Delete the original reply. */
  async deleteReply(): Promise<void> {
    await this._rest.request('DELETE', `/webhooks/${this.applicationId}/${this.token}/messages/@original`);
  }

  /** Fetch the original reply message. */
  async fetchReply(): Promise<any> {
    return this._rest.request('GET', `/webhooks/${this.applicationId}/${this.token}/messages/@original`);
  }

  /** Respond to an autocomplete interaction with choices. */
  async autocomplete(choices: Array<{ name: string; value: string | number }>): Promise<void> {
    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 8, // APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
      data: { choices },
    });
  }

  /** Respond to a button/select component interaction without sending a message. */
  async deferUpdate(): Promise<void> {
    if (this._replied) return;
    this._replied = true;
    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 6, // DEFERRED_UPDATE_MESSAGE
    });
  }

  /** Update the message the component is attached to. */
  async updateMessage(options: ReplyOptions | string): Promise<void> {
    if (this._replied) throw new Error('Already replied to this interaction');
    this._replied = true;
    const data = typeof options === 'string' ? { content: options } : options;
    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 7, // UPDATE_MESSAGE
      data: {
        content: data.content,
        embeds: data.embeds,
        components: data.components,
      },
    });
  }

  /** Open a modal dialog in the user's client. */
  async showModal(modal: { customId: string; title: string; components: any[] }): Promise<void> {
    if (this._replied) throw new Error('Already replied to this interaction');
    this._replied = true;
    await this._rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 9, // MODAL
      data: modal,
    });
  }

  /** v3.5: Await a component interaction from the reply message. */
  async awaitComponent(options: { filter?: (i: InteractionContext) => boolean; time?: number } = {}): Promise<InteractionContext | null> {
    const collector = new InteractionCollector(this._rest.client, {
      ...options,
      max: 1,
      messageId: '@original', // Special case for the original interaction reply
    });
    const results = await collector.await();
    return results[0] ?? null;
  }

  /** Get the value(s) submitted from a select menu component. */
  getSelectValues(): string[] {
    return (this._raw as any)?.data?.values ?? [];
  }

  /** Get the custom_id of the component that triggered this interaction. */
  get customId(): string {
    return (this._raw as any)?.data?.custom_id ?? '';
  }

  /** The member/user who triggered the interaction. */
  get member(): GuildMember | null {
    return this._raw?.member ? new GuildMember(this._rest.client, this._raw.member) : null;
  }

  get user(): User | null {
    const userData = this._raw?.member?.user || this._raw?.user;
    return userData ? new User(this._rest.client, userData) : null;
  }

  get userId(): string {
    return this._userId;
  }

  /** Resolved users/members/channels/roles from option values. */
  get resolved(): Record<string, any> {
    return (this._raw as any)?.data?.resolved ?? {};
  }

  /** Role IDs for the member who triggered the interaction (guild interactions). */
  get memberRoleIds(): string[] {
    const roles = (this._raw as any)?.member?.roles;
    return Array.isArray(roles) ? roles : [];
  }

  /** Permission bitfield string for the member who triggered the interaction. */
  get memberPermissions(): string | undefined {
    const raw = (this._raw as any)?.member?.permissions;
    if (raw === undefined || raw === null) return undefined;
    return String(raw);
  }

  get replied(): boolean {
    return this._replied;
  }

  get deferred(): boolean {
    return this._deferred;
  }

  /** The type of interaction (Ping = 1, Command = 2, Component = 3, Autocomplete = 4, ModalSubmit = 5) */
  get type(): number {
    return this._raw.type;
  }

  /** Whether this interaction is a slash command or context menu */
  isChatInput(): boolean {
    return this.type === 2;
  }

  /** Whether this interaction is a message component (button, select) */
  isComponent(): boolean {
    return this.type === 3;
  }

  /** Whether this interaction is a button */
  isButton(): boolean {
    return this.isComponent() && (this._raw.data as any)?.component_type === 2;
  }

  /** Whether this interaction is a select menu */
  isSelectMenu(): boolean {
    return this.isComponent() && [3, 5, 6, 7, 8].includes((this._raw.data as any)?.component_type);
  }

  /** Whether this interaction is an autocomplete request */
  isAutocomplete(): boolean {
    return this.type === 4;
  }

  /** Whether this interaction is a modal submission */
  isModalSubmit(): boolean {
    return this.type === 5;
  }
}
