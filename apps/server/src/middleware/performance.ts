import { Request, Response, NextFunction } from 'express'
import { logger } from '../services/logger'
import { redis } from '../db'

const NOISY_LOG_PATHS = (process.env.REQUEST_LOG_NOISY_PATHS || '/info,/options,/friends')
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean)

const endpointLogWindowMs = Math.max(1000, Number(process.env.REQUEST_LOG_THROTTLE_MS || 15000))
const requestLogSampleRate = Math.min(1, Math.max(0, Number(process.env.REQUEST_LOG_SAMPLE_RATE || 1)))
const logSuccessfulRequests = !['0', 'false', 'no'].includes(String(process.env.REQUEST_LOG_SUCCESS || 'true').toLowerCase())
const endpointLastLog = new Map<string, number>()

/**
 * Middleware to track request duration and log performance metrics.
 */
export function requestTimer(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime()

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start)
        const duration = (seconds * 1000 + nanoseconds / 1000000).toFixed(2)

        const status = res.statusCode
        const isNoisyPath = NOISY_LOG_PATHS.some((path) => req.path === path || req.path.endsWith(path))
        const isSuccess = status < 400

        if (isSuccess && !logSuccessfulRequests) {
            return
        }

        if (isNoisyPath && isSuccess) {
            const key = `${req.method}:${req.path}:${status}`
            const now = Date.now()
            const last = endpointLastLog.get(key) || 0
            if (now - last >= endpointLogWindowMs) {
                endpointLastLog.set(key, now)
                logger.info(`${req.method} ${req.path} - ${status} (${duration}ms) [throttled]`)
            }
            return
        }

        if (isSuccess && requestLogSampleRate < 1 && Math.random() > requestLogSampleRate) {
            return
        }

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
        const userId = (req as any).user?.id || 'anonymous'
        const key = `beacon:cache:${userId}:${req.originalUrl || req.url}`

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
