import type { Client } from '../client';
import { User } from './User';

/**
 * Message structure
 */
export interface RawMessage {
  id: string;
  channel_id: string;
  author: RawUser;
  content: string;
  timestamp: string;
  edited_timestamp?: string | null;
  mentions: RawUser[];
  attachments: RawAttachment[];
  embeds: any[];
  reactions?: RawReaction[];
  pinned: boolean;
  webhook_id?: string;
  referenced_message?: RawMessage | null;
}

export interface RawUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
}

export interface RawAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  content_type?: string;
}

export interface RawReaction {
  count: number;
  me: boolean;
  emoji: { id: string | null; name: string | null; animated?: boolean };
}

export interface RawGuild {
  id: string;
  name: string;
  icon: string | null;
  banner: string | null;
  owner_id: string;
  member_count?: number;
  channels?: RawChannel[];
  roles?: RawRole[];
  members?: RawMember[];
}

export interface RawChannel {
  id: string;
  guild_id?: string;
  name: string;
  type: number;
  position: number;
  parent_id?: string | null;
  topic?: string | null;
  nsfw?: boolean;
  slowmode_delay?: number;
  recipients?: RawUser[];
}

export interface RawRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface RawMember {
  user: RawUser;
  nick?: string | null;
  roles: string[];
  joined_at: string;
  deaf: boolean;
  mute: boolean;
}

export interface RawInteraction {
  id: string;
  application_id: string;
  type: number;
  data?: {
    id: string;
    name: string;
    type: number;
    options?: InteractionOption[];
  };
  guild_id?: string;
  channel_id: string;
  member?: RawMember;
  user?: RawUser;
  token: string;
  version: number;
}

export interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: InteractionOption[];
}

export class Message {
  public readonly client: Client;
  public id: string;
  public channelId: string;
  public author: User;
  public content: string;
  public timestamp: Date;
  public editedTimestamp: Date | null;
  public pinned: boolean;

  constructor(client: Client, data: RawMessage) {
    this.client = client;
    this.id = data.id;
    this.channelId = data.channel_id;
    this.author = new User(client, data.author);
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
    this.editedTimestamp = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.pinned = data.pinned;
  }

  async reply(content: string | { content?: string; embeds?: any[] }) {
    if (typeof content === 'string') {
      return this.client.sendMessage(this.channelId, { content, reply_to: this.id });
    }
    return this.client.sendMessage(this.channelId, { ...content, reply_to: this.id });
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
}

