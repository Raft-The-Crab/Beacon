import { Request, Response } from 'express';
import { prisma, redis } from '../db';
import { priorityQueue } from '../services/priorityQueue';
import { getProfile } from '../utils/autoTune';
import { resolveServerSdkConfig } from '../lib/beaconSdk';

let lastPostgresHealthErrorLogAt = 0;

/**
 * Health check handler moved from api-server.ts
 */
export async function getHealth(_req: Request, res: Response) {
    const serviceProfile =
        process.env.AUTO_TUNE_PROFILE
        || (process.env.RAILWAY_ENVIRONMENT_NAME ? 'railway-api' : 'clawcloud-api');
    const profile = getProfile(serviceProfile);
    const sdkConfig = resolveServerSdkConfig();

    try {
        const mem = process.memoryUsage();
        const postgresStart = Date.now();
        const postgresConnected = !!prisma;
        let postgresLatency = -1;
        let postgresHealthy = postgresConnected;

        try {
            if (prisma) {
                await prisma.$queryRaw`SELECT 1`;
                postgresLatency = Date.now() - postgresStart;
            }
        } catch (e) {
            postgresHealthy = false;
            const now = Date.now();
            if (now - lastPostgresHealthErrorLogAt > 60_000) {
                console.warn('Postgres health check failed:', e);
                lastPostgresHealthErrorLogAt = now;
            }
        }

        const redisStatus = redis.status === 'ready';

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
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
