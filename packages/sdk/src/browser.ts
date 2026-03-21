// Browser-safe SDK surface.
// Use this entrypoint in frontend apps to avoid Node-only bot runtime modules.

export * from './types/index';

export { Client as BeaconClient } from './client';
export { BeaconEventEmitter as SDKEventEmitter } from './sdk/BeaconEventEmitter';
export type { MusicMetadata } from './types/index';

export { RestClient, type RestClientOptions } from './rest/RestClient';
export { resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from './connection';

// Builders
export * from './builders/index';

export { Collection } from './structures/Collection';
export { InteractionContext, type ReplyOptions } from './structures/InteractionContext';
export { Collector, type CollectorOptions } from './structures/Collector';
export type {
  RawMessage,
  RawUser,
  RawGuild,
  RawChannel,
  RawRole,
  RawGuildMember,
  RawAttachment,
  RawReaction,
  RawInteraction,
  InteractionOption,
} from './types/index';

export { GuildManager, type CreateGuildOptions, type EditGuildOptions } from './managers/GuildManager';
export { ChannelManager, type CreateChannelOptions, type EditChannelOptions } from './managers/ChannelManager';
export { MemberManager, type GuildMember, type ListMembersOptions } from './managers/MemberManager';
export { UserManager } from './managers/UserManager';
export { PresenceManager, type Presence, type Activity } from './managers/PresenceManager';

export { Permissions, PermissionFlags, type PermissionFlagValues } from './utils/Permissions';
export { BeaconEventEmitter, type BeaconEvents } from './events/EventEmitter';

// ─── Advanced SDK Systems (browser-safe) ───────────────────────────────────

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

// TTL-aware LRU cache
export { TTLCache } from './cache/TTLCache';

// Security (Supremacy Phase)
export { RequestSigner } from './security/RequestSigner';
export { TokenManager, type TokenInfo } from './security/TokenManager';

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

// Embed preset factories
export { EmbedPresets } from './builders/EmbedPresets';

// Context menu builder
export { ContextMenuBuilder, type ContextMenuData } from './builders/ContextMenuBuilder';

// Event router (browser-safe — accepts any EventEmitter)
export { EventRouter, type RouteGuard, type RouteHandler } from './routing/EventRouter';
