import { redis } from '../db'

export class CacheService {
    private static DEFAULT_TTL = 3600 // 1 hour

    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key)
            return data ? JSON.parse(data) : null
        } catch (err) {
            console.error(`Cache Get Error [${key}]:`, err)
            return null
        }
    }

    static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
        try {
            const data = JSON.stringify(value)
            await redis.set(key, data, 'EX', ttl)
        } catch (err) {
            console.error(`Cache Set Error [${key}]:`, err)
        }
    }

    static async del(key: string): Promise<void> {
        try {
            await redis.del(key)
        } catch (err) {
            console.error(`Cache Del Error [${key}]:`, err)
        }
    }

    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern)
            if (keys.length > 0) {
                await redis.del(...keys)
            }
        } catch (err) {
            console.error(`Cache Pattern Invalidation Error [${pattern}]:`, err)
        }
    }
}
