import type { Client } from '../client';
import { User } from './User';
import { Channel } from './Channel';

export type ServerTag = 'gaming' | 'music' | 'entertainment' | 'education' | 'science' | 'technology' | 'art' | 'community' | 'anime' | 'memes' | 'programming' | 'sports' | 'fashion' | 'food' | 'travel' | 'business' | 'finance' | 'politics' | 'news' | 'other'

export interface Guild {
  id: string
  name: string
  icon: string | null
  banner: string | null
  splash?: string | null
  ownerId: string
  createdAt?: string
  memberCount: number
  members: User[]
  channels: Channel[]
  roles: any[]
  boostCount: number
  boostLevel: number
  vanityURL?: string | null
  description?: string | null
  features: string[]
  tags: ServerTag[]
  iconURL?: string
  bannerURL?: string | null
  toJSON?(): Record<string, any>
}

export interface RawGuild {
  id: string
  name: string
  icon: string | null
  banner: string | null
  splash?: string | null
  owner_id?: string
  ownerId?: string
  created_at?: string
  createdAt?: string
  member_count?: number
  memberCount?: number
  members?: any[]
  channels?: any[]
  roles?: any[]
  boost_count?: number
  boostCount?: number
  boost_level?: number
  boostLevel?: number
  vanity_url?: string | null
  vanityURL?: string | null
  description?: string | null
  features?: string[]
  tags?: ServerTag[]
  settings?: any
  approximate_member_count?: number
  approximateMemberCount?: number
  approximate_presence_count?: number
}
import { RoleManager } from '../managers/RoleManager';
import { GuildMemberManager } from '../managers/GuildMemberManager';
import { GuildChannelManager } from '../managers/GuildChannelManager';
import { GuildEmojiManager } from '../managers/GuildEmojiManager';
import { AuditLogManager } from '../managers/AuditLogManager';
import { GuildScheduledEventManager } from '../managers/GuildScheduledEventManager';
import { GuildInviteManager } from '../managers/GuildInviteManager';

export class Guild {
    public readonly client: Client;
    public id: string;
    public name: string;
    public icon: string | null;
    public banner: string | null;
    public splash?: string | null;
    public ownerId: string;
    public memberCount: number;
    public approximateMemberCount?: number;
    public vanityURL?: string | null;
    public description?: string | null;
    public boostCount: number;
    public boostLevel: number;
    public features: string[];
    public tags: ServerTag[];
    public settings: any;
    
    // Computed properties for compatibility
    public iconURL?: string;
    public bannerURL?: string | null;
    public createdAt?: string;
    public createdAtDate?: Date;

    public roles: any[] = [];
    public members: User[] = [];
    public channels: Channel[] = [];
    public emojis: any[] = [];
    
    // Managers
    public readonly roleManager: RoleManager;
    public readonly memberManager: GuildMemberManager;
    public readonly channelManager: GuildChannelManager;
    public readonly emojiManager: GuildEmojiManager;
    public readonly auditLogManager: AuditLogManager;
    public readonly scheduledEventManager: GuildScheduledEventManager;
    public readonly inviteManager: GuildInviteManager;

    constructor(client: Client, data: RawGuild) {
        this.client = client;
        this.id = data.id;
        this.name = data.name;
        this.icon = data.icon;
        this.banner = data.banner;
        this.splash = data.splash;
        this.ownerId = data.owner_id || data.ownerId || '';
        this.memberCount = data.member_count || data.memberCount || data.approximate_member_count || data.approximateMemberCount || 0;
        this.approximateMemberCount = data.approximate_member_count || data.approximateMemberCount || this.memberCount;
        this.vanityURL = data.vanity_url || data.vanityURL;
        this.description = data.description;
        this.boostCount = data.boost_count || data.boostCount || 0;
        this.boostLevel = data.boost_level || data.boostLevel || 0;
        this.features = data.features || [];
        this.tags = data.tags || [];
        this.settings = (data as any).settings ?? {};

        this.roleManager = new RoleManager(client.rest, this.id);
        this.memberManager = new GuildMemberManager(client, this.id);
        this.channelManager = new GuildChannelManager(client, this.id);
        this.emojiManager = new GuildEmojiManager(client, this.id);
        this.auditLogManager = new AuditLogManager(client);
        this.scheduledEventManager = new GuildScheduledEventManager(client, this.id);
        this.inviteManager = new GuildInviteManager(client, this.id);

        // Map initial data if provided
        if (data.channels) {
            this.channels = data.channels.map(c => new Channel(client, c));
        }
        if (data.members) {
            this.members = data.members.map(m => new User(client, m));
        }

        // Initialize computed properties
        this.iconURL = this.icon 
            ? `${this.client.rest.baseURL}/guilds/${this.id}/icons/${this.icon}.png`
            : `${this.client.rest.baseURL}/assets/default-guild-icon.png`;
        this.bannerURL = this.banner
            ? `${this.client.rest.baseURL}/guilds/${this.id}/banners/${this.banner}.png`
            : null;
        
        // Handle createdAt
        let date: Date;
        try {
            const rawDate = data.created_at || data.createdAt;
            if (rawDate && isNaN(Number(rawDate))) {
                this.createdAt = rawDate;
            } else {
                date = new Date(Number((BigInt(this.id) >> 22n) + 1420070400000n));
                this.createdAt = date.toISOString();
                this.createdAtDate = date;
            }
        } catch {
            this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
            this.createdAtDate = new Date();
        }
    }

    /**
     * Fetch all channels in this guild.
     */
    public async fetchChannels() {
        const raw = await this.client.rest.getGuildChannels(this.id);
        this.channels = raw.map((c: any) => new Channel(this.client, c));
        return this.channels;
    }

    /**
     * Fetch all members in this guild.
     */
    public async fetchMembers() {
        const raw = await this.client.rest.getGuildMembers(this.id);
        // GuildMember uses (client, data) and data.guildId
        this.members = raw.map((m: any) => new User(this.client, m.user));
        return raw; // Should return GuildMember objects ideally, but User is used for now in this.members
    }

    /**
     * Kick a member from the guild.
     * @param userId The ID of the member to kick
     * @param reason Optional reason for the audit log
     */
    public async kick(userId: string, reason?: string) {
        return this.client.kickMember(this.id, userId, reason);
    }

    /**
     * Ban a member from the guild.
     * @param userId The ID of the member to ban
     * @param options Optional banning configurations (reason, message deletion)
     */
    public async ban(userId: string, options: { deleteMessageDays?: number; reason?: string } = {}) {
        return this.client.banMember(this.id, userId, options);
    }

    /**
     * Unban a previously banned user.
     * @param userId The ID of the user to unban
     */
    public async unban(userId: string) {
        return this.client.unbanMember(this.id, userId);
    }

    /**
     * Create a new channel in this guild.
     * @param data Channel configuration (name, type, etc.)
     */
    public async createChannel(data: { name: string; type?: number; topic?: string; parent_id?: string; nsfw?: boolean; position?: number }) {
        return this.client.createChannel(this.id, data);
    }

    /**
     * Create a new role in this guild.
     * @param data Role configuration (name, permissions, color, etc.)
     */
    public async createRole(data: any) {
        return this.client.createRole(this.id, data);
    }

    /**
     * Delete an existing role.
     * @param roleId The ID of the role to delete
     */
    public async deleteRole(roleId: string) {
        return this.client.rest.deleteGuildRole(this.id, roleId);
    }

    /**
     * Modify an existing role.
     * @param roleId The ID of the role
     * @param data The new role data
     */
    public async modifyRole(roleId: string, data: any) {
        return this.client.rest.modifyGuildRole(this.id, roleId, data);
    }

    /**
     * Add a role to a member.
     * @param userId The member's user ID
     * @param roleId The role's ID
     */
    public async addRole(userId: string, roleId: string) {
        return this.client.addRoleToMember(this.id, userId, roleId);
    }

    /**
     * Remove a role from a member.
     * @param userId The member's user ID
     * @param roleId The role's ID
     */
    public async removeRole(userId: string, roleId: string) {
        return this.client.removeRoleFromMember(this.id, userId, roleId);
    }

    /**
     * Fetch all bans for this guild.
     */
    public async getBans() {
        return this.client.rest.getGuildBans(this.id);
    }

    /**
     * Fetch audit logs for this guild.
     * @param options Filtering options for audit logs
     */
    public async getAuditLogs(options: { limit?: number; action?: number } = {}) {
        return this.client.rest.getAuditLogs(this.id, options);
    }


    /** Serializes this structure to a plain object */
    public toJSON?: () => Record<string, any> = () => {
        const result: Record<string, any> = {};
        const exclude = ['client', 'roleManager', 'memberManager', 'channelManager', 'emojiManager', 'auditLogManager', 'scheduledEventManager', 'inviteManager'];
        
        for (const key of Object.keys(this)) {
            if (exclude.includes(key)) continue;
            const value = (this as any)[key];
            if (typeof value !== 'function') {
                if (Array.isArray(value)) {
                    result[key] = value.map(item => (item && typeof item.toJSON === 'function') ? item.toJSON() : item);
                } else {
                    result[key] = value;
                }
            }
        }
        
        // Explicitly add computed properties if they are not already covered by Object.keys(this)
        // and if the intent is to always include them in the serialized output.
        // If they are already properties of the class, they will be picked up by the loop.
        // This explicit addition ensures they are present even if they were not enumerable for some reason.
        if (this.iconURL !== undefined) result.iconURL = this.iconURL;
        if (this.bannerURL !== undefined) result.bannerURL = this.bannerURL;
        if (this.createdAt !== undefined) result.createdAt = this.createdAt;
        
        return result;
    }
}
