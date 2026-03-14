/**
 * CommandRegistry — Central registry for slash commands, context menus, and autocomplete.
 * Handles routing, subcommand groups, middlewares per command, and registration via REST.
 */

import { RestClient } from '../rest/RestClient';
import { InteractionContext } from '../structures/InteractionContext';
import { CooldownManager, CooldownOptions } from '../cooldowns/CooldownManager';
import { ValidationError } from '../errors';

export type CommandHandler = (ctx: InteractionContext) => void | Promise<void>;
export type AutocompleteHandler = (ctx: AutocompleteContext) => void | Promise<void>;
export type CommandMiddleware = (ctx: InteractionContext, next: () => Promise<void>) => void | Promise<void>;

export interface AutocompleteContext {
  interactionId: string;
  guildId?: string;
  channelId: string;
  commandName: string;
  focusedOption: string;
  focusedValue: string;
  respond(choices: AutocompleteChoice[]): Promise<void>;
}

export interface AutocompleteChoice {
  name: string;
  value: string | number;
}

export interface CommandDefinition {
  name: string;
  description: string;
  /** JSON for the API registration payload */
  payload: Record<string, any>;
  handler: CommandHandler;
  autocomplete?: AutocompleteHandler;
  middlewares?: CommandMiddleware[];
  cooldown?: CooldownOptions;
  /** Whether this command requires a guild context */
  guildOnly?: boolean;
  /** Required permission bits as BigInt string */
  defaultMemberPermissions?: string;
  /** At least one of these role IDs is required to execute this command. */
  requiredRoleIds?: string[];
  /** Member must include all of these permission bit flags. */
  requiredPermissions?: Array<string | bigint | number>;
}

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();
  private contextMenus = new Map<string, CommandHandler>();
  private cooldowns = new CooldownManager();

  /** Register a slash command. */
  register(definition: CommandDefinition): this {
    if (this.commands.has(definition.name)) {
      throw new ValidationError(`Command '${definition.name}' is already registered`);
    }
    this.commands.set(definition.name, definition);
    return this;
  }

  /** Register multiple commands at once. */
  registerAll(definitions: CommandDefinition[]): this {
    definitions.forEach(d => this.register(d));
    return this;
  }

  /** Register a user or message context menu handler. */
  registerContextMenu(name: string, handler: CommandHandler): this {
    this.contextMenus.set(name, handler);
    return this;
  }

  /** Look up a registered command by name. */
  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  /** All registered command names. */
  get names(): string[] {
    return [...this.commands.keys()];
  }

  /** Total count of slash commands + context menus. */
  get count(): number {
    return this.commands.size + this.contextMenus.size;
  }

  /**
   * Dispatch an incoming interaction to the appropriate handler.
   * Returns false if no handler was found.
   */
  async dispatch(ctx: InteractionContext): Promise<boolean> {
    const def = this.commands.get(ctx.commandName);
    if (!def && !this.contextMenus.has(ctx.commandName)) return false;

    // Guild-only guard
    if (def?.guildOnly && !ctx.guildId) {
      await ctx.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return true;
    }

    if (def?.requiredRoleIds?.length) {
      const memberRoles = new Set(ctx.memberRoleIds || []);
      const hasRole = def.requiredRoleIds.some(roleId => memberRoles.has(roleId));
      if (!hasRole) {
        await ctx.reply({
          content: '❌ You do not have a required role for this command.',
          ephemeral: true,
        });
        return true;
      }
    }

    if (def?.requiredPermissions?.length) {
      const memberPerms = BigInt(ctx.memberPermissions || '0');
      const hasAllPerms = def.requiredPermissions.every((perm) => {
        const required = BigInt(perm as any);
        return (memberPerms & required) === required;
      });
      if (!hasAllPerms) {
        await ctx.reply({
          content: '❌ You do not have the required permissions for this command.',
          ephemeral: true,
        });
        return true;
      }
    }

    // Cooldown check
    if (def?.cooldown) {
      const remaining = this.cooldowns.check(ctx.commandName, {
        userId: ctx.userId,
        channelId: ctx.channelId,
        guildId: ctx.guildId,
      }, def.cooldown);
      if (remaining > 0) {
        const secs = (remaining / 1000).toFixed(1);
        await ctx.reply({
          content: `⏳ You're on cooldown. Try again in **${secs}s**.`,
          ephemeral: true,
        });
        return true;
      }
    }

    // Build per-command middleware chain
    const middlewares = def?.middlewares ?? [];
    const handler = def?.handler ?? this.contextMenus.get(ctx.commandName)!;

    if (middlewares.length === 0) {
      await handler(ctx);
      return true;
    }

    let index = 0;
    const dispatch = async (): Promise<void> => {
      if (index >= middlewares.length) {
        await handler(ctx);
        return;
      }
      await middlewares[index++](ctx, dispatch);
    };
    await dispatch();
    return true;
  }

  /**
   * Push all registered commands to the Beacon API.
   * Pass guildId to register guild-scoped commands (instant), or omit for global (may take a few mins).
   */
  async syncWithAPI(rest: RestClient, applicationId: string, guildId?: string): Promise<void> {
    const payloads = [...this.commands.values()].map(c => c.payload);
    const endpoint = guildId
      ? `/applications/${applicationId}/guilds/${guildId}/commands`
      : `/applications/${applicationId}/commands`;
    await rest.put(endpoint, payloads);
  }

  /** Reset cooldowns for a user globally (e.g. after admin override). */
  resetUserCooldowns(userId: string): void {
    this.cooldowns.resetUser(userId);
  }

  destroy(): void {
    this.cooldowns.destroy();
  }
}
