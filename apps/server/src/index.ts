import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectMongo, prisma, redis } from './db'
import { GatewayService } from './services/gateway'
import notesRouter from './api/notes'
import authRouter from './api/auth'
import guildRouter from './api/guilds'
import channelRouter from './api/channels'
import userRouter from './api/users'
import mediaRouter from './api/media'
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
import moderationRouter from './api/moderation'
import { ipBlockMiddleware, generalLimiter, authLimiter, sanitizeHeaders, csrfProtection, generateCSRFToken } from './middleware/security'
import { responseWrapper } from './middleware/responseWrapper'
import { globalErrorHandler, notFoundHandler } from './middleware/error'
import { requestTimer } from './middleware/performance'
import { sanitizeBody } from './utils/sanitize'

// Memory optimization for 512MB RAM
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = '--max-old-space-size=384 --optimize-for-size'
}

const app = express()
app.use(requestTimer)

// Security Hardening — Helmet with CSP
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
  crossOriginEmbedderPolicy: false, // Needed for media
}))

// Strip X-Powered-By
app.use(sanitizeHeaders)

// Input sanitization
app.use(sanitizeBody)

// IP blocklist check (async, fails open if Redis down)
app.use(ipBlockMiddleware)

// General rate limiting
app.use('/api/', generalLimiter)

// Standard Response Wrapper
app.use(responseWrapper)

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/gateway' })

const PORT = process.env.PORT || 8080

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://beacon.app'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// CSRF Protection (skip for GET requests)
app.use(csrfProtection)

// Trust proxy for secure cookies and rate limiting (required for Railway/Heroku)
app.set('trust proxy', 1)

// Request logging middleware
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.get('/health', async (_req: express.Request, res: express.Response) => {
  try {
    // Health checks for all services
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
app.use('/api/media', mediaRouter)
app.use('/api/applications', appsRouter)
app.use('/api/friends', friendsRouter)
app.use('/api/dms', dmRouter)
app.use('/api/webhooks', webhookRouter)
app.use('/api/audit-logs', auditLogRouter)
app.use('/api/folders', folderRouter)
app.use('/api/moderation', moderationRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api', beacoinRouter)

// CSRF token endpoint
app.get('/api/csrf-token', (_req, res) => {
  const token = generateCSRFToken()
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  })
  res.json({ token })
})

// Version endpoint for auto-updates
app.get('/api/version', (_req, res) => {
  res.json({ version: '2.4.0' })
})

// Initialize Gateway Service
const gateway = new GatewayService(wss)

// Export app/server for tests
export { app, server, wss, gateway }

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(globalErrorHandler)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...')
  server.close(async () => {
    if (prisma) await prisma.$disconnect()
    await redis.quit()
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...')
  server.close(async () => {
    if (prisma) await prisma.$disconnect()
    await redis.quit()
    console.log('✅ Server closed')
    process.exit(0)
  })
})

// Start Server
const start = async () => {
  try {
    console.log('🚀 Starting Beacon Server...')
    console.log('📊 Environment:', process.env.NODE_ENV || 'development')

    // Connect to databases with error handling
    console.log('🔌 Connecting to databases...')
    
    // MongoDB
    try {
      await connectMongo()
    } catch (e) {
      console.warn('⚠️  MongoDB connection failed, continuing without it:', e)
    }
    
    // PostgreSQL
    if (prisma) {
      try {
        await prisma.$connect()
        console.log('✅ PostgreSQL (Supabase): Connected')
      } catch (e) {
        console.warn('⚠️  PostgreSQL connection failed:', e)
      }
    } else {
      console.warn('⚠️  PostgreSQL: Skipped (DATABASE_URL not set)')
    }
    
    // Redis
    try {
      await redis.ping()
      console.log('✅ Redis Cloud: Connected')
    } catch (e) {
      console.warn('⚠️  Redis connection failed:', e)
    }

    server.listen(PORT, () => {
      console.log(`\n✨ Beacon server is running!`)
      console.log(`📡 HTTP API: http://localhost:${PORT}`)
      console.log(`🔌 WebSocket Gateway: ws://localhost:${PORT}/gateway`)
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
      console.log(`\n🎉 Ready to accept connections!`)

      // Keep-Alive: self-ping every 10 minutes
      const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`
        : `http://localhost:${PORT}/health`

      setInterval(async () => {
        try {
          const res = await fetch(SELF_URL)
          console.log(`[keep-alive] ping → ${res.status}`)
        } catch (e) {
          console.warn('[keep-alive] ping failed:', e)
        }
      }, 10 * 60 * 1000)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()

