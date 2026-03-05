/**
 * MemberManager — List, kick, ban, and manage roles for guild members.
 */
import { RestClient } from '../rest/RestClient';
import { Collection } from '../structures/Collection';

export interface GuildMember {
    id: string;
    userId: string;
    guildId: string;
    nickname?: string;
    avatar?: string;
    roles: string[];
    joinedAt: string;
    user?: {
        id: string;
        username: string;
        avatar?: string;
        bot?: boolean;
    };
}

export interface ListMembersOptions {
    limit?: number;   // max 1000, default 100
    after?: string;   // user ID for pagination
}

export class MemberManager {
    public readonly cache: Collection<string, GuildMember>;

    constructor(private rest: RestClient) {
        this.cache = new Collection<string, GuildMember>().setMaxSize(1000);
    }

    private _cacheKey(guildId: string, userId: string): string {
        return `${guildId}:${userId}`;
    }

    /** Fetch a single member */
    async fetch(guildId: string, userId: string, force = false): Promise<GuildMember> {
        const key = this._cacheKey(guildId, userId);
        if (!force) {
            const cached = this.cache.get(key);
            if (cached) return cached;
        }
        const data = await this.rest.get(`/guilds/${guildId}/members/${userId}`);
        this.cache.set(key, data);
        return data;
    }

    /** List members of a guild */
    async list(guildId: string, options: ListMembersOptions = {}): Promise<GuildMember[]> {
        const params = new URLSearchParams();
        if (options.limit) params.set('limit', String(options.limit));
        if (options.after) params.set('after', options.after);

        const qs = params.toString();
        const data = await this.rest.get(`/guilds/${guildId}/members${qs ? '?' + qs : ''}`);
        for (const member of data) {
            this.cache.set(this._cacheKey(guildId, member.userId || member.user?.id), member);
        }
        return data;
    }

    /** Kick a member from a guild */
    async kick(guildId: string, userId: string, reason?: string): Promise<void> {
        await this.rest.delete(`/guilds/${guildId}/members/${userId}`, {
            headers: reason ? { 'X-Audit-Log-Reason': reason } : undefined
        });
        this.cache.delete(this._cacheKey(guildId, userId));
    }

    /** Ban a member from a guild */
    async ban(guildId: string, userId: string, options?: { reason?: string; deleteMessageDays?: number }): Promise<void> {
        await this.rest.put(`/guilds/${guildId}/bans/${userId}`, {
            reason: options?.reason,
            delete_message_days: options?.deleteMessageDays || 0
        });
        this.cache.delete(this._cacheKey(guildId, userId));
    }

    /** Unban a user */
    async unban(guildId: string, userId: string): Promise<void> {
        await this.rest.delete(`/guilds/${guildId}/bans/${userId}`);
    }

    /** Add a role to a member */
    async addRole(guildId: string, userId: string, roleId: string): Promise<void> {
        await this.rest.put(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {});
    }

    /** Remove a role from a member */
    async removeRole(guildId: string, userId: string, roleId: string): Promise<void> {
        await this.rest.delete(`/guilds/${guildId}/members/${userId}/roles/${roleId}`);
    }

    /** Set member nickname */
    async setNickname(guildId: string, userId: string, nickname: string | null): Promise<GuildMember> {
        const data = await this.rest.patch(`/guilds/${guildId}/members/${userId}`, { nickname });
        this.cache.set(this._cacheKey(guildId, userId), data);
        return data;
    }

    /** Timeout a member (communication disabled until) */
    async timeout(guildId: string, userId: string, until: Date | null): Promise<GuildMember> {
        const data = await this.rest.patch(`/guilds/${guildId}/members/${userId}`, {
            communication_disabled_until: until?.toISOString() || null
        });
        this.cache.set(this._cacheKey(guildId, userId), data);
        return data;
    }
}
