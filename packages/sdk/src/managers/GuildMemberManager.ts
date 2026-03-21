
import { TTLCache } from '../cache/TTLCache';
import { GuildMember } from '../structures/GuildMember';
import { Client } from '../client';

export class GuildMemberManager {
    public cache: TTLCache<string, GuildMember> = new TTLCache<string, GuildMember>(3600000, 100);

    constructor(private client: Client, public guildId: string) {}

    async fetch(userId: string, force = false): Promise<GuildMember> {
        if (!force) {
            const cached = this.cache.get(userId);
            if (cached) return cached;
        }
        const data = await this.client.memberManager.fetch(this.guildId, userId, force);
        const member = new GuildMember(this.client, data);
        this.cache.set(userId, member);
        return member;
    }

    async list(options?: any): Promise<GuildMember[]> {
        const data = await this.client.memberManager.list(this.guildId, options);
        return data.map(d => {
            const m = new GuildMember(this.client, d);
            this.cache.set(m.userId, m);
            return m;
        });
    }
}
