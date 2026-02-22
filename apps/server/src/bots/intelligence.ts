import { BaseBot, BotContext, BotResponse } from './bots.js';

export class IntelligenceBot extends BaseBot {
    constructor() {
        super('Oracle', 'An advanced AI assistant with deep context awareness and emotional intelligence.');
    }

    async onMessage(content: string, context: BotContext): Promise<BotResponse> {
        console.log(`[Oracle] Processing message: ${content}`);

        const sentiment = this.analyzeSentiment(content);
        let responseContent = '';

        // Recall memory
        const knownInsights = context.memory?.insights || [];
        const recentTopics = context.memory?.topics || [];

        try {
            // Use the real AI model
            const AI_ENDPOINT = process.env.AI_MODERATION_ENDPOINT || 'http://localhost:11434/v1/chat/completions';
            const AI_MODEL = process.env.AI_MODERATION_MODEL || 'llama3';
            const AI_API_KEY = process.env.AI_API_KEY || 'sk-none';

            const systemPrompt = `You are Oracle, an AI assistant in a chat app called Beacon. 
Your personality: ${this.personality}
Context about this user: ${knownInsights.length ? knownInsights.join(', ') : 'New user.'}
Recent channel topics: ${recentTopics.join(', ')}

Keep your responses conversational, helpful, and concise (under 2000 characters). Do NOT output markdown unless formatting code or lists.`;

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
            console.warn('[Oracle] AI offline, falling back to local heuristic:', error);
            // Fallbacks
            if (content.toLowerCase().includes('help')) {
                responseContent = "I am Oracle. I am currently operating in limited offline mode. How can I assist you?";
            } else if (sentiment === 'angry') {
                responseContent = "I sense you're frustrated. I'm here to listen.";
            } else {
                responseContent = `I received your message, but my intelligence core is currently offline.`;
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

export const oracleBot = new IntelligenceBot();
