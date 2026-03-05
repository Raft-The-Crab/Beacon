import type { BeaconEventEmitter } from '../BeaconEventEmitter'
import type { BeaconClientOptions, WSEventType } from '../types'
import { delay } from '../utils'

enum WSOpCode {
  DISPATCH = 0,
  HEARTBEAT = 1,
  IDENTIFY = 2,
  STATUS_UPDATE = 3,
  VOICE_STATE_UPDATE = 4,
  RESUME = 6,
  RECONNECT = 7,
  REQUEST_GUILD_MEMBERS = 8,
  INVALID_SESSION = 9,
  HELLO = 10,
  HEARTBEAT_ACK = 11
}

interface WSMessage {
  op: WSOpCode
  d?: any
  s?: number | null
  t?: WSEventType | null
}

/**
 * WebSocket client for real-time communication
 */
export class WSClient {
  private ws?: WebSocket
  private heartbeatInterval?: ReturnType<typeof setInterval>
  private sessionId?: string
  private sequence: number = 0
  private reconnectAttempts: number = 0
  private heartbeatAcked: boolean = true
  private connected: boolean = false

  constructor(
    private options: BeaconClientOptions,
    private token: string,
    private events: BeaconEventEmitter
  ) {}

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.wsUrl)

        this.ws.onopen = () => {
          if (this.options.debug) {
            console.log('[WS] Connected')
          }
        }

        this.ws.onmessage = (event: MessageEvent<string>) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event: CloseEvent) => {
          if (this.options.debug) {
            console.log(`[WS] Disconnected with code ${event.code}`)
          }
          this.handleDisconnect()
        }

        this.ws.onerror = (event: Event) => {
          const error = new Error('WebSocket error')
          if (this.options.debug) {
            console.error('[WS] Error:', event)
          }
          this.events.emit('error', error)
          reject(error)
        }

        // Resolve when we receive READY event
        this.events.once('ready', () => {
          this.connected = true
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    if (this.ws) {
      this.ws.close(1000)
      this.ws = undefined
    }

    this.connected = false
    this.sessionId = undefined
    this.sequence = 0
  }

  /**
   * Send a message through the WebSocket
   */
  send(op: WSOpCode, data?: any): void {
    if (!this.ws || this.ws.readyState !== globalThis.WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const message: WSMessage = {
      op,
      d: data
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data)

      if (message.s !== null && message.s !== undefined) {
        this.sequence = message.s
      }

      switch (message.op) {
        case WSOpCode.HELLO:
          this.handleHello(message.d)
          break

        case WSOpCode.HEARTBEAT_ACK:
          this.heartbeatAcked = true
          break

        case WSOpCode.DISPATCH:
          if (message.t) {
            this.handleEvent(message.t, message.d)
          }
          break

        case WSOpCode.RECONNECT:
          this.handleReconnect()
          break

        case WSOpCode.INVALID_SESSION:
          this.handleInvalidSession(message.d)
          break

        default:
          if (this.options.debug) {
            console.log('[WS] Unknown opcode:', message.op)
          }
      }
    } catch (error) {
      if (this.options.debug) {
        console.error('[WS] Failed to parse message:', error)
      }
    }
  }

  /**
   * Handle HELLO opcode
   */
  private handleHello(data: { heartbeat_interval: number }): void {
    if (this.options.debug) {
      console.log('[WS] Received HELLO')
    }

    // Start heartbeat
    this.startHeartbeat(data.heartbeat_interval)

    // Identify or resume
    if (this.sessionId) {
      this.resume()
    } else {
      this.identify()
    }
  }

  /**
   * Send IDENTIFY to authenticate
   */
  private identify(): void {
    this.send(WSOpCode.IDENTIFY, {
      token: this.token,
      properties: {
        os: 'web',
        browser: 'beacon-sdk',
        device: 'beacon-sdk'
      }
    })

    if (this.options.debug) {
      console.log('[WS] Sent IDENTIFY')
    }
  }

  /**
   * Resume a previous session
   */
  private resume(): void {
    this.send(WSOpCode.RESUME, {
      token: this.token,
      session_id: this.sessionId,
      seq: this.sequence
    })

    if (this.options.debug) {
      console.log('[WS] Sent RESUME')
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcked) {
        if (this.options.debug) {
          console.log('[WS] Heartbeat not acknowledged, reconnecting')
        }
        this.handleReconnect()
        return
      }

      this.heartbeatAcked = false
      this.send(WSOpCode.HEARTBEAT, this.sequence)
    }, interval)
  }

  /**
   * Handle dispatch events
   */
  private handleEvent(type: WSEventType, data: any): void {
    if (this.options.debug) {
      console.log('[WS] Event:', type)
    }

    switch (type) {
      case 'READY':
        this.sessionId = data.session_id
        this.events.emit('ready')
        break

      case 'MESSAGE':
        this.events.emit('message', data)
        break

      case 'MESSAGE_UPDATE':
        this.events.emit('messageUpdate', data)
        break

      case 'MESSAGE_DELETE':
        this.events.emit('messageDelete', data)
        break

      case 'MESSAGE_REACTION_ADD':
        this.events.emit('reactionAdd', data)
        break

      case 'MESSAGE_REACTION_REMOVE':
        this.events.emit('reactionRemove', data)
        break

      case 'SERVER_CREATE':
        this.events.emit('serverCreate', data)
        break

      case 'SERVER_UPDATE':
        this.events.emit('serverUpdate', data)
        break

      case 'SERVER_DELETE':
        this.events.emit('serverDelete', data.id)
        break

      case 'CHANNEL_CREATE':
        this.events.emit('channelCreate', data)
        break

      case 'CHANNEL_UPDATE':
        this.events.emit('channelUpdate', data)
        break

      case 'CHANNEL_DELETE':
        this.events.emit('channelDelete', data)
        break

      case 'USER_UPDATE':
        this.events.emit('userUpdate', data)
        break

      case 'PRESENCE_UPDATE':
        this.events.emit('presenceUpdate', data)
        break

      case 'TYPING_START':
        this.events.emit('typingStart', data)
        break

      case 'VOICE_STATE_UPDATE':
        this.events.emit('voiceStateUpdate', data)
        break

      case 'SPEAKING_START':
        this.events.emit('speakingStart', data)
        break

      case 'SPEAKING_STOP':
        this.events.emit('speakingStop', data)
        break

      case 'ROLE_CREATE':
        this.events.emit('roleCreate', data)
        break

      case 'ROLE_UPDATE':
        this.events.emit('roleUpdate', data)
        break

      case 'ROLE_DELETE':
        this.events.emit('roleDelete', data)
        break

      case 'MEMBER_JOIN':
        this.events.emit('memberJoin', data)
        break

      case 'MEMBER_UPDATE':
        this.events.emit('memberUpdate', data)
        break

      case 'MEMBER_LEAVE':
        this.events.emit('memberLeave', data)
        break
    }
  }

  /**
   * Handle disconnect
   */
  private async handleDisconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.connected = false
    this.events.emit('disconnect')

    // Attempt to reconnect
    if (this.options.reconnect !== false && this.reconnectAttempts < (this.options.reconnectAttempts || 5)) {
      this.reconnectAttempts++
      
      const delayMs = this.options.reconnectDelay || 3000
      if (this.options.debug) {
        console.log(`[WS] Reconnecting in ${delayMs}ms (attempt ${this.reconnectAttempts})`)
      }

      await delay(delayMs)
      
      try {
        await this.connect()
        this.reconnectAttempts = 0
        this.events.emit('reconnect')
      } catch (error) {
        if (this.options.debug) {
          console.error('[WS] Reconnection failed:', error)
        }
        this.handleDisconnect()
      }
    }
  }

  /**
   * Handle reconnect request from server
   */
  private handleReconnect(): void {
    if (this.options.debug) {
      console.log('[WS] Server requested reconnect')
    }
    this.disconnect()
    this.connect()
  }

  /**
   * Handle invalid session
   */
  private handleInvalidSession(resumable: boolean): void {
    if (this.options.debug) {
      console.log('[WS] Invalid session, resumable:', resumable)
    }

    if (!resumable) {
      this.sessionId = undefined
      this.sequence = 0
    }

    delay(1000).then(() => this.identify())
  }

  /**
   * Update presence
   */
  updatePresence(status: string, customStatus?: string): void {
    this.send(WSOpCode.STATUS_UPDATE, {
      status,
      custom_status: customStatus
    })
  }

  /**
   * Update voice state
   */
  updateVoiceState(serverId: string, channelId: string | null, muted: boolean, deafened: boolean): void {
    this.send(WSOpCode.VOICE_STATE_UPDATE, {
      server_id: serverId,
      channel_id: channelId,
      self_mute: muted,
      self_deaf: deafened
    })
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }
}
