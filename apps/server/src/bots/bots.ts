import { v4 as uuidv4 } from 'uuid';

export interface BotContext {
    userId: string;
    channelId: string;
    guildId?: string;
    content?: string; // For onMessage
    commandName?: string; // For onCommand
    options?: any[]; // For onCommand
    history: string[];
    memory?: {
        insights: string[];
        topics: string[];
        preferences: Record<string, string>;
    };
    respond: (response: BotResponse) => Promise<void>;
}

export interface BotAction {
    type: 'button' | 'link' | 'embed' | 'reaction' | 'dm';
    label?: string;
    payload: any;
}

export interface BotEmbed {
    title?: string;
    description?: string;
    color?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: string;
    thumbnail?: string;
    image?: string;
}

export interface BotResponse {
    content: string;
    embeds?: BotEmbed[];
    metadata?: any;
    actions?: BotAction[];
    ephemeral?: boolean; // only visible to command sender
    deleteOriginal?: boolean; // automatically delete the command message
    threadId?: string; // respond in a specific thread
}

export interface BotPlugin {
    id: string;
    name: string;
    onEnable?: (bot: BaseBot) => void;
    onDisable?: (bot: BaseBot) => void;
    onMessage?: (ctx: BotContext) => Promise<void | boolean>;
    onCommand?: (ctx: BotContext) => Promise<void | boolean>;
}

// ─── Slash Command System ────────────────────────────────────────────────────

export interface SlashCommandOption {
    name: string;
    description: string;
    type: 'string' | 'integer' | 'boolean' | 'user' | 'channel';
    required?: boolean;
}

export interface SlashCommand {
    name: string;
    description: string;
    options?: SlashCommandOption[];
    cooldownMs?: number; // per-user cooldown
    handler: (args: Record<string, any>, context: BotContext) => Promise<BotResponse>;
}

// ─── Base Bot ────────────────────────────────────────────────────────────────

export abstract class BaseBot {
    public id: string;
    public name: string;
    public personality: string;
    public prefix: string;
    public commands: Map<string, SlashCommand> = new Map();
    private _cooldowns: Map<string, number> = new Map();
    private _plugins: Map<string, BotPlugin> = new Map();

    constructor(name: string, personality: string, prefix = '!') {
        this.id = uuidv4();
        this.name = name;
        this.personality = personality;
        this.prefix = prefix;
    }

    /** Register a slash command */
    registerCommand(cmd: SlashCommand) {
        this.commands.set(cmd.name, cmd);
    }

    /** Load a bot plugin */
    loadPlugin(plugin: BotPlugin) {
        if (this._plugins.has(plugin.id)) return;
        this._plugins.set(plugin.id, plugin);
        if (plugin.onEnable) plugin.onEnable(this);
        console.log(`[Bot:${this.name}] Enabled plugin: ${plugin.name}`);
    }

    addPlugin(plugin: BotPlugin) {
        this.loadPlugin(plugin);
    }

    /** Unload a bot plugin */
    unloadPlugin(pluginName: string) {
        const plugin = this._plugins.get(pluginName);
        if (plugin) {
            plugin.onDisable(this);
            this._plugins.delete(pluginName);
        }
    }

    /** Check if a command is on cooldown for a user */
    isOnCooldown(commandName: string, userId: string): boolean {
        const key = `${commandName}:${userId}`;
        const expiry = this._cooldowns.get(key);
        if (!expiry) return false;
        if (Date.now() < expiry) return true;
        this._cooldowns.delete(key);
        return false;
    }

    /** Set cooldown for a user on a command */
    setCooldown(commandName: string, userId: string, durationMs: number) {
        this._cooldowns.set(`${commandName}:${userId}`, Date.now() + durationMs);
    }

    /** Handle a slash command: /name arg1 arg2 */
    async handleSlashCommand(commandStr: string, context: BotContext): Promise<BotResponse | null> {
        const parts = commandStr.trim().split(/\s+/);
        const cmdName = parts[0].replace(/^\//, '');
        const cmd = this.commands.get(cmdName);

        if (!cmd) return null;

        // Cooldown check
        if (cmd.cooldownMs && this.isOnCooldown(cmdName, context.userId)) {
            return {
                content: `⏳ Command \`/${cmdName}\` is on cooldown. Try again shortly.`,
                ephemeral: true,
            };
        }

        // Parse simple args: /command key:value or positional
        const args: Record<string, any> = {};
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes(':')) {
                const [key, ...val] = parts[i].split(':');
                args[key] = val.join(':');
            } else if (cmd.options && cmd.options[i - 1]) {
                args[cmd.options[i - 1].name] = parts[i];
            } else {
                args[`arg${i}`] = parts[i];
            }
        }

        // Execute
        const response = await cmd.handler(args, context);

        // Set cooldown
        if (cmd.cooldownMs) {
            this.setCooldown(cmdName, context.userId, cmd.cooldownMs);
        }

        return response;
    }

    /** Handle a prefix command: !help */
    async handlePrefixCommand(content: string, context: BotContext): Promise<BotResponse | null> {
        if (!content.startsWith(this.prefix)) return null;
        const slashEquivalent = '/' + content.slice(this.prefix.length);
        return this.handleSlashCommand(slashEquivalent, context);
    }

    /** Fallback: handle mention/natural language */
    abstract onMessage(content: string, context: BotContext): Promise<BotResponse>;
}

// ─── Bot Framework ───────────────────────────────────────────────────────────

export class BotFramework {
    private bots: Map<string, BaseBot> = new Map();
    private botsByName: Map<string, BaseBot> = new Map();
    private botsByAppId: Map<string, BaseBot> = new Map();

    registerBot(bot: BaseBot, applicationId?: string) {
        this.bots.set(bot.id, bot);
        this.botsByName.set(bot.name.toLowerCase(), bot);
        if (applicationId) {
            this.botsByAppId.set(applicationId, bot);
        }
        console.log(`[BotFramework] Registered: ${bot.name} (${bot.commands.size} commands, prefix: "${bot.prefix}")`);
    }

    getBotByAppId(appId: string): BaseBot | undefined {
        return this.botsByAppId.get(appId);
    }

    getBotByName(name: string): BaseBot | undefined {
        return this.botsByName.get(name.toLowerCase());
    }

    /** Get all registered commands across all bots (for /help) */
    getAllCommands(): { bot: string; commands: SlashCommand[] }[] {
        return [...this.bots.values()].map(bot => ({
            bot: bot.name,
            commands: [...bot.commands.values()],
        }));
    }

    async handleMessage(content: string, context: BotContext): Promise<BotResponse | null> {
        // Inject Long-Term Memory
        const { LongTermMemory } = await import('./memory.js');
        const insights = await LongTermMemory.getUserInsights(context.userId);
        const topics = await LongTermMemory.getChannelTopics(context.channelId);
        context.memory = { insights, topics, preferences: {} };
        context.content = content;

        // 1. Slash commands (highest priority)
        if (content.startsWith('/')) {
            for (const bot of this.bots.values()) {
                const response = await bot.handleSlashCommand(content, context);
                if (response) return response;
            }
        }

        // 2. Prefix commands (! by default)
        for (const bot of this.bots.values()) {
            const response = await bot.handlePrefixCommand(content, context);
            if (response) return response;
        }

        // 3. Plugin message hooks
        for (const bot of this.bots.values()) {
            for (const plugin of (bot as any)._plugins.values()) {
                if (plugin.onMessage) {
                    const result = await plugin.onMessage(context);
                    if (result === true) return null; // Plugin handled it and wants to stop further processing
                }
            }
        }

        // 4. Mention/natural language
        for (const bot of this.bots.values()) {
            if (content.toLowerCase().includes(bot.name.toLowerCase()) ||
                content.toLowerCase().includes(`@${bot.name.toLowerCase()}`)) {
                const response = await bot.onMessage(content, context);
                return response;
            }
        }

        return null;
    }

    async handleInteraction(interaction: any): Promise<BotResponse | null> {
        const bot = this.botsByAppId.get(interaction.applicationId);
        if (!bot) return null;

        const context: BotContext = {
            userId: interaction.member?.user?.id || interaction.user?.id,
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            history: [],
            commandName: interaction.data?.name,
            options: interaction.data?.options,
            respond: async (res) => { /* handled by controller */ }
        };

        // 1. Plugin command hooks
        for (const plugin of (bot as any)._plugins.values()) {
            if (plugin.onCommand) {
                const result = await plugin.onCommand(context);
                if (result) return null; // Handled via context.respond (mocked here)
            }
        }

        // 2. Native bot commands
        if (interaction.type === 2) {
            return bot.handleSlashCommand(`/${interaction.data.name}`, context);
        }

        return null;
    }
}

export const botFramework = new BotFramework();
