import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

// Environment Initialization
const nodeEnv = process.env.NODE_ENV || 'development';
const inferredServerRoot = process.cwd().endsWith(path.join('apps', 'server'))
    ? process.cwd()
    : path.resolve(process.cwd(), 'apps', 'server');

const baseEnvPath = path.join(inferredServerRoot, '.env');
if (fs.existsSync(baseEnvPath)) dotenv.config({ path: baseEnvPath });

const envModePath = path.join(inferredServerRoot, `.env.${nodeEnv}`);
if (fs.existsSync(envModePath)) dotenv.config({ path: envModePath, override: false });

http.globalAgent.maxSockets = 500;

// Internal Imports
import { connectMongo, prisma, redis } from './db';
import { moderationService } from './services/moderation';
import { getProfile } from './utils/autoTune';
import { sanitizeBody } from './utils/sanitize';
import { ipBlockMiddleware, generalLimiter, sanitizeHeaders, csrfProtection } from './middleware/security';
import { responseWrapper } from './middleware/responseWrapper';
import { globalErrorHandler, notFoundHandler } from './middleware/error';
import { requestTimer } from './middleware/performance';
import apiRouter from './api/index';
import { requestId } from './middleware/requestId';
import { getHealth } from './api/health';
import { gracefulShutdown } from './services/gracefulShutdown';
import { SystemAuditService, AuditAction } from './services/systemAudit';
import { logger } from './services/logger';
import './config/firebase';

const profile = getProfile(
    process.env.AUTO_TUNE_PROFILE || (process.env.RAILWAY_ENVIRONMENT_NAME ? 'railway-api' : 'clawcloud-api')
);

if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = `--max-old-space-size=${profile.heapLimitMB} --optimize-for-size`;
}

/**
 * Parses essentially boolean string configs.
 */
function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
    if (value == null) return defaultValue;
    const normalized = String(value).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
}

export class BeaconServerV2 {
    public app: Express;
    public server: http.Server;
    private port: number;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = Number(process.env.PORT || 8080);
        this.configureMiddleware();
        this.mountRoutes();
        this.registerShutdownHooks();
    }

    private configureMiddleware() {
        this.app.use(requestId);
        
        // CORS Configuration
        const customOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.replace(/^["']/g, '').replace(/["']$/g, '').split(',')
                .map(origin => origin.trim().replace(/^["']/g, '').replace(/["']$/g, '')).filter(Boolean)
            : [];

        const frontendUrl = process.env.FRONTEND_URL 
            ? process.env.FRONTEND_URL.replace(/\/$/, '') 
            : null;

        const devTunnelRegex = /^https:\/\/[a-z0-9-]+\.[a-z0-9-]*devtunnels\.ms\/?$/i;
        const cfPagesRegex = /^https:\/\/[a-z0-9-.]+\.pages\.dev\/?$/i;
        const railwayRegex = /\.railway\.app$/i;
        const beaconDomainRegex = /^https:\/\/(?:www\.)?(?:[a-z0-9-]+\.)*qzz\.io\/?$/i;

         this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                
                const isAllowed = 
                    origin === 'http://localhost:5173' ||
                    origin === 'http://127.0.0.1:5173' ||
                    origin === frontendUrl ||
                    customOrigins.includes(origin) ||
                    devTunnelRegex.test(origin) ||
                    cfPagesRegex.test(origin) ||
                    railwayRegex.test(origin) ||
                    beaconDomainRegex.test(origin);

                if (isAllowed) {
                    callback(null, true);
                } else {
                    logger.warn(`[CORS] ❌ Blocked: ${origin}`);
                    // Log persistent CORS failures to audit log for monitoring
                    SystemAuditService.log({
                        action: AuditAction.CORS_BLOCKED,
                        reason: `CORS Blocked origin: ${origin}`,
                        severity: 'medium',
                        metadata: { origin }
                    } as any).catch(() => {});
                    callback(null, false);
                }
            },
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-request-id', 'accept', 'x-client-version', 'x-requested-with'],
            exposedHeaders: ['x-request-id'],
            maxAge: 86400, // Cache preflight for 24 hours
        }));

        // Add Vary: Origin for correct CDN/proxy caching of CORS responses
        this.app.use((_req: any, res: express.Response, next: express.NextFunction) => {
            res.setHeader('Vary', 'Origin');
            next();
        });

         this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.qzz.io'],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://*.qzz.io'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                    imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://*.qzz.io', 'https://*.railway.app'],
                    mediaSrc: ["'self'", 'blob:', 'https:', 'https://*.qzz.io', 'https://*.railway.app'],
                    connectSrc: ["'self'", 'wss:', 'https:', 'http://localhost:*', 'ws://localhost:*', 'https://*.qzz.io', 'https://*.railway.app'],
                    frameSrc: ["'self'", 'https://*.qzz.io'],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
            crossOriginResourcePolicy: { policy: "cross-origin" },
            hsts: process.env.NODE_ENV === 'production' ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            } : false,
            xContentTypeOptions: true,
            xFrameOptions: { action: 'deny' },
        }));

        this.app.use(compression({ level: 6, threshold: 10 * 1024 }));
        this.app.use(requestTimer);
        this.app.use(sanitizeHeaders);
        this.app.use(sanitizeBody);
        this.app.use(ipBlockMiddleware);
        this.app.use('/api/', generalLimiter);
        this.app.use(responseWrapper);

        // Parse cookies BEFORE body parsers for CSRF validation
        this.app.use(cookieParser());
        this.app.use(express.json({ limit: profile.jsonLimitMB }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(csrfProtection);
        this.app.set('trust proxy', 1);

        this.app.use((req: any, _res: express.Response, next: express.NextFunction) => {
            logger.info(`${req.method} ${req.path}`, req.id);
            next();
        });

        this.app.get('/api/ping', (_req, res) => {
            res.send('pong');
        });
    }

    private mountRoutes() {
        this.app.get('/health', getHealth);
        this.app.get('/api/health', getHealth); // Alias
        this.app.get('/api/ping', (_req, res) => res.json({ status: 'ok', message: 'pong', timestamp: new Date().toISOString() }));
        this.app.use('/api', apiRouter);
        this.app.use(notFoundHandler);
        this.app.use(globalErrorHandler);
    }

    private registerShutdownHooks() {
        gracefulShutdown.init();
        gracefulShutdown.registerServer(this.server);
        if (prisma) {
            gracefulShutdown.register('Prisma', async () => {
                await prisma.$disconnect();
            }, 80);
        }
    }

    private async initializeDatabases() {
        logger.info('[Startup] Non-blocking Database Initialization Initiated...');
        try { await connectMongo(); } catch (e) { logger.warn('⚠️ MongoDB connection failed', e); }
        
        if (prisma) {
            prisma.$connect().then(() => {
                logger.info(`✅ PostgreSQL: Connected successfully`);
            }).catch(error => {
                logger.error(`❌ PostgreSQL connection failed unrecoverably: ${error}`);
            });
        }
        
        if (redis.isEnabled) {
            redis.connect().catch((err: any) => logger.warn(`⚠️ Redis connection failed: ${err.message}`));
        }
    }

    private startWatchdogs() {
        const publicUrl = process.env.RAILWAY_PUBLIC_URL || process.env.CLAWCLOUD_PUBLIC_URL;
        const url = publicUrl ? `${publicUrl}/health` : `http://localhost:${this.port}/health`;
        
        setInterval(async () => {
            try {
                const res = await fetch(url);
                logger.info(`[keep-alive] Service ping ${res.ok ? '✅' : '⚠️'} (${res.status})`);
            } catch (e: any) {
                logger.warn(`[keep-alive] ping failed: ${e.message}`);
            }
        }, 5 * 60 * 1000);

        setInterval(() => {
            if (global.gc) global.gc();
            const mem = process.memoryUsage();
            const rssMB = Math.round(mem.rss / 1024 / 1024);
            if (rssMB > profile.gcTriggerMB) {
                logger.warn(`[memory] ⚠️ RSS above ${profile.gcTriggerMB} MB, forcing GC`);
                if (global.gc) global.gc();
            }
        }, 10 * 60 * 1000);
    }

    public async listen(): Promise<void> {
        return new Promise((resolve) => {
            const onError = (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    logger.warn(`⚠️ Port ${this.port} is mapped, trying ${this.port + 1}...`);
                    this.port++;
                    this.server.listen(this.port, '0.0.0.0');
                } else {
                    logger.error(`❌ Server binding failed: ${err}`);
                    process.exit(1);
                }
            };

            this.server.once('error', onError);
            this.server.once('listening', () => {
                this.server.removeListener('error', onError);
                logger.info(`🚀 Beacon V2.0.0 API Server Online. Listening on 0.0.0.0:${this.port}`);
                
                // Initialize db in background logic strictly POST-binding
                this.initializeDatabases();
                this.startWatchdogs();

                if (parseEnvBool(process.env.ENABLE_MODERATION, true)) {
                    moderationService.init();
                    moderationService.initQueue();
                    logger.info('✅ Moderation Engine V2: Ready');
                }

                if (parseEnvBool(process.env.ENABLE_BOT_SYSTEM, true)) {
                    import('./bots/index.js').then(async ({ initBotSystem }) => {
                        await initBotSystem();
                        logger.info('✅ Bot Subsystem V2: Ready');
                    }).catch(err => logger.error(`❌ Failed to initialize Bot System: ${err}`));
                }

                resolve();
            });

            this.server.listen(this.port, '0.0.0.0');
        });
    }
}

// Ensure compatibility with existing modules trying to import app/server
const instance = new BeaconServerV2();
export const app = instance.app;
export const server = instance.server;

instance.listen();
