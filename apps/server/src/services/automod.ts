/**
 * Beacon AutoMod Pro v1 — Pillar IV: The Council
 * A configurable, per-guild rules engine with regex matching and automated actions.
 * Each guild can define rules with patterns, severity, and responses.
 */

import { prisma } from '../db';
import { CacheService } from './cache';
import { AuditLogService, AuditLogAction } from './auditLog';

// ── Types ────────────────────────────────────────────────────────────

export interface AutoModRule {
    id: string;
    guildId: string;
    name: string;
    enabled: boolean;
    triggerType: 'keyword' | 'regex' | 'mention_spam' | 'link' | 'caps_lock';
    triggerPatterns: string[];       // keywords or regex strings
    exemptRoles: string[];          // role IDs exempt from this rule
    exemptChannels: string[];       // channel IDs exempt from this rule
    actions: AutoModAction[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AutoModAction {
    type: 'delete_message' | 'warn_user' | 'mute_user' | 'kick_user' | 'log_only';
    duration?: number;              // ms for mute
    customMessage?: string;         // DM or channel warning text
}

export interface AutoModMatch {
    ruleId: string;
    ruleName: string;
    matched: string;
    actions: AutoModAction[];
}

// ── Service ──────────────────────────────────────────────────────────

class AutoModService {
    private ruleCache: Map<string, AutoModRule[]> = new Map();
    private compiledRegex: Map<string, RegExp[]> = new Map();

    /**
     * Load rules for a guild, with in-memory caching.
     */
    async getRules(guildId: string): Promise<AutoModRule[]> {
        const cached = this.ruleCache.get(guildId);
        if (cached) return cached;

        try {
            const raw = await CacheService.get(`automod:${guildId}`);
            if (raw) {
                const rules = raw as AutoModRule[];
                this.ruleCache.set(guildId, rules);
                this.compilePatterns(guildId, rules);
                return rules;
            }
        } catch { }

        // Fallback: empty rules (no DB table yet — rules stored in Redis/cache)
        return [];
    }

    /**
     * Save rules for a guild to both cache and Redis.
     */
    async saveRules(guildId: string, rules: AutoModRule[]): Promise<void> {
        this.ruleCache.set(guildId, rules);
        this.compilePatterns(guildId, rules);
        await CacheService.set(`automod:${guildId}`, rules, 86400); // 24h cache
    }

    /**
     * Create a new rule for a guild.
     */
    async createRule(
        guildId: string,
        createdBy: string,
        rule: Omit<AutoModRule, 'id' | 'guildId' | 'createdBy' | 'createdAt' | 'updatedAt'>
    ): Promise<AutoModRule> {
        const rules = await this.getRules(guildId);

        const newRule: AutoModRule = {
            ...rule,
            id: `amr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            guildId,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        rules.push(newRule);
        await this.saveRules(guildId, rules);

        await AuditLogService.log(
            guildId,
            createdBy,
            AuditLogAction.GUILD_UPDATE,
            { action: 'automod_rule_created', ruleName: newRule.name }
        );

        return newRule;
    }

    /**
     * Update an existing rule.
     */
    async updateRule(guildId: string, ruleId: string, updates: Partial<AutoModRule>, userId: string): Promise<AutoModRule | null> {
        const rules = await this.getRules(guildId);
        const idx = rules.findIndex(r => r.id === ruleId);
        if (idx === -1) return null;

        rules[idx] = { ...rules[idx], ...updates, updatedAt: new Date() };
        await this.saveRules(guildId, rules);

        await AuditLogService.log(
            guildId,
            userId,
            AuditLogAction.GUILD_UPDATE,
            { action: 'automod_rule_updated', ruleName: rules[idx].name }
        );

        return rules[idx];
    }

    /**
     * Delete a rule.
     */
    async deleteRule(guildId: string, ruleId: string, userId: string): Promise<boolean> {
        const rules = await this.getRules(guildId);
        const filtered = rules.filter(r => r.id !== ruleId);
        if (filtered.length === rules.length) return false;

        await this.saveRules(guildId, filtered);
        await AuditLogService.log(
            guildId,
            userId,
            AuditLogAction.GUILD_UPDATE,
            { action: 'automod_rule_deleted', ruleId }
        );

        return true;
    }

    /**
     * Core: Check a message against all guild rules.
     * Returns all matching rule results, or empty array if clean.
     */
    async checkMessage(
        guildId: string,
        content: string,
        userId: string,
        channelId: string,
        memberRoleIds: string[]
    ): Promise<AutoModMatch[]> {
        const rules = await this.getRules(guildId);
        if (rules.length === 0) return [];

        const matches: AutoModMatch[] = [];

        for (const rule of rules) {
            if (!rule.enabled) continue;

            // Check exemptions
            if (rule.exemptChannels.includes(channelId)) continue;
            if (rule.exemptRoles.some(roleId => memberRoleIds.includes(roleId))) continue;

            let matched: string | null = null;

            switch (rule.triggerType) {
                case 'keyword': {
                    const lower = content.toLowerCase();
                    matched = rule.triggerPatterns.find(p => lower.includes(p.toLowerCase())) || null;
                    break;
                }
                case 'regex': {
                    const compiled = this.compiledRegex.get(rule.id) || [];
                    for (const rx of compiled) {
                        const m = content.match(rx);
                        if (m) { matched = m[0]; break; }
                    }
                    break;
                }
                case 'mention_spam': {
                    const mentionCount = (content.match(/<@!?\d+>/g) || []).length;
                    const threshold = parseInt(rule.triggerPatterns[0]) || 5;
                    if (mentionCount >= threshold) matched = `${mentionCount} mentions`;
                    break;
                }
                case 'link': {
                    const urlMatch = content.match(/https?:\/\/[^\s]+/gi);
                    if (urlMatch) {
                        const blocked = rule.triggerPatterns.length === 0
                            ? urlMatch[0]  // block all links
                            : urlMatch.find(u => rule.triggerPatterns.some(p => u.includes(p)));
                        if (blocked) matched = blocked;
                    }
                    break;
                }
                case 'caps_lock': {
                    const capsRatio = (content.replace(/[^A-Z]/g, '').length) / Math.max(content.length, 1);
                    const threshold = parseFloat(rule.triggerPatterns[0]) || 0.7;
                    if (content.length > 8 && capsRatio > threshold) matched = `${Math.round(capsRatio * 100)}% caps`;
                    break;
                }
            }

            if (matched) {
                matches.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    matched,
                    actions: rule.actions
                });
            }
        }

        return matches;
    }

    /**
     * Compile regex patterns for a guild's rules.
     */
    private compilePatterns(guildId: string, rules: AutoModRule[]) {
        for (const rule of rules) {
            if (rule.triggerType === 'regex') {
                const compiled: RegExp[] = [];
                for (const pattern of rule.triggerPatterns) {
                    try {
                        compiled.push(new RegExp(pattern, 'gi'));
                    } catch {
                        console.warn(`[AutoMod] Invalid regex in rule ${rule.id}: ${pattern}`);
                    }
                }
                this.compiledRegex.set(rule.id, compiled);
            }
        }
    }

    /**
     * Clear cache for a guild (call on settings update).
     */
    invalidateCache(guildId: string) {
        this.ruleCache.delete(guildId);
        // Also clear compiled regex for that guild's rules
        const rules = this.ruleCache.get(guildId);
        if (rules) {
            for (const rule of rules) {
                this.compiledRegex.delete(rule.id);
            }
        }
    }
}

export const autoModService = new AutoModService();
