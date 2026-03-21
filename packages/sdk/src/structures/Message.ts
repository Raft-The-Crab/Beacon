import type { Client } from '../client';
import { User } from './User';
import { GuildMember } from './GuildMember';
import { MessageBuilder } from '../builders/MessageBuilder';

export interface Attachment {
  id: string
  filename: string
  size: number
  url: string
  contentType: string
}

export interface Embed {
  title?: string
  description?: string
  color?: number
  author?: { name: string; icon_url?: string; url?: string }
  image?: { url: string }
  thumbnail?: { url: string }
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

/** Represents an Action Row or nested component in a message. */
export interface MessageComponent {
  type: number
  components?: MessageComponent[]
  custom_id?: string
  customId?: string
  label?: string
  style?: number
  url?: string
  disabled?: boolean
  placeholder?: string
  min_values?: number
  max_values?: number
  options?: any[]
}

export interface Message {
  id: string
  channelId: string
  author: User
  authorId: string
  guildId?: string
  content: string
  attachments: Attachment[]
  embeds: Embed[]
  components?: MessageComponent[]
  mentions: string[]
  replyTo?: string
  editedAt?: string
  createdAt?: string
  createdAtDate?: Date
  timestamp: Date
  editedTimestamp: Date | null
  pinned: boolean
  flags?: number
  toJSON?(): Record<string, any>
}

export interface RawMessage {
  id: string
  channel_id: string
  guild_id?: string
  author_id?: string
  author: any
  member?: any
  content: string
  timestamp: string
  edited_timestamp?: string | null
  mentions: any[]
  attachments: any[]
  embeds: any[]
  reactions?: any[]
  pinned: boolean
  webhook_id?: string
  referenced_message?: RawMessage | null
  nonce?: string
  flags?: number
}
import { ReactionCollector, ReactionData } from './ReactionCollector';
import { ComponentCollector } from './ComponentCollector';
import type { InteractionContext } from './InteractionContext';
import { CollectorOptions } from './Collector';

export class Message {
  public readonly client: Client;
  public id: string;
  public channelId: string;
  public guildId?: string;
  public author: User;
  public authorId: string;
  public member?: GuildMember;
  public content: string;
  public timestamp: Date;
  public editedTimestamp: Date | null;
  public pinned: boolean;
  public attachments: Attachment[];
  public embeds: Embed[];
  public components?: MessageComponent[];
  public mentions: string[];
  public replyTo?: string;
  public editedAt?: string;
  public flags?: number;
  
  // Computed properties
  public createdAt?: string;
  public createdAtDate?: Date;

  constructor(client: Client, data: RawMessage) {
    this.client = client;
    this.id = data.id;
    this.channelId = data.channel_id;
    this.guildId = (data as any).guild_id;
    this.author = new User(client, data.author);
    this.authorId = data.author.id;
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
    this.editedTimestamp = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.pinned = data.pinned;
    this.attachments = data.attachments || [];
    this.embeds = data.embeds || [];
    this.components = (data as any).components;
    this.mentions = (data.mentions || []).map(m => m.id);
    this.replyTo = (data as any).referenced_message?.id || (data as any).reply_to;
    this.editedAt = data.edited_timestamp || undefined;
    this.flags = data.flags;
    
    // Handle createdAt
    let date: Date;
    try {
        date = new Date(Number((BigInt(this.id) >> 22n) + 1420070400000n));
    } catch {
        date = new Date();
    }
    this.createdAt = (data as any).created_at || date.toISOString();
    this.createdAtDate = date;

    if ((data as any).member && (data as any).guild_id) {
        this.member = new GuildMember(client, { ...(data as any).member, guildId: (data as any).guild_id });
    }
  }

  async reply(content: string | { content?: string; embeds?: any[]; components?: any[] } | any) {
    let payload: any;
    if (typeof content === 'string') {
      payload = { content, reply_to: this.id };
    } else if (typeof content === 'object' && content !== null && 'toJSON' in (content as any)) {
      payload = { ...(content as any).toJSON(), reply_to: this.id };
    } else {
      payload = { ...content, reply_to: this.id };
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

    return this.client.sendMessage(this.channelId, payload);
  }

  async edit(content: string | MessageBuilder | { content?: string; embeds?: any[]; components?: any[] } | any) {
    return this.client.editMessage(this.channelId, this.id, content);
  }

  async delete() {
    return this.client.deleteMessage(this.channelId, this.id);
  }

  async pin() {
    return this.client.pinMessage(this.channelId, this.id);
  }

  async unpin() {
    return this.client.unpinMessage(this.channelId, this.id);
  }

  async react(emoji: string) {
    return this.client.addReaction(this.channelId, this.id, emoji);
  }

  async unreact(emoji: string, userId = '@me') {
    return this.client.removeReaction(this.channelId, this.id, emoji, userId);
  }

  /** Create a reaction collector for this message */
  createReactionCollector(options: CollectorOptions<ReactionData> = {}) {
    return new ReactionCollector(this.client, {
        filter: (r) => r.messageId === this.id && (options.filter ? options.filter(r) : true),
        ...options
    });
  }

  /** Create a component collector (buttons/select menus) for this message */
  createComponentCollector(options: CollectorOptions<InteractionContext> = {}) {
    return new ComponentCollector(this.client, {
        filter: (i) => (i as any).raw?.message?.id === this.id && (options.filter ? options.filter(i) : true),
        ...options
    });
  }

  /** Wait for a single component interaction on this message */
  async awaitMessageComponent(options: CollectorOptions<InteractionContext> = {}): Promise<InteractionContext | null> {
    const collector = this.createComponentCollector({ max: 1, ...options });
    const results = await collector.await();
    return results[0] ?? null;
  }

  /** Bulk delete messages in the same channel */
  async bulkDelete(count: number) {
    return this.client.channelManager.bulkDelete(this.channelId, count);
  }

  /** Purge the channel (Beyond Discord: Native context-aware purge) */
  async purge(limit = 100) {
    return this.client.channelManager.bulkDelete(this.channelId, limit);
  }

    /** Serializes this structure to a plain object */
    public toJSON?: () => Record<string, any> = () => {
        const result: Record<string, any> = {};
        const exclude = ['client', 'author', 'member'];
        
        for (const key of Object.keys(this)) {
            if (exclude.includes(key)) continue;
            const value = (this as any)[key];
            if (typeof value !== 'function') {
                result[key] = value;
            }
        }
        
        result.author = this.author.toJSON?.();
        if (this.member) result.member = this.member.toJSON?.();
        
        return result;
    }
}

