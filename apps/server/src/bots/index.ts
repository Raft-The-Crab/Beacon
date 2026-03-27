import { botFramework } from './bots.js';

/**
 * Enhanced Bot Engine for Beacon Server
 * Integrates with the Gateway and NLU logic
 */
export async function initBotSystem() {
    const { beaconBot } = await import('./intelligence.js');

    const { officialBot } = await import('./official/official.js');

    console.log('[BotSystem] Initializing context-aware agents...');

    // Register Official Bot for system commands
    botFramework.registerBot(officialBot, process.env.BEACON_OFFICIAL_BOT_APP_ID);
    // Register Beacon Bot as the built-in intelligent agent
    botFramework.registerBot(beaconBot, process.env.BEACON_INTELLIGENCE_BOT_APP_ID);

    console.log('[BotSystem] Active and monitoring Gateway events.');
}

export { botFramework };
