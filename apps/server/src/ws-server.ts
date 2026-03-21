import './env'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import helmet from 'helmet'
import { connectMongo, redis } from './db'
import { GatewayService } from './services/gateway'
import { getProfile } from './utils/autoTune'
import { logger } from './services/logger'

const profile = getProfile('railway-gateway')

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = `--max-old-space-size=${profile.heapLimitMB} --optimize-for-size`
}

const app = express()
app.use(helmet())

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/gateway' })

const BASE_WS_PORT = Number(process.env.WS_PORT || 4001)
if (process.env.WS_PORT) {
    logger.debug(`Custom WS_PORT provided: ${process.env.WS_PORT}`);
} else {
    logger.debug(`No WS_PORT env found, defaulting to: 4001`);
}

async function listenWithPortFallback(basePort: number): Promise<number> {
    const maxLocalAttempts = 8
    const isProd = process.env.NODE_ENV === 'production'
    const firstPort = Number.isFinite(basePort) && basePort > 0 ? basePort : 4001

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
        // Explicitly bind to 0.0.0.0 for container networking reliability
        server.listen(port, '0.0.0.0')
    })

    for (let i = 0; i < maxLocalAttempts; i++) {
        const port = firstPort + i
        try {
            return await tryListen(port)
        } catch (err: any) {
            if (err?.code === 'EADDRINUSE' && !isProd) {
                logger.warn(`Gateway port ${port} already in use, trying ${port + 1}...`)
                continue
            }
            throw err
        }
    }

    throw new Error(`No open gateway port found starting at ${firstPort}`)
}

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
            logger.debug(`Railway ping ${res.ok ? '✅' : '⚠️'} (${res.status})`)
        } catch (e: any) {
            logger.debug(`keep-alive ping failed: ${e.message}`)
        }
    }
    setInterval(ping, INTERVAL)
    logger.info(`Keep-alive active (Self-pinging every 5 min)`)
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
            logger.warn(`High memory detected (${Math.round(usageRatio * 100)}%). Pruning...`);

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
        
        // Initialize databases in background - DON'T BLOCK SERVER STARTUP
        const dbInit = async () => {
            try {
                await connectMongo()
                logger.success('Gateway MongoDB: Connected')
            } catch (error: any) {
                logger.warn('Gateway MongoDB unavailable (continuing degraded): ' + (error?.message || error))
            }
            
            if (redis.isEnabled) {
                redis.connect()
                    .then(() => redis.ping())
                    .then((pong) => {
                        if (pong === 'PONG') {
                            logger.success('Gateway Redis: Connected')
                        } else {
                            logger.warn('Gateway Redis ping unavailable')
                        }
                    })
                    .catch(err => {
                        logger.warn('Gateway Redis connection failed: ' + err.message)
                    })
            }
        }

        const activePort = await listenWithPortFallback(BASE_WS_PORT)
        
        // Start background DB init after listening
        dbInit();

        logger.info(`Gateway running on ws://0.0.0.0:${activePort}/gateway`)
        if (process.env.NODE_ENV === 'production') {
            startKeepAlive(activePort)
            startMemoryPruner()
        }
    } catch (err: any) {
        logger.error('Failed to start Gateway: ' + err.message)
        process.exit(1)
    }
}

start()
