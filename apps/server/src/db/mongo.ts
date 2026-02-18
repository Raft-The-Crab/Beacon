// MongoDB connection setup using Mongoose
import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/beacon'

export const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
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
  stickers: Array
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

export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema)
