/**
 * Beacon Scheduled Messages Service — Pillar VII: Omni-Nexus
 * Allows users to schedule messages for future delivery with timezone support.
 */

import { prisma } from '../db';
import { CacheService } from './cache';

// ── Types ────────────────────────────────────────────────────────────

export interface ScheduledMessage {
    id: string;
    userId: string;
    channelId: string;
    guildId: string;
    content: string;
    attachments?: string[];
    scheduledAt: Date;
    timezone: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    createdAt: Date;
}

// ── Service ──────────────────────────────────────────────────────────

class ScheduledMessageService {
    private timer: NodeJS.Timeout | null = null;

    /**
     * Start the scheduler loop — checks every 30 seconds for pending messages.
     */
    start() {
        if (this.timer) return;
        console.log('[ScheduledMessages] Scheduler started');
        this.timer = setInterval(() => this.processPending(), 30_000);
        // Also run immediately
        this.processPending();
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Schedule a new message.
     */
    async schedule(
        userId: string,
        channelId: string,
        guildId: string,
        content: string,
        scheduledAt: Date,
        timezone: string = 'UTC',
        attachments?: string[]
    ): Promise<ScheduledMessage> {
        const id = `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const msg: ScheduledMessage = {
            id,
            userId,
            channelId,
            guildId,
            content,
            attachments,
            scheduledAt,
            timezone,
            status: 'pending',
            createdAt: new Date(),
        };

        // Store in cache (in production, use a proper table)
        const userKey = `scheduled_msgs:${userId}`;
        const existing = ((await CacheService.get(userKey)) as ScheduledMessage[]) || [];
        existing.push(msg);
        await CacheService.set(userKey, existing, 86400 * 30); // 30 day TTL

        // Also store in a global pending queue
        const pendingKey = 'scheduled_msgs:pending';
        const pending = ((await CacheService.get(pendingKey)) as ScheduledMessage[]) || [];
        pending.push(msg);
        await CacheService.set(pendingKey, pending, 86400 * 30);

        return msg;
    }

    /**
     * Cancel a scheduled message.
     */
    async cancel(userId: string, messageId: string): Promise<boolean> {
        const userKey = `scheduled_msgs:${userId}`;
        const existing = ((await CacheService.get(userKey)) as ScheduledMessage[]) || [];
        const updated = existing.map(m =>
            m.id === messageId ? { ...m, status: 'cancelled' as const } : m
        );
        await CacheService.set(userKey, updated, 86400 * 30);

        // Also update pending queue
        const pendingKey = 'scheduled_msgs:pending';
        const pending = ((await CacheService.get(pendingKey)) as ScheduledMessage[]) || [];
        const updatedPending = pending.filter(m => m.id !== messageId);
        await CacheService.set(pendingKey, updatedPending, 86400 * 30);

        return true;
    }

    /**
     * Get all scheduled messages for a user.
     */
    async getUserScheduled(userId: string): Promise<ScheduledMessage[]> {
        const userKey = `scheduled_msgs:${userId}`;
        return ((await CacheService.get(userKey)) as ScheduledMessage[]) || [];
    }

    /**
     * Process pending messages — called by the scheduler loop.
     */
    private async processPending() {
        try {
            const pendingKey = 'scheduled_msgs:pending';
            const pending = ((await CacheService.get(pendingKey)) as ScheduledMessage[]) || [];
            if (pending.length === 0) return;

            const now = new Date();
            const toSend: ScheduledMessage[] = [];
            const remaining: ScheduledMessage[] = [];

            for (const msg of pending) {
                const scheduledTime = new Date(msg.scheduledAt);
                if (scheduledTime <= now && msg.status === 'pending') {
                    toSend.push(msg);
                } else if (msg.status === 'pending') {
                    remaining.push(msg);
                }
            }

            if (toSend.length === 0) return;

            // Send each pending message
            for (const msg of toSend) {
                try {
                    await prisma.message.create({
                        data: {
                            content: msg.content,
                            channelId: msg.channelId,
                            authorId: msg.userId,
                        },
                    });

                    // Update user's list
                    const userKey = `scheduled_msgs:${msg.userId}`;
                    const userMsgs = ((await CacheService.get(userKey)) as ScheduledMessage[]) || [];
                    const updatedUserMsgs = userMsgs.map(m =>
                        m.id === msg.id ? { ...m, status: 'sent' as const } : m
                    );
                    await CacheService.set(userKey, updatedUserMsgs, 86400 * 30);

                    console.log(`[ScheduledMessages] Sent message ${msg.id} to channel ${msg.channelId}`);
                } catch (err) {
                    console.error(`[ScheduledMessages] Failed to send ${msg.id}:`, err);
                    remaining.push({ ...msg, status: 'failed' });
                }
            }

            await CacheService.set(pendingKey, remaining, 86400 * 30);
        } catch (err) {
            console.error('[ScheduledMessages] Processing error:', err);
        }
    }
}

export const scheduledMessageService = new ScheduledMessageService();
