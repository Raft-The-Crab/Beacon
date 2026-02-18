export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

export interface User {
  id: string
  username: string
  discriminator?: string
  avatar: string | null
  email?: string
  status?: PresenceStatus
  customStatus?: string | null
}

export interface Server {
  id: string
  name: string
  icon: string | null
  banner?: string | null
  ownerId?: string
  createdAt?: string
}

export interface Channel {
  id: string
  guildId?: string
  serverId?: string
  name: string
  type: 'text' | 'voice' | 'category' | 'stage'
  position?: number
  parentId?: string
  topic?: string
  nsfw?: boolean
  slowmode?: number
}

export interface Message {
  id: string
  channelId: string
  authorId?: string
  author?: User
  content: string
  attachments: Attachment[]
  embeds: Embed[]
  mentions: string[]
  replyTo?: string
  editedAt?: string
  createdAt: string
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

export interface Role {
  id: string
  guildId?: string
  serverId?: string
  name: string
  color: string
  icon?: string
  position: number
  permissions: Permission[] | string
  hoist?: boolean
  mentionable?: boolean
}

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
