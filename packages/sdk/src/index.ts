/**
 * beacon-sdk — Official Bot SDK for Beacon
 */

// Core types (Consolidated)
export * from './types/index';

// SDK API Client (Consolidated)
export { BeaconClient } from './sdk/BeaconClient';
export { BeaconEventEmitter as SDKEventEmitter } from './sdk/BeaconEventEmitter';
export { BotFramework, pingCommand, helpCommand, announceCommand, waitCommand } from './sdk/bot';
export type {
  BotCommand,
  BotContext,
  BotFrameworkApi,
  BotFrameworkOptions,
  BotMiddleware,
  BotPlugin,
  BotScheduleJob,
  CommandOption as BotCommandOption,
} from './sdk/bot';
export type { MusicMetadata } from './types/index';

// Core bot client
export { Client } from './client';
export { AIClient, type AIClientOptions } from './enhanced';

// Gateway
export { Gateway, Intents, DEFAULT_INTENTS, type GatewayOptions } from './gateway';

// REST
export { RestClient, type RestClientOptions } from './rest/RestClient';
export { resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from './connection';

// Builders
export { CommandBuilder, CommandOptionBuilder, CommandOptionType, type Command, type CommandOption } from './builders/CommandBuilder';
export { EmbedBuilder, type Embed } from './builders/EmbedBuilder';
export { ButtonBuilder, type ButtonData, type ButtonStyle } from './builders/ButtonBuilder';
export { SelectMenuBuilder, type SelectMenuData, type SelectMenuOption } from './builders/SelectMenuBuilder';
export { ActionRowBuilder, type ActionRowData, type ActionRowComponent } from './builders/ActionRowBuilder';
export { ModalBuilder, TextInputBuilder, type ModalData, type TextInputData } from './builders/ModalBuilder';
export { PollBuilder, type PollData, type PollOption } from './builders/PollBuilder';
export { CardBuilder, type CardData, type CardField } from './builders/CardBuilder';
export { FormBuilder, type FormData, type FormField } from './builders/FormBuilder';
export { PaginatorBuilder, type PaginatorData, type PaginatorPage } from './builders/PaginatorBuilder';
export { TimelineBuilder, type TimelineData, type TimelineEvent } from './builders/TimelineBuilder';
export { TableBuilder, type TableData, type TableColumn, type TableRow } from './builders/TableBuilder';
export { DropdownBuilder, type DropdownData, type DropdownOption, type DropdownType } from './builders/DropdownBuilder';

// Structures
export { Collection } from './structures/Collection';
export { InteractionContext, type ReplyOptions } from './structures/InteractionContext';
export { Collector, type CollectorOptions } from './structures/Collector';
export type {
  RawMessage,
  RawUser,
  RawGuild,
  RawChannel,
  RawRole,
  RawMember,
  RawAttachment,
  RawReaction,
  RawInteraction,
  InteractionOption,
} from './structures/Message';

// Utility Managers
export { VoiceManager } from './managers/VoiceManager';
export { GuildManager, type CreateGuildOptions, type EditGuildOptions } from './managers/GuildManager';
export { ChannelManager, type CreateChannelOptions, type EditChannelOptions, type FetchMessagesOptions } from './managers/ChannelManager';
export { MemberManager, type GuildMember, type ListMembersOptions } from './managers/MemberManager';
export { PresenceManager, type Presence, type Activity } from './managers/PresenceManager';
export { E2EEContext } from './structures/E2EEContext';

// Utilities
export { Permissions, PermissionFlags, type PermissionFlagValues } from './utils/Permissions';
export { BeaconEventEmitter, type BeaconEvents } from './events/EventEmitter';

// ─── Advanced SDK Systems ───────────────────────────────────────────────────

// Typed error hierarchy
export {
  BeaconError,
  BeaconAPIError,
  RateLimitError,
  GatewayError,
  AuthenticationError,
  ValidationError,
  ShardError,
  TimeoutError,
  UploadError,
} from './errors';

// Cooldown management (per-user/channel/guild/global)
export { CooldownManager, type CooldownOptions, type CooldownScope } from './cooldowns/CooldownManager';

// TTL-aware LRU cache
export { TTLCache } from './cache/TTLCache';

// Middleware pipeline
export {
  MiddlewarePipeline,
  type MiddlewareFn,
  loggerMiddleware,
  guildAllowlistMiddleware,
  userBlocklistMiddleware,
  ignoreBotMessagesMiddleware,
} from './middleware/Middleware';

// Standalone webhook client
export { WebhookClient, type WebhookClientOptions, type WebhookMessageOptions } from './webhooks/WebhookClient';

// SDK API modules (notifications, webhooks, invites)
export { NotificationsAPI } from './sdk/api/NotificationsAPI';
export { WebhooksAPI } from './sdk/api/WebhooksAPI';
export { InvitesAPI } from './sdk/api/InvitesAPI';
export type { NotificationData } from './sdk/api/NotificationsAPI';
export type { WebhookData, CreateWebhookOptions, ExecuteWebhookOptions } from './sdk/api/WebhooksAPI';
export type { InviteData, CreateInviteOptions } from './sdk/api/InvitesAPI';

// Full command registry (cooldowns, autocomplete, per-command middleware, REST sync)
export {
  CommandRegistry,
  type CommandDefinition,
  type CommandHandler as RegistryCommandHandler,
  type CommandMiddleware,
  type AutocompleteContext,
  type AutocompleteChoice,
} from './registry/CommandRegistry';

// Multi-shard gateway manager
export { ShardManager, type ShardManagerOptions } from './sharding/ShardManager';
export type ShardStatus = 'idle' | 'connecting' | 'ready' | 'reconnecting' | 'dead';

// Embed preset factories
export { EmbedPresets } from './builders/EmbedPresets';

// Context menu builder (USER / MESSAGE types)
export { ContextMenuBuilder, type ContextMenuData } from './builders/ContextMenuBuilder';

// Scheduled task runner
export {
  ScheduledTaskManager,
  type IntervalTaskOptions,
  type CronTaskOptions,
  type TaskOptions,
  type TaskFn,
} from './tasks/ScheduledTask';

// Event router (pattern-based gateway event routing)
export { EventRouter, type RouteGuard, type RouteHandler } from './routing/EventRouter';

// Plugin system types
export type { Plugin } from './client';
