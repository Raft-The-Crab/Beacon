import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import helmet from 'helmet'
import { redis } from './db'
import { GatewayService } from './services/gateway'

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = '--max-old-space-size=384 --optimize-for-size'
}

const app = express()
app.use(helmet())

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/gateway' })

const PORT = process.env.PORT || 8080

app.get('/health', async (_req, res) => {
    const redisStatus = redis.status === 'ready'
    res.json({
        status: 'healthy',
        service: 'railway-gateway',
        services: {
            redis: redisStatus ? 'connected' : 'disconnected'
        }
    })
})

const gateway = new GatewayService(wss)

export { app, server, wss, gateway }

process.on('SIGTERM', async () => {
    server.close(async () => {
        await redis.quit()
        process.exit(0)
    })
})

process.on('SIGINT', async () => {
    server.close(async () => {
        await redis.quit()
        process.exit(0)
    })
})

/**
 * Keep-alive self-ping — prevents Railway from sleeping after 30min idle.
 * Pings /health every 14 minutes.
 */
function startKeepAlive(port: number | string) {
    const url = process.env.RAILWAY_PUBLIC_URL
        ? `${process.env.RAILWAY_PUBLIC_URL}/health`
        : `http://localhost:${port}/health`
    const INTERVAL = 14 * 60 * 1000 // 14 minutes

    const { get } = require('http')
    const ping = () => {
        try {
            get(url, (res: any) => {
                const ok = res.statusCode === 200
                console.log(`[keep-alive] Railway ping ${ok ? '✅' : '⚠️'} (${res.statusCode})`)
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
        console.log('🚀 Starting Beacon WebSocket Gateway (Railway)...')
        try {
            await redis.ping()
            console.log('✅ ClawCloud Redis: Connected')
        } catch (e) {
            console.warn('⚠️  Redis connection failed:', e)
        }

        server.listen(PORT, () => {
            console.log(`\n✨ Gateway running on ws://localhost:${PORT}/gateway`)
            if (process.env.NODE_ENV === 'production') {
                startKeepAlive(PORT)
            }
        })
    } catch (err) {
        console.error('❌ Failed to start Gateway:', err)
        process.exit(1)
    }
}

start()
