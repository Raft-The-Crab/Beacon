/**
 * Message Purge Service
 * Handles the permanent deletion of soft-deleted messages after the 5-day retention period.
 */
import { prisma } from '../db';
import { logger } from './logger';

class MessagePurgeService {
    private timer: NodeJS.Timeout | null = null;
    private readonly RETENTION_DAYS = 5;

    /**
     * Start the background purge worker.
     * Runs every 12 hours by default.
     */
    start() {
        if (this.timer) return;
        logger.info(`[MessagePurge] Background worker started (${this.RETENTION_DAYS}-day retention)`);
        
        // Run every 12 hours
        this.timer = setInterval(() => this.purgeExpired(), 12 * 60 * 60 * 1000);
        
        // Initial run with slight delay to ensure DB is ready
        setTimeout(() => this.purgeExpired(), 10000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Permanently deletes messages that have been soft-deleted for longer than RETENTION_DAYS.
     * Cascading deletes in Prisma schema handle associated reactions and attachments.
     */
    async purgeExpired() {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);

            const result = await prisma.message.deleteMany({
                where: {
                    deletedAt: {
                        lt: cutoff,
                        not: null
                    }
                } as any
            });

            if (result.count > 0) {
                logger.success(`[MessagePurge] Successfully purged ${result.count} expired messages.`);
            }
        } catch (err) {
            logger.error('[MessagePurge] Failed to purge expired messages:', err);
        }
    }
}

export const messagePurgeService = new MessagePurgeService();
