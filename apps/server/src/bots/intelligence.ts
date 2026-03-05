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

        this.registerCommand({
            name: 'ping',
            description: 'Check bot latency',
            cooldownMs: 3000,
            handler: async () => {
                const start = Date.now();
                const mem = process.memoryUsage();
                return {
                    content: `🏓 **Pong!** Latency: \`${Date.now() - start}ms\` | RSS: \`${Math.round(mem.rss / 1024 / 1024)} MB\` | Uptime: \`${Math.round(process.uptime())}s\``,
                };
            },
        });

        this.registerCommand({
            name: 'stats',
            description: 'Show server statistics',
            cooldownMs: 10000,
            handler: async () => {
                const mem = process.memoryUsage();
                return {
                    content: '📊 **Server Stats**',
                    embeds: [{
                        title: 'Beacon Server Statistics',
                        color: '#00D166',
                        fields: [
                            { name: 'Uptime', value: `${Math.round(process.uptime() / 60)} min`, inline: true },
                            { name: 'RSS', value: `${Math.round(mem.rss / 1024 / 1024)} MB`, inline: true },
                            { name: 'Heap', value: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`, inline: true },
                            { name: 'Node', value: process.version, inline: true },
                            { name: 'Platform', value: process.platform, inline: true },
                        ],
                    }],
                };
            },
        });

        this.registerCommand({
            name: 'moderate',
            description: 'Check content through the moderation pipeline',
            options: [
                { name: 'text', description: 'Text to check', type: 'string', required: true },
            ],
            cooldownMs: 5000,
            handler: async (args, context) => {
                try {
                    const { moderationService } = await import('../services/moderation.js');
                    const text = args.text || args.arg1 || 'test';
                    const { result } = await moderationService.checkMessage(text, context.userId);
                    return {
                        content: '🛡️ **Moderation Result**',
                        embeds: [{
                            title: 'Content Check',
                            color: result.approved ? '#00D166' : '#ED4245',
                            fields: [
                                { name: 'Status', value: result.approved ? '✅ Approved' : '❌ Rejected', inline: true },
                                { name: 'Severity', value: result.severity, inline: true },
                                { name: 'Score', value: String(result.score || 0), inline: true },
                                { name: 'Flags', value: result.flags?.join(', ') || 'None', inline: false },
                                { name: 'Reason', value: result.reason || 'N/A', inline: false },
                            ],
                        }],
                        ephemeral: true,
                    };
                } catch {
                    return { content: '❌ Moderation service unavailable.', ephemeral: true };
                }
            },
        });

        this.registerCommand({
            name: 'beacoin',
            description: 'Check your Beacoin balance',
            options: [
                { name: 'action', description: 'balance / daily', type: 'string' },
            ],
            cooldownMs: 3000,
            handler: async (args, context) => {
                const action = args.action || args.arg1 || 'balance';
                const { prisma: db } = await import('../db');

                if (action === 'balance') {
                    const wallet = await db.beacoinWallet.findUnique({
                        where: { userId: context.userId }
                    });

                    const balance = wallet ? wallet.balance : 0;

                    return {
                        content: '💰 **Beacoin Wallet**',
                        embeds: [{
                            title: '🪙 Your Balance',
                            description: `You currently have **${balance}** Beacoins.`,
                            color: '#FEE75C',
                            fields: [
                                { name: 'Balance', value: `${balance} 🪙`, inline: true },
                                { name: 'Wallet Status', value: wallet ? '✅ Active' : '⚠️ Not Initialized', inline: true },
                            ],
                        }],
                        actions: [
                            { type: 'button' as const, label: '📅 Claim Daily', payload: { command: '/beacoin daily' } },
                            { type: 'button' as const, label: '🏪 Shop', payload: { command: '/shop' } },
                        ],
                    };
                }

                if (action === 'daily') {
                    const wallet = await db.beacoinWallet.findFirst({ where: { userId: context.userId } });
                    if (!wallet) return { content: '❌ Wallet not found. Please send a message first to initialize your account.' };

                    // Simple 24h check based on last transaction or a dedicated field if exists
                    // For now, let's assume we allow it and log a transaction
                    const rewardAmount = 10;

                    await db.beacoinWallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: rewardAmount } }
                    });

                    await db.beacoinTransaction.create({
                        data: {
                            walletId: wallet.id,
                            fromUserId: 'SYSTEM',
                            type: 'EARN' as any,
                            amount: rewardAmount,
                            reason: 'Daily Reward'
                        }
                    });

                    return {
                        content: `🎁 **Daily Reward!** You received **${rewardAmount}** Beacoins. Come back tomorrow!`,
                    };
                }
                return { content: `Unknown action: \`${action}\`. Try \`balance\` or \`daily\`.` };
            },
        });

        this.registerCommand({
            name: 'about',
            description: 'Learn about Beacon',
            cooldownMs: 5000,
            handler: async () => ({
                content: '🔮 **About Beacon**',
                embeds: [{
                    title: 'Beacon — Next-Gen Messaging',
                    description: 'A privacy-first, AI-moderated messaging platform with E2EE, custom bots, Beacoin economy, and a Discord-inspired UI.',
                    color: '#5865F2',
                    fields: [
                        { name: 'AI Moderation', value: '3-tier pipeline: LLM → Prolog → TS fallback', inline: true },
                        { name: 'Encryption', value: 'Curve25519 E2EE for DMs', inline: true },
                        { name: 'Economy', value: 'Earn Beacoin, unlock Premium', inline: true },
                        { name: 'SDK', value: '`beacon.js` — full bot framework', inline: true },
                    ],
                    footer: 'Built with ❤️ by the Beacon team',
                }],
            }),
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
            const AI_ENDPOINT = process.env.CLAWCLOUD_AI_URL || process.env.AI_MODERATION_ENDPOINT || 'http://localhost:11434/v1/chat/completions';
            const AI_MODEL = process.env.AI_MODERATION_MODEL || 'llama3';
            const AI_API_KEY = process.env.CLAWCLOUD_API_KEY || process.env.AI_API_KEY || 'sk-none';

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
