import { botFramework } from './bots.js';
import { beaconBot } from './intelligence.js';

/**
 * Enhanced Bot Engine for Beacon Server
 * Integrates with the Gateway and NLU logic
 */
export async function initBotSystem() {
    console.log('[BotSystem] Initializing context-aware agents...');

    // Register Beacon Bot as a built-in intelligent agent
    botFramework.registerBot(beaconBot);

    console.log('[BotSystem] Active and monitoring Gateway events.');
}

export * from './bots.js';
export * from './intelligence.js';
export { botFramework };
