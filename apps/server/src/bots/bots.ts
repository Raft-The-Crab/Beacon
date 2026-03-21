import { v4 as uuidv4 } from 'uuid';

export interface BotContext {
    userId: string;
    channelId: string;
    guildId?: string;
    memberRoleIds?: string[];
    memberPermissions?: bigint;
    content?: string; // For onMessage
    commandName?: string; // For onCommand
    options?: any[]; // For onCommand
    targetId?: string; // For Context Menu commands
    resolved?: any; // For user/channel/role options
    interactionData?: any;
    sourceMessageId?: string;
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

export interface BotButtonComponent {
    type?: 'button';
    customId?: string;
    label?: string;
    style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
    emoji?: string;
    url?: string;
    disabled?: boolean;
}

export interface BotSelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
}

export interface BotSelectComponent {
    type?: 'string' | 'user' | 'role' | 'channel' | 'mentionable' | 'select';
    customId: string;
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options?: BotSelectOption[];
}

export interface BotActionRow {
    components: Array<BotButtonComponent | BotSelectComponent>;
}

export interface BotCard {
    title?: string;
    description?: string;
    color?: string | number;
    thumbnail?: string;
    image?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: string;
    timestamp?: boolean;
    author?: { name: string; iconUrl?: string; url?: string };
}

export interface BotResponse {
    content: string;
    embeds?: BotEmbed[];
    cards?: BotCard[];
    metadata?: any;
    actions?: BotAction[];
    components?: BotActionRow[];
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
    type?: 1 | 2 | 3; // 1: CHAT_INPUT, 2: USER, 3: MESSAGE
    options?: SlashCommandOption[];
    cooldownMs?: number; // per-user cooldown
    requiredRoleIds?: string[];
    requiredPermissions?: Array<bigint | string | number>;
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

        if (cmd.requiredRoleIds?.length) {
            const memberRoles = new Set(context.memberRoleIds || []);
            const hasRole = cmd.requiredRoleIds.some(roleId => memberRoles.has(roleId));
            if (!hasRole) {
                return {
                    content: `❌ You are missing the required role to run \`/${cmdName}\`.`,
                    ephemeral: true,
                };
            }
        }

        if (cmd.requiredPermissions?.length) {
            const memberPerms = context.memberPermissions ?? 0n;
            const hasAllPerms = cmd.requiredPermissions.every((perm) => {
                const required = BigInt(perm as any);
                return (memberPerms & required) === required;
            });
            if (!hasAllPerms) {
                return {
                    content: `❌ You are missing the required permissions to run \`/${cmdName}\`.`,
                    ephemeral: true,
                };
            }
        }

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

    async onComponentInteraction(_data: any, _context: BotContext): Promise<BotResponse | null> {
        return null;
    }

    /** Handle a modal form submission */
    async onModalSubmit(_data: any, _context: BotContext): Promise<BotResponse | null> {
        return null;
    }

    /** Handle autocomplete for a slash command option */
    async onAutocomplete(_data: any, _context: BotContext): Promise<BotResponse | null> {
        return null;
    }
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

    async handleInteraction(interaction: any, fallbackBot?: BaseBot): Promise<BotResponse | null> {
        const bot = this.botsByAppId.get(interaction.applicationId)
            || fallbackBot
            || this.botsByName.get('official beacon bot')
            || this.botsByName.get('beacon bot')
            || this.bots.values().next().value;
        if (!bot) return null;

        const context: BotContext = {
            userId: interaction.member?.user?.id || interaction.user?.id,
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            memberRoleIds: Array.isArray(interaction.member?.roles) ? interaction.member.roles : [],
            memberPermissions: interaction.member?.permissions !== undefined ? BigInt(interaction.member.permissions) : undefined,
            interactionData: interaction.data,
            sourceMessageId: interaction.message?.id,
            targetId: interaction.data?.target_id,
            resolved: interaction.data?.resolved,
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

        // 2. Native bot commands (APPLICATION_COMMAND = 2)
        if (interaction.type === 2) {
            const data = interaction.data;
            if (!data) return null;

            let currentPath = [data.name];
            let options = Array.isArray(data.options) ? data.options : [];
            const args: Record<string, any> = {};

            // Recursive function to parse subcommands and collect arguments
            const parseOptions = (opts: any[]) => {
                for (const opt of opts) {
                    if (opt.type === 1 || opt.type === 2) { // SUB_COMMAND or SUB_COMMAND_GROUP
                        currentPath.push(opt.name);
                        if (Array.isArray(opt.options)) {
                            parseOptions(opt.options);
                        }
                    } else {
                        args[opt.name] = opt.value;
                    }
                }
            };

            parseOptions(options);

            // Handle Context Menus (USER=2, MESSAGE=3)
            const commandType = data.type || 1; // Default to CHAT_INPUT
            const fullCommandName = currentPath.join(' ');
            
            // For User/Message commands, the "name" is the command name, but it has no options usually
            // but we need to find the command in our map.
            const cmd = bot.commands.get(data.name);
            if (!cmd) return null;

            // Permission & Cooldown checks
            if (cmd.requiredRoleIds?.length) {
                const memberRoles = new Set(context.memberRoleIds || []);
                const hasRole = cmd.requiredRoleIds.some(roleId => memberRoles.has(roleId));
                if (!hasRole) {
                    return { content: `❌ Missing required roles for \`/${data.name}\`.`, ephemeral: true };
                }
            }

            if (cmd.requiredPermissions?.length) {
                const memberPerms = context.memberPermissions ?? 0n;
                const hasAllPerms = cmd.requiredPermissions.every((perm) => (memberPerms & BigInt(perm as any)) === BigInt(perm as any));
                if (!hasAllPerms) {
                    return { content: `❌ Missing required permissions for \`/${data.name}\`.`, ephemeral: true };
                }
            }

            if (cmd.cooldownMs && bot.isOnCooldown(data.name, context.userId)) {
                return { content: `⏳ Command \`/${data.name}\` is on cooldown.`, ephemeral: true };
            }

            // Set sub-command info in context if applicable
            if (currentPath.length > 1) {
                (context as any).subCommand = currentPath[currentPath.length - 1];
                (context as any).subCommandGroup = currentPath.length > 2 ? currentPath[1] : undefined;
            }

            const response = await cmd.handler(args, context);
            if (cmd.cooldownMs) bot.setCooldown(data.name, context.userId, cmd.cooldownMs);
            return response;
        }

        // 3. Component interaction (type 3) — buttons, selects
        if (interaction.type === 3) {
            return bot.onComponentInteraction(interaction.data, context);
        }

        // 4. Autocomplete (type 4)
        if (interaction.type === 4) {
            const result = await bot.onAutocomplete(interaction.data, context);
            if (result) {
                // Tag response so the controller knows this is an autocomplete result
                (result as any)._responseType = 8; // APPLICATION_COMMAND_AUTOCOMPLETE_RESULT
                (result as any)._choices = (result as any).choices || [];
            }
            return result;
        }

        // 5. Modal submit (type 5)
        if (interaction.type === 5) {
            return bot.onModalSubmit(interaction.data, context);
        }

        return null;
    }
}

export const botFramework = new BotFramework();
