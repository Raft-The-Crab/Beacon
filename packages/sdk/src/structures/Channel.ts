import type { Client } from '../client';
import { MessageBuilder } from '../builders/MessageBuilder';
import { PermissionOverwrite } from './PermissionOverwrite';

export interface Channel {
  id: string
  guildId: string
  name: string
  type: 'text' | 'voice' | 'category' | 'stage'
  position: number
  parentId?: string
  topic?: string
  nsfw: boolean
  slowmode?: number
  permissionOverwrites: PermissionOverwrite[]
  createdAt?: string
  createdAtDate?: Date
  toJSON?(): Record<string, any>
}

export interface RawChannel {
  id: string
  guild_id?: string
  name: string
  type: number
  position: number
  parent_id?: string | null
  topic?: string | null
  nsfw: boolean
  slowmode_delay: number
  permission_overwrites?: any[]
  created_at?: string
}

export class Channel {
    public readonly client: Client;
    public id: string;
    public guildId: string;
    public name: string;
    public type: 'text' | 'voice' | 'category' | 'stage';
    public position: number;
    public parentId?: string;
    public topic?: string;
    public nsfw: boolean;
    public slowmode?: number;
    public slowmodeDelay: number;
    public permissionOverwrites: PermissionOverwrite[];
    
    // Computed properties for compatibility
    public createdAt?: string;
    public createdAtDate?: Date;

    constructor(client: Client, data: RawChannel) {
        this.client = client;
        this.id = data.id;
        this.guildId = data.guild_id || '';
        this.name = data.name;
        // Map numeric types to strings if necessary
        const typeMap: Record<number, any> = {
            0: 'text',
            2: 'voice',
            4: 'category',
            13: 'stage'
        };
        this.type = (typeof data.type === 'number' ? typeMap[data.type] : data.type) || 'text';
        this.position = data.position;
        this.parentId = data.parent_id || undefined;
        this.topic = data.topic || undefined;
        this.nsfw = !!data.nsfw;
        this.slowmode = data.slowmode_delay || 0;
        this.slowmodeDelay = data.slowmode_delay || 0;
        this.permissionOverwrites = (data.permission_overwrites || []).map((o: any) => new PermissionOverwrite(client, o));
        
        // Handle createdAt
        let date: Date;
        try {
            date = new Date(Number((BigInt(this.id) >> 22n) + 1420070400000n));
        } catch {
            date = new Date();
        }
        this.createdAt = (data as any).created_at || date.toISOString();
        this.createdAtDate = date;
    }

    async send(content: string | MessageBuilder | { content?: string; embeds?: any[] }) {
        return this.client.sendMessage(this.id, content);
    }

    async sendTyping() {
        return this.client.sendTyping(this.id);
    }

    /** 
     * Bulk delete messages in this channel
     * @param messages Array of message IDs OR a number of recent messages to delete
     */
    async bulkDelete(messages: string[] | number) {
        return this.client.channelManager.bulkDelete(this.id, messages);
    }

    /** 
     * Purge all recent messages (Beyond Discord: Simplified channel clearing)
     */
    async clear(limit = 100) {
        return this.bulkDelete(limit);
    }

    /**
     * Delete this channel.
     */
    async delete() {
        return this.client.deleteChannel(this.id);
    }

    /**
     * Fetch messages from this channel.
     * @param options Pagination options (limit, before, after)
     */
    async fetchMessages(options: { limit?: number; before?: string; after?: string } = {}) {
        return this.client.fetchMessages(this.id, options);
    }

    /** Serializes this structure to a plain object */
    public toJSON?: () => Record<string, any> = () => {
        const result: Record<string, any> = {};
        const exclude = ['client', 'permissionOverwrites'];
        
        for (const key of Object.keys(this)) {
            if (exclude.includes(key)) continue;
            const value = (this as any)[key];
            if (typeof value !== 'function') {
                result[key] = value;
            }
        }
        
        return result;
    }
}
