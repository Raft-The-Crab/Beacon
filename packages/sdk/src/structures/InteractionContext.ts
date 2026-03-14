/**
 * InteractionContext — Wraps a slash command interaction with helper methods
 */
import { RestClient } from '../rest/RestClient';
import { EmbedBuilder } from '../builders/EmbedBuilder';
import type { ActionRowData } from '../builders/ActionRowBuilder';
import type { CardData } from '../builders/CardBuilder';
import { RawInteraction, InteractionOption } from './Message';

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

  constructor(raw: RawInteraction, rest: RestClient) {
    this.id = raw.id;
    this.token = raw.token;
    this.applicationId = raw.application_id;
    this.guildId = raw.guild_id;
    this.channelId = raw.channel_id;
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
  async reply(options: ReplyOptions | string): Promise<void> {
    if (this._replied) throw new Error('Already replied to this interaction');
    this._replied = true;

    const data = typeof options === 'string' ? { content: options } : options;
    const flags = data.ephemeral ? 64 : 0;

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
  async editReply(options: ReplyOptions | string): Promise<void> {
    const data = typeof options === 'string' ? { content: options } : options;

    await this._rest.request('PATCH', `/webhooks/${this.applicationId}/${this.token}/messages/@original`, {
      content: data.content,
      embeds: data.embeds,
      components: data.components,
      cards: data.cards,
    });
  }

  /** Follow-up message after a reply */
  async followUp(options: ReplyOptions | string): Promise<void> {
    const data = typeof options === 'string' ? { content: options } : options;
    const flags = (data as ReplyOptions).ephemeral ? 64 : 0;

    await this._rest.request('POST', `/webhooks/${this.applicationId}/${this.token}`, {
      content: data.content,
      embeds: (data as ReplyOptions).embeds,
      components: (data as ReplyOptions).components,
      cards: (data as ReplyOptions).cards,
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

  /** Get the value(s) submitted from a select menu component. */
  getSelectValues(): string[] {
    return (this as any)._raw?.data?.values ?? [];
  }

  /** Get the custom_id of the component that triggered this interaction. */
  get customId(): string {
    return (this as any)._raw?.data?.custom_id ?? '';
  }

  /** The member/user who triggered the interaction. */
  get userId(): string | undefined {
    const raw = (this as any)._raw;
    return raw?.member?.user?.id ?? raw?.user?.id;
  }

  /** Resolved users/members/channels/roles from option values. */
  get resolved(): Record<string, any> {
    return (this as any)._raw?.data?.resolved ?? {};
  }

  /** Role IDs for the member who triggered the interaction (guild interactions). */
  get memberRoleIds(): string[] {
    const roles = (this as any)._raw?.member?.roles;
    return Array.isArray(roles) ? roles : [];
  }

  /** Permission bitfield string for the member who triggered the interaction. */
  get memberPermissions(): string | undefined {
    const raw = (this as any)._raw?.member?.permissions;
    if (raw === undefined || raw === null) return undefined;
    return String(raw);
  }

  get replied(): boolean {
    return this._replied;
  }

  get deferred(): boolean {
    return this._deferred;
  }
}
