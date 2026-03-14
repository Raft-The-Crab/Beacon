/**
 * ChannelManager — Fetch, create, edit channels and message history.
 */
import { RestClient } from '../rest/RestClient';
import { Channel } from '../structures/Channel';
import { Message } from '../structures/Message';
import { Collection } from '../structures/Collection';

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

export interface FetchMessagesOptions {
    limit?: number;    // max 100, default 50
    before?: string;   // message ID
    after?: string;    // message ID
    around?: string;   // message ID
}

export class ChannelManager {
    public readonly cache: Collection<string, Channel>;

    constructor(private rest: RestClient) {
        this.cache = new Collection<string, Channel>().setMaxSize(500);
    }

    /** Fetch a channel by ID */
    async fetch(channelId: string, force = false): Promise<Channel> {
        if (!force) {
            const cached = this.cache.get(channelId);
            if (cached) return cached;
        }
        const data = await this.rest.get(`/channels/${channelId}`);
        const channel = new Channel(this.rest.client, data);
        this.cache.set(channelId, channel);
        return channel;
    }

    /** Fetch all channels in a guild */
    async fetchGuildChannels(guildId: string): Promise<Collection<string, Channel>> {
        const data = await this.rest.get(`/guilds/${guildId}/channels`);
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
        const params = new URLSearchParams();
        if (options.limit) params.set('limit', String(options.limit));
        if (options.before) params.set('before', options.before);
        if (options.after) params.set('after', options.after);
        if (options.around) params.set('around', options.around);

        const qs = params.toString();
        const data = await this.rest.get(`/channels/${channelId}/messages${qs ? '?' + qs : ''}`);
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
}
