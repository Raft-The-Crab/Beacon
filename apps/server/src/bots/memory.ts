import { redis } from '../db'

/**
 * Long-Term Memory Service
 * Persists user-specific insights and channel context in Redis
 */
export class LongTermMemory {
    private static readonly TTL = 60 * 60 * 24 * 30 // 30 days

    /**
     * Save a specific insight about a user (e.g., "likes anime", "is a developer")
     */
    static async saveUserInsight(userId: string, insight: string) {
        const key = `bot:memory:user:${userId}:insights`
        await redis.sadd(key, insight)
        await redis.expire(key, this.TTL)
    }

    /**
     * Retrieve all insights for a user
     */
    static async getUserInsights(userId: string): Promise<string[]> {
        const key = `bot:memory:user:${userId}:insights`
        return await redis.smembers(key)
    }

    /**
     * Store recent topics discussed in a channel
     */
    static async updateChannelTopic(channelId: string, topic: string) {
        const key = `bot:memory:channel:${channelId}:topics`
        await redis.lpush(key, topic)
        await redis.ltrim(key, 0, 9) // Keep last 10 topics
        await redis.expire(key, this.TTL)
    }

    /**
     * Get recent topics for a channel
     */
    static async getChannelTopics(channelId: string): Promise<string[]> {
        const key = `bot:memory:channel:${channelId}:topics`
        return await redis.lrange(key, 0, -1)
    }

    /**
     * Store user specific preference
     */
    static async setPreference(userId: string, key: string, value: string) {
        const redisKey = `bot:memory:user:${userId}:prefs`
        await redis.hset(redisKey, key, value)
        await redis.expire(redisKey, this.TTL)
    }

    /**
     * Get user specific preference
     */
    static async getPreference(userId: string, key: string): Promise<string | null> {
        const redisKey = `bot:memory:user:${userId}:prefs`
        return await redis.hget(redisKey, key)
    }
}
