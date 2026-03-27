import { RestClient } from '../rest/RestClient';

import { TTLCache } from '../cache/TTLCache';
import type { RawUser } from '../types/index';

export interface GuildMember {
    id: string; // Internal mapping ID
    userId: string;
    guildId: string;
    nickname?: string;
    avatar?: string;
    roles: string[];
    joinedAt: string;
    premiumSince?: string | null;
    deaf: boolean;
    mute: boolean;
    pending?: boolean;
    permissions?: string;
    communicationDisabledUntil?: string | null;
    user?: RawUser;
}

export interface ListMembersOptions {
    limit?: number;   // max 1000, default 100
    after?: string;   // user ID for pagination
}

export class MemberManager {
    public readonly cache: TTLCache<string, GuildMember>;

    constructor(private rest: RestClient) {
        this.cache = new TTLCache<string, GuildMember>(3600000, 1000); // 1 hour TTL
    }

    private _cacheKey(guildId: string, userId: string): string {
        return `${guildId}:${userId}`;
    }

    /** @internal Update cache from gateway event */
    _updateCache(guildId: string, userId: string, data: Partial<GuildMember> | null) {
        const key = this._cacheKey(guildId, userId);
        if (!data) {
            this.cache.delete(key);
            return;
        }
        const existing = this.cache.get(key);
        if (existing) {
            Object.assign(existing, data);
        } else if (data.joinedAt) { // Only set if it's a "full" enough object
            this.cache.set(key, data as GuildMember);
        }
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

    /** Edit a member's properties (bulk) */
    async edit(guildId: string, userId: string, options: { 
        nickname?: string | null; 
        roles?: string[]; 
        mute?: boolean; 
        deaf?: boolean; 
        channelId?: string | null;
        communicationDisabledUntil?: Date | null;
    }): Promise<GuildMember> {
        const payload: any = {};
        if (options.nickname !== undefined) payload.nickname = options.nickname;
        if (options.roles !== undefined) payload.roles = options.roles;
        if (options.mute !== undefined) payload.mute = options.mute;
        if (options.deaf !== undefined) payload.deaf = options.deaf;
        if (options.channelId !== undefined) payload.channel_id = options.channelId;
        if (options.communicationDisabledUntil !== undefined) {
            payload.communication_disabled_until = options.communicationDisabledUntil?.toISOString() || null;
        }

        const data = await this.rest.patch(`/guilds/${guildId}/members/${userId}`, payload);
        this.cache.set(this._cacheKey(guildId, userId), data);
        return data;
    }

    /** Mute a member in voice */
    async setMute(guildId: string, userId: string, mute: boolean): Promise<GuildMember> {
        return this.edit(guildId, userId, { mute });
    }

    /** Deafen a member in voice */
    async setDeaf(guildId: string, userId: string, deaf: boolean): Promise<GuildMember> {
        return this.edit(guildId, userId, { deaf });
    }

    /** Move a member to another voice channel, or disconnect them if null */
    async setVoiceChannel(guildId: string, userId: string, channelId: string | null): Promise<GuildMember> {
        return this.edit(guildId, userId, { channelId });
    }
}
