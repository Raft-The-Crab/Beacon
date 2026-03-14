/**
 * PresenceManager — Track user presence via gateway events.
 */
import { Collection } from '../structures/Collection';

export interface Presence {
    userId: string;
    status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
    customStatus?: string;
    activities: Activity[];
    platform?: string;
    lastSeen?: string;
}

export interface Activity {
    type: 'playing' | 'streaming' | 'listening' | 'watching' | 'competing' | 'custom';
    name: string;
    details?: string;
    state?: string;
    url?: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
}

export class PresenceManager {
    public readonly cache: Collection<string, Presence>;

    constructor() {
        this.cache = new Collection<string, Presence>().setMaxSize(5000);
    }

    /** Update presence from a gateway PRESENCE_UPDATE event */
    update(data: any): Presence {
        const presence: Presence = {
            userId: data.user?.id || data.userId,
            status: data.status || 'offline',
            customStatus: data.custom_status || data.customStatus,
            activities: (data.activities || []).map((a: any) => ({
                type: a.type || 'custom',
                name: a.name || '',
                details: a.details,
                state: a.state,
                url: a.url,
                timestamps: a.timestamps,
            })),
            platform: data.platform,
            lastSeen: data.status === 'offline' ? new Date().toISOString() : undefined,
        };

        this.cache.set(presence.userId, presence);
        return presence;
    }

    /** Get a user's presence (returns offline if unknown) */
    get(userId: string): Presence {
        return this.cache.get(userId) || {
            userId,
            status: 'offline',
            activities: [],
        };
    }

    /** Check if a user is online */
    isOnline(userId: string): boolean {
        const p = this.cache.get(userId);
        return !!p && p.status !== 'offline';
    }

    /** Get all online users */
    getOnline(): Presence[] {
        return [...this.cache.values()].filter(p => p.status !== 'offline');
    }

    /** Get count of online users */
    get onlineCount(): number {
        return [...this.cache.values()].filter(p => p.status !== 'offline').length;
    }

    /** Set a user offline and record lastSeen */
    setOffline(userId: string): void {
        const existing = this.cache.get(userId);
        if (existing) {
            existing.status = 'offline';
            existing.lastSeen = new Date().toISOString();
            existing.activities = [];
        }
    }

    /** Bulk update presences from GUILD_CREATE payload */
    bulkUpdate(presences: any[]): void {
        for (const p of presences) {
            this.update(p);
        }
    }
}
