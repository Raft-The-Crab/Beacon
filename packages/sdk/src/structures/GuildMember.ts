import { Client } from '../client';
import { User, RawUser } from './User';
import { VoiceState } from './VoiceState';

export interface GuildMember {
  userId: string
  guildId: string
  nickname?: string
  avatar?: string
  roles: string[]
  joinedAt?: string
  user?: User
  createdAt?: string
  createdAtDate?: Date
  displayName?: string
  toJSON?(): Record<string, any>
}

export interface RawGuildMember {
  user: RawUser
  nick?: string | null
  roles: string[]
  joined_at: string
  deaf: boolean
  mute: boolean
  permissions?: string
  premium_since?: string | null
  communication_disabled_until?: string | null
  pending?: boolean
}

export class GuildMember {
    public readonly client: Client;
    public userId: string;
    public guildId: string;
    public nickname?: string;
    public avatar?: string;
    public roles: string[];
    public user?: User;
    public voice?: VoiceState;
    public displayName?: string;
    public permissions?: string;
    public premiumSince?: Date | null;
    public communicationDisabledUntil?: Date | null;
    public pending?: boolean;
    
    // Computed compatibility properties
    public joinedAt?: string;
    public createdAt?: string;
    public createdAtDate?: Date;

    constructor(client: Client, data: any) {
        this.client = client;
        this.userId = data.userId || data.user?.id;
        this.guildId = data.guildId;
        this.nickname = data.nickname || data.nick;
        this.avatar = data.avatar;
        this.roles = data.roles || [];
        
        // Handle joinedAt
        const jDate = data.joinedAt || data.joined_at ? new Date(data.joinedAt || data.joined_at) : new Date();
        this.joinedAt = data.joinedAt || data.joined_at || jDate.toISOString();
        
        if (data.user) {
            this.user = new User(client, data.user);
        }

        this.displayName = this.nickname || this.user?.username || 'Unknown User';
        this.permissions = data.permissions;
        this.premiumSince = (data.premiumSince || data.premium_since) ? new Date(data.premiumSince || data.premium_since) : null;
        this.communicationDisabledUntil = (data.communicationDisabledUntil || data.communication_disabled_until) ? new Date(data.communicationDisabledUntil || data.communication_disabled_until) : null;
        this.pending = !!(data.pending);
        
        // Handle createdAt
        let cDate: Date;
        try {
            cDate = new Date(Number((BigInt(this.userId) >> 22n) + 1420070400000n));
        } catch {
            cDate = new Date();
        }
        this.createdAt = data.created_at || cDate.toISOString();
        this.createdAtDate = cDate;
    }


    async kick(reason?: string) {
        return this.client.memberManager.kick(this.guildId, this.userId, reason);
    }

    async ban(options?: { reason?: string; deleteMessageDays?: number }) {
        return this.client.memberManager.ban(this.guildId, this.userId, options);
    }

    async setNickname(nickname: string | null) {
        return this.client.memberManager.setNickname(this.guildId, this.userId, nickname);
    }

    async addRole(roleId: string) {
        return this.client.memberManager.addRole(this.guildId, this.userId, roleId);
    }

    async removeRole(roleId: string) {
        return this.client.memberManager.removeRole(this.guildId, this.userId, roleId);
    }

    /** Edit this member's properties (nickname, roles, voice state) */
    async edit(options: { 
        nickname?: string | null; 
        roles?: string[]; 
        mute?: boolean; 
        deaf?: boolean; 
        channelId?: string | null;
        communicationDisabledUntil?: Date | null;
    }) {
        return this.client.memberManager.edit(this.guildId, this.userId, options);
    }

    /** Timeout this member (communication disabled) */
    async timeout(until: Date | null) {
        return this.client.memberManager.timeout(this.guildId, this.userId, until);
    }

    /** Mute this member in voice channels */
    async setMute(mute: boolean) {
        return this.client.memberManager.setMute(this.guildId, this.userId, mute);
    }

    /** Deafen this member in voice channels */
    async setDeaf(deaf: boolean) {
        return this.client.memberManager.setDeaf(this.guildId, this.userId, deaf);
    }

    /** Move this member to a different voice channel (or disconnect if null) */
    async setVoiceChannel(channelId: string | null) {
        return this.client.memberManager.setVoiceChannel(this.guildId, this.userId, channelId);
    }

    /**
     * Refresh this member's data from the API.
     */
    async fetch(force = true) {
        return this.client.fetchMember(this.guildId, this.userId);
    }

    /**
     * Fetch the guild this member belongs to.
     */
    async fetchGuild(force = false) {
        return this.client.fetchGuild(this.guildId, force);
    }

    /** Serializes this structure to a plain object */
    public toJSON?: () => Record<string, any> = () => {
        const result: Record<string, any> = {};
        const exclude = ['client', 'user', 'voice'];
        
        for (const key of Object.keys(this)) {
            if (exclude.includes(key)) continue;
            const value = (this as any)[key];
            if (typeof value !== 'function') {
                result[key] = value;
            }
        }
        
        if (this.user) result.user = this.user.toJSON?.();
        result.displayName = this.displayName;
        
        return result;
    }
}
