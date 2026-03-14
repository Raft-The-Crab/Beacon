// Browser-safe SDK surface.
// Use this entrypoint in frontend apps to avoid Node-only bot runtime modules.

export * from './types/index';

export { BeaconClient } from './sdk/BeaconClient';
export { BeaconEventEmitter as SDKEventEmitter } from './sdk/BeaconEventEmitter';
export type { MusicMetadata } from './types/index';

export { RestClient, type RestClientOptions } from './rest/RestClient';
export { resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from './connection';

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

export { GuildManager, type CreateGuildOptions, type EditGuildOptions } from './managers/GuildManager';
export { ChannelManager, type CreateChannelOptions, type EditChannelOptions, type FetchMessagesOptions } from './managers/ChannelManager';
export { MemberManager, type GuildMember, type ListMembersOptions } from './managers/MemberManager';
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
