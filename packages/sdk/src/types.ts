import type { User, Server, Channel, Message, Role, Presence, Permission } from './core-types'

// Re-export types from @beacon/types
export type { User, Server, Channel, Message, Role, Presence, Permission } from './core-types'

/**
 * Configuration options for the Beacon SDK client
 */
export interface BeaconClientOptions {
  /** Base URL for the REST API */
  apiUrl: string
  
  /** WebSocket server URL */
  wsUrl: string
  
  /** Authentication token (if already authenticated) */
  token?: string
  
  /** Auto-reconnect on connection loss */
  reconnect?: boolean
  
  /** Maximum number of reconnection attempts */
  reconnectAttempts?: number
  
  /** Delay between reconnection attempts (ms) */
  reconnectDelay?: number
  
  /** Heartbeat interval for WebSocket (ms) */
  heartbeatInterval?: number
  
  /** Request timeout (ms) */
  requestTimeout?: number
  
  /** Enable debug logging */
  debug?: boolean
  
  /** Custom headers for API requests */
  headers?: Record<string, string>
  
  /** User agent string */
  userAgent?: string
}

/**
 * Message send options
 */
export interface SendMessageOptions {
  /** Message content */
  content?: string
  
  /** File attachments */
  attachments?: File[] | string[]
  
  /** Message embeds */
  embeds?: MessageEmbed[]
  
  /** Message to reply to */
  replyTo?: string
  
  /** Mention users */
  mentions?: string[]
  
  /** Silent message (no notifications) */
  silent?: boolean
}

/**
 * Message embed structure
 */
export interface MessageEmbed {
  title?: string
  description?: string
  url?: string
  color?: string
  timestamp?: string
  footer?: {
    text: string
    iconUrl?: string
  }
  author?: {
    name: string
    url?: string
    iconUrl?: string
  }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  image?: {
    url: string
    width?: number
    height?: number
  }
  thumbnail?: {
    url: string
  }
}

/**
 * Server creation options
 */
export interface CreateServerOptions {
  name: string
  icon?: string | File
  description?: string
  region?: string
}

/**
 * Channel creation options
 */
export interface CreateChannelOptions {
  name: string
  type: 'text' | 'voice' | 'category'
  topic?: string
  nsfw?: boolean
  parentId?: string
  rateLimitPerUser?: number
  permissions?: ChannelPermissionOverwrite[]
}

/**
 * Channel permission overwrite
 */
export interface ChannelPermissionOverwrite {
  id: string
  type: 'role' | 'user'
  allow: Permission[]
  deny: Permission[]
}

/**
 * Role creation options
 */
export interface CreateRoleOptions {
  name: string
  color?: string
  icon?: string
  permissions?: Permission[]
  hoist?: boolean
  mentionable?: boolean
  position?: number
}

/**
 * Presence status types
 */
export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

/**
 * Presence update options
 */
export interface UpdatePresenceOptions {
  status: PresenceStatus
  customStatus?: string
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching'
    name: string
    details?: string
    state?: string
  }
}

/**
 * Voice state
 */
export interface VoiceState {
  userId: string
  channelId?: string
  serverId?: string
  muted: boolean
  deafened: boolean
  selfMuted: boolean
  selfDeafened: boolean
  streaming: boolean
  videoEnabled: boolean
  speaking: boolean
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number
  before?: string
  after?: string
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: number
}

/**
 * WebSocket event types
 */
export type WSEventType =
  | 'READY'
  | 'MESSAGE'
  | 'MESSAGE_UPDATE'
  | 'MESSAGE_DELETE'
  | 'MESSAGE_REACTION_ADD'
  | 'MESSAGE_REACTION_REMOVE'
  | 'SERVER_CREATE'
  | 'SERVER_UPDATE'
  | 'SERVER_DELETE'
  | 'CHANNEL_CREATE'
  | 'CHANNEL_UPDATE'
  | 'CHANNEL_DELETE'
  | 'USER_UPDATE'
  | 'PRESENCE_UPDATE'
  | 'TYPING_START'
  | 'VOICE_STATE_UPDATE'
  | 'VOICE_SERVER_UPDATE'
  | 'SPEAKING_START'
  | 'SPEAKING_STOP'
  | 'ROLE_CREATE'
  | 'ROLE_UPDATE'
  | 'ROLE_DELETE'
  | 'MEMBER_JOIN'
  | 'MEMBER_UPDATE'
  | 'MEMBER_LEAVE'
  | 'BAN_ADD'
  | 'BAN_REMOVE'
  | 'INVITE_CREATE'
  | 'INVITE_DELETE'

/**
 * WebSocket event payload types
 */
export interface WSEventMap {
  READY: { user: User; servers: Server[] }
  MESSAGE: Message
  MESSAGE_UPDATE: Message
  MESSAGE_DELETE: { id: string; channelId: string }
  MESSAGE_REACTION_ADD: { messageId: string; channelId: string; userId: string; emoji: string }
  MESSAGE_REACTION_REMOVE: { messageId: string; channelId: string; userId: string; emoji: string }
  SERVER_CREATE: Server
  SERVER_UPDATE: Server
  SERVER_DELETE: { id: string }
  CHANNEL_CREATE: Channel
  CHANNEL_UPDATE: Channel
  CHANNEL_DELETE: { id: string; serverId: string }
  USER_UPDATE: User
  PRESENCE_UPDATE: Presence
  TYPING_START: { channelId: string; userId: string }
  VOICE_STATE_UPDATE: VoiceState
  VOICE_SERVER_UPDATE: { serverId: string; endpoint: string; token: string }
  SPEAKING_START: { userId: string; channelId: string }
  SPEAKING_STOP: { userId: string; channelId: string }
  ROLE_CREATE: { serverId: string; role: Role }
  ROLE_UPDATE: { serverId: string; role: Role }
  ROLE_DELETE: { serverId: string; roleId: string }
  MEMBER_JOIN: { serverId: string; user: User }
  MEMBER_UPDATE: { serverId: string; user: User }
  MEMBER_LEAVE: { serverId: string; userId: string }
  BAN_ADD: { serverId: string; user: User }
  BAN_REMOVE: { serverId: string; userId: string }
  INVITE_CREATE: { code: string; serverId: string; channelId: string; inviterId: string }
  INVITE_DELETE: { code: string; serverId: string }
}

/**
 * SDK event map for user-facing events
 */
export interface SDKEventMap {
  ready: void
  message: Message
  messageUpdate: Message
  messageDelete: { id: string; channelId: string }
  reactionAdd: { messageId: string; channelId: string; userId: string; emoji: string }
  reactionRemove: { messageId: string; channelId: string; userId: string; emoji: string }
  serverCreate: Server
  serverUpdate: Server
  serverDelete: string
  channelCreate: Channel
  channelUpdate: Channel
  channelDelete: { id: string; serverId: string }
  userUpdate: User
  presenceUpdate: Presence
  typingStart: { channelId: string; userId: string }
  voiceStateUpdate: VoiceState
  speakingStart: { userId: string; channelId: string }
  speakingStop: { userId: string; channelId: string }
  roleCreate: { serverId: string; role: Role }
  roleUpdate: { serverId: string; role: Role }
  roleDelete: { serverId: string; roleId: string }
  memberJoin: { serverId: string; user: User }
  memberUpdate: { serverId: string; user: User }
  memberLeave: { serverId: string; userId: string }
  disconnect: void
  reconnect: void
  error: Error
}

/**
 * Error types
 */
export class BeaconError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'BeaconError'
  }
}

export class AuthenticationError extends BeaconError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends BeaconError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429)
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends BeaconError {
  constructor(message: string = 'Network request failed') {
    super(message, 0)
    this.name = 'NetworkError'
  }
}

/**
 * Cache manager interface
 */
export interface CacheManager {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T, ttl?: number): void
  delete(key: string): void
  clear(): void
  has(key: string): boolean
}

/**
 * Rate limiter interface
 */
export interface RateLimiter {
  canMakeRequest(route: string): boolean
  waitForBucket(route: string): Promise<void>
  updateFromHeaders(route: string, headers: Headers): void
}
