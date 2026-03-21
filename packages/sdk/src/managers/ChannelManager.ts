import { RestClient } from '../rest/RestClient';
import { Channel } from '../structures/Channel';
import { Message } from '../structures/Message';
import { Collection } from '../structures/Collection';
import { TTLCache } from '../cache/TTLCache';
import type { FetchMessagesOptions } from '@beacon/types';

export interface CreateChannelOptions {
    name: string;
    type?: 'TEXT' | 'VOICE' | 'CATEGORY' | 'ANNOUNCEMENT' | 'FORUM' | 'STAGE';
    topic?: string;
    parentId?: string;
    position?: number;
    nsfw?: boolean;
    slowmode?: number;
    bitrate?: number;
    userLimit?: number;
}

export interface EditChannelOptions {
    name?: string;
    topic?: string;
    position?: number;
    nsfw?: boolean;
    slowmode?: number;
    parentId?: string | null;
}

export class ChannelManager {
    public readonly cache: TTLCache<string, Channel>;

    constructor(private rest: RestClient) {
        this.cache = new TTLCache<string, Channel>(3600000, 500); // 1 hour TTL
    }

    /** Fetch a channel by ID */
    async fetch(channelId: string, force = false): Promise<Channel> {
        if (!force) {
            const cached = this.cache.get(channelId);
            if (cached) return cached;
        }
        const data = await this.rest.getChannel(channelId);
        const channel = new Channel(this.rest.client, data);
        this.cache.set(channelId, channel);
        return channel;
    }

    /** Fetch all channels in a guild */
    async fetchGuildChannels(guildId: string): Promise<Collection<string, Channel>> {
        const data = await this.rest.getGuildChannels(guildId);
        const channels = new Collection<string, Channel>();
        for (const raw of data) {
            const ch = new Channel(this.rest.client, raw);
            channels.set(ch.id, ch);
            this.cache.set(ch.id, ch);
        }
        return channels;
    }

    /** Create a channel in a guild */
    async create(guildId: string, options: CreateChannelOptions): Promise<Channel> {
        const data = await this.rest.post(`/guilds/${guildId}/channels`, options);
        const channel = new Channel(this.rest.client, data);
        this.cache.set(channel.id, channel);
        return channel;
    }

    /** Edit a channel */
    async edit(channelId: string, options: EditChannelOptions): Promise<Channel> {
        const data = await this.rest.patch(`/channels/${channelId}`, options);
        const channel = new Channel(this.rest.client, data);
        this.cache.set(channelId, channel);
        return channel;
    }

    /** Delete a channel */
    async delete(channelId: string): Promise<void> {
        await this.rest.delete(`/channels/${channelId}`);
        this.cache.delete(channelId);
    }

    /** Fetch message history */
    async fetchMessages(channelId: string, options: FetchMessagesOptions = {}): Promise<Message[]> {
        const data = await this.rest.getChannelMessages(channelId, options);
        return data.map((raw: any) => new Message(this.rest.client, raw));
    }

    /** Fetch pinned messages */
    async fetchPins(channelId: string): Promise<Message[]> {
        const data = await this.rest.get(`/channels/${channelId}/pins`);
        return data.map((raw: any) => new Message(this.rest.client, raw));
    }

    /** Start typing indicator */
    async triggerTyping(channelId: string): Promise<void> {
        await this.rest.post(`/channels/${channelId}/typing`, {});
    }

    /** 
     * Bulk delete messages (Beyond Discord: Simplified array/count handling)
     * @param channelId The channel ID
     * @param messageIds Array of message IDs OR a number of recent messages to delete
     */
    async bulkDelete(channelId: string, messages: string[] | number): Promise<void> {
        let ids: string[] = [];
        if (typeof messages === 'number') {
            const msgs = await this.fetchMessages(channelId, { limit: messages });
            ids = msgs.map(m => m.id);
        } else {
            ids = messages;
        }

        if (ids.length === 0) return;
        
        await this.rest.post(`/channels/${channelId}/messages/bulk-delete`, {
            messages: ids
        });
    }
}
