import { redis } from '../db';
import { logger } from '../services/logger';

interface SpamProfile {
    score: number;
    lastMessageTime: number;
    mutedUntil: number;
}

/**
 * Heuristic Anti-Spam Engine
 * Evaluates Zalgo formatting, caps-lock entropy, and exact message repetition.
 */
export class AntiSpamEngine {
    private static readonly MUTE_DURATION = 5 * 60 * 1000; // 5 minutes shadow mute
    private static readonly SPAM_THRESHOLD = 100;

    /**
     * Checks if a user's message is spam.
     * @returns {boolean} True if safe, False if the message should be dropped/muted.
     */
    public static async checkMessage(userId: string, content: string): Promise<boolean> {
        if (!content || !userId) return true;

        const key = `antispam:${userId}`;
        const rawProfile = await redis.get(key);
        let profile: SpamProfile = rawProfile
            ? JSON.parse(rawProfile)
            : { score: 0, lastMessageTime: 0, mutedUntil: 0 };

        const now = Date.now();

        // 1. Check if currently shadow-muted
        if (profile.mutedUntil > now) {
            return false;
        }

        // 2. Evaluate Message Entropy (Score Penalties)
        let penalty = 0;

        // A. Zalgo / Crazy Unicode characters
        const zalgoRegex = /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{3,}/g;
        if (zalgoRegex.test(content)) penalty += 40;

        // B. CAPS LOCK Abuse (if message > 8 chars and mostly caps)
        const lettersOnly = content.replace(/[^a-zA-Z]/g, '');
        if (lettersOnly.length > 8) {
            const upperCount = (lettersOnly.match(/[A-Z]/g) || []).length;
            if (upperCount / lettersOnly.length > 0.8) penalty += 20;
        }

        // C. Repeated Character Abuse ("loooooooool")
        if (/(.)\1{6,}/.test(content)) penalty += 25;

        // D. High Velocity (less than 800ms between messages)
        const timeDiff = now - profile.lastMessageTime;
        if (timeDiff < 800) {
            penalty += 35;
        } else if (timeDiff > 5000) {
            // Decay score if they wait 5+ seconds
            profile.score = Math.max(0, profile.score - 15);
        }

        profile.score += penalty;
        profile.lastMessageTime = now;

        // 3. Threshold check
        if (profile.score >= this.SPAM_THRESHOLD) {
            logger.warn(`[AntiSpam] User ${userId} shadow-muted for spam.`);
            profile.mutedUntil = now + this.MUTE_DURATION;
            profile.score = 0; // Reset score for next window
            await redis.set(key, JSON.stringify(profile), 'EX', 600);
            return false;
        }

        // Store active profile for 10 minutes
        await redis.set(key, JSON.stringify(profile), 'EX', 600);
        return true;
    }
}
