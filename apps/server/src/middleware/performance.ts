import { Request, Response, NextFunction } from 'express'
import { logger } from '../services/logger'
import { redis } from '../db'

/**
 * Middleware to track request duration and log performance metrics.
 */
export function requestTimer(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime()

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start)
        const duration = (seconds * 1000 + nanoseconds / 1000000).toFixed(2)

        const status = res.statusCode
        const color = status >= 500 ? 'red' : status >= 400 ? 'yellow' : 'green'

        logger.info(`${req.method} ${req.path} - ${status} (${duration}ms)`)
    })

    next()
}

/**
 * High-performance Redis Cache Middleware for GET requests.
 * @param durationSeconds How long to cache the response
 */
export function cacheResponse(durationSeconds: number = 60) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET') return next()

        // Create a unique cache key based on URL and query params
        const key = `beacon:cache:${req.originalUrl || req.url}`

        try {
            const cached = await redis.get(key)
            if (cached) {
                res.setHeader('X-Cache', 'HIT')
                return res.json(JSON.parse(cached))
            }

            // Override res.json to intercept the response and cache it
            res.setHeader('X-Cache', 'MISS')
            const originalJson = res.json.bind(res)

            res.json = (body: any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redis.set(key, JSON.stringify(body), 'EX', durationSeconds).catch((e: any) => logger.error('Cache set error:', e))
                }
                return originalJson(body)
            }

            next()
        } catch (error) {
            logger.error('Redis cache error:', error)
            next()
        }
    }
}
