import { useAuthStore } from '../stores/useAuthStore';
import { UserActivity } from '../stores/usePresenceStore';
import { wsClient } from './websocket';

/**
 * ActivitySyncService (Titan V Edition)
 * Manages real-time activity synchronization for the local user.
 * Bridges local states (Spotify, Gaming) to the Beacon Gateway.
 */
class ActivitySyncService {
    private interval: any = null;
    private currentActivities: UserActivity[] = [];

    /**
     * Start monitoring local activities.
     * In a browser, this primarily handles manual overrides and simulated bridges.
     */
    public start() {
        if (this.interval) return;

        // Polling loop for activity drift & sync
        this.interval = setInterval(() => this.sync(), 30000);
        this.sync();
        console.log('✨ [ActivitySync] Management started');
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Manually set a persistent activity (e.g., "Playing Counter-Strike 2")
     */
    public async setActivity(activity: UserActivity | null) {
        const { updateActivities } = useAuthStore.getState();
        this.currentActivities = activity ? [activity] : [];
        await updateActivities(this.currentActivities);
        this.broadcast();
    }

    /**
     * Spotify Bridge Integration (Titan V Style)
     * If the user has connected Spotify, this would fetch real-time data.
     */
    public async syncSpotify(data: { track: string; artist: string; albumArt?: string; url?: string } | null) {
        const { updateActivities } = useAuthStore.getState();

        if (!data) {
            this.currentActivities = this.currentActivities.filter(a => String(a.name || '').toLowerCase() !== 'spotify');
        } else {
            const spotifyActivity: UserActivity = {
                type: 'listening',
                name: 'Spotify',
                details: data.track,
                state: `by ${data.artist}`,
                assets: {
                    largeImage: data.albumArt || 'spotify-default',
                    largeText: data.track
                },
                url: data.url
            };

            // Replace existing spotify activity
            this.currentActivities = [
                ...this.currentActivities.filter(a => String(a.name || '').toLowerCase() !== 'spotify'),
                spotifyActivity
            ];
        }

        await updateActivities(this.currentActivities);
        this.broadcast();
    }

    /**
     * Broadcast presence/activity change to the Gateway
     */
    private broadcast() {
        const { user } = useAuthStore.getState();
        if (!user) return;

        wsClient.updatePresence(
            user.status || 'online',
            this.currentActivities.length > 0 ? this.currentActivities[0] : undefined
        );
    }

    /**
     * Internal sync logic to handle expiry or background changes
     */
    private sync() {
        // Handle activity expiry or heartbeat if needed
        this.broadcast();
    }
}

export const activitySync = new ActivitySyncService();
