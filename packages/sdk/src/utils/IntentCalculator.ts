import { Intents } from '../gateway';

/**
 * A utility class to automatically calculate the bitwise intent integer
 * based on the array of gateway events the developer wants to listen for.
 */
export class IntentCalculator {
    public static calculate(events: string[]): number {
        let intents = 0;

        for (const event of events) {
            switch (event) {
                case 'messageCreate':
                case 'messageUpdate':
                case 'messageDelete':
                    intents |= Intents.GUILD_MESSAGES | Intents.MESSAGE_CONTENT | Intents.DIRECT_MESSAGES;
                    break;
                case 'guildCreate':
                case 'guildUpdate':
                case 'guildDelete':
                    intents |= Intents.GUILDS;
                    break;
                case 'guildMemberAdd':
                case 'guildMemberRemove':
                case 'guildMemberUpdate':
                    intents |= Intents.GUILD_MEMBERS;
                    break;
                case 'messageReactionAdd':
                case 'messageReactionRemove':
                    intents |= Intents.GUILD_MESSAGE_REACTIONS | Intents.DIRECT_MESSAGE_REACTIONS;
                    break;
                case 'voiceStateUpdate':
                    intents |= Intents.GUILD_VOICE_STATES;
                    break;
                case 'presenceUpdate':
                    intents |= Intents.GUILD_PRESENCES;
                    break;
                case 'typingStart':
                    intents |= Intents.GUILD_MESSAGE_TYPING;
                    break;
            }
        }

        return intents;
    }
}
