/**
 * InteractionContext — Wraps a slash command interaction with helper methods
 */
import { RestClient } from '../rest/RestClient';
import { EmbedBuilder } from '../builders/EmbedBuilder';
import { RawInteraction, InteractionOption } from './Message';

export interface ReplyOptions {
  content?: string;
  embeds?: ReturnType<EmbedBuilder['toJSON']>[];
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
    });
  }

  /** Follow-up message after a reply */
  async followUp(options: ReplyOptions | string): Promise<void> {
    const data = typeof options === 'string' ? { content: options } : options;
    const flags = (data as ReplyOptions).ephemeral ? 64 : 0;

    await this._rest.request('POST', `/webhooks/${this.applicationId}/${this.token}`, {
      content: data.content,
      embeds: (data as ReplyOptions).embeds,
      flags,
    });
  }

  get replied(): boolean {
    return this._replied;
  }

  get deferred(): boolean {
    return this._deferred;
  }
}
