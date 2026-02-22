import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectMongo, prisma, redis } from './db'
import notesRouter from './api/notes'
import authRouter from './api/auth'
import guildRouter from './api/guilds'
import channelRouter from './api/channels'
import userRouter from './api/users'
import appsRouter from './api/apps'
import friendsRouter from './api/friends'
import dmRouter from './api/directMessages'
import webhookRouter from './api/webhooks'
import auditLogRouter from './api/auditLogs'
import folderRouter from './api/folders'
import beacoinRouter from './api/beacoin'
import messagesRouter from './api/messages'
import analyticsRouter from './api/analytics'
import helmet from 'helmet'
// Moderation moved to Render Worker
import { ipBlockMiddleware, generalLimiter, authLimiter, sanitizeHeaders, csrfProtection, generateCSRFToken } from './middleware/security'
import { responseWrapper } from './middleware/responseWrapper'
import { globalErrorHandler, notFoundHandler } from './middleware/error'
import { requestTimer } from './middleware/performance'
import { sanitizeBody } from './utils/sanitize'

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = '--max-old-space-size=384 --optimize-for-size'
}

const app = express()
app.use(requestTimer)

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            mediaSrc: ["'self'", 'blob:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:'],
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

const server = createServer(app)
const PORT = process.env.PORT || 8080

app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://beacon.app'],
    credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
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
            timestamp: new Date().toISOString(),
            services: {
                postgres: postgresConnected ? 'connected' : 'unavailable',
                postgresLatency: postgresLatency > -1 ? `${postgresLatency}ms` : 'N/A',
                mongodb: 'connected',
                redis: redisStatus ? 'connected' : 'disconnected',
            },
            version: '1.0.0',
        })
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/notes', notesRouter)
app.use('/api/guilds', guildRouter)
app.use('/api/channels', channelRouter)
app.use('/api/users', userRouter)
// /api/media moved to Render worker
app.use('/api/applications', appsRouter)
app.use('/api/friends', friendsRouter)
app.use('/api/dms', dmRouter)
app.use('/api/webhooks', webhookRouter)
app.use('/api/audit-logs', auditLogRouter)
app.use('/api/folders', folderRouter)
// /api/moderation moved to Render worker
app.use('/api/messages', messagesRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api', beacoinRouter)

app.get('/api/csrf-token', (_req, res) => {
    const token = generateCSRFToken()
    res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
    })
    res.json({ token })
})

app.get('/api/version', (_req, res) => {
    res.json({ version: '2.4.0' })
})

export { app, server }

app.use(notFoundHandler)
app.use(globalErrorHandler)

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
        console.log('🚀 Starting Beacon API Server (Azure)...')
        try { await connectMongo() } catch (e) { console.warn('⚠️  MongoDB connection failed', e) }
        if (prisma) {
            try {
                await prisma.$connect()
                console.log('✅ PostgreSQL: Connected')
            } catch (e) {
                console.warn('⚠️  PostgreSQL connection failed:', e)
            }
        }
        try {
            await redis.ping()
            console.log('✅ ClawCloud Redis: Connected')
        } catch (e) { }

        server.listen(PORT, () => {
            console.log(`\n✨ API running on http://localhost:${PORT}`)
        })
    } catch (err) {
        console.error('❌ Failed to start API API:', err)
        process.exit(1)
    }
}

start()
