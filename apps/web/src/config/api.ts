// Backend API Configuration
export const API_CONFIG = {
  // Production API URL (Railway deployment)
  BASE_URL: import.meta.env.VITE_API_URL || 'https://beacon-production.up.railway.app',
  
  // WebSocket Gateway URL
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://beacon-production.up.railway.app',
  
  // Supabase PostgreSQL (via API proxy for security)
  SUPABASE_URL: 'https://db.cikitgsftvtpnjdiigxf.supabase.co',
  
  // Cloudinary for media
  CLOUDINARY_CLOUD_NAME: 'dvbag0oy5',
  CLOUDINARY_UPLOAD_PRESET: 'beacon_uploads',
  
  // API Request Configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // WebSocket Configuration
  WS_RECONNECT_INTERVAL: 5000,
  WS_MAX_RECONNECT_ATTEMPTS: 10,
  WS_HEARTBEAT_INTERVAL: 30000,
  
  // Cache Configuration
  CACHE_TTL: 300000, // 5 minutes
  MESSAGE_CACHE_LIMIT: 1000,
  
  // Feature Flags
  FEATURES: {
    VOICE_CHANNELS: true,
    VIDEO_CALLS: true,
    SCREEN_SHARE: true,
    BOTS: true,
    WEBHOOKS: true,
    EMOJIS: true,
    REACTIONS: true,
    THREADS: true,
    STAGE_CHANNELS: true,
    DEVELOPER_MODE: true,
    AI_MODERATION: true,
  },
  
  // Rate Limiting (client-side)
  RATE_LIMITS: {
    MESSAGE_SEND: { max: 10, window: 10000 }, // 10 msgs per 10s
    FILE_UPLOAD: { max: 5, window: 60000 }, // 5 files per minute
    API_REQUEST: { max: 50, window: 60000 }, // 50 requests per minute
  },
  
  // Media Configuration
  MEDIA: {
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
    MAX_AVATAR_SIZE: 8 * 1024 * 1024, // 8MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
    ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/json'],
  },
}

// Backend Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  
  // Users
  USERS: {
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE: '/users/me',
    RELATIONSHIPS: '/users/relationships',
    FRIENDS: '/users/friends',
    BLOCKED: '/users/blocked',
    PRESENCE: '/users/presence',
  },
  
  // Guilds (Servers)
  GUILDS: {
    LIST: '/guilds',
    CREATE: '/guilds',
    BY_ID: (id: string) => `/guilds/${id}`,
    UPDATE: (id: string) => `/guilds/${id}`,
    DELETE: (id: string) => `/guilds/${id}`,
    MEMBERS: (id: string) => `/guilds/${id}/members`,
    CHANNELS: (id: string) => `/guilds/${id}/channels`,
    ROLES: (id: string) => `/guilds/${id}/roles`,
    INVITES: (id: string) => `/guilds/${id}/invites`,
    BANS: (id: string) => `/guilds/${id}/bans`,
    WEBHOOKS: (id: string) => `/guilds/${id}/webhooks`,
  },
  
  // Channels
  CHANNELS: {
    BY_ID: (id: string) => `/channels/${id}`,
    MESSAGES: (id: string) => `/channels/${id}/messages`,
    MESSAGE_BY_ID: (channelId: string, msgId: string) => `/channels/${channelId}/messages/${msgId}`,
    TYPING: (id: string) => `/channels/${id}/typing`,
    PINS: (id: string) => `/channels/${id}/pins`,
    WEBHOOKS: (id: string) => `/channels/${id}/webhooks`,
  },
  
  // Direct Messages
  DMS: {
    LIST: '/dms',
    CREATE: '/dms',
    BY_ID: (id: string) => `/dms/${id}`,
    MESSAGES: (id: string) => `/dms/${id}/messages`,
  },
  
  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    AVATAR: '/media/avatar',
    EMOJI: '/media/emoji',
    STICKER: '/media/sticker',
  },
  
  // Voice
  VOICE: {
    TOKEN: '/voice/token',
    REGION: '/voice/region',
  },
  
  // Applications/Bots
  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications',
    BY_ID: (id: string) => `/applications/${id}`,
    REGENERATE_TOKEN: (id: string) => `/applications/${id}/reset-token`,
    COMMANDS: (id: string) => `/applications/${id}/commands`,
  },
  
  // Webhooks
  WEBHOOKS: {
    EXECUTE: (id: string, token: string) => `/webhooks/${id}/${token}`,
  },
}

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  HELLO: 'HELLO',
  IDENTIFY: 'IDENTIFY',
  READY: 'READY',
  HEARTBEAT: 'HEARTBEAT',
  HEARTBEAT_ACK: 'HEARTBEAT_ACK',
  RESUME: 'RESUME',
  RECONNECT: 'RECONNECT',
  INVALID_SESSION: 'INVALID_SESSION',
  
  // Messages
  MESSAGE_CREATE: 'MESSAGE_CREATE',
  MESSAGE_UPDATE: 'MESSAGE_UPDATE',
  MESSAGE_DELETE: 'MESSAGE_DELETE',
  MESSAGE_DELETE_BULK: 'MESSAGE_DELETE_BULK',
  MESSAGE_REACTION_ADD: 'MESSAGE_REACTION_ADD',
  MESSAGE_REACTION_REMOVE: 'MESSAGE_REACTION_REMOVE',
  
  // Guilds
  GUILD_CREATE: 'GUILD_CREATE',
  GUILD_UPDATE: 'GUILD_UPDATE',
  GUILD_DELETE: 'GUILD_DELETE',
  GUILD_MEMBER_ADD: 'GUILD_MEMBER_ADD',
  GUILD_MEMBER_UPDATE: 'GUILD_MEMBER_UPDATE',
  GUILD_MEMBER_REMOVE: 'GUILD_MEMBER_REMOVE',
  
  // Channels
  CHANNEL_CREATE: 'CHANNEL_CREATE',
  CHANNEL_UPDATE: 'CHANNEL_UPDATE',
  CHANNEL_DELETE: 'CHANNEL_DELETE',
  TYPING_START: 'TYPING_START',
  
  // Voice
  VOICE_STATE_UPDATE: 'VOICE_STATE_UPDATE',
  VOICE_SERVER_UPDATE: 'VOICE_SERVER_UPDATE',
  
  // Presence
  PRESENCE_UPDATE: 'PRESENCE_UPDATE',
  
  // Relationships
  RELATIONSHIP_ADD: 'RELATIONSHIP_ADD',
  RELATIONSHIP_REMOVE: 'RELATIONSHIP_REMOVE',
}

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  GATEWAY_UNAVAILABLE: 503,
}
