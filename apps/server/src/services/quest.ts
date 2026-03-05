/**
 * Beacon Quest Service — Pillar V: Beacoin Economy
 * Backend engine for daily/weekly/server-level quests with automated reward distribution.
 */

import { prisma } from '../db';
import { CacheService } from './cache';

// ── Types ────────────────────────────────────────────────────────────

export interface Quest {
    id: string;
    type: 'daily' | 'weekly' | 'server' | 'achievement';
    title: string;
    description: string;
    icon: string;
    reward: number;
    xpReward: number;
    requirement: QuestRequirement;
    expiresAt?: Date;
    guildId?: string;
    createdBy?: string;
}

export interface QuestRequirement {
    action: 'send_messages' | 'react' | 'join_voice' | 'invite_users' | 'boost_server' | 'login_streak' | 'custom';
    count: number;
    metadata?: Record<string, any>;
}

export interface UserQuestProgress {
    questId: string;
    userId: string;
    progress: number;
    completed: boolean;
    claimedAt?: Date;
}

// ── Templates ────────────────────────────────────────────────────────

const DAILY_QUEST_TEMPLATES: Omit<Quest, 'id' | 'expiresAt'>[] = [
    {
        type: 'daily', title: 'Chatty Beacon', description: 'Send 20 messages in any server.',
        icon: '💬', reward: 50, xpReward: 25, requirement: { action: 'send_messages', count: 20 }
    },
    {
        type: 'daily', title: 'React Master', description: 'Add 10 reactions to messages.',
        icon: '⭐', reward: 30, xpReward: 15, requirement: { action: 'react', count: 10 }
    },
    {
        type: 'daily', title: 'Voice Voyager', description: 'Spend 15 minutes in a voice channel.',
        icon: '🎙️', reward: 75, xpReward: 40, requirement: { action: 'join_voice', count: 15 }
    },
    {
        type: 'daily', title: 'Social Butterfly', description: 'Send messages in 3 different servers.',
        icon: '🦋', reward: 60, xpReward: 30, requirement: { action: 'send_messages', count: 3, metadata: { uniqueGuilds: true } }
    },
];

const WEEKLY_QUEST_TEMPLATES: Omit<Quest, 'id' | 'expiresAt'>[] = [
    {
        type: 'weekly', title: 'Community Builder', description: 'Invite 3 users to any server.',
        icon: '🏗️', reward: 200, xpReward: 100, requirement: { action: 'invite_users', count: 3 }
    },
    {
        type: 'weekly', title: 'Streak Champion', description: 'Maintain a 7-day login streak.',
        icon: '🔥', reward: 300, xpReward: 150, requirement: { action: 'login_streak', count: 7 }
    },
    {
        type: 'weekly', title: 'Message Marathon', description: 'Send 200 messages across all servers.',
        icon: '🏃', reward: 250, xpReward: 120, requirement: { action: 'send_messages', count: 200 }
    },
];

// ── Service ──────────────────────────────────────────────────────────

class QuestService {
    async generateDailyQuests(userId: string): Promise<Quest[]> {
        const cacheKey = `quests:daily:${userId}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached as Quest[];

        const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 3);
        const now = new Date();
        const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

        const quests: Quest[] = selected.map((t, i) => ({
            ...t, id: `dq_${userId}_${now.toISOString().slice(0, 10)}_${i}`, expiresAt: endOfDay,
        }));

        await CacheService.set(cacheKey, quests, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
        return quests;
    }

    async generateWeeklyQuests(userId: string): Promise<Quest[]> {
        const cacheKey = `quests:weekly:${userId}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached as Quest[];

        const shuffled = [...WEEKLY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2);
        const now = new Date();
        const endOfWeek = new Date(now); endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay())); endOfWeek.setHours(23, 59, 59, 999);

        const quests: Quest[] = selected.map((t, i) => ({
            ...t, id: `wq_${userId}_${now.toISOString().slice(0, 10)}_${i}`, expiresAt: endOfWeek,
        }));

        await CacheService.set(cacheKey, quests, Math.floor((endOfWeek.getTime() - now.getTime()) / 1000));
        return quests;
    }

    async getActiveQuests(userId: string): Promise<{ daily: Quest[]; weekly: Quest[] }> {
        const [daily, weekly] = await Promise.all([this.generateDailyQuests(userId), this.generateWeeklyQuests(userId)]);
        return { daily, weekly };
    }

    async trackProgress(userId: string, action: QuestRequirement['action'], increment: number = 1): Promise<UserQuestProgress[]> {
        const { daily, weekly } = await this.getActiveQuests(userId);
        const allQuests = [...daily, ...weekly];
        const updated: UserQuestProgress[] = [];

        for (const quest of allQuests) {
            if (quest.requirement.action !== action) continue;
            const progressKey = `quest_progress:${userId}:${quest.id}`;
            let current = ((await CacheService.get(progressKey)) as number) || 0;
            if (current >= quest.requirement.count) continue;
            current += increment;
            const completed = current >= quest.requirement.count;
            await CacheService.set(progressKey, current, 86400 * 7);
            updated.push({ questId: quest.id, userId, progress: Math.min(current, quest.requirement.count), completed });
        }
        return updated;
    }

    async claimReward(userId: string, questId: string): Promise<{ success: boolean; reward?: number; error?: string }> {
        const { daily, weekly } = await this.getActiveQuests(userId);
        const quest = [...daily, ...weekly].find(q => q.id === questId);
        if (!quest) return { success: false, error: 'Quest not found' };

        const progressKey = `quest_progress:${userId}:${questId}`;
        const current = ((await CacheService.get(progressKey)) as number) || 0;
        if (current < quest.requirement.count) return { success: false, error: 'Quest not completed' };

        const claimKey = `quest_claimed:${userId}:${questId}`;
        if (await CacheService.get(claimKey)) return { success: false, error: 'Already claimed' };

        try {
            await prisma.beacoinWallet.update({ where: { userId }, data: { balance: { increment: quest.reward } } });
            const wallet = await prisma.beacoinWallet.findUnique({ where: { userId } });
            if (wallet) {
                await prisma.beacoinTransaction.create({
                    data: { walletId: wallet.id, fromUserId: 'SYSTEM', amount: quest.reward, type: 'EARN', description: `Quest: ${quest.title}` } as any
                });
            }
            await CacheService.set(claimKey, true, 86400 * 7);
            return { success: true, reward: quest.reward };
        } catch (error) {
            console.error('[QuestService] Claim error:', error);
            return { success: false, error: 'Failed to award reward' };
        }
    }
}

export const questService = new QuestService();
