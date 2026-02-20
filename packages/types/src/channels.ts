// Enhanced Channel Types for Beacon

export enum ChannelType {
  // Text Channels
  TEXT = 'TEXT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  RULES = 'RULES',
  
  // Voice Channels
  VOICE = 'VOICE',
  STAGE = 'STAGE',
  CONFERENCE = 'CONFERENCE',
  
  // Video Channels
  VIDEO = 'VIDEO',
  STREAMING = 'STREAMING',
  WATCH_PARTY = 'WATCH_PARTY',
  
  // Organization
  CATEGORY = 'CATEGORY',
  FOLDER = 'FOLDER',
  
  // Special Channels
  FORUM = 'FORUM',
  THREAD = 'THREAD',
  MEDIA = 'MEDIA',
  GALLERY = 'GALLERY',
  MUSIC = 'MUSIC',
  PODCAST = 'PODCAST',
  
  // Direct Messages
  DM = 'DM',
  GROUP_DM = 'GROUP_DM',
  
  // Advanced
  WHITEBOARD = 'WHITEBOARD',
  NOTES = 'NOTES',
  CALENDAR = 'CALENDAR',
  TASKS = 'TASKS',
  WIKI = 'WIKI',
  CODE = 'CODE',
  GAMING = 'GAMING',
  MARKETPLACE = 'MARKETPLACE'
}

export interface ChannelConfig {
  type: ChannelType
  name: string
  description?: string
  nsfw?: boolean
  slowmode?: number
  permissions?: string[]
  
  // Voice/Video specific
  bitrate?: number
  userLimit?: number
  videoQuality?: 'auto' | '720p' | '1080p' | '4k'
  screenShareQuality?: ScreenShareQuality
  
  // Forum specific
  tags?: string[]
  requireTag?: boolean
  
  // Advanced features
  allowThreads?: boolean
  allowReactions?: boolean
  allowUploads?: boolean
  maxUploadSize?: number
}

export interface ScreenShareQuality {
  resolution: '720p' | '1080p' | '1440p' | '4k'
  fps: 30 | 60
  bitrate: number
}

// Screen Share Quality Tiers
export const SCREEN_SHARE_TIERS = {
  FREE: {
    resolution: '720p' as const,
    fps: 60,
    bitrate: 2500
  },
  PLUS: {
    resolution: '1080p' as const,
    fps: 60,
    bitrate: 4000
  },
  PRO: {
    resolution: '1440p' as const,
    fps: 60,
    bitrate: 6000
  },
  ULTRA: {
    resolution: '4k' as const,
    fps: 30,
    bitrate: 8000
  }
}

// Channel Icons
export const CHANNEL_ICONS = {
  [ChannelType.TEXT]: '💬',
  [ChannelType.ANNOUNCEMENT]: '📢',
  [ChannelType.RULES]: '📜',
  [ChannelType.VOICE]: '🔊',
  [ChannelType.STAGE]: '🎤',
  [ChannelType.CONFERENCE]: '📞',
  [ChannelType.VIDEO]: '📹',
  [ChannelType.STREAMING]: '📡',
  [ChannelType.WATCH_PARTY]: '🍿',
  [ChannelType.CATEGORY]: '📁',
  [ChannelType.FOLDER]: '🗂️',
  [ChannelType.FORUM]: '💭',
  [ChannelType.THREAD]: '🧵',
  [ChannelType.MEDIA]: '🖼️',
  [ChannelType.GALLERY]: '🎨',
  [ChannelType.MUSIC]: '🎵',
  [ChannelType.PODCAST]: '🎙️',
  [ChannelType.DM]: '✉️',
  [ChannelType.GROUP_DM]: '👥',
  [ChannelType.WHITEBOARD]: '🖍️',
  [ChannelType.NOTES]: '📝',
  [ChannelType.CALENDAR]: '📅',
  [ChannelType.TASKS]: '✅',
  [ChannelType.WIKI]: '📚',
  [ChannelType.CODE]: '💻',
  [ChannelType.GAMING]: '🎮',
  [ChannelType.MARKETPLACE]: '🛒'
}
