import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

// Configure global connection pooling
http.globalAgent.maxSockets = 500;

import { connectMongo, prisma, redis } from './db';
import { moderationService } from './services/moderation'
import { priorityQueue } from './services/priorityQueue'
import { getProfile } from './utils/autoTune'
import { sanitizeBody } from './utils/sanitize'

import { ipBlockMiddleware, generalLimiter, authLimiter, sanitizeHeaders, csrfProtection, generateCSRFToken } from './middleware/security'
import { responseWrapper } from './middleware/responseWrapper'
import { globalErrorHandler, notFoundHandler } from './middleware/error'
import { requestTimer } from './middleware/performance'

import apiRouter from './api/index'
import activityRouter from './routes/activity.routes'
import uploadRouter from './routes/upload.routes'

const profile = getProfile('clawcloud-api')

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = `--max-old-space-size=${profile.heapLimitMB} --optimize-for-size`
}

const app = express()
app.use(compression({ level: 6, threshold: 10 * 1024 })) // Gzip compression > 10kb
app.use(requestTimer)

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
const PORT = process.env.PORT || 8080

app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'https://beacon.app', 'http://127.0.0.1:5173'],
    credentials: true,
}))
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
        try {
            if (prisma) {
                await prisma.$queryRaw`SELECT 1`
                postgresLatency = Date.now() - postgresStart
            }
        } catch (e) {
            console.warn('Postgres health check failed:', e)
        }

        const redisStatus = redis.status === 'ready'

        res.json({
            status: 'healthy',
            service: 'northflank-api',
            timestamp: new Date().toISOString(),
            memory: {
                rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
            },
            services: {
                postgres: postgresConnected ? 'connected' : 'unavailable',
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
        sameSite: isLocalhost ? 'lax' : 'strict',
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
    const url = process.env.NORTHFLANK_PUBLIC_URL || process.env.RAILWAY_PUBLIC_URL
        ? `${process.env.NORTHFLANK_PUBLIC_URL || process.env.RAILWAY_PUBLIC_URL}/health`
        : `http://localhost:${port}/health`
    const INTERVAL = 5 * 60 * 1000

    const ping = async () => {
        try {
            const res = await fetch(url)
            console.log(`[keep-alive] Northflank ping ${res.ok ? '✅' : '⚠️'} (${res.status})`)
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
        console.log('🚀 Starting Beacon API Server (Northflank — Combined)...')
        console.log(`   Memory limit: ${process.env.NODE_OPTIONS || 'default'}`)
        try { await connectMongo() } catch (e) { console.warn('⚠️  MongoDB connection failed', e) }
        if (prisma) {
            try {
                await prisma.$connect()
                console.log('✅ PostgreSQL: Connected')
            } catch (e) {
                console.warn('⚠️  PostgreSQL connection failed:', e)
            }
        }
        // Initialize Redis in background — don't block server startup
        redis.connect().catch(err => {
            console.warn('⚠️  Redis connection failed (Continuing in degraded mode):', err.message);
        });

        server.listen(PORT, () => {
            console.log(`\n✨ API running on http://localhost:${PORT}`)

            // Initialize moderation pipeline + priority queue
            moderationService.init()
            moderationService.initQueue()

            // Initialize Bot System (Official Beacon Bot)
            import('./bots/index.js').then(async ({ initBotSystem }) => {
                await initBotSystem();
                console.log('✅ Bot System: Ready')
            }).catch(err => {
                console.error('❌ Failed to initialize Bot System:', err);
            });

            console.log('✅ Moderation + Priority Queue + Bot System: Ready')

            startKeepAlive(PORT)
            startMemoryWatchdog()
        })
    } catch (err) {
        console.error('❌ Failed to start API:', err)
        process.exit(1)
    }
}

start()
