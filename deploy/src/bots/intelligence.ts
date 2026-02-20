import { BaseBot, BotContext, BotResponse } from './bots.js';

export class IntelligenceBot extends BaseBot {
    constructor() {
        super('Oracle', 'An advanced AI assistant with deep context awareness and emotional intelligence.');
    }

    async onMessage(content: string, context: BotContext): Promise<BotResponse> {
        console.log(`[Oracle] Processing message: ${content}`);

        const sentiment = this.analyzeSentiment(content);
        const intent = this.detectIntent(content);

        let responseContent = '';
        const actions: BotResponse['actions'] = [];

        // Recall memory
        const knownInsights = context.memory?.insights || [];
        const isKnownUser = knownInsights.length > 0;

        if (intent === 'help') {
            responseContent = "I am Oracle. I can help you with moderation, data analysis, and general questions. How can I assist you today?";
        } else if (intent === 'moderation') {
            responseContent = "I've analyzed the recent moderation reports for you. Accessing the dashboard now...";
            actions.push({ type: 'check_moderation', payload: { channelId: context.channelId } });
        } else if (content.toLowerCase().includes('remember')) {
            responseContent = "I've added that to my long-term memory. I'll remember that for our future conversations!";
        } else if (intent === 'inquiry' && isKnownUser) {
            responseContent = `Since I know you're interested in ${knownInsights[0]}, perhaps I can help with that specifically?`;
        } else if (sentiment === 'angry') {
            responseContent = "I sense you're frustrated. I'm here to help resolve any issues or just listen if you need to vent.";
        } else if (intent === 'joke') {
            responseContent = this.getRandomJoke();
        } else {
            responseContent = `I've analyzed your message: "${content}". ${isKnownUser ? `Always good to see you again!` : ''}`;
        }

        return {
            content: responseContent,
            metadata: { sentiment, intent, insightsCount: knownInsights.length },
            actions
        };
    }

    private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'angry' {
        const t = text.toLowerCase();
        if (t.includes('hate') || t.includes('angry') || t.includes('!!')) return 'angry';
        if (t.includes('great') || t.includes('love') || t.includes('thanks')) return 'positive';
        if (t.includes('bad') || t.includes('wrong') || t.includes('sad')) return 'negative';
        return 'neutral';
    }

    private detectIntent(text: string): string {
        const t = text.toLowerCase();
        if (t.includes('help')) return 'help';
        if (t.includes('what') || t.includes('who')) return 'inquiry';
        if (t.includes('moder')) return 'moderation';
        if (t.includes('joke') || t.includes('funny')) return 'joke';
        return 'general_chat';
    }

    private getRandomJoke(): string {
        const jokes = [
            "Why did the developer go broke? Because he used up all his cache!",
            "Why do Java developers wear glasses? Because they don't C#.",
            "I told my computer I needed a break, and now it won't stop sending me Kit-Kats.",
            "3 SQL statements walk into a bar. The bartender says, 'Table for 3?'" // Classic
        ];
        return jokes[Math.floor(Math.random() * jokes.length)] || "I'm out of jokes right now.";
    }
}

export const oracleBot = new IntelligenceBot();
