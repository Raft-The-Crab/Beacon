import express from 'express'
import rateLimit from 'express-rate-limit'
import { redis } from '../db'
import { SystemAuditService, AuditAction } from '../services/systemAudit'
import crypto from 'crypto'

type Request = express.Request
type Response = express.Response
type NextFunction = express.NextFunction

// ─── IP Blocklist ────────────────────────────────────────────────────────────

const BLOCKLIST_KEY = 'beacon:blocklist:ips'

export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  try {
    const blocked = await (redis as any).sismember(BLOCKLIST_KEY, ip)
    if (blocked) {
      await SystemAuditService.log({
        action: AuditAction.IP_BLOCKED,
        reason: 'Attempted access from blocked IP',
        ip,
        metadata: { path: req.path }
      });
      res.status(403).json({ error: 'Your IP has been blocked. Contact support@beacon.app to appeal.' })
      return
    }
  } catch {
    // Redis failure — fail open (don't block legit users if Redis is down)
  }
  next()
}

export async function blockIP(ip: string, reason?: string) {
  await redis.sadd(BLOCKLIST_KEY, ip)
  if (reason) {
    await redis.hset('beacon:blocklist:reasons', ip, reason)
  }
}

export async function unblockIP(ip: string) {
  await redis.srem(BLOCKLIST_KEY, ip)
  await redis.hdel('beacon:blocklist:reasons', ip)
}

export async function getBlockedIPs(): Promise<string[]> {
  return redis.smembers(BLOCKLIST_KEY)
}

// ─── Rate Limiters ───────────────────────────────────────────────────────────

/** General API: 300 req / 15 min */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many requests. Please slow down.' },
})

/** Auth endpoints: 5 req / 15 min (Stricter for brute-force) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  handler: (req, res, _next, options) => {
    SystemAuditService.log({
      action: AuditAction.RATE_LIMIT_HIT,
      reason: 'Auth rate limit exceeded',
      ip: req.ip,
      metadata: { path: req.path }
    });
    res.status(options.statusCode).send(options.message);
  }
})

/** Guild management: 20 req / 1 min */
export const guildLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
  message: { error: 'You are modifying guilds too quickly.' },
  handler: (req, res, _next, options) => {
    SystemAuditService.log({
      action: AuditAction.RATE_LIMIT_HIT,
      reason: 'Guild rate limit exceeded',
      userId: (req as any).user?.id,
      ip: req.ip,
      metadata: { path: req.path }
    });
    res.status(options.statusCode).send(options.message);
  }
})

/** Message send: 60 req / 1 min per user (prevents spam) */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
  message: { error: 'You are sending messages too quickly.' },
})

/** File upload & Media: 30 req / 1 min */
export const mediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
  message: { error: 'Media operation limit exceeded. Please wait a moment.' },
})

/** WebSocket flood protection: tracked separately in ws/index.ts */
export const wsFloodConfig = {
  maxMessagesPerSecond: 10,
  maxMessagesPerMinute: 100,
  banDurationMs: 5 * 60 * 1000, // 5 min temp-ban from WS on flood
}

// ─── WS Flood Tracker ────────────────────────────────────────────────────────

const wsMessageCounts = new Map<string, { perSecond: number; perMinute: number; lastSecond: number; lastMinute: number }>()

export function checkWSFlood(userId: string): boolean {
  const now = Date.now()
  const entry = wsMessageCounts.get(userId) || { perSecond: 0, perMinute: 0, lastSecond: now, lastMinute: now }

  // Reset per-second counter
  if (now - entry.lastSecond >= 1000) {
    entry.perSecond = 0
    entry.lastSecond = now
  }
  // Reset per-minute counter
  if (now - entry.lastMinute >= 60_000) {
    entry.perMinute = 0
    entry.lastMinute = now
  }

  entry.perSecond++
  entry.perMinute++
  wsMessageCounts.set(userId, entry)

  return entry.perSecond > wsFloodConfig.maxMessagesPerSecond || entry.perMinute > wsFloodConfig.maxMessagesPerMinute
}

// ─── Request Sanitization ────────────────────────────────────────────────────

/** Strip potentially dangerous headers */
export function sanitizeHeaders(_req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By')
  next()
}

// ─── CSRF Protection ─────────────────────────────────────────────────────────

const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'csrf_token'

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const token = req.headers[CSRF_HEADER] as string
  const cookieToken = req.cookies?.[CSRF_COOKIE]

  if (!token || !cookieToken || token !== cookieToken) {
    res.status(403).json({ error: 'Invalid CSRF token' })
    return
  }

  next()
}

export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

/** Validate Content-Type for POST/PUT/PATCH */
export function requireJSON(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || ''
    if (!ct.includes('application/json') && !ct.includes('multipart/form-data')) {
      res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' })
      return
    }
  }
  next()
}

// ─── User-Level Rate Limiting via Redis ──────────────────────────────────────

export async function userRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `beacon:ratelimit:${userId}:${action}`
  try {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }
    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, maxRequests - current)
    return {
      allowed: current <= maxRequests,
      remaining,
      resetIn: ttl,
    }
  } catch {
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds }
  }
}

// ─── WebSocket Rate Limiting ─────────────────────────────────────────────────

export async function wsRateLimit(
  userId: string,
  eventType: string
): Promise<boolean> {
  const key = `ws:ratelimit:${userId}:${eventType}`
  const limit = eventType === 'MESSAGE_CREATE' ? 5 : 10 // 5 msgs/sec, 10 events/sec
  
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 1) // 1 second window
    }
    return count <= limit
  } catch {
    return true // Fail open
  }
}
