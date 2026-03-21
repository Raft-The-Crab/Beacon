import { Client } from '../client';
import { Channel } from '../structures/Channel';
import { TTLCache } from '../cache/TTLCache';

export class GuildChannelManager {
    public cache: TTLCache<string, Channel> = new TTLCache<string, Channel>(3600000, 100);

    constructor(private client: Client, public guildId: string) {}

    async fetch(channelId: string, force = false): Promise<Channel> {
        if (!force) {
            const cached = this.cache.get(channelId);
            if (cached) return cached;
        }
        const data = await this.client.channelManager.fetch(channelId);
        const channel = new Channel(this.client, data as any);
        this.cache.set(channelId, channel);
        return channel;
    }

    async create(data: any): Promise<Channel> {
        const res = await this.client.channelManager.create(this.guildId, data);
        const channel = new Channel(this.client, res as any);
        this.cache.set(channel.id, channel);
        return channel;
    }
}
