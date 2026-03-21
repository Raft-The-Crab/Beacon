/**
 * beacon-sdk v3 — Official Bot SDK for Beacon
 */

// Core types (Consolidated — includes all beacon-types definitions)
export * from './types/index';

// SDK API Client (Consolidated)
export { BeaconEventEmitter as SDKEventEmitter } from './sdk/BeaconEventEmitter';

// Core bot client
export { Client, type Plugin, Client as BeaconClient } from './client';
export { AIClient, type AIClientOptions } from './enhanced';

// Gateway
export { Intents, DEFAULT_INTENTS, type GatewayOptions, type ConnectionState, type HealthGrade, type GatewaySessionInfo } from './gateway';

// REST
export { RestClient, type RestClientOptions, type RestMetrics, SDK_VERSION } from './rest/RestClient';
export { resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from './connection';

// Builders
export * from './builders/index';

// Structures
export { Collection } from './structures/Collection';

// Utility Managers
export { VoiceManager } from './voice/VoiceManager';
export { GuildManager, type CreateGuildOptions, type EditGuildOptions } from './managers/GuildManager';
export { ChannelManager, type CreateChannelOptions, type EditChannelOptions } from './managers/ChannelManager';
export { MemberManager, type ListMembersOptions } from './managers/MemberManager';
export { UserManager } from './managers/UserManager';
export { PresenceManager, type Presence, type Activity } from './managers/PresenceManager';
export { RoleManager, type RoleData } from './managers/RoleManager';
export { GuildMemberManager } from './managers/GuildMemberManager';
export { GuildChannelManager } from './managers/GuildChannelManager';
export { GuildEmojiManager, type EmojiData } from './managers/GuildEmojiManager';
export { AuditLogManager, type AuditLogFetchOptions } from './managers/AuditLogManager';
export { GuildScheduledEventManager } from './managers/GuildScheduledEventManager';
export { E2EEContext } from './structures/E2EEContext';

// Structures
export { Guild } from './structures/Guild';
export { Channel } from './structures/Channel';
export { User } from './structures/User';
export { Message } from './structures/Message';
export { GuildMember } from './structures/GuildMember';
export { VoiceState } from './structures/VoiceState';
export { InteractionContext } from './structures/InteractionContext';
export { Collector, type CollectorOptions } from './structures/Collector';
export { ReactionCollector, type ReactionData } from './structures/ReactionCollector';
export { ComponentCollector } from './structures/ComponentCollector';
export { VoiceStateCollector } from './structures/VoiceStateCollector';
export { ModalCollector, type ModalCollectorOptions } from './structures/ModalCollector';
export { AuditLog, AuditLogEntry } from './structures/AuditLog';
export { ScheduledEvent } from './structures/ScheduledEvent';

// Utilities
export { Permissions, PermissionFlags, type PermissionFlagValues } from './utils/Permissions';
export { IntentCalculator } from './utils/IntentCalculator';
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

// Security (Supremacy Phase)
export { RequestSigner } from './security/RequestSigner';
export { TokenManager, type TokenInfo } from './security/TokenManager';

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

export { InviteManager } from './managers/InviteManager';
export { GuildInviteManager } from './managers/GuildInviteManager';
export { PermissionOverwrite } from './structures/PermissionOverwrite';
export { Invite } from './structures/Invite';

// Event router (pattern-based gateway event routing)
export { EventRouter, type RouteGuard, type RouteHandler } from './routing/EventRouter';
