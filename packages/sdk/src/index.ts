// Main client
export { BeaconClient } from './BeaconClient'
export { BotFramework, pingCommand, helpCommand, announceCommand } from './bot'

// API modules
export { AuthAPI } from './api/AuthAPI'
export { MessagesAPI } from './api/MessagesAPI'
export { ServersAPI } from './api/ServersAPI'
export { ChannelsAPI } from './api/ChannelsAPI'
export { UsersAPI } from './api/UsersAPI'
export { RolesAPI } from './api/RolesAPI'
export { PresenceAPI } from './api/PresenceAPI'
export { VoiceAPI } from './api/VoiceAPI'
export { HTTPClient } from './api/HTTPClient'

// WebSocket client
export { WSClient } from './ws/WSClient'

// Events
export { BeaconEventEmitter } from './BeaconEventEmitter'

// Utilities
export { MemoryCacheManager, APIRateLimiter } from './utils'
export * from './utils'

// Types
export type {
  BeaconClientOptions,
  SendMessageOptions,
  MessageEmbed,
  CreateServerOptions,
  CreateChannelOptions,
  ChannelPermissionOverwrite,
  CreateRoleOptions,
  PresenceStatus,
  UpdatePresenceOptions,
  VoiceState,
  PaginationOptions,
  ApiResponse,
  WSEventType,
  WSEventMap,
  SDKEventMap,
  CacheManager,
  RateLimiter
} from './types'

export {
  BeaconError,
  AuthenticationError,
  RateLimitError,
  NetworkError
} from './types'

export type {
  BotCommand,
  BotContext,
  BotFrameworkApi,
  BotFrameworkOptions,
  BotMiddleware,
  BotPlugin,
  BotScheduleJob,
  CommandOption
} from './bot'

// Re-export SDK core entity types
export type {
  User,
  Server,
  Channel,
  Message,
  Role,
  Presence,
  Permission
} from './core-types'
