import { WebSocketServer, WebSocket as WSWebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { IncomingMessage } from 'http'
import { prisma, redis, MessageModel, ModerationReportModel } from '../db'
import { AuthService } from './auth'
import { moderationService } from './moderation'
import { SovereigntyService } from './sovereignty'
import { getGuildMembers, addGuildMember } from './membership'
import { PermissionService } from './permissions'
import { sanitizeMessage } from '../utils/sanitize'
import { wsRateLimit } from '../middleware/security'
import { WSOpCode, WSEventType, WSPayload, PermissionBit } from '@beacon/types'

export type WebSocketClient = WSWebSocket & {
  id: string
  isAlive: boolean
  userId?: string
  lastMessageTime?: number
}

export enum Permissions {
  MANAGE_MESSAGES = 'MANAGE_MESSAGES',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

export async function hasPermission(userId: string, guildId: string, permission: Permissions): Promise<boolean> {
  const permBit = permission === Permissions.ADMINISTRATOR 
    ? PermissionBit.ADMINISTRATOR 
    : PermissionBit.MANAGE_MESSAGES
  
  return PermissionService.hasPermission(userId, guildId, permBit)
}

export async function membershipGetGuildMembers(guildId: string): Promise<string[]> {
  // 1. Try Redis cache first
  const cachedMembers = await getGuildMembers(guildId)
  if (cachedMembers) return cachedMembers

  // 2. Fallback to Prisma
  const members = await prisma.guildMember.findMany({
    where: { guildId },
    select: { userId: true }
  })

  // 3. Update cache for future requests
  const memberIds = members.map((m: { userId: string }) => m.userId)
  for (const id of memberIds) {
    await addGuildMember(guildId, id)
  }

  return memberIds
}

export class GatewayService {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()

  constructor(wss: WebSocketServer) {
    this.wss = wss
    this.setup()
  }

  private setup() {
    // Subscribe to Redis pubsub channel for cross-instance events
    try {
      redis.subscribe('gateway:events', (message: any) => {
        if (message) this.handlePubSubEvent(message)
      })
    } catch (err) {
      console.warn('Failed to setup Redis pubsub', err)
    }

    this.wss.on('connection', async (ws: WebSocketClient, _req: IncomingMessage) => {
      ws.id = uuidv4()
      ws.isAlive = true
      this.clients.set(ws.id, ws)

      console.log(`New connection: ${ws.id}`)

      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', async (data: any) => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (err) {
          console.error('Invalid message format', err)
        }
      })

      ws.on('close', () => {
        this.handleDisconnect(ws)
      })

      // Send Hello Opcode
      this.send(ws, {
        op: WSOpCode.HELLO,
        d: {
          heartbeat_interval: 45000
        }
      })
    })

    // Heartbeat interval
    setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        const client = ws as WebSocketClient
        if (!client.isAlive) return client.terminate()

        client.isAlive = false
        client.ping()
      })
    }, 30000)
  }

  private async handleMessage(ws: WebSocketClient, message: WSPayload) {
    // Rate limiting
    if (ws.userId && message.t) {
      const allowed = await wsRateLimit(ws.userId, message.t)
      if (!allowed) {
        this.send(ws, { 
          op: WSOpCode.DISPATCH, 
          t: 'ERROR' as WSEventType, 
          d: { code: 4008, message: 'Rate limit exceeded' } 
        })
        return
      }
    }

    switch (message.op) {
      case WSOpCode.HEARTBEAT:
        this.send(ws, { op: WSOpCode.HEARTBEAT_ACK })
        break

      case WSOpCode.IDENTIFY:
        await this.handleIdentify(ws, message.d)
        break

      case WSOpCode.VOICE_STATE_UPDATE:
        await this.handleVoiceStateUpdate(ws, message.d)
        break

      case WSOpCode.DISPATCH:
        if (!message.t) return
        try {
          switch (message.t) {
            case 'MESSAGE_CREATE':
              await this.handleCreateMessage(ws, message.d)
              break
            case 'MESSAGE_UPDATE':
              await this.handleUpdateMessage(ws, message.d)
              break
            case 'MESSAGE_DELETE':
              await this.handleDeleteMessage(ws, message.d)
              break
            case 'MESSAGE_PIN':
              await this.handlePinMessage(ws, message.d)
              break
            case 'MESSAGE_UNPIN':
              await this.handleUnpinMessage(ws, message.d)
              break
            case 'MESSAGE_REACTION':
              await this.handleReaction(ws, message.d)
              break
            default:
              console.warn('Unhandled client event:', message.t)
          }
        } catch (err) {
          console.error('Error handling client event', err)
          this.send(ws, { 
            op: WSOpCode.DISPATCH, 
            t: 'ERROR' as WSEventType, 
            d: { code: 5000, message: 'Internal error' } 
          })
        }
        break
    }
  }

  private async handleVoiceStateUpdate(ws: WebSocketClient, data: { guild_id: string; channel_id: string | null; self_mute?: boolean; self_deaf?: boolean }) {
    if (!ws.userId) return

    const { guild_id, channel_id, self_mute, self_deaf } = data

    // Validate required fields
    if (!guild_id) {
      console.warn(`[Gateway] Missing guild_id in VOICE_STATE_UPDATE from user ${ws.userId}`)
      return
    }
    // channel_id can be null if the user leaves a voice channel
    // if (!channel_id) {
    //   console.warn(`[Gateway] Missing channel_id in VOICE_STATE_UPDATE from user ${ws.userId}`)
    //   return
    // }

    // Validate channel/guild access...

    // Broadcast to guild members
    // Ideally we fetch guild members from Redis or DB
    // For MVP, we broadcast to everyone in the guild (if we tracked it) or just naive broadcast

    // Store Voice State in Redis
    const stateKey = `voice:${guild_id}:${ws.userId}`
    if (channel_id) {
      await redis.hmset(stateKey, {
        channel_id,
        user_id: ws.userId,
        session_id: ws.id,
        self_mute: self_mute || false,
        self_deaf: self_deaf || false
      })
      await redis.expire(stateKey, 86400)
    } else {
      // User left voice
      await redis.del(stateKey)
    }

    // Emit event to clients
    this.broadcastToGuild(guild_id, {
      op: 0,
      t: 'VOICE_STATE_UPDATE',
      d: {
        guild_id,
        channel_id,
        user_id: ws.userId,
        session_id: ws.id,
        self_mute,
        self_deaf
      }
    })
  }

  private broadcastToGuild(guildId: string, payload: any) {
    ; (async () => {
      try {
        const members = await membershipGetGuildMembers(guildId)
        if (members && members.length > 0) {
          this.broadcast(members, payload)
          return
        }
      } catch (err) {
        console.warn('Failed to read guild members from Redis, falling back to broadcastAll', err)
      }

      // Fallback: broadcast to all connected clients (MVP)
      this.broadcastAll(payload)
    })()
  }

  private async getGuildMembers(guildId: string): Promise<string[] | null> {
    return await membershipGetGuildMembers(guildId)
  }

  private async handleCreateMessage(ws: WebSocketClient, data: any) {
    try {
      const { channelId, content } = data
      const authorId = ws.userId
      if (!authorId) {
        this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 4001, message: 'Not authenticated' } })
        return
      }

      // Sanitize content
      const sanitizedContent = sanitizeMessage(content)
      if (!sanitizedContent) {
        this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 4002, message: 'Invalid message content' } })
        return
      }

      // AI Moderation
      const { result: moderationResult } = await moderationService.checkMessage(sanitizedContent, authorId, channelId)

      if (!moderationResult.approved) {
        console.warn(`[AI Moderation] Prohibited message from ${authorId} in ${channelId}: "${sanitizedContent.substring(0, 50)}..." - Flags: ${moderationResult.flags?.join(', ')}`)
        this.send(ws, {
          op: WSOpCode.DISPATCH,
          t: 'MESSAGE_REJECTED' as WSEventType,
          d: {
            code: 4005,
            message: 'Your message was rejected by the moderation system.',
            flags: moderationResult.flags,
            score: moderationResult.score,
            status: moderationResult.status,
          },
        })

        await (ModerationReportModel as any).create({
          id: `report_${Date.now()}`,
          channel_id: channelId,
          guild_id: data.guildId || null,
          reporter_id: 'system',
          target_user_id: authorId,
          content: sanitizedContent,
          reason: moderationResult.reason,
          flags: moderationResult.flags,
          score: moderationResult.score,
          status: 'pending'
        })

        return
      }

      if (moderationResult.status === 'Warning') {
        const flags = moderationResult.flags || []
        console.log(`[AI Moderation] Warning message from ${authorId} in ${channelId}: "${sanitizedContent.substring(0, 50)}..." - Flags: ${flags.join(', ')}`)
      }

      console.log(`[AI Moderation] Message from ${authorId} in ${channelId}: "${sanitizedContent.substring(0, 50)}..." - Status: ${moderationResult.status}`)

      // Bot Interaction
      if (moderationResult.status !== 'Rejected') {
        const botContext = {
          userId: authorId,
          channelId: channelId,
          guildId: data.guildId || null,
          history: []
        }

        const { botFramework } = await import('../bots/index')
        const botResponse = await botFramework.handleMessage(sanitizedContent, botContext)

        if (botResponse) {
          const botMsg = await (MessageModel as any).create({
            id: `bot_${Date.now()}`,
            channel_id: channelId,
            guild_id: data.guildId || null,
            author: { id: 'oracle-bot-id', username: 'Oracle', bot: true },
            content: botResponse.content,
            timestamp: new Date(),
            metadata: {
              ...botResponse.metadata,
              actions: botResponse.actions
            }
          })

          const isZeroData = process.env.SOVEREIGNTY_LEVEL === '3'
          const optimizedMsg = await SovereigntyService.optimizePayload(botMsg, isZeroData)

          await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_CREATE', d: optimizedMsg }))
        }
      }

      // Create message
      const msg = await (MessageModel as any).create({
        id: Date.now().toString(),
        channel_id: channelId,
        guild_id: data.guildId || null,
        author: { id: authorId },
        content: sanitizedContent,
        timestamp: new Date(),
        moderationFlags: moderationResult.flags,
        moderationStatus: moderationResult.status,
        moderationScore: moderationResult.score,
      })

      const guildId = msg.guild_id || data.guildId
      try {
        await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_CREATE', d: msg }))
      } catch (err) {
        console.warn('Failed to publish MESSAGE_CREATE to redis', err)
        if (guildId) {
          const members = await this.getGuildMembers(guildId)
          if (members) this.broadcast(members, { op: WSOpCode.DISPATCH, t: 'MESSAGE_CREATE' as WSEventType, d: msg })
          else this.broadcastAll({ op: WSOpCode.DISPATCH, t: 'MESSAGE_CREATE' as WSEventType, d: msg })
        } else {
          this.broadcastAll({ op: WSOpCode.DISPATCH, t: 'MESSAGE_CREATE' as WSEventType, d: msg })
        }
      }
    } catch (err) {
      console.error('handleCreateMessage error', err)
      this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 5000, message: 'Internal server error during message processing.' } })
    }
  }

  private async handleUpdateMessage(_ws: WebSocketClient, data: any) {
    try {
      const { channelId, messageId, content } = data
      const { MessageModel } = await import('../db')
      const updated = await MessageModel.findOneAndUpdate({ id: messageId, channel_id: channelId }, { content, edited_timestamp: new Date() }, { new: true })
      if (updated) {
        try {
          await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_UPDATE', d: updated }))
        } catch (err) {
          console.warn('Failed to publish MESSAGE_UPDATE to redis', err)
          const guildId = updated.guild_id || data.guildId
          const members = guildId ? await this.getGuildMembers(guildId) : null
          if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_UPDATE', d: updated })
          else this.broadcastAll({ op: 0, t: 'MESSAGE_UPDATE', d: updated })
        }
      }
    } catch (err) {
      console.error('handleUpdateMessage error', err)
    }
  }

  private async handleDeleteMessage(ws: WebSocketClient, data: any) {
    try {
      const { channelId, messageId } = data
      const userId = ws.userId

      if (!userId) {
        this.send(ws, { op: 0, t: 'ERROR', d: { code: 4001, message: 'Not authenticated' } })
        return
      }

      const messageToDelete = await MessageModel.findOne({ id: messageId, channel_id: channelId })

      if (!messageToDelete) {
        this.send(ws, { op: 0, t: 'ERROR', d: { code: 4004, message: 'Message not found' } })
        return
      }

      // Check if user is the author
      const isAuthor = (messageToDelete.author as any)?.id === userId

      let canManageMessages = false
      if (messageToDelete.guild_id) {
        canManageMessages = await hasPermission(userId, messageToDelete.guild_id, Permissions.MANAGE_MESSAGES)
      }

      if (!isAuthor && !canManageMessages) {
        this.send(ws, { op: 0, t: 'ERROR', d: { code: 4003, message: 'Missing permissions to delete message' } })
        return
      }

      await MessageModel.deleteOne({ id: messageId, channel_id: channelId })

      // Broadcast delete to members of the channel's guild (best-effort)
      const guildId = messageToDelete.guild_id || data.guildId
      try {
        await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_DELETE', d: { channelId, messageId, guildId } }))
      } catch (err) {
        console.warn('Failed to publish MESSAGE_DELETE to redis', err)
        // Fallback to local broadcasting
        if (guildId) {
          const members = await this.getGuildMembers(guildId)
          if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_DELETE', d: { channelId, messageId } })
          else this.broadcastAll({ op: 0, t: 'MESSAGE_DELETE', d: { channelId, messageId } })
        } else {
          this.broadcastAll({ op: 0, t: 'MESSAGE_DELETE', d: { channelId, messageId } })
        }
      }
    } catch (err) {
      console.error('handleDeleteMessage error', err)
      this.send(ws, { op: 0, t: 'ERROR', d: { code: 5000, message: 'Internal server error during message deletion' } })
    }
  }

  private async handlePinMessage(_ws: WebSocketClient, data: any) {
    try {
      const { channelId, messageId } = data
      const { MessageModel } = await import('../db')
      const updated = await MessageModel.findOneAndUpdate({ id: messageId, channel_id: channelId }, { pinned: true }, { new: true })
      if (updated) {
        try {
          await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_PIN', d: { channelId, message: updated, guildId: updated.guild_id } }))
        } catch (err) {
          console.warn('Failed to publish MESSAGE_PIN to redis', err)
          const guildId = updated.guild_id || data.guildId
          const members = guildId ? await this.getGuildMembers(guildId) : null
          if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_PIN', d: { channelId, message: updated } })
          else this.broadcastAll({ op: 0, t: 'MESSAGE_PIN', d: { channelId, message: updated } })
        }
      }
    } catch (err) {
      console.error('handlePinMessage error', err)
    }
  }

  private async handleUnpinMessage(_ws: WebSocketClient, data: any) {
    try {
      const { channelId, messageId } = data
      const { MessageModel } = await import('../db')
      const updated = await MessageModel.findOneAndUpdate({ id: messageId, channel_id: channelId }, { pinned: false }, { new: true })
      if (updated) {
        try {
          await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_UNPIN', d: { channelId, message: updated, guildId: updated.guild_id } }))
        } catch (err) {
          console.warn('Failed to publish MESSAGE_UNPIN to redis', err)
          const guildId = updated.guild_id || data.guildId
          const members = guildId ? await this.getGuildMembers(guildId) : null
          if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_UNPIN', d: { channelId, message: updated } })
          else this.broadcastAll({ op: 0, t: 'MESSAGE_UNPIN', d: { channelId, message: updated } })
        }
      }
    } catch (err) {
      console.error('handleUnpinMessage error', err)
    }
  }

  private async handleReaction(ws: WebSocketClient, data: any) {
    try {
      const { channelId, messageId, emoji, remove } = data
      const { MessageModel } = await import('../db')
      const msgDoc = await MessageModel.findOne({ id: messageId, channel_id: channelId })
      if (!msgDoc) return
      const msg = msgDoc as any

      const userId = ws.userId
      if (!userId) return

      const reactions = msg.reactions || []
      const idx = reactions.findIndex((r: any) => (r.emoji && ((r.emoji.name && r.emoji.name === emoji) || r.emoji === emoji)))
      if (idx === -1 && !remove) {
        // add new reaction with users array
        reactions.push({ emoji: { name: emoji }, users: [userId] })
      } else if (idx !== -1) {
        const reaction: any = reactions[idx]
        const users: string[] = reaction.users || []
        if (remove) {
          const newUsers = users.filter((u) => u !== userId)
          if (newUsers.length === 0) {
            reactions.splice(idx, 1)
          } else {
            reactions[idx].users = newUsers
          }
        } else {
          if (!users.includes(userId)) users.push(userId)
          reactions[idx].users = users
        }
      }

      msg.reactions = reactions
      await msg.save()

      // Publish event to Redis for cross-instance propagation
      try {
        await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_REACTION', d: { channelId, messageId, reactions: msg.reactions, guildId: msg.guild_id } }))
      } catch (err) {
        console.warn('Failed to publish MESSAGE_REACTION to redis', err)
        // Fallback to local broadcast
        // Fallback to local broadcast
        const guildId = msg.guild_id
        const members = guildId ? await this.getGuildMembers(guildId) : null
        if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_REACTION', d: { channelId, messageId, reactions: msg.reactions } })
        else this.broadcastAll({ op: 0, t: 'MESSAGE_REACTION', d: { channelId, messageId, reactions: msg.reactions } })
      }
    } catch (err) {
      console.error('handleReaction error', err)
    }
  }

  private async handleIdentify(ws: WebSocketClient, data: any) {
    const { token } = data
    if (!token) {
      ws.close(4004, 'Authentication Failed')
      return
    }

    let userId: string | null = null

    if (token.startsWith('bot_')) {
      // Bot Authentication
      const bot = await prisma.bot.findUnique({
        where: { token },
        include: { application: true }
      })
      if (!bot) {
        ws.close(4004, 'Invalid Bot Token')
        return
      }
      userId = bot.userId || `bot:${bot.id}`
    } else {
      // User Authentication
      const payload = AuthService.verifyToken(token)
      if (!payload) {
        ws.close(4004, 'Authentication Failed')
        return
      }
      userId = payload.id
    }

    ws.userId = userId as string

    // Store session in Redis
    if (userId) {
      await redis.set(`session:${ws.id}`, userId, 'EX', 86400)
      await redis.sadd(`user_sessions:${userId}`, ws.id)
    }

    this.send(ws, {
      op: WSOpCode.DISPATCH,
      t: 'READY' as WSEventType,
      d: {
        v: 1,
        user: { id: userId },
        session_id: ws.id
      }
    })
  }

  private async handleDisconnect(ws: WebSocketClient) {
    this.clients.delete(ws.id)
    if (ws.userId) {
      await redis.set(`session:${ws.id}`, ws.userId, 'EX', 86400)
      await redis.srem(`user_sessions:${ws.userId}`, ws.id)
    }
    console.log(`Disconnected: ${ws.id}`)
  }

  private send(ws: WebSocketClient, payload: any) {
    if ((ws as any).readyState === (WebSocket as any).OPEN) {
      // --- Zero-Data Optimization (Sovereignty) ---
      // For general send, we apply system-level optimization if enabled
      const isZeroData = process.env.SOVEREIGNTY_LEVEL === '3';
      const optimizedPayload = SovereigntyService.optimizePayload(payload, isZeroData);

      (ws as any).send(JSON.stringify(optimizedPayload));
    }
  }

  public broadcast(userIds: string[], payload: any) {
    // In a real scaled app, this would publish to Redis PubSub
    // Here we iterate local clients for simplicity or MVP
    this.clients.forEach(client => {
      if (client.userId && userIds.includes(client.userId)) {
        this.send(client, payload)
      }
    })
  }

  // Broadcast to all connected clients (MVP)
  public broadcastAll(payload: any) {
    this.clients.forEach(client => {
      this.send(client, payload)
    })
  }

  // Handle events received from Redis pubsub and broadcast locally
  private async handlePubSubEvent(evt: any) {
    const t = evt.t
    const d = evt.d
    try {
      switch (t) {
        case 'MESSAGE_CREATE': {
          const guildId = d.guild_id || d.guildId
          if (guildId) {
            const members = await this.getGuildMembers(guildId)
            if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_CREATE', d })
            else this.broadcastAll({ op: 0, t: 'MESSAGE_CREATE', d })
          } else {
            this.broadcastAll({ op: 0, t: 'MESSAGE_CREATE', d })
          }
          break
        }
        case 'MESSAGE_UPDATE': {
          const guildId = d.guild_id || d.guildId
          if (guildId) {
            const members = await this.getGuildMembers(guildId)
            if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_UPDATE', d })
            else this.broadcastAll({ op: 0, t: 'MESSAGE_UPDATE', d })
          } else this.broadcastAll({ op: 0, t: 'MESSAGE_UPDATE', d })
          break
        }
        case 'MESSAGE_DELETE': {
          const guildId = d.guildId || d.guild_id
          if (guildId) {
            const members = await this.getGuildMembers(guildId)
            if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_DELETE', d })
            else this.broadcastAll({ op: 0, t: 'MESSAGE_DELETE', d })
          } else this.broadcastAll({ op: 0, t: 'MESSAGE_DELETE', d })
          break
        }
        case 'MESSAGE_PIN':
        case 'MESSAGE_UNPIN': {
          const guildId = d.guildId || d.message?.guild_id || d.message?.guildId
          if (guildId) {
            const members = await this.getGuildMembers(guildId)
            if (members) this.broadcast(members, { op: 0, t, d })
            else this.broadcastAll({ op: 0, t, d })
          } else this.broadcastAll({ op: 0, t, d })
          break
        }
        case 'MESSAGE_REACTION': {
          const guildId = d.guildId || d.guild_id
          if (guildId) {
            const members = await this.getGuildMembers(guildId)
            if (members) this.broadcast(members, { op: 0, t, d })
            else this.broadcastAll({ op: 0, t, d })
          } else this.broadcastAll({ op: 0, t, d })
          break
        }
        default:
          // unknown event
          break
      }
    } catch (err) {
      console.warn('handlePubSubEvent failed', err)
      this.broadcastAll({ op: 0, t: evt.t, d: evt.d })
    }
  }
}
