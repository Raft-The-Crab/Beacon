/**
 * Beacon Priority Queue — 2-Lane Processing
 *
 * FAST LANE (chat moderation):
 *   - Text only, < 2s target latency
 *   - Runs synchronously before message is saved
 *   - Never blocks on media jobs
 *
 * SLOW LANE (media processing):
 *   - Images, videos, file uploads
 *   - Queued, processed one at a time in background
 *   - Yields CPU to fast lane between jobs
 *   - Results published via Redis when done
 */

import { redis } from '../db'
import { getProfile } from '../utils/autoTune'

export type JobPriority = 'fast' | 'slow'
export type JobType = 'text_moderation' | 'image_moderation' | 'video_moderation' | 'media_upload'

export interface QueueJob<T = any> {
    id: string
    type: JobType
    priority: JobPriority
    data: T
    createdAt: number
    attempts: number
    maxAttempts: number
}

interface QueueStats {
    fastPending: number
    slowPending: number
    slowProcessing: boolean
    totalProcessed: number
    totalFailed: number
}

type JobHandler<T = any> = (job: QueueJob<T>) => Promise<any>

class PriorityQueueService {
    private fastQueue: QueueJob[] = []
    private slowQueue: QueueJob[] = []
    private handlers = new Map<JobType, JobHandler>()
    private slowProcessing = false
    private stats = { totalProcessed: 0, totalFailed: 0 }
    private slowConcurrency: number

    constructor() {
        const profile = getProfile()
        this.slowConcurrency = 1 // Always 1 for media — sequential to save RAM
    }

    /** Register a handler for a job type */
    register(type: JobType, handler: JobHandler) {
        this.handlers.set(type, handler)
    }

    /**
     * FAST LANE — runs immediately, returns result inline.
     * Used for chat moderation: must complete before the message is saved.
     */
    async runFast<T = any, R = any>(type: JobType, data: T): Promise<R> {
        const job: QueueJob<T> = {
            id: `fast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            priority: 'fast',
            data,
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 1,
        }

        const handler = this.handlers.get(type)
        if (!handler) throw new Error(`No handler for job type: ${type}`)

        job.attempts++
        try {
            const result = await handler(job)
            this.stats.totalProcessed++
            return result as R
        } catch (err) {
            this.stats.totalFailed++
            throw err
        }
    }

    /**
     * SLOW LANE — queues the job and returns immediately.
     * Used for media processing: runs in background, publishes result to Redis.
     */
    enqueue<T = any>(type: JobType, data: T, onComplete?: string): string {
        const MAX_QUEUE_SIZE = 500
        if (this.slowQueue.length >= MAX_QUEUE_SIZE) {
            console.warn(`[Queue] Overloaded! Dropping ${type} job to prevent OOM.`)
            throw new Error('Moderation queue overloaded (backpressure)')
        }
        
        const job: QueueJob<T> = {
            id: `slow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            priority: 'slow',
            data,
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 3,
        }

        this.slowQueue.push(job)
        console.log(`[Queue] Enqueued ${type} (${this.slowQueue.length} pending)`)

        // Kick off processing if idle
        if (!this.slowProcessing) {
            this.processSlowQueue()
        }

        return job.id
    }

    /** Background processing loop for slow lane */
    private async processSlowQueue() {
        if (this.slowProcessing || this.slowQueue.length === 0) return
        this.slowProcessing = true

        while (this.slowQueue.length > 0) {
            const job = this.slowQueue.shift()!
            const handler = this.handlers.get(job.type)

            if (!handler) {
                console.warn(`[Queue] No handler for ${job.type}, skipping`)
                continue
            }

            // Check memory before processing
            const rssMB = process.memoryUsage().rss / 1024 / 1024
            const profile = getProfile()
            if (rssMB > profile.rssBackpressureMB) {
                console.warn(`[Queue] RSS ${Math.round(rssMB)} MB too high, deferring ${job.type}`)
                this.slowQueue.unshift(job) // put it back
                // Wait 30 seconds for memory to settle
                await new Promise(r => setTimeout(r, 30000))
                continue
            }

            job.attempts++
            try {
                const result = await handler(job)
                this.stats.totalProcessed++

                // Publish result to Redis for other services
                try {
                    await redis.publish('beacon:media:complete', JSON.stringify({
                        jobId: job.id,
                        type: job.type,
                        result,
                        timestamp: Date.now()
                    }))
                } catch { /* Redis publish failure is non-fatal */ }

                console.log(`[Queue] ✅ ${job.type} completed (${this.slowQueue.length} remaining)`)
            } catch (err) {
                this.stats.totalFailed++
                console.error(`[Queue] ❌ ${job.type} failed (attempt ${job.attempts}/${job.maxAttempts}):`, err)

                // Retry if under max attempts
                if (job.attempts < job.maxAttempts) {
                    this.slowQueue.push(job)
                }
            }

            // YIELD — let the event loop breathe between slow jobs
            // This ensures fast-lane chat moderation isn't blocked
            await new Promise(r => setImmediate(r))
        }

        this.slowProcessing = false
    }

    /** Get queue stats for /health endpoint */
    getStats(): QueueStats {
        return {
            fastPending: this.fastQueue.length,
            slowPending: this.slowQueue.length,
            slowProcessing: this.slowProcessing,
            ...this.stats
        }
    }
}

// Singleton
export const priorityQueue = new PriorityQueueService()
