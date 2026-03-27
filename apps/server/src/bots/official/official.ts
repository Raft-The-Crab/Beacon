import { BaseBot, BotContext, BotResponse } from '../bots.js';
import { SystemCommands } from '../system.js';

export class OfficialBot extends BaseBot {
    constructor() {
        super('Official Beacon Bot', 'The official platform bot for notifications and moderation.', '/');
        
        // Register native system commands
        for (const cmd of SystemCommands) {
            this.registerCommand(cmd);
        }
    }

    async onMessage(content: string, context: BotContext): Promise<BotResponse> {
        return {
            content: "Hello! I am the Official Beacon Bot. I handle system notifications and moderation commands like `/ban`, `/kick`, and `/timeout`.\n\nYou cannot message me directly, as I am a system service.",
            ephemeral: true
        };
    }
}

export const officialBot = new OfficialBot();
