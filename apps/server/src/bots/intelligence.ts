import { BaseBot, BotContext, BotResponse, BotEmbed } from './bots.js';
import { MusicPlugin, ModerationPlugin } from './plugins.js';

export class OfficialBeaconBot extends BaseBot {
    constructor() {
        super('Official Beacon Bot', 'The primary system authority for moderation, notifications, and intelligence.');
        this.personality = 'Authoritative yet helpful, firm on safety, and platform-expert.';

        // Load system-level plugins
        this.addPlugin(new MusicPlugin());
        this.addPlugin(new ModerationPlugin());

        // ─── Register Slash Commands ──────────────────────────────
        this.registerCommand({
            name: 'help',
            description: 'Show all available commands',
            cooldownMs: 5000,
            handler: async (_args, context) => {
                const { botFramework } = await import('./bots.js');
                const allCommands = botFramework.getAllCommands();

                const fields = allCommands.flatMap(({ bot, commands }) =>
                    commands.map(cmd => ({
                        name: `/${cmd.name}`,
                        value: cmd.description,
                        inline: true,
                    }))
                );

                return {
                    content: '📖 **Available Commands**',
                    embeds: [{
                        title: 'Beacon Bot Commands',
                        description: 'Use `/command` or `!command` to run these:',
                        color: '#5865F2',
                        fields,
                        footer: `${fields.length} commands available`,
                    }],
                };
            },
        });

        console.log(`[Official Beacon Bot] Initialized as system authority with ${this.commands.size} slash commands`);
    }

    async onMessage(content: string, context: BotContext): Promise<BotResponse> {
        console.log(`[Official Beacon Bot] Monitoring message: ${content}`);

        // 1. Proactive Moderation via System AI
        try {
            const { moderationService } = await import('../services/moderation.js');
            const { SystemAuditService, AuditAction } = await import('../services/systemAudit.js');
            const { result, action } = await moderationService.checkMessage(content, context.userId, context.channelId);

            if (!result.approved) {
                console.warn(`[Official Beacon Bot] Moderation Triggered: ${result.reason} (Action: ${action.type})`);

                // Log to Centralized Audit Log
                await SystemAuditService.log({
                    action: AuditAction.MEMBER_KICK, // Or a more specific action if we add it
                    userId: 'BEACON_SYSTEM_BOT',
                    targetId: context.userId,
                    guildId: context.guildId,
                    reason: `AI Moderation: ${result.reason}`,
                    metadata: { content, severity: result.severity, flags: result.flags }
                });

                return {
                    content: `⚠️ **System Warning**: Your message was flagged for \`${result.reason}\`. Please follow the Beacon community guidelines.`,
                    metadata: { moderated: true, severity: result.severity }
                };
            }
        } catch (err) {
            console.error('[Official Beacon Bot] Moderation bypass due to service error', err);
        }

        // 2. AI Intelligence Response (only if addressed or in specific conditions)
        const sentiment = this.analyzeSentiment(content);
        let responseContent = '';

        const knownInsights = context.memory?.insights || [];
        const recentTopics = context.memory?.topics || [];

        try {
            const AI_ENDPOINT = (process.env.AI_ASSISTANT_ENDPOINT || process.env.AI_CHAT_ENDPOINT || '').trim();
            const AI_MODEL = (process.env.AI_ASSISTANT_MODEL || process.env.AI_CHAT_MODEL || '').trim();
            const AI_API_KEY = process.env.CLAWCLOUD_API_KEY || process.env.AI_API_KEY || 'sk-none';

            if (!AI_ENDPOINT || !AI_MODEL) {
                throw new Error('AI assistant endpoint/model not configured');
            }

            const systemPrompt = `You are the Official Beacon Bot, the primary system authority and AI assistant for the Beacon messaging platform. 
Your personality: ${this.personality}
User Context: ${knownInsights.length ? knownInsights.join(', ') : 'New user.'}
Channel Context: ${recentTopics.join(', ')}

Guidelines:
- Act as the official authority (similar to the Discord System Bot).
- Be conversational but professional.
- Guide users towards Titan V parity features and Beacon Sovereignty.
- Do NOT output excessive markdown.
- Focus on platform assistance and safety.`;

            const response = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content }
                    ]
                })
            });

            if (!response.ok) throw new Error('AI Provider Offline');

            const data = await response.json() as any;
            responseContent = data.choices[0].message.content;

        } catch (error) {
            console.warn('[Official Beacon Bot] AI intelligence core offline, falling back to heuristics:', error);
            if (content.toLowerCase().includes('help')) {
                responseContent = "I'm the **Official Beacon Bot**. Type `/help` to see my platform commands and moderation tools.";
            } else if (sentiment === 'angry') {
                responseContent = "System Note: Frustration detected. Please use `/help` if you need platform assistance.";
            } else {
                responseContent = `The Beacon Intelligence Core is currently regenerating. My system-level moderation remains active.`;
            }
        }

        return {
            content: responseContent,
            metadata: { sentiment, insightsCount: knownInsights.length }
        };
    }

    private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'angry' {
        const t = text.toLowerCase();
        if (t.includes('hate') || t.includes('angry') || t.includes('!!')) return 'angry';
        if (t.includes('great') || t.includes('love') || t.includes('thanks')) return 'positive';
        if (t.includes('bad') || t.includes('wrong') || t.includes('sad')) return 'negative';
        return 'neutral';
    }
}

export const beaconBot = new OfficialBeaconBot();
