import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import helmet from 'helmet'
import { redis } from './db'
import { GatewayService } from './services/gateway'
import { getProfile } from './utils/autoTune'

const profile = getProfile('railway-gateway')

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = `--max-old-space-size=${profile.heapLimitMB} --optimize-for-size`
}

const app = express()
app.use(helmet())

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/gateway' })

const PORT = process.env.WS_PORT || 4001

app.get('/health', async (_req, res) => {
    const redisStatus = redis.status === 'ready'
    const mem = process.memoryUsage()
    res.json({
        status: 'healthy',
        service: 'railway-gateway',
        connections: wss.clients.size,
        memory: {
            rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
        },
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
    const INTERVAL = 5 * 60 * 1000 // 5 minutes (more aggressive for Railway)

    const ping = async () => {
        try {
            const res = await fetch(url)
            console.log(`[keep-alive] Railway ping ${res.ok ? '✅' : '⚠️'} (${res.status})`)
        } catch (e: any) {
            console.warn(`[keep-alive] ping failed: ${e.message}`)
        }
    }
    setInterval(ping, INTERVAL)
    console.log(`[keep-alive] Self-pinging every 5 min → ${url}`)
}

/**
 * Nano-Engine Memory Pruner (Titan IV Edition)
 * Aggressively clears caches and triggers GC if RAM usage is too high.
 */
function startMemoryPruner() {
    const MEM_THRESHOLD = 0.85; // 85%
    const HEAP_LIMIT = 384 * 1024 * 1024; // from --max-old-space-size

    setInterval(() => {
        const mem = process.memoryUsage();
        const usageRatio = mem.heapUsed / HEAP_LIMIT;

        if (usageRatio > MEM_THRESHOLD) {
            console.warn(`[nano-engine] High memory detected (${Math.round(usageRatio * 100)}%). Pruning...`);

            // 1. Manually trigger Node.js Garbage Collection (enabled via --expose-gc)
            if (global.gc) {
                global.gc();
            }

            // 2. Clear internal Gateway/Socket caches if necessary
            if (gateway && (gateway as any).pruneCaches) {
                (gateway as any).pruneCaches();
            }
        }
    }, 30000); // Check every 30 seconds
}

const start = async () => {
    try {
        console.log('🚀 Starting Beacon WebSocket Gateway (Railway)...')
        // Non-blocking Redis ping
        redis.ping().then(() => {
            console.log('✅ ClawCloud Redis: Connected');
        }).catch(err => {
            console.warn('⚠️  Redis connection failed (Gateway continuing):', err.message);
        });

        server.listen(PORT, () => {
            console.log(`\n✨ Gateway running on ws://localhost:${PORT}/gateway`)
            if (process.env.NODE_ENV === 'production') {
                startKeepAlive(PORT)
                startMemoryPruner()
            }
        })
    } catch (err) {
        console.error('❌ Failed to start Gateway:', err)
        process.exit(1)
    }
}

start()
