import type { Client } from '../client';
import { Channel } from './Channel';
export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

export interface MusicMetadata {
  url: string
  start: number
  duration: 15 | 30
  title: string
  artist: string
  platform: 'spotify' | 'youtube' | 'unknown'
}

export type UserBadge =
  | 'staff'
  | 'verified_developer'
  | 'early_supporter'
  | 'beacon_plus'
  | 'bug_hunter'
  | 'moderator'
  | 'owner'
  | 'admin'
  | 'bot'
  | 'server_owner'
  | 'verified'
  | string

export interface User {
  id: string
  username: string
  displayName: string | null
  discriminator: string
  avatar: string | null
  email: string
  status: PresenceStatus
  customStatus: string | null
  statusText?: string
  statusEmoji?: string
  statusMusic?: string
  statusMusicMetadata?: MusicMetadata
  theme?: string
  bio: string | null
  banner: string | null
  developerMode: boolean
  isBeaconPlus: boolean
  badges: UserBadge[]
  bot: boolean
  twoFactorEnabled: boolean
  avatarDecorationId: string | null
  profileEffectId: string | null
  nameDesign: Record<string, any> | null
  locale: string | null
  createdAt?: string
  tag?: string
  avatarURL?: string
  createdAtDate?: Date
  toJSON?(): Record<string, any>
}

export interface RawUser {
  id: string
  username: string
  display_name?: string | null
  discriminator: string
  avatar: string | null
  email: string
  status: PresenceStatus
  custom_status: string | null
  status_text?: string
  status_emoji?: string
  status_music?: string
  status_music_metadata?: MusicMetadata
  theme?: string
  bio?: string | null
  banner?: string | null
  developer_mode?: boolean
  is_beacon_plus?: boolean
  badges?: UserBadge[]
  bot?: boolean
  two_factor_enabled?: boolean
  avatar_decoration_id?: string | null
  profile_effect_id?: string | null
  name_design?: Record<string, any> | null
  global_name?: string | null
  locale?: string | null
  created_at?: string
  accent_color?: number | null
}

export class User {
    public readonly client: Client;
    public id: string;
    public username: string;
    public displayName: string | null;
    public discriminator: string;
    public avatar: string | null;
    public bot: boolean;
    public globalName: string | null;
    public email: string;
    public status: PresenceStatus;
    public customStatus: string | null;
    public statusText?: string;
    public statusEmoji?: string;
    public statusMusic?: string;
    public statusMusicMetadata?: MusicMetadata;
    public theme?: string;
    public bio: string | null;
    public banner: string | null;
    public accentColor: number | null;
    public developerMode: boolean;
    public isBeaconPlus: boolean;
    public badges: UserBadge[];
    public twoFactorEnabled: boolean;
    public avatarDecorationId: string | null;
    public profileEffectId: string | null;
    public nameDesign: Record<string, any> | null;
    public locale: string | null;
    
    // Computed properties for compatibility
    public tag?: string;
    public avatarURL?: string;
    public createdAt?: string;

    constructor(client: Client, data: RawUser) {
        this.client = client;
        this.id = data.id;
        this.username = data.username;
        this.displayName = data.display_name || data.global_name || null;
        this.discriminator = data.discriminator;
        this.avatar = data.avatar;
        this.bot = !!data.bot;
        this.globalName = data.global_name || null;
        this.email = data.email;
        this.status = data.status || 'offline';
        this.customStatus = data.custom_status || null;
        this.statusText = data.status_text;
        this.statusEmoji = data.status_emoji;
        this.statusMusic = data.status_music;
        this.statusMusicMetadata = data.status_music_metadata;
        this.theme = data.theme;
        this.bio = data.bio || null;
        this.banner = data.banner || null;
        this.accentColor = data.accent_color || null;
        this.developerMode = !!data.developer_mode;
        this.isBeaconPlus = !!data.is_beacon_plus;
        this.badges = data.badges || [];
        this.twoFactorEnabled = !!data.two_factor_enabled;
        this.avatarDecorationId = data.avatar_decoration_id || null;
        this.profileEffectId = data.profile_effect_id || null;
        this.nameDesign = data.name_design || null;
        this.locale = data.locale || null;

        // Initialize computed properties
        this.tag = `${this.username}#${this.discriminator}`;
        this.avatarURL = this.avatar 
            ? `${this.client.rest.baseURL}/users/${this.id}/avatars/${this.avatar}.png`
            : `${this.client.rest.baseURL}/assets/default-avatar.png`;
        
        // Handle createdAt
        let date: Date;
        try {
            date = new Date(Number((BigInt(this.id) >> 22n) + 1420070400000n));
        } catch {
            date = new Date();
        }
        this.createdAt = data.created_at || date.toISOString();
        this.createdAtDate = date;
    }

    /**
     * Gets mutual friends and guilds with this user
     */
    public async getMutuals() {
        return this.client.getMutuals(this.id);
    }

    /**
     * Create a DM channel with this user.
     */
    public async createDM() {
        const raw = await this.client.rest.request('POST', '/users/@me/channels', { recipient_id: this.id });
        return new Channel(this.client, raw);
    }

    /**
     * Send a direct message to this user.
     */
    public async send(content: string | any) {
        const dmChannel = await this.createDM();
        return dmChannel.send(content);
    }

    /**
     * Refresh this user's data from the API.
     */
    public async fetch(force = true) {
        return this.client.fetchUser(this.id, force);
    }

    /** Gets the creation date from the snowflake ID */
    public createdAtDate?: Date;

    /** Serializes this structure to a plain object */
    public toJSON?: () => Record<string, any> = () => {
        const result: Record<string, any> = {};
        const exclude = ['client'];
        
        for (const key of Object.keys(this)) {
            if (exclude.includes(key)) continue;
            const value = (this as any)[key];
            if (typeof value !== 'function') {
                result[key] = value;
            }
        }
        
        result.tag = this.tag;
        result.avatarURL = this.avatarURL;
        result.createdAt = this.createdAt;
        
        return result;
    }
}
