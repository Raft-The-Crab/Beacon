import './env';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

http.globalAgent.maxSockets = 500;

// Internal Imports
import { WebSocketServer } from 'ws';
import { connectMongo, prisma, redis } from './db';
import { moderationService } from './services/moderation';
import { GatewayService } from './services/gateway';
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

export class BeaconServer {
    public app: Express;
    public server: http.Server;
    private port: number;
    private wss: WebSocketServer | null = null;
    private gateway: GatewayService | null = null;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = Number(process.env.PORT || 8080);
        this._bootStart = Date.now();
        this.configureMiddleware();
        this.mountRoutes();
        this.registerShutdownHooks();
    }

    private _bootStart: number;

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
        const cfPagesRegex = /^https:\/\/[a-z0-9-.]+\.pages\.dev$/i;
        const railwayRegex = /\.railway\.app$/i;
        const beaconDomainRegex = /^https:\/\/(?:www\.)?(?:[a-z0-9-]+\.)*qzz\.io\/?$/i;

         this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                
                const isAllowed = 
                    origin === 'http://localhost:5173' ||
                    origin === 'http://127.0.0.1:5173' ||
                    origin === 'https://beacon.qzz.io' ||
                    origin === frontendUrl ||
                    customOrigins.includes(origin) ||
                    devTunnelRegex.test(origin) ||
                    origin.toLowerCase().endsWith('.pages.dev') ||
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

        // v3: Add Vary: Origin and X-Beacon-Version for client version detection
        this.app.use((_req: any, res: express.Response, next: express.NextFunction) => {
            res.setHeader('Vary', 'Origin');
            res.setHeader('X-Beacon-Version', '3.0.3');
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
            crossOriginOpenerPolicy: { policy: "unsafe-none" },
            crossOriginResourcePolicy: { policy: "cross-origin" },
            hsts: process.env.NODE_ENV === 'production' ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            } : false,
            xContentTypeOptions: true,
            xFrameOptions: { action: 'deny' },
            permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        }));

        // v3: Permissions-Policy — restrict sensitive browser APIs
        this.app.use((_req: any, res: express.Response, next: express.NextFunction) => {
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
            next();
        });

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
                    logger.warn(`⚠️ Port ${this.port} already in use, trying ${this.port + 1}...`);
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
                const bootMs = Date.now() - this._bootStart;
                
                logger.info(`================================================`);
                logger.info(`🚀 Beacon Unified V3 Server Online`);
                logger.info(`📡 Mode: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`🔗 API: http://0.0.0.0:${this.port}`);
                logger.info(`🔌 WebSocket: ws://0.0.0.0:${this.port}/gateway`);
                logger.info(`⏱️ Boot time: ${bootMs}ms`);
                logger.info(`================================================`);

                // Initialize WebSocket Gateway on the existing server
                this.wss = new WebSocketServer({ server: this.server, path: '/gateway' });
                this.gateway = new GatewayService(this.wss);
                logger.success('✅ WebSocket Gateway: Ready');

                // Initialize databases in background POST-binding
                this.initializeDatabases();
                this.startWatchdogs();

                if (parseEnvBool(process.env.ENABLE_MODERATION, true)) {
                    moderationService.init();
                    moderationService.initQueue();
                    logger.info('✅ Moderation Engine V2: Ready');
                }

                if (parseEnvBool(process.env.ENABLE_BOT_SYSTEM, true)) {
                    // Check if bots/index.ts exists before importing to avoid build crashes
                    const botPath = path.join(__dirname, 'bots', 'index.js');
                    if (fs.existsSync(botPath) || fs.existsSync(path.join(__dirname, 'bots', 'index.ts'))) {
                        import('./bots/index.js').then(async ({ initBotSystem }) => {
                            await initBotSystem();
                            logger.info('✅ Bot Subsystem V2: Ready');
                        }).catch(err => logger.error(`❌ Failed to initialize Bot System: ${err}`));
                    }
                }

                resolve();
            });

            this.server.listen(this.port, '0.0.0.0');
        });
    }
}

// Ensure compatibility with existing modules trying to import app/server
const instance = new BeaconServer();
export const app = instance.app;
export const server = instance.server;

instance.listen();
