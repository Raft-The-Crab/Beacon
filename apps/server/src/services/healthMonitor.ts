/**
 * Beacon Health Monitor — Pillar VIII: Global Scaling
 * Self-healing service that monitors system health and triggers auto-recovery.
 */

import os from 'os';
import { redis } from './redis';

// ── Types ────────────────────────────────────────────────────────────

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    memory: {
        rss: number;      // MB
        heapUsed: number;  // MB
        heapTotal: number; // MB
        external: number;  // MB
        percentage: number;
    };
    cpu: {
        loadAvg: number[];
        cores: number;
        percentage: number;
    };
    redis: {
        connected: boolean;
        latency: number;   // ms
    };
    services: {
        gateway: boolean;
        api: boolean;
        moderation: boolean;
        scheduler: boolean;
    };
    timestamp: number;
}

// ── Thresholds ───────────────────────────────────────────────────────

const THRESHOLDS = {
    MEMORY_WARNING: 70,    // % of heap
    MEMORY_CRITICAL: 90,
    CPU_WARNING: 70,       // % load
    CPU_CRITICAL: 90,
    REDIS_LATENCY_WARNING: 100, // ms
    REDIS_LATENCY_CRITICAL: 500,
    GC_INTERVAL: 5 * 60_000,    // 5 min forced GC check
    HEALTH_INTERVAL: 30_000,     // 30 sec health check
};

// ── Service ──────────────────────────────────────────────────────────

class HealthMonitor {
    private timer: NodeJS.Timeout | null = null;
    private gcTimer: NodeJS.Timeout | null = null;
    private history: HealthStatus[] = [];
    private readonly MAX_HISTORY = 60;
    private crashCount = 0;

    /**
     * Start the health monitoring loop.
     */
    start() {
        if (this.timer) return;
        console.log('[HealthMonitor] Started — checking every 30s');

        this.timer = setInterval(() => this.check(), THRESHOLDS.HEALTH_INTERVAL);
        this.gcTimer = setInterval(() => this.memoryGuard(), THRESHOLDS.GC_INTERVAL);

        // Initial check
        this.check();
    }

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        if (this.gcTimer) { clearInterval(this.gcTimer); this.gcTimer = null; }
    }

    /**
     * Run a full health check.
     */
    async check(): Promise<HealthStatus> {
        const mem = process.memoryUsage();
        const cpuLoad = os.loadavg();
        const cores = os.cpus().length;

        // Redis latency check
        let redisLatency = -1;
        let redisConnected = false;
        try {
            const start = Date.now();
            await redis.ping();
            redisLatency = Date.now() - start;
            redisConnected = true;
        } catch {
            redisConnected = false;
        }

        const memPercentage = Math.round((mem.heapUsed / mem.heapTotal) * 100);
        const cpuPercentage = Math.round((cpuLoad[0] / cores) * 100);

        let status: HealthStatus['status'] = 'healthy';
        if (memPercentage > THRESHOLDS.MEMORY_CRITICAL || cpuPercentage > THRESHOLDS.CPU_CRITICAL || !redisConnected) {
            status = 'critical';
        } else if (memPercentage > THRESHOLDS.MEMORY_WARNING || cpuPercentage > THRESHOLDS.CPU_WARNING || redisLatency > THRESHOLDS.REDIS_LATENCY_WARNING) {
            status = 'degraded';
        }

        const health: HealthStatus = {
            status,
            uptime: process.uptime(),
            memory: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
                external: Math.round(mem.external / 1024 / 1024),
                percentage: memPercentage,
            },
            cpu: {
                loadAvg: cpuLoad.map(l => Math.round(l * 100) / 100),
                cores,
                percentage: cpuPercentage,
            },
            redis: {
                connected: redisConnected,
                latency: redisLatency,
            },
            services: {
                gateway: true,     // Assume running since we're in process
                api: true,
                moderation: true,
                scheduler: true,
            },
            timestamp: Date.now(),
        };

        // Store in history
        this.history.push(health);
        if (this.history.length > this.MAX_HISTORY) this.history.shift();

        // Publish to Redis for dashboard consumption
        try {
            await redis.cache('health:latest', health, 120);
            await redis.publish('health:status', health);
        } catch { }

        // Log warnings
        if (status === 'critical') {
            console.error(`[HealthMonitor] ⛔ CRITICAL — Memory: ${memPercentage}%, CPU: ${cpuPercentage}%, Redis: ${redisConnected ? 'OK' : 'DOWN'}`);
            this.crashCount++;
        } else if (status === 'degraded') {
            console.warn(`[HealthMonitor] ⚠️ DEGRADED — Memory: ${memPercentage}%, CPU: ${cpuPercentage}%`);
        }

        return health;
    }

    /**
     * Memory guard — attempts GC when heap usage is too high.
     */
    private memoryGuard() {
        const mem = process.memoryUsage();
        const pct = (mem.heapUsed / mem.heapTotal) * 100;

        if (pct > THRESHOLDS.MEMORY_WARNING && global.gc) {
            console.warn(`[HealthMonitor] Memory at ${Math.round(pct)}% — triggering GC`);
            global.gc();
        }
    }

    /**
     * Get recent health history.
     */
    getHistory(): HealthStatus[] {
        return [...this.history];
    }

    /**
     * Get the latest health status.
     */
    getLatest(): HealthStatus | null {
        return this.history[this.history.length - 1] || null;
    }

    getCrashCount(): number {
        return this.crashCount;
    }
}

export const healthMonitor = new HealthMonitor();
