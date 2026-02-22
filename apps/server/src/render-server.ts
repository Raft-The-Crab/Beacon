import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { connectMongo, prisma, redis } from './db'
import moderationRouter from './api/moderation'
import mediaRouter from './api/media'
import { responseWrapper } from './middleware/responseWrapper'
import { globalErrorHandler, notFoundHandler } from './middleware/error'

const app = express()
const server = createServer(app)
const PORT = process.env.RENDER_PORT || process.env.PORT || 8081

app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://beacon.app'],
    credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(responseWrapper)

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'render-worker' })
})

// Media Processing (queued) + Moderation routes
app.use('/api/moderation', moderationRouter)
app.use('/api/media', mediaRouter)

app.use(notFoundHandler)
app.use(globalErrorHandler)

/**
 * Keep-alive self-ping — prevents Render from sleeping after 15min idle.
 * Pings /health every 14 minutes.
 */
function startKeepAlive(port: number | string) {
    const url = process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/health`
        : `http://localhost:${port}/health`
    const INTERVAL = 14 * 60 * 1000 // 14 minutes

    const { get } = require('http')
    const ping = () => {
        try {
            get(url, (res: any) => {
                const ok = res.statusCode === 200
                console.log(`[keep-alive] Render ping ${ok ? '✅' : '⚠️'} (${res.statusCode})`)
            }).on('error', (e: Error) => {
                console.warn(`[keep-alive] ping failed: ${e.message}`)
            })
        } catch { }
    }
    setInterval(ping, INTERVAL)
    console.log(`[keep-alive] Self-pinging every 14 min → ${url}`)
}

const start = async () => {
    try {
        console.log('🚀 Starting Beacon Render Worker...')
        try { await connectMongo() } catch (e) { console.warn('⚠️  MongoDB failed', e) }
        try { if (prisma) await prisma.$connect() } catch (e) { console.warn('⚠️  Postgres failed', e) }
        try { await redis.ping() } catch (e) { console.warn('⚠️  Redis failed', e) }

        server.listen(PORT, () => {
            console.log(`✨ Render Worker running on port ${PORT}`)
            if (process.env.NODE_ENV === 'production') {
                startKeepAlive(PORT)
            }
        })
    } catch (err) {
        console.error('❌ Worker failed to start:', err)
        process.exit(1)
    }
}

start()
