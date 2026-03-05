import { beaconBot } from '../bots/intelligence.js';

export class BotService {
    /**
     * Dynamically loads a plugin into the Official Beacon Bot.
     * This allows for "Sovereign" updates without full server restarts.
     */
    static async loadSystemPlugin(pluginPath: string) {
        try {
            console.log(`[BotService] Attempting to load system plugin: ${pluginPath}`);
            const { default: PluginClass } = await import(pluginPath);
            const plugin = new PluginClass();

            if (plugin.id && typeof plugin.onEnable === 'function') {
                beaconBot.addPlugin(plugin);
                console.log(`[BotService] Successfully loaded plugin: ${plugin.name} (${plugin.id})`);
                return { success: true, pluginId: plugin.id };
            }
            throw new Error('Invalid plugin structure: must have id and onEnable');
        } catch (error) {
            console.error(`[BotService] Failed to load plugin from ${pluginPath}:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Lists all active plugins for the system bot.
     */
    static getActivePlugins() {
        // @ts-ignore - access internal plugins map if needed, or expose it in BaseBot
        return Array.from((beaconBot as any).plugins.values()).map((p: any) => ({
            id: p.id,
            name: p.name
        }));
    }

    /**
     * Broadcasts a system event via the Official Beacon Bot.
     */
    static async broadcastSystemMessage(content: string) {
        console.log(`[BotService] Broadcasting system message: ${content}`);
        // This could iterate through active guilds or send to a global status channel
        // For now, we log it, establishing the bot's authoritative broadcast role.
    }
}
