import { prisma } from '../db';
import { redis } from '../db';

/**
 * Service to manage and broadcast user activities (Spotify, Gaming, etc.)
 */
export class ActivityService {
    private static ACTIVITY_KEY_PREFIX = 'beacon:activities:';

    /**
     * Updates a user's current activities and broadcasts to followers/guild members.
     */
    static async updateActivities(userId: string, activities: any[]) {
        try {
            const key = `${this.ACTIVITY_KEY_PREFIX}${userId}`;

            // 1. Store in Redis for fast access
            if (activities.length > 0) {
                await redis.set(key, JSON.stringify(activities), 'EX', 3600); // 1 hour TTL
            } else {
                await redis.del(key);
            }

            // 2. Broadcast via Gateway (if available)
            // In a production setup, this would publish to a Redis channel 
            // that the Gateway (WS server) listens to.
            await redis.publish('beacon:presence:updates', JSON.stringify({
                userId,
                type: 'ACTIVITY_UPDATE',
                activities,
                timestamp: Date.now()
            }));

            console.log(`[ActivityService] Updated activities for user ${userId}: ${activities.length} active`);
        } catch (error) {
            console.error('[ActivityService] Failed to update activities:', error);
        }
    }

    /**
     * Retrieves current activities for a set of users.
     */
    static async getBatchActivities(userIds: string[]): Promise<Record<string, any[]>> {
        const results: Record<string, any[]> = {};
        if (userIds.length === 0) return results;

        try {
            for (const id of userIds) {
                const data = await redis.get(`${this.ACTIVITY_KEY_PREFIX}${id}`);
                results[id] = data ? JSON.parse(data) : [];
            }
        } catch (error) {
            console.error('[ActivityService] Failed to fetch batch activities:', error);
        }
        return results;
    }
}
