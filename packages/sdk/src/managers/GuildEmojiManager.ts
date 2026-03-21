import { Client } from '../client';
import { TTLCache } from '../cache/TTLCache';

export interface EmojiData {
    id: string;
    name: string;
    roles?: string[];
    user?: any;
    require_colons?: boolean;
    managed?: boolean;
    animated?: boolean;
    available?: boolean;
}

export class GuildEmojiManager {
    public cache: TTLCache<string, EmojiData> = new TTLCache<string, EmojiData>(3600000, 100);

    constructor(private client: Client, public guildId: string) {}

    async fetch(): Promise<EmojiData[]> {
        const data = await this.client.rest.get(`/guilds/${this.guildId}/emojis`);
        for (const emoji of data) {
            this.cache.set(emoji.id, emoji);
        }
        return data;
    }

    async create(data: { name: string; image: string; roles?: string[] }): Promise<EmojiData> {
        const res = await this.client.rest.post(`/guilds/${this.guildId}/emojis`, data);
        this.cache.set(res.id, res);
        return res;
    }

    async delete(emojiId: string): Promise<void> {
        await this.client.rest.delete(`/guilds/${this.guildId}/emojis/${emojiId}`);
        this.cache.delete(emojiId);
    }
}
