import { v4 as uuidv4 } from 'uuid';

export interface BotContext {
    userId: string;
    channelId: string;
    guildId?: string;
    history: string[];
    memory?: {
        insights: string[];
        topics: string[];
        preferences: Record<string, string>;
    };
}

export interface BotAction {
    type: string;
    payload: any;
}

export interface BotResponse {
    content: string;
    metadata?: any;
    actions?: BotAction[];
}

export abstract class BaseBot {
    public id: string;
    public name: string;
    public personality: string;

    constructor(name: string, personality: string) {
        this.id = uuidv4();
        this.name = name;
        this.personality = personality;
    }

    abstract onMessage(content: string, context: BotContext): Promise<BotResponse>;
}

export class BotFramework {
    private bots: Map<string, BaseBot> = new Map();

    registerBot(bot: BaseBot) {
        this.bots.set(bot.id, bot);
        console.log(`[BotFramework] Registered bot: ${bot.name} (${bot.id})`);
    }

    async handleMessage(content: string, context: BotContext): Promise<BotResponse | null> {
        // Inject Long-Term Memory
        const { LongTermMemory } = await import('./memory.js');
        const insights = await LongTermMemory.getUserInsights(context.userId);
        const topics = await LongTermMemory.getChannelTopics(context.channelId);

        // Populate context memory
        context.memory = {
            insights,
            topics,
            preferences: {} // Future: load all prefs
        };

        // Basic NLU: Check if any bot is mentioned or if it's a direct command
        for (const bot of this.bots.values()) {
            if (content.toLowerCase().includes(bot.name.toLowerCase())) {
                const response = await bot.onMessage(content, context);

                // Post-process: Extract insights if the response content is definitive
                if (response.content.includes("I'll remember that")) {
                    // Primitive logic for now
                    const potentialInsight = content.replace(/oracle/gi, '').trim();
                    if (potentialInsight.length > 5) {
                        await LongTermMemory.saveUserInsight(context.userId, potentialInsight);
                    }
                }

                return response;
            }
        }
        return null;
    }
}

export const botFramework = new BotFramework();
