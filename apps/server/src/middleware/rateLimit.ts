/**
 * Beacon Advanced Rate Limiter — Pillar VIII: Global Scaling
 * Sliding window rate limiter middleware with per-route configuration,
 * user-level and IP-level tracking, and Sovereign developer exemption.
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis';
import { SovereigntyService } from '../services/sovereignty';

// ── Types ────────────────────────────────────────────────────────────

interface RateLimitConfig {
    windowMs: number;       // Window size in milliseconds
    max: number;            // Max requests per window
    keyPrefix: string;      // Redis key prefix
    skipSovereign?: boolean; // Skip rate limiting for sovereign developers
    message?: string;       // Custom error message
}

// ── Presets ───────────────────────────────────────────────────────────

export const RateLimitPresets = {
    /** Standard API: 100 req / 60s */
    STANDARD: { windowMs: 60_000, max: 100, keyPrefix: 'rl:std', skipSovereign: true },
    /** Auth endpoints: 10 req / 60s */
    AUTH: { windowMs: 60_000, max: 10, keyPrefix: 'rl:auth', skipSovereign: false, message: 'Too many login attempts. Please try again later.' },
    /** Message sending: 30 req / 10s */
    MESSAGES: { windowMs: 10_000, max: 30, keyPrefix: 'rl:msg', skipSovereign: true },
    /** File uploads: 5 req / 60s */
    UPLOADS: { windowMs: 60_000, max: 5, keyPrefix: 'rl:upload', skipSovereign: true },
    /** Search: 15 req / 30s */
    SEARCH: { windowMs: 30_000, max: 15, keyPrefix: 'rl:search', skipSovereign: true },
    /** Guild creation: 3 req / 3600s */
    GUILD_CREATE: { windowMs: 3_600_000, max: 3, keyPrefix: 'rl:guild', skipSovereign: true },
    /** Webhook execution: 30 req / 60s */
    WEBHOOKS: { windowMs: 60_000, max: 30, keyPrefix: 'rl:webhook', skipSovereign: true },
    /** Burst protection: 5 req / 1s */
    BURST: { windowMs: 1_000, max: 5, keyPrefix: 'rl:burst', skipSovereign: true },
} as const;

// ── Middleware ────────────────────────────────────────────────────────

export function rateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Sovereign bypass
        if (config.skipSovereign) {
            const userId = (req as any).user?.id;
            if (userId && SovereigntyService.isSovereign(userId)) {
                return next();
            }
        }

        // Build the rate limit key (prefer user ID, fallback to IP)
        const userId = (req as any).user?.id;
        const identifier = userId || req.ip || 'unknown';
        const key = `${config.keyPrefix}:${identifier}`;

        try {
            const now = Date.now();
            const windowStart = now - config.windowMs;

            // Sliding window implementation using Redis sorted sets
            const pipeline = redis as any;
            await pipeline.zremrangebyscore(key, 0, windowStart);
            const count = await pipeline.zcard(key);

            if (count >= config.max) {
                // Calculate retry-after
                const oldestStr = await (redis as any).get(`${key}:oldest`);
                const oldest = oldestStr ? parseInt(oldestStr) : now;
                const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);

                res.set('X-RateLimit-Limit', String(config.max));
                res.set('X-RateLimit-Remaining', '0');
                res.set('X-RateLimit-Reset', String(Math.ceil((now + config.windowMs) / 1000)));
                res.set('Retry-After', String(Math.max(retryAfter, 1)));

                return res.status(429).json({
                    error: config.message || 'Rate limit exceeded. Please slow down.',
                    retryAfter: Math.max(retryAfter, 1),
                    limit: config.max,
                    windowMs: config.windowMs,
                });
            }

            // Add this request to the window
            await pipeline.zadd(key, now, `${now}:${Math.random()}`);
            await pipeline.expire(key, Math.ceil(config.windowMs / 1000));

            // Set response headers
            res.set('X-RateLimit-Limit', String(config.max));
            res.set('X-RateLimit-Remaining', String(Math.max(config.max - count - 1, 0)));
            res.set('X-RateLimit-Reset', String(Math.ceil((now + config.windowMs) / 1000)));

            next();
        } catch (err) {
            // If Redis is down, allow the request (fail-open)
            console.warn('[RateLimit] Redis error, failing open:', err);
            next();
        }
    };
}
