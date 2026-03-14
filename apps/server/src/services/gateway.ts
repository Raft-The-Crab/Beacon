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
import { publishGatewayEvent } from './gatewayPublisher'
import { questService } from './quest'

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
  const cachedMembers = await getGuildMembers(guildId)
  if (cachedMembers) return cachedMembers

  const members = await prisma.guildMember.findMany({
    where: { guildId },
    select: { userId: true }
  })

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
        d: { heartbeat_interval: 45000 }
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

  private async handleDisconnect(ws: WebSocketClient) {
    this.clients.delete(ws.id)
    if (ws.userId) {
      await redis.del(`session:${ws.id}`)
      await redis.srem(`user_sessions:${ws.userId}`, ws.id)

      const remainingSessions = await redis.scard(`user_sessions:${ws.userId}`)
      if (remainingSessions === 0) {
        const isSovereign = SovereigntyService.isSovereign(ws.userId)
        const isGhost = isSovereign && (await redis.get(`ghost_mode:${ws.userId}`)) === 'true'

        const offlineData = { userId: ws.userId, status: 'offline', lastSeen: Date.now() }
        await redis.hset('presence', ws.userId, JSON.stringify(offlineData))

        if (!isGhost) {
          await publishGatewayEvent('PRESENCE_UPDATE', offlineData)
        }
      }
    }
  }

  private send(ws: WebSocketClient, payload: any) {
    if ((ws as any).readyState === (WSWebSocket as any).OPEN) {
      const isZeroData = process.env.SOVEREIGNTY_LEVEL === '3';
      const optimizedPayload = SovereigntyService.optimizePayload(payload, isZeroData);
      (ws as any).send(JSON.stringify(optimizedPayload));
    }
  }

  public broadcast(userIds: string[], payload: any) {
    // Local iteration, cross-instance is done via publishEvent
    for (const [, client] of this.clients) {
      if (client.userId && userIds.includes(client.userId)) {
        this.send(client, payload)
      }
    }
  }

  public broadcastAll(payload: any) {
    for (const [, client] of this.clients) {
      this.send(client, payload)
    }
  }

  // --- Core Utility: Publish and fallback local broadcast ---
  // Note: publishEvent is now extracted into gatewayPublisher.ts
  // This class purely listens to Redis events and broadcasts down to local connected sockets

  private handlePubSubEvent(rawMessage: string) {
    try {
      const message = JSON.parse(rawMessage)
      const payload = { op: WSOpCode.DISPATCH, t: message.t, d: message.d }

      if (message.recipientIds && Array.isArray(message.recipientIds)) {
        this.broadcast(message.recipientIds, payload)
        return
      }

      if (message.t === 'MESSAGE_CREATE' || message.t === 'MESSAGE_UPDATE') {
        const guildId = message.d.guild_id || message.d.guildId
        if (guildId) {
          this.getGuildMembers(guildId).then(members => {
            if (members) this.broadcast(members, payload)
            else this.broadcastAll(payload)
          })
          return
        }
      } else if (message.t === 'VOICE_STATE_UPDATE') {
        const guildId = message.d.guild_id || message.d.guildId
        if (guildId) {
          this.getGuildMembers(guildId).then(members => {
            if (members) this.broadcast(members, payload)
          })
          return
        }
      } else if (message.t === 'WEBRTC_SIGNAL') {
        const targetUserId = message.d.targetUserId
        if (targetUserId) {
          this.broadcast([targetUserId], payload)
          return
        }
      } else if (message.guild_id) {
        // Guild-scoped events (GUILD_UPDATE, GUILD_ROLE_*, GUILD_MEMBER_*, etc.)
        this.getGuildMembers(message.guild_id).then(members => {
          if (members && members.length > 0) this.broadcast(members, payload)
          else this.broadcastAll(payload)
        })
        return
      }

      this.broadcastAll(payload)
    } catch (err) {
      console.error('Failed to handle pubsub event', err)
    }
  }

  private async getGuildMembers(guildId: string): Promise<string[] | null> {
    try {
      return await membershipGetGuildMembers(guildId)
    } catch {
      return null
    }
  }

  private async handleMessage(ws: WebSocketClient, message: WSPayload) {
    if (ws.userId && message.t) {
      const allowed = await wsRateLimit(ws.userId, message.t)
      if (!allowed) {
        this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 4008, message: 'Rate limit exceeded' } })
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
          switch (message.t as string) {
            case 'MESSAGE_CREATE': return await this.handleCreateMessage(ws, message.d)
            case 'MESSAGE_UPDATE': return await this.handleUpdateMessage(ws, message.d)
            case 'MESSAGE_DELETE': return await this.handleDeleteMessage(ws, message.d)
            case 'MESSAGE_PIN': return await this.handlePinMessage(ws, message.d)
            case 'MESSAGE_UNPIN': return await this.handleUnpinMessage(ws, message.d)
            case 'MESSAGE_REACTION': return await this.handleReaction(ws, message.d)

            // New events merged from Socket.IO
            case 'UPDATE_PRESENCE': return await this.handlePresenceUpdate(ws, message.d)
            case 'TYPING_START': return await this.handleTyping(ws, message.d, true)
            case 'TYPING_STOP': return await this.handleTyping(ws, message.d, false)
            case 'VOICE_JOIN': return await this.handleVoiceJoin(ws, message.d)
            case 'VOICE_LEAVE': return await this.handleVoiceLeave(ws, message.d)
            case 'WEBRTC_SIGNAL': return await this.handleWebRTCSignal(ws, message.d)

            default: console.warn('Unhandled client event:', message.t)
          }
        } catch (err) {
          console.error('Error handling client event', err)
          this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 5000, message: 'Internal error' } })
        }
        break
    }
  }

  // --- Handlers ---

  private async handleIdentify(ws: WebSocketClient, data: any) {
    const { token } = data
    if (!token) return ws.close(4004, 'Authentication Failed')

    let userId: string | null = null

    if (token.startsWith('beacon/bot_') || token.startsWith('bot_')) {
      const bot = await prisma.bot.findUnique({ where: { token } })
      if (!bot) return ws.close(4004, 'Invalid Bot Token')
      userId = (bot as any).userId || `bot:${bot.id}`
    } else {
      const payload: any = AuthService.verifyToken(token)
      if (!payload) return ws.close(4004, 'Authentication Failed')
      userId = payload.userId || payload.id || null
    }

    if (!userId) return ws.close(4004, 'Authentication Failed')

    ws.userId = userId
    await redis.set(`session:${ws.id}`, userId, 'EX', 86400)
    await redis.sadd(`user_sessions:${userId}`, ws.id)

    const isSovereign = SovereigntyService.isSovereign(userId)
    const isGhost = isSovereign && (await redis.get(`ghost_mode:${userId}`)) === 'true'

    const onlineData = { userId, status: 'online', lastSeen: Date.now() }
    await redis.hset('presence', userId, JSON.stringify(onlineData))

    if (!isGhost) {
      await publishGatewayEvent('PRESENCE_UPDATE', onlineData)
    }

    this.send(ws, { op: WSOpCode.DISPATCH, t: 'READY' as WSEventType, d: { v: 1, user: { id: userId, isSovereign }, session_id: ws.id } })
  }

  private async handleCreateMessage(ws: WebSocketClient, data: any) {
    const { channelId, content, guildId } = data
    const authorId = ws.userId
    if (!authorId) return this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 4001, message: 'Not authenticated' } })

    const sanitizedContent = sanitizeMessage(content)
    if (!sanitizedContent) return this.send(ws, { op: WSOpCode.DISPATCH, t: 'ERROR' as WSEventType, d: { code: 4002, message: 'Invalid content' } })

    const { result: moderationResult } = await moderationService.checkMessage(sanitizedContent, authorId, channelId)

    if (!moderationResult.approved) {
      this.send(ws, {
        op: WSOpCode.DISPATCH, t: 'MESSAGE_REJECTED' as WSEventType,
        d: { code: 4005, message: 'Rejected', flags: moderationResult.flags }
      })
      await (ModerationReportModel as any).create({
        id: `report_${Date.now()}`, channel_id: channelId, target_user_id: authorId, content: sanitizedContent, status: 'pending'
      })
      return
    }

    const msg = await (MessageModel as any).create({
      id: Date.now().toString(), channel_id: channelId, guild_id: guildId || null, author: { id: authorId },
      content: sanitizedContent, timestamp: new Date(), moderationStatus: moderationResult.status
    })

    await publishGatewayEvent('MESSAGE_CREATE', msg, msg.guild_id)

    // Quest Hook: Message Creation
    questService.trackProgress(authorId, 'send_messages', 1).catch(e => console.warn('Quest update failed:', e))
  }

  private async handleUpdateMessage(_ws: WebSocketClient, data: any) {
    const { channelId, messageId, content, guildId } = data
    const { MessageModel } = await import('../db')
    const updated = await MessageModel.findOneAndUpdate({ id: messageId, channel_id: channelId }, { content, edited_timestamp: new Date() }, { new: true })
    if (updated) await publishGatewayEvent('MESSAGE_UPDATE', updated, updated.guild_id || guildId)
  }

  private async handleDeleteMessage(ws: WebSocketClient, data: any) {
    const { channelId, messageId, guildId } = data
    if (!ws.userId) return

    const msg = await MessageModel.findOne({ id: messageId, channel_id: channelId })
    if (!msg) return

    const isAuthor = (msg.author as any)?.id === ws.userId
    const canManage = msg.guild_id ? await hasPermission(ws.userId, msg.guild_id, Permissions.MANAGE_MESSAGES) : false

    if (!isAuthor && !canManage) return this.send(ws, { op: 0, t: 'ERROR', d: { code: 4003, message: 'Missing permissions' } })

    await MessageModel.deleteOne({ id: messageId, channel_id: channelId })
    await publishGatewayEvent('MESSAGE_DELETE', { channelId, messageId, guildId: msg.guild_id || guildId }, msg.guild_id)
  }

  private async handlePresenceUpdate(ws: WebSocketClient, data: { status?: string, custom_status?: string, activities?: any[] }) {
    if (!ws.userId) return
    const payload = { user_id: ws.userId, status: data.status || 'online', custom_status: data.custom_status }
    await redis.hset('presence', ws.userId, JSON.stringify(payload))
    await publishGatewayEvent('PRESENCE_UPDATE', payload)
  }

  private async handleTyping(ws: WebSocketClient, data: any, isStart: boolean) {
    if (!ws.userId) return
    await publishGatewayEvent(isStart ? 'TYPING_START' : 'TYPING_STOP', { channelId: data.channelId, userId: ws.userId }, data.guildId)
  }

  // --- Voice & WebRTC ---

  private async handleVoiceStateUpdate(ws: WebSocketClient, data: any) {
    if (!ws.userId || !data.guild_id) return
    const payload = { ...data, user_id: ws.userId, session_id: ws.id }

    if (data.channel_id) {
      await redis.hmset(`voice:${data.guild_id}:${ws.userId}`, payload)
    } else {
      await redis.del(`voice:${data.guild_id}:${ws.userId}`)
    }
    await publishGatewayEvent('VOICE_STATE_UPDATE', payload, data.guild_id)
  }

  private async handleVoiceJoin(ws: WebSocketClient, data: any) {
    if (!ws.userId || !data.channelId) return
    await publishGatewayEvent('VOICE_USER_JOINED', { userId: ws.userId, channelId: data.channelId }, data.guildId)
  }

  private async handleVoiceLeave(ws: WebSocketClient, data: any) {
    if (!ws.userId || !data.channelId) return
    await publishGatewayEvent('VOICE_USER_LEFT', { userId: ws.userId, channelId: data.channelId }, data.guildId)
  }

  private async handleWebRTCSignal(ws: WebSocketClient, data: any) {
    if (!ws.userId || !data.targetUserId) return
    // targetUserId lets us route directly in handlePubSubEvent
    await publishGatewayEvent('WEBRTC_SIGNAL', { senderUserId: ws.userId, targetUserId: data.targetUserId, signal: data.signal })
  }

  private async handlePinMessage(_ws: WebSocketClient, data: any) {
    const updated = await MessageModel.findOneAndUpdate({ id: data.messageId, channel_id: data.channelId }, { pinned: true }, { new: true })
    if (updated) await publishGatewayEvent('MESSAGE_PIN', { channelId: data.channelId, message: updated }, updated.guild_id)
  }

  private async handleUnpinMessage(_ws: WebSocketClient, data: any) {
    const updated = await MessageModel.findOneAndUpdate({ id: data.messageId, channel_id: data.channelId }, { pinned: false }, { new: true })
    if (updated) await publishGatewayEvent('MESSAGE_UNPIN', { channelId: data.channelId, message: updated }, updated.guild_id)
  }

  private async handleReaction(ws: WebSocketClient, data: any) {
    if (!ws.userId) return
    const msg = await MessageModel.findOne({ id: data.messageId, channel_id: data.channelId }) as any
    if (!msg) return

    const emojiName = data.emoji
    const idx = (msg.reactions || []).findIndex((r: any) => r.emoji?.name === emojiName || r.emoji === emojiName)

    if (idx === -1 && !data.remove) {
      msg.reactions = msg.reactions || []
      msg.reactions.push({ emoji: { name: emojiName }, users: [ws.userId] })
    } else if (idx !== -1) {
      let users = msg.reactions[idx].users || []
      if (data.remove) users = users.filter((u: string) => u !== ws.userId)
      else if (!users.includes(ws.userId)) users.push(ws.userId)

      if (users.length === 0) msg.reactions.splice(idx, 1)
      else msg.reactions[idx].users = users
    }

    await msg.save()
    await publishGatewayEvent('MESSAGE_REACTION', { channelId: data.channelId, messageId: data.messageId, reactions: msg.reactions }, msg.guild_id)

    // Quest Hook: Reaction
    if (!data.remove) {
      questService.trackProgress(ws.userId, 'react', 1).catch(e => console.warn('Quest update failed:', e))
    }
  }
}
