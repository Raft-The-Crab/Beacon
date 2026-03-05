/**
 * GuildManager — Fetch, create, edit, and delete guilds.
 */
import { RestClient } from '../rest/RestClient';
import { Guild } from '../structures/Guild';
import { Collection } from '../structures/Collection';

export interface CreateGuildOptions {
    name: string;
    icon?: string;
    description?: string;
}

export interface EditGuildOptions {
    name?: string;
    icon?: string;
    banner?: string;
    description?: string;
}

export class GuildManager {
    public readonly cache: Collection<string, Guild>;

    constructor(private rest: RestClient) {
        this.cache = new Collection<string, Guild>().setMaxSize(100);
    }

    /** Fetch a guild by ID (hits cache first) */
    async fetch(guildId: string, force = false): Promise<Guild> {
        if (!force) {
            const cached = this.cache.get(guildId);
            if (cached) return cached;
        }
        const data = await this.rest.get(`/guilds/${guildId}`);
        const guild = new Guild(this.rest.client, data);
        this.cache.set(guildId, guild);
        return guild;
    }

    /** Fetch all guilds the bot/user is a member of */
    async fetchAll(): Promise<Collection<string, Guild>> {
        const data = await this.rest.get('/users/@me/guilds');
        const guilds = new Collection<string, Guild>();
        for (const raw of data) {
            const g = new Guild(this.rest.client, raw);
            guilds.set(g.id, g);
            this.cache.set(g.id, g);
        }
        return guilds;
    }

    /** Create a new guild */
    async create(options: CreateGuildOptions): Promise<Guild> {
        const data = await this.rest.post('/guilds', options);
        const guild = new Guild(this.rest.client, data);
        this.cache.set(guild.id, guild);
        return guild;
    }

    /** Edit an existing guild */
    async edit(guildId: string, options: EditGuildOptions): Promise<Guild> {
        const data = await this.rest.patch(`/guilds/${guildId}`, options);
        const guild = new Guild(this.rest.client, data);
        this.cache.set(guildId, guild);
        return guild;
    }

    /** Delete a guild (owner only) */
    async delete(guildId: string): Promise<void> {
        await this.rest.delete(`/guilds/${guildId}`);
        this.cache.delete(guildId);
    }

    /** Leave a guild */
    async leave(guildId: string): Promise<void> {
        await this.rest.delete(`/users/@me/guilds/${guildId}`);
        this.cache.delete(guildId);
    }

    /** Fetch guild invite code */
    async fetchInvites(guildId: string): Promise<any[]> {
        return this.rest.get(`/guilds/${guildId}/invites`);
    }

    /** Get guild emoji list */
    async fetchEmojis(guildId: string): Promise<any[]> {
        return this.rest.get(`/guilds/${guildId}/emojis`);
    }

    /** Get scheduled events */
    async fetchEvents(guildId: string): Promise<any[]> {
        return this.rest.get(`/guilds/${guildId}/scheduled-events`);
    }
}
