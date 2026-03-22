import express from 'express'
import rateLimit from 'express-rate-limit'
import { redis } from '../db'
import { SystemAuditService, AuditAction } from '../services/systemAudit'
import crypto from 'crypto'

type Request = express.Request
type Response = express.Response
type NextFunction = express.NextFunction

// Extend Express Request type to include optional user property

declare global {
  namespace Express {
    interface Request {
      user?: { id?: string; [key: string]: any };
    }
  }
}

// ─── IP Blocklist ────────────────────────────────────────────────────────────

const BLOCKLIST_KEY = 'beacon:blocklist:ips'

export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  // Fail-fast if Redis is not ready yet to prevent hanging the request during startup
  if (redis.status !== 'ready') {
    return next()
  }

  try {
    const blocked = await (redis as any).sismember(BLOCKLIST_KEY, ip)
    if (blocked) {
      await SystemAuditService.log({
        action: AuditAction.IP_BLOCKED,
        reason: 'Attempted access from blocked IP',
        ip,
        metadata: { path: req.path }
      });
      res.status(403).json({ error: 'Your IP has been blocked. Contact support@beacon.qzz.io to appeal.' })
      return
    }
  } catch (err) {
    // Redis failure — fail open (don't block legit users if Redis is down)
    console.warn('[Security] IP block check failed (falling back to open):', err instanceof Error ? err.message : err)
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
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  message: { error: 'You are modifying guilds too quickly.' },
  handler: (req, res, _next, options) => {
    SystemAuditService.log({
      action: AuditAction.RATE_LIMIT_HIT,
      reason: 'Guild rate limit exceeded',
      userId: req.user?.id,
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
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  message: { error: 'You are sending messages too quickly.' },
})

/** File upload & Media: 30 req / 1 min */
export const mediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Media operation limit exceeded. Please wait a moment.' },
})

/** v3: Upload-specific rate limiter: 40 req / 1 min */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  message: { error: 'Upload limit exceeded. Please wait before uploading more files.' },
  handler: (req, res, _next, options) => {
    SystemAuditService.log({
      action: AuditAction.RATE_LIMIT_HIT,
      reason: 'Upload rate limit exceeded',
      userId: req.user?.id,
      ip: req.ip,
      metadata: { path: req.path }
    });
    res.status(options.statusCode).send(options.message);
  }
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

/** Strip potentially dangerous headers and enforce security defaults */
export function sanitizeHeaders(_req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
}

/**
 * v3: Detect and log prototype pollution attempts in request payloads.
 * Does NOT block (to avoid breaking legitimate edge cases) but logs for audit.
 */
export function detectProtoPollution(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const suspicious = findSuspiciousKeys(req.body)
    if (suspicious.length > 0) {
      console.warn(`[Security] ⚠️ Proto pollution attempt detected from ${req.ip}: keys=[${suspicious.join(', ')}] path=${req.path}`)
      SystemAuditService.log({
        action: AuditAction.RATE_LIMIT_HIT,
        reason: `Prototype pollution attempt: ${suspicious.join(', ')}`,
        ip: req.ip,
        metadata: { path: req.path, keys: suspicious }
      }).catch(() => {})
    }
  }
  next()
}

/** Recursively find __proto__, constructor, prototype keys in an object */
function findSuspiciousKeys(obj: any, prefix = '', found: string[] = []): string[] {
  if (!obj || typeof obj !== 'object') return found
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      found.push(fullKey)
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      findSuspiciousKeys(obj[key], fullKey, found)
    }
  }
  return found
}

// ─── CSRF Protection ─────────────────────────────────────────────────────────

// Using a stateless double-submit cookie pattern, but more robust for SPAs.
// The frontend reads the token from the cookie, and sends it in the header.
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'csrf_token'

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Bearer-token API clients are not cookie-authenticated, so CSRF protection
  // is not required and can cause false negatives on valid requests.
  const authorization = req.headers.authorization || ''
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return next()
  }

  // Auth bootstrap endpoints are called before the client has a CSRF cookie.
  const path = req.path.toLowerCase()
  if (
    path.endsWith('/api/auth/login') ||
    path.endsWith('/api/auth/register') ||
    path.endsWith('/api/auth/google') ||
    path.endsWith('/api/auth/verify') ||
    path.endsWith('/api/auth/resend-verification') ||
    path.endsWith('/api/auth/mfa/verify') ||
    path.endsWith('/api/auth/refresh') ||
    path.endsWith('/api/csrf-token') ||
    path.endsWith('/csrf-token') ||
    path.endsWith('/api/version') ||
    path.endsWith('/version')
  ) {
    return next()
  }

  const token = req.headers[CSRF_HEADER] as string
  const cookieToken = req.cookies?.[CSRF_COOKIE]

  // Enforce CSRF for mutation requests — require both header and cookie to match.
  if (!token || !cookieToken || token !== cookieToken) {
    const origin = req.headers.origin || 'no-origin'
    const referer = req.headers.referer || 'no-referer'
    
    // LOGGING: include whether it's a mismatch or missing
    console.warn(`[CSRF] 403 Forbidden | Method: ${req.method} | Path: ${req.path} | Origin: ${origin} | Referer: ${referer} | Header: ${token ? 'present' : 'missing'} | Cookie: ${cookieToken ? 'present' : 'missing'} | Match: ${token === cookieToken}`)
    
    return res.status(403).json({ 
      error: 'Invalid or missing CSRF token. Please refresh the page and try again.', 
      debug: { 
        origin, 
        method: req.method,
        path: req.path,
        refreshRequired: true // Hint to front-end to retry
      } 
    })
  }

  next()
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** Validate Content-Type for POST/PUT/PATCH */
export function requireJSON(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || ''
    // Allow empty bodies (e.g. logout) or JSON/Multipart
    if (req.headers['content-length'] === '0') {
      return next()
    }
    if (!ct.includes('application/json') && !ct.includes('multipart/form-data')) {
      res.status(415).json({ error: 'Unsupported Media Type. Use application/json or multipart.' })
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
/** Capture rich fingerprint for security tracking */
export function getFingerprint(req: Request) {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    ua: req.headers['user-agent'] || 'unknown',
    lang: req.headers['accept-language'] || 'unknown',
    host: req.headers.host || 'unknown'
  }
}

/** Generate a stable hash from a fingerprint for session hardening */
export function hashFingerprint(req: Request): string {
  const fp = getFingerprint(req)
  // v3.1 modification: We exclude IP from the stable hash by default to support
  // mobile users switching networks (e.g. WiFi -> 5G). 
  // We still bind to User-Agent and Language to prevent basic replay/hijacks.
  const raw = `${fp.ua}|${fp.lang}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}
