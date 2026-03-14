import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

const nodeEnv = process.env.NODE_ENV || 'development'
const inferredServerRoot = process.cwd().endsWith(path.join('apps', 'server'))
    ? process.cwd()
    : path.resolve(process.cwd(), 'apps', 'server')

const baseEnvPath = path.join(inferredServerRoot, '.env')
if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath })
}

const envModePath = path.join(inferredServerRoot, `.env.${nodeEnv}`)
if (fs.existsSync(envModePath)) {
    dotenv.config({ path: envModePath, override: true })
}

// Configure global connection pooling
http.globalAgent.maxSockets = 500;

import { connectMongo, prisma, redis } from './db';
import { moderationService } from './services/moderation'
import { priorityQueue } from './services/priorityQueue'
import { getProfile } from './utils/autoTune'
import { sanitizeBody } from './utils/sanitize'
import { resolveServerSdkConfig } from './lib/beaconSdk'

import { ipBlockMiddleware, generalLimiter, authLimiter, sanitizeHeaders, csrfProtection, generateCSRFToken } from './middleware/security'
import { responseWrapper } from './middleware/responseWrapper'
import { globalErrorHandler, notFoundHandler } from './middleware/error'
import { requestTimer } from './middleware/performance'

import apiRouter from './api/index'
import activityRouter from './routes/activity.routes'
import uploadRouter from './routes/upload.routes'

const serviceProfile =
    process.env.AUTO_TUNE_PROFILE
    || (process.env.RAILWAY_ENVIRONMENT_NAME ? 'railway-api' : 'clawcloud-api')
const profile = getProfile(serviceProfile)
const sdkConfig = resolveServerSdkConfig()

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = `--max-old-space-size=${profile.heapLimitMB} --optimize-for-size`
}

const app = express()
app.use(compression({ level: 6, threshold: 10 * 1024 })) // Gzip compression > 10kb
app.use(requestTimer)

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
    if (value == null) return defaultValue
    const normalized = String(value).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
    return defaultValue
}

const configuredCorsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:5173', 'https://beacon.qzz.io', 'http://127.0.0.1:5173']

const devTunnelRegex = /^https:\/\/[a-z0-9-]+\.[a-z0-9-]*devtunnels\.ms$/i

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true)
            return
        }

        if (configuredCorsOrigins.includes(origin) || devTunnelRegex.test(origin)) {
            callback(null, true)
            return
        }

        callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
}))

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:*'],
            mediaSrc: ["'self'", 'blob:*', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:', 'http://localhost:*', 'ws://localhost:*'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}))

app.use(sanitizeHeaders)
app.use(sanitizeBody)
app.use(ipBlockMiddleware)
app.use('/api/', generalLimiter)
app.use(responseWrapper)

const server = http.createServer(app)
const BASE_PORT = Number(process.env.PORT || 8080)
let lastPostgresHealthErrorLogAt = 0

async function listenWithPortFallback(basePort: number): Promise<number> {
    const maxLocalAttempts = 8
    const isProd = process.env.NODE_ENV === 'production'
    const firstPort = Number.isFinite(basePort) && basePort > 0 ? basePort : 8080

    const tryListen = (port: number) => new Promise<number>((resolve, reject) => {
        const onError = (err: any) => {
            server.off('listening', onListening)
            reject(err)
        }
        const onListening = () => {
            server.off('error', onError)
            resolve(port)
        }

        server.once('error', onError)
        server.once('listening', onListening)
        server.listen(port)
    })

    for (let i = 0; i < maxLocalAttempts; i++) {
        const port = firstPort + i
        try {
            return await tryListen(port)
        } catch (err: any) {
            if (err?.code === 'EADDRINUSE' && !isProd) {
                console.warn(`⚠️  Port ${port} already in use, trying ${port + 1}...`)
                continue
            }
            throw err
        }
    }

    throw new Error(`No open port found starting at ${firstPort}`)
}

async function connectPostgresWithRetry(maxAttempts = 5, baseDelayMs = 800): Promise<boolean> {
    if (!prisma) return false

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await prisma.$connect()
            console.log(`✅ PostgreSQL: Connected (attempt ${attempt}/${maxAttempts})`)
            return true
        } catch (error) {
            const delay = baseDelayMs * attempt
            const reason = error instanceof Error ? error.message : String(error)
            console.warn(`⚠️  PostgreSQL connection attempt ${attempt}/${maxAttempts} failed: ${reason}`)
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delay))
            }
        }
    }

    return false
}

app.use(express.json({ limit: profile.jsonLimitMB }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(csrfProtection)
app.set('trust proxy', 1)

app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
})

app.get('/health', async (_req: express.Request, res: express.Response) => {
    try {
        const mem = process.memoryUsage()
        const postgresStart = Date.now()
        const postgresConnected = !!prisma
        let postgresLatency = -1
        let postgresHealthy = postgresConnected
        try {
            if (prisma) {
                await prisma.$queryRaw`SELECT 1`
                postgresLatency = Date.now() - postgresStart
            }
        } catch (e) {
            postgresHealthy = false
            const now = Date.now()
            if (now - lastPostgresHealthErrorLogAt > 60_000) {
                console.warn('Postgres health check failed:', e)
                lastPostgresHealthErrorLogAt = now
            }
        }

        const redisStatus = redis.status === 'ready'

        res.json({
            status: 'healthy',
            service: 'beacon-api',
            timestamp: new Date().toISOString(),
            sdk: {
                apiUrl: sdkConfig.apiUrl,
                wsUrl: sdkConfig.wsUrl,
            },
            memory: {
                rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
            },
            services: {
                postgres: postgresHealthy ? 'connected' : 'degraded',
                postgresLatency: postgresLatency > -1 ? `${postgresLatency}ms` : 'N/A',
                mongodb: 'connected',
                redis: redisStatus ? 'connected' : 'unavailable',
            },
            version: '2.4.0',
            autoTune: profile.name,
            queue: priorityQueue.getStats(),
        })
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})

// Consolidated API Router
app.use('/api', apiRouter)

app.get('/api/version', (req, res) => {
    res.json({ version: '2.4.0', status: 'healthy', timestamp: new Date().toISOString() })
})

app.get('/api/csrf-token', (req, res) => {
    const token = generateCSRFToken()
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1'
    res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' && !isLocalhost,
        sameSite: 'lax',
        maxAge: 3600000
    })
    res.json({ token })
})

// Duplicate version route removed
export { app, server }

app.use(notFoundHandler)
app.use(globalErrorHandler)

/**
 * Keep-alive self-ping — prevents any platform from sleeping the service.
 */
function startKeepAlive(port: number | string) {
    const publicUrl =
        process.env.CLAWCLOUD_PUBLIC_URL ||
        process.env.CLAWCLOUD_URL ||
        process.env.RAILWAY_PUBLIC_URL
    const url = publicUrl
        ? `${publicUrl}/health`
        : `http://localhost:${port}/health`
    const INTERVAL = 5 * 60 * 1000

    const ping = async () => {
        try {
            const res = await fetch(url)
            console.log(`[keep-alive] Service ping ${res.ok ? '✅' : '⚠️'} (${res.status})`)
        } catch (e: any) {
            console.warn(`[keep-alive] ping failed: ${e.message}`)
        }
    }
    setInterval(ping, INTERVAL)
    console.log(`[keep-alive] Self-pinging every 5 min → ${url}`)
}

/**
 * Memory watchdog — logs RSS every 10 min, triggers GC if high.
 */
function startMemoryWatchdog() {
    setInterval(() => {
        if (global.gc) global.gc()
        const mem = process.memoryUsage()
        const rssMB = Math.round(mem.rss / 1024 / 1024)
        console.log(`[memory] RSS: ${rssMB} MB | Heap: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`)
        if (rssMB > profile.gcTriggerMB) {
            console.warn(`[memory] ⚠️ RSS above ${profile.gcTriggerMB} MB, forcing GC`)
            if (global.gc) global.gc()
        }
    }, 10 * 60 * 1000)
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    server.close(async () => {
        if (prisma) await prisma.$disconnect()
        await redis.quit()
        process.exit(0)
    })
})

process.on('SIGINT', async () => {
    server.close(async () => {
        if (prisma) await prisma.$disconnect()
        await redis.quit()
        process.exit(0)
    })
})

const start = async () => {
    try {
        console.log('🚀 Starting Beacon API Server (Railway/ClawCloud — Combined)...')
        console.log(`   Memory limit: ${process.env.NODE_OPTIONS || 'default'}`)
        try { await connectMongo() } catch (e) { console.warn('⚠️  MongoDB connection failed', e) }
        if (prisma) {
            const postgresConnected = await connectPostgresWithRetry(6)
            if (!postgresConnected) {
                console.warn('⚠️  PostgreSQL unavailable at startup. Server continues in degraded mode and will retry on next queries.')
            }
        }
        // Initialize Redis in background when configured — don't block server startup.
        if (redis.isEnabled) {
            redis.connect().catch(err => {
                console.warn('⚠️  Redis connection failed (Continuing in degraded mode):', err.message)
            })
        } else {
            const reason = redis.disabledConfigReason ? `: ${redis.disabledConfigReason}` : ''
            console.log(`⚪ Redis disabled${reason}`)
        }

        const activePort = await listenWithPortFallback(BASE_PORT)
        const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || process.env.CLAWCLOUD_PUBLIC_URL || process.env.CLAWCLOUD_URL
        const publicUrl = publicDomain
            ? (String(publicDomain).startsWith('http') ? String(publicDomain) : `https://${publicDomain}`)
            : null

        console.log(`\n✨ API bound to internal container URL: http://localhost:${activePort}`)
        if (publicUrl) {
            console.log(`🌐 Public API URL: ${publicUrl}`)
        }

            const moderationEnabled = parseEnvBool(process.env.ENABLE_MODERATION, true)
            const botSystemEnabled = parseEnvBool(process.env.ENABLE_BOT_SYSTEM, true)

            if (moderationEnabled) {
                moderationService.init()
                moderationService.initQueue()
                console.log('✅ Moderation + Priority Queue: Ready')
            } else {
                console.log('⚪ Moderation disabled by ENABLE_MODERATION=false')
            }

            if (botSystemEnabled) {
                import('./bots/index.js').then(async ({ initBotSystem }) => {
                    await initBotSystem()
                    console.log('✅ Bot System: Ready')
                }).catch(err => {
                    console.error('❌ Failed to initialize Bot System:', err)
                })
            } else {
                console.log('⚪ Bot System disabled by ENABLE_BOT_SYSTEM=false')
            }

            startKeepAlive(activePort)
            startMemoryWatchdog()
    } catch (err) {
        console.error('❌ Failed to start API:', err)
        process.exit(1)
    }
}

start()
