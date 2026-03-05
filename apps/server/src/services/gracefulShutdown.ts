/**
 * Beacon Graceful Shutdown — Pillar VIII: Global Scaling
 * Implements connection draining, service teardown, and zero-downtime shutdown.
 */

import { redis } from './redis';
import { healthMonitor } from './healthMonitor';
import { scheduledMessageService } from './scheduledMessages';

type ShutdownHook = () => Promise<void>;

class GracefulShutdownService {
    private hooks: { name: string; fn: ShutdownHook; priority: number }[] = [];
    private isShuttingDown = false;
    private drainTimeoutMs = 10_000; // 10 second drain window

    /**
     * Register a shutdown hook with priority (lower = runs first).
     */
    register(name: string, fn: ShutdownHook, priority: number = 10) {
        this.hooks.push({ name, fn, priority });
        this.hooks.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Initialize signal handlers for SIGTERM, SIGINT, and uncaught exceptions.
     */
    init() {
        const shutdown = (signal: string) => {
            console.log(`\n[Shutdown] Received ${signal} — initiating graceful shutdown...`);
            this.execute(signal);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (err) => {
            console.error('[Shutdown] Uncaught exception:', err);
            this.execute('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason) => {
            console.error('[Shutdown] Unhandled rejection:', reason);
            // Don't shutdown for unhandled rejections, just log
        });

        // Register default hooks
        this.register('Health Monitor', async () => {
            healthMonitor.stop();
        }, 1);

        this.register('Scheduled Messages', async () => {
            scheduledMessageService.stop();
        }, 2);

        this.register('Redis', async () => {
            try {
                await redis.publish('cluster:shutdown', { timestamp: Date.now() });
                await redis.disconnect();
            } catch { }
        }, 90);

        console.log('[Shutdown] Graceful shutdown handlers registered');
    }

    /**
     * Execute the shutdown sequence.
     */
    private async execute(reason: string) {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log(`[Shutdown] Starting drain period (${this.drainTimeoutMs}ms)...`);
        console.log(`[Shutdown] ${this.hooks.length} hooks to execute.`);

        // Phase 1: Stop accepting new connections (handled by caller)
        try {
            await redis.publish('cluster:draining', {
                reason,
                timestamp: Date.now(),
                drainMs: this.drainTimeoutMs,
            });
        } catch { }

        // Phase 2: Wait for drain timeout
        await new Promise(resolve => setTimeout(resolve, this.drainTimeoutMs));

        // Phase 3: Execute hooks in priority order
        for (const hook of this.hooks) {
            try {
                console.log(`[Shutdown] Running hook: ${hook.name} (priority ${hook.priority})`);
                await Promise.race([
                    hook.fn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
                ]);
                console.log(`[Shutdown] ✅ ${hook.name} completed`);
            } catch (err) {
                console.error(`[Shutdown] ❌ ${hook.name} failed:`, err);
            }
        }

        console.log(`[Shutdown] All hooks executed. Exiting.`);
        process.exit(0);
    }

    /**
     * Register an HTTP server for drain (stops accepting new connections).
     */
    registerServer(server: any) {
        this.register('HTTP Server', async () => {
            return new Promise<void>((resolve) => {
                server.close(() => {
                    console.log('[Shutdown] HTTP server closed');
                    resolve();
                });
                // Force close after 5 seconds
                setTimeout(() => resolve(), 5000);
            });
        }, 50);
    }

    /**
     * Register a WebSocket server for drain.
     */
    registerWebSocket(wss: any) {
        this.register('WebSocket Server', async () => {
            // Notify all connected clients
            for (const client of wss.clients) {
                try {
                    client.send(JSON.stringify({ type: 'SERVER_SHUTDOWN', data: { message: 'Server is restarting. You will be reconnected shortly.' } }));
                    client.close(1001, 'Server shutdown');
                } catch { }
            }
        }, 40);
    }
}

export const gracefulShutdown = new GracefulShutdownService();
