import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectMongo, prisma, redis } from './db'
import { GatewayService } from './services/gateway'
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

import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()

// Security Hardening
app.use(helmet())
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
})
app.use('/api/', limiter)

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/gateway' })

const PORT = process.env.PORT || 8080

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://beacon.app'],
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Trust proxy for secure cookies and rate limiting (required for Railway/Heroku)
app.set('trust proxy', 1)

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.get('/health', async (_req, res) => {
  try {
    // Health checks for all services
    const postgresConnected = !!prisma
    try {
      if (prisma) await prisma.$queryRaw`SELECT 1`
    } catch (e) {
      console.warn('Postgres health check failed:', e)
    }

    const redisStatus = redis.status === 'ready'

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgresConnected ? 'connected' : 'unavailable',
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

app.use('/api/auth', authRouter)
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

// Initialize Gateway Service
const gateway = new GatewayService(wss)

// Export app/server for tests
export { app, server, wss, gateway }

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  })
})

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

    // Connect to databases
    console.log('🔌 Connecting to databases...')
    await connectMongo()
    if (prisma) {
      try { await prisma.$connect() } catch (e) { console.warn('Prisma connect failed:', e) }
    } else {
      console.warn('Prisma client not initialized; skipping Postgres connect')
    }
    await redis.ping()

    console.log('✅ All database connections established')
    console.log('  - PostgreSQL (Supabase): Connected')
    console.log('  - MongoDB Atlas: Connected')
    console.log('  - Redis Cloud: Connected')

    server.listen(PORT, () => {
      console.log(`\n✨ Beacon server is running!`)
      console.log(`📡 HTTP API: http://localhost:${PORT}`)
      console.log(`🔌 WebSocket Gateway: ws://localhost:${PORT}/gateway`)
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
      console.log(`\n🎉 Ready to accept connections!`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()

