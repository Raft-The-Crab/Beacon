import { RestClient } from '../rest/RestClient';
import { Guild } from '../structures/Guild';
import { Collection } from '../structures/Collection';
import { TTLCache } from '../cache/TTLCache';
import type { Invite, Role, RawChannel, AuditLogEntry } from '../types/index';

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
    public readonly cache: TTLCache<string, Guild>;

    constructor(private rest: RestClient) {
        this.cache = new TTLCache<string, Guild>(3600000, 100); // 1 hour TTL
    }

    /** Fetch a guild by ID (hits cache first) */
    async fetch(guildId: string, force = false): Promise<Guild> {
        if (!force) {
            const cached = this.cache.get(guildId);
            if (cached) return cached;
        }
        const data = await this.rest.getGuild(guildId);
        const guild = new Guild(this.rest.client, data);
        this.cache.set(guildId, guild);
        return guild;
    }

    /** Fetch all guilds the bot/user is a member of */
    async fetchAll(): Promise<Collection<string, Guild>> {
        const data = await this.rest.get<any[]>('/users/@me/guilds');
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

    /** Bulk fetch guild members for rapid local cache hydration */
    async bulkFetchMembers(guildId: string, userIds: string[], chunkSize = 50): Promise<any[]> {
        const results: any[] = [];
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            const promises = chunk.map(id => this.rest.getGuildMember(guildId, id).catch(() => null));
            const chunkRes = await Promise.all(promises);
            results.push(...chunkRes.filter(Boolean));
        }
        return results;
    }

    /** Fetch guild audit logs */
    async fetchAuditLogs(guildId: string, options: { limit?: number; action?: number } = {}): Promise<AuditLogEntry[]> {
        return this.rest.getAuditLogs(guildId, options);
    }

    // ─── Channel Management ─────────────────────────────────────
    
    async fetchChannels(guildId: string): Promise<RawChannel[]> {
        return this.rest.getGuildChannels(guildId);
    }

    async createChannel(guildId: string, data: { name: string; type?: number; parent_id?: string }): Promise<RawChannel> {
        return this.rest.createGuildChannel(guildId, data);
    }

    // ─── Role Management ────────────────────────────────────────

    async fetchRoles(guildId: string): Promise<Role[]> {
        return this.rest.getGuildRoles(guildId);
    }

    async createRole(guildId: string, data: { name: string; color?: number; permissions?: string }): Promise<Role> {
        return this.rest.createGuildRole(guildId, data);
    }

    async deleteRole(guildId: string, roleId: string): Promise<void> {
        await this.rest.deleteGuildRole(guildId, roleId);
    }

    /** Fetch guild invite code */
    async fetchInvites(guildId: string): Promise<Invite[]> {
        return this.rest.request<Invite[]>('GET', `/guilds/${guildId}/invites`);
    }

    /** Get guild emoji list */
    async fetchEmojis(guildId: string): Promise<any[]> {
        return this.rest.get(`/guilds/${guildId}/emojis`);
    }

    /** Get scheduled events */
    async fetchEvents(guildId: string): Promise<any[]> {
        return this.rest.listGuildScheduledEvents(guildId);
    }
}
