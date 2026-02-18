import { aiModeration } from '../../ai'; // Import aiModeration

// ... (existing interfaces, enums, hasPermission function) ...

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
      redis.subscribe('gateway:events').then(() => {
        console.log('Subscribed to Redis channel: gateway:events')
      }).catch((err) => console.warn('Redis subscribe failed', err))

      redis.on('message', (channel: string, message: string) => {
        if (channel !== 'gateway:events') return
        try {
          const evt = JSON.parse(message)
          this.handlePubSubEvent(evt)
        } catch (err) {
          console.warn('Failed to parse pubsub message', err)
        }
      })
    } catch (err) {
      console.warn('Failed to setup Redis pubsub', err)
    }

    this.wss.on('connection', async (ws: WebSocketClient, req: IncomingMessage) => {
      ws.id = uuidv4()
      ws.isAlive = true
      this.clients.set(ws.id, ws)

      console.log(`New connection: ${ws.id}`)

      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', async (data) => {
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
        op: 10, // HELLO
        d: {
          heartbeat_interval: 45000
        }
      })
    })

    // Heartbeat interval
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as WebSocketClient
        if (!client.isAlive) return client.terminate()

        client.isAlive = false
        client.ping()
      })
    }, 30000)
  }

  private async handleMessage(ws: WebSocketClient, message: any) {
    switch (message.op) {
      case 1: // HEARTBEAT
        this.send(ws, { op: 11 }) // HEARTBEAT_ACK
        break

      case 2: // IDENTIFY
        await this.handleIdentify(ws, message.d)
        break

      case 4: // VOICE_STATE_UPDATE
        await this.handleVoiceStateUpdate(ws, message.d)
        break

      case 0: // DISPATCH-like actions from client (MESSAGE_CREATE, MESSAGE_UPDATE, etc.)
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
        }
        break

      // Add other opcodes here
    }
  }

  private async handleVoiceStateUpdate(ws: WebSocketClient, data: any) {
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

  // --- Message handlers (simple implementations using Mongo)
  private async handleCreateMessage(ws: WebSocketClient, data: any) {
    try {
      const { channelId, content, replyTo } = data
      const authorId = ws.userId
      if (!authorId) {
        this.send(ws, { op: 0, t: 'ERROR', d: { code: 4001, message: 'Not authenticated' } });
        return;
      }

      // --- AI Moderation ---
      const moderationContext = {
        userId: authorId,
        channelId: channelId,
        guildId: data.guildId || null,
        // Potentially add user roles, historical data, etc., here
        // For now, let's assume 'admin' role for userId 'admin-user-id' for testing
        userRole: (authorId === 'admin-user-id') ? 'admin' : 'member', // Example for context-aware rule
      };

      const moderationResult = await aiModeration.checkContent(content, 'text', moderationContext);

      if (!moderationResult.approved) {
        console.warn(`[AI Moderation] Prohibited message from ${authorId} in ${channelId}: "${content.substring(0, 50)}..." - Flags: ${moderationResult.flags.join(', ')}`);
        this.send(ws, {
          op: 0,
          t: 'MESSAGE_REJECTED',
          d: {
            code: 4005,
            message: 'Your message was rejected by the moderation system.',
            flags: moderationResult.flags,
            score: moderationResult.score,
            status: moderationResult.status,
          },
        });
        return; // Stop processing the message
      }

      if (moderationResult.status === 'Warning') {
        console.log(`[AI Moderation] Warning message from ${authorId} in ${channelId}: "${content.substring(0, 50)}..." - Flags: ${moderationResult.flags.join(', ')}`);
        // Optionally, add moderation flags to the message object or log for human review
      }

      console.log(`[AI Moderation] Message from ${authorId} in ${channelId}: "${content.substring(0, 50)}..." - Status: ${moderationResult.status}`);
      // --- End AI Moderation ---

      // Create document in Mongo
      const msg = await (await import('../db')).MessageModel.create({
        id: Date.now().toString(),
        channel_id: channelId,
        guild_id: data.guildId || null,
        author: { id: authorId },
        content,
        timestamp: new Date(),
        // Potentially save moderation flags here if status is 'Warning'
        moderationFlags: moderationResult.flags,
        moderationStatus: moderationResult.status,
        moderationScore: moderationResult.score,
      });

      // Broadcast DISPATCH to guild members if possible
      const guildId = msg.guild_id || data.guildId
      // Publish message create to Redis so all instances can handle broadcasting
      try {
        await redis.publish('gateway:events', JSON.stringify({ t: 'MESSAGE_CREATE', d: msg }))
      } catch (err) {
        console.warn('Failed to publish MESSAGE_CREATE to redis', err)
        // Fallback to local broadcasting
        if (guildId) {
          const members = await this.getGuildMembers(guildId)
          if (members) this.broadcast(members, { op: 0, t: 'MESSAGE_CREATE', d: msg })
          else this.broadcastAll({ op: 0, t: 'MESSAGE_CREATE', d: msg })
        } else {
          this.broadcastAll({ op: 0, t: 'MESSAGE_CREATE', d: msg })
        }
      }
    } catch (err) {
      console.error('handleCreateMessage error', err)
      this.send(ws, { op: 0, t: 'ERROR', d: { code: 5000, message: 'Internal server error during message processing.' } });
    }
  }

  private async handleUpdateMessage(ws: WebSocketClient, data: any) {
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
      const isAuthor = messageToDelete.author.id === userId

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

  private async handlePinMessage(ws: WebSocketClient, data: any) {
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

  private async handleUnpinMessage(ws: WebSocketClient, data: any) {
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
      const msg = await MessageModel.findOne({ id: messageId, channel_id: channelId })
      if (!msg) return

      const reactions = msg.reactions || []
      const idx = reactions.findIndex((r: any) => (r.emoji && ((r.emoji.name && r.emoji.name === emoji) || r.emoji === emoji)))
      if (idx === -1 && !remove) {
        // add new reaction with users array
        reactions.push({ emoji: { name: emoji }, users: [ws.userId] })
      } else if (idx !== -1) {
        const users: string[] = reactions[idx].users || []
        if (remove) {
          const newUsers = users.filter((u) => u !== ws.userId)
          if (newUsers.length === 0) {
            reactions.splice(idx, 1)
          } else {
            reactions[idx].users = newUsers
          }
        } else {
          if (!users.includes(ws.userId!)) users.push(ws.userId!)
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
        const guildId = msg.guild_id || data.guildId
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
      op: 0, // DISPATCH
      t: 'READY',
      d: {
        v: 1,
        user: { id: userId },
        session_id: ws.id
      }
    })
  }

  private handleDisconnect(ws: WebSocketClient) {
    this.clients.delete(ws.id)
    if (ws.userId) {
      redis.del(`session:${ws.id}`)
      redis.srem(`user_sessions:${ws.userId}`, ws.id)
    }
    console.log(`Disconnected: ${ws.id}`)
  }

  private send(ws: WebSocket, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
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
