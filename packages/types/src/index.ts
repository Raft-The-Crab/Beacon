// Beacon Type Definitions

// ============================================================================
// WebSocket Protocol Types
// ============================================================================

export enum WSOpCode {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  PRESENCE_UPDATE = 3,
  VOICE_STATE_UPDATE = 4,
  RESUME = 6,
  RECONNECT = 7,
  REQUEST_GUILD_MEMBERS = 8,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11,
}

export type WSEventType =
  | 'READY'
  | 'MESSAGE_CREATE'
  | 'MESSAGE_UPDATE'
  | 'MESSAGE_DELETE'
  | 'MESSAGE_PIN'
  | 'MESSAGE_UNPIN'
  | 'MESSAGE_REACTION'
  | 'MESSAGE_REJECTED'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'PRESENCE_UPDATE'
  | 'VOICE_STATE_UPDATE'
  | 'CHANNEL_CREATE'
  | 'CHANNEL_UPDATE'
  | 'CHANNEL_DELETE'
  | 'GUILD_CREATE'
  | 'GUILD_UPDATE'
  | 'GUILD_DELETE'
  | 'MEMBER_ADD'
  | 'MEMBER_REMOVE'
  | 'MEMBER_UPDATE'
  | 'ERROR'

export interface WSPayload<T = any> {
  op: WSOpCode
  d?: T
  t?: WSEventType
  s?: number
}

export interface WSIdentifyPayload {
  token: string
  properties?: {
    os?: string
    browser?: string
    device?: string
  }
}

export interface WSReadyPayload {
  v: number
  user: { id: string; username?: string; avatar?: string }
  session_id: string
  guilds?: Array<{ id: string; unavailable?: boolean }>
}

export interface WSErrorPayload {
  code: number
  message: string
  details?: any
}

// ============================================================================
// Core Domain Types
// ============================================================================

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

export interface User {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  email: string
  status: PresenceStatus
  customStatus: string | null
  theme?: string
  bio?: string | null
  banner?: string | null
  developerMode?: boolean
}

export interface Guild {
  id: string
  name: string
  icon: string | null
  banner: string | null
  ownerId: string
  createdAt: string
  memberCount?: number
  members?: User[]
  channels?: Channel[]
}

// Server is an alias for Guild
export type Server = Guild

export interface Presence {
  userId: string
  status: PresenceStatus
  customStatus?: string | null
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching'
    name: string
    details?: string
    state?: string
  }
  lastSeen?: string
}

export interface Channel {
  id: string
  guildId: string
  name: string
  type: 'text' | 'voice' | 'category' | 'stage'
  position: number
  parentId?: string
  topic?: string
  nsfw: boolean
  slowmode: number
}

export interface Message {
  id: string
  channelId: string
  authorId: string
  content: string
  attachments: Attachment[]
  embeds: Embed[]
  mentions: string[]
  replyTo?: string
  editedAt?: string
  createdAt: string
}

export interface MessageReaction {
  emoji: { id?: string | null; name?: string | null; animated?: boolean | null } | string
  users?: string[]
}

// Extend Message with optional runtime fields used by clients
export interface MessageWithExtras extends Message {
  reactions?: MessageReaction[]
  pinned?: boolean
}

export interface Attachment {
  id: string
  filename: string
  size: number
  url: string
  contentType: string
}

export interface Embed {
  title?: string
  description?: string
  color?: number
  image?: { url: string }
  thumbnail?: { url: string }
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

export interface Role {
  id: string
  guildId: string
  name: string
  color: string
  icon?: string
  position: number
  permissions: string
  hoist?: boolean
  mentionable?: boolean
}

export type Permission =
  | 'ADMINISTRATOR'
  | 'MANAGE_SERVER'
  | 'MANAGE_ROLES'
  | 'MANAGE_CHANNELS'
  | 'KICK_MEMBERS'
  | 'BAN_MEMBERS'
  | 'CREATE_INVITE'
  | 'CHANGE_NICKNAME'
  | 'MANAGE_NICKNAMES'
  | 'MANAGE_MESSAGES'
  | 'SEND_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'ADD_REACTIONS'
  | 'USE_EXTERNAL_EMOJIS'
  | 'MENTION_EVERYONE'
  | 'MANAGE_WEBHOOKS'
  | 'VIEW_CHANNELS'
  | 'SEND_TTS_MESSAGES'
  | 'CONNECT_VOICE'
  | 'SPEAK_VOICE'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'USE_VOICE_ACTIVITY'
  | 'PRIORITY_SPEAKER'

export interface Member {
  userId: string
  guildId: string
  nick?: string
  roles: string[]
  joinedAt: string
}

export interface VoiceState {
  userId: string
  channelId: string | null
  deaf: boolean
  mute: boolean
  selfDeaf: boolean
  selfMute: boolean
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// ============================================================================
// Permission System
// ============================================================================

export enum PermissionBit {
  ADMINISTRATOR = 1n << 0n,
  MANAGE_SERVER = 1n << 1n,
  MANAGE_ROLES = 1n << 2n,
  MANAGE_CHANNELS = 1n << 3n,
  KICK_MEMBERS = 1n << 4n,
  BAN_MEMBERS = 1n << 5n,
  CREATE_INVITE = 1n << 6n,
  MANAGE_NICKNAMES = 1n << 7n,
  MANAGE_MESSAGES = 1n << 8n,
  SEND_MESSAGES = 1n << 9n,
  EMBED_LINKS = 1n << 10n,
  ATTACH_FILES = 1n << 11n,
  ADD_REACTIONS = 1n << 12n,
  USE_EXTERNAL_EMOJIS = 1n << 13n,
  MENTION_EVERYONE = 1n << 14n,
  MANAGE_WEBHOOKS = 1n << 15n,
  VIEW_CHANNELS = 1n << 16n,
  CONNECT_VOICE = 1n << 17n,
  SPEAK_VOICE = 1n << 18n,
  MUTE_MEMBERS = 1n << 19n,
  DEAFEN_MEMBERS = 1n << 20n,
  MOVE_MEMBERS = 1n << 21n,
}

// ============================================================================
// Moderation Types
// ============================================================================

export interface ModerationResult {
  approved: boolean
  status: 'Approved' | 'Warning' | 'Rejected'
  score: number
  flags?: string[]
  reason?: string
}

// ============================================================================
// Search Types
// ============================================================================

export interface MessageSearchQuery {
  content?: string
  authorId?: string
  channelId?: string
  guildId?: string
  before?: string
  after?: string
  limit?: number
  offset?: number
}

export interface MessageSearchResult {
  messages: Message[]
  total: number
  hasMore: boolean
}
