import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/beacon'

export const connectMongo = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected')
      return
    }
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5, // Limit connections for low memory
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
    })
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

// Schemas for Non-Relational Data (Messages, Audit Logs)

const AttachmentSchema = new mongoose.Schema({
  id: String,
  filename: String,
  size: Number,
  url: String,
  proxy_url: String,
  height: Number,
  width: Number,
  content_type: String
})

const EmbedSchema = new mongoose.Schema({
  title: String,
  type: String,
  description: String,
  url: String,
  timestamp: Date,
  color: Number,
  footer: {
    text: String,
    icon_url: String,
    proxy_icon_url: String
  },
  image: {
    url: String,
    proxy_url: String,
    height: Number,
    width: Number
  },
  thumbnail: {
    url: String,
    proxy_url: String,
    height: Number,
    width: Number
  },
  video: {
    url: String,
    proxy_url: String,
    height: Number,
    width: Number
  },
  provider: {
    name: String,
    url: String
  },
  author: {
    name: String,
    url: String,
    icon_url: String,
    proxy_icon_url: String
  },
  fields: [{
    name: String,
    value: String,
    inline: Boolean
  }]
})

const ReactionSchema = new mongoose.Schema({
  emoji: {
    id: String,
    name: String,
    animated: Boolean
  },
  users: [String] // list of userIds who reacted with this emoji
})

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, // Snowflake
  channel_id: { type: String, required: true, index: true },
  guild_id: { type: String, index: true },
  author: {
    id: String,
    username: String,
    discriminator: String,
    avatar: String,
    bot: Boolean
  },
  content: String,
  timestamp: { type: Date, default: Date.now },
  edited_timestamp: Date,
  tts: Boolean,
  mention_everyone: Boolean,
  mentions: [String], // User IDs
  mention_roles: [String], // Role IDs
  attachments: [AttachmentSchema],
  embeds: [EmbedSchema],
  reactions: [ReactionSchema],
  nonce: String,
  pinned: Boolean,
  webhook_id: String,
  type: Number,
  activity: Object,
  application: Object,
  message_reference: Object,
  flags: Number,
  referenced_message: Object,
  interaction: Object,
  thread: Object,
  components: Array,
  sticker_items: Array,
  stickers: Array,
  metadata: Object
}, { timestamps: true })

// Index for search/history fetching
MessageSchema.index({ channel_id: 1, timestamp: -1 })
MessageSchema.index({ guild_id: 1, 'author.id': 1 }) // For audit/search
MessageSchema.index({ content: 'text' }) // Full text search

export const MessageModel = mongoose.model('Message', MessageSchema)

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  guild_id: { type: String, required: true, index: true },
  user_id: String,
  target_id: String,
  action_type: Number,
  changes: [{
    key: String,
    old_value: mongoose.Schema.Types.Mixed,
    new_value: mongoose.Schema.Types.Mixed
  }],
  reason: String,
  timestamp: { type: Date, default: Date.now }
})

// Auto-delete logs after 30 days (Enterprise best practice)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema)

const ModerationReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  message_id: String,
  channel_id: String,
  guild_id: String,
  reporter_id: String, // 'system' if AI rejected it
  target_user_id: String,
  content: String,
  reason: String,
  flags: [String],
  score: Number,
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  action_taken: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

export const ModerationReportModel = mongoose.model('ModerationReport', ModerationReportSchema)
