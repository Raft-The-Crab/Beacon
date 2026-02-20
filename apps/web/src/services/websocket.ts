import type { WSOpCode, WSEventType, WSPayload } from '@beacon/types'

export type WebSocketEventType = WSEventType

export interface WebSocketEvent<T = any> {
  type: WSEventType
  data: T
  timestamp: number
}

export type WebSocketPayload = WSPayload

export class BeaconWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private token: string | null = null
  private listeners: Map<WebSocketEventType | '*', Set<(event: WebSocketEvent) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isIntentionallyClosed = false
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  constructor(url: string) {
    this.url = url
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.token = token
        this.isIntentionallyClosed = false
        const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected')
          this.reconnectAttempts = 0
          this.emit('READY', {})
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error)
          this.emit('ERROR', { error: error.toString() })
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected')
          this.handleDisconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(rawData: string): void {
    try {
      const payload: WSPayload = JSON.parse(rawData)
      
      if (payload.t) {
        this.emit(payload.t, payload.d || {})
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error)
    }
  }

  private handleDisconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[WebSocket] Reconnecting (attempt ${this.reconnectAttempts})...`)
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token).catch((error) => {
            console.error('[WebSocket] Reconnection failed:', error)
          })
        }
      }, this.reconnectDelay)
    }
  }

  // Reserved for future heartbeat implementation

  private send(payload: WSPayload): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on(event: WebSocketEventType | '*', listener: (event: WebSocketEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: WebSocketEventType | '*', listener: (event: WebSocketEvent) => void): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  private emit(type: WSEventType, data: any): void {
    const event: WebSocketEvent = {
      type,
      data,
      timestamp: Date.now(),
    }

    // Emit to specific event listeners
    const specificListeners = this.listeners.get(type)
    if (specificListeners) {
      specificListeners.forEach((listener) => listener(event))
    }

    // Emit to wildcard listeners
    const wildcardListeners = this.listeners.get('*')
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => listener(event))
    }
  }

  // WebSocket Methods
  sendMessage(channelId: string, content: string, replyTo?: string): void {
    this.send({
      op: 0,
      t: 'MESSAGE_CREATE',
      d: {
        channelId,
        content,
        replyTo,
      },
    })
  }

  editMessage(channelId: string, messageId: string, content: string): void {
    this.send({
      op: 0,
      t: 'MESSAGE_UPDATE',
      d: {
        channelId,
        messageId,
        content,
      },
    })
  }

  deleteMessage(channelId: string, messageId: string): void {
    this.send({
      op: 0,
      t: 'MESSAGE_DELETE',
      d: {
        channelId,
        messageId,
      },
    })
  }

  // Reaction handling: add/remove reactions on a message
  reactMessage(channelId: string, messageId: string, emoji: string, remove: boolean = false): void {
    this.send({
      op: 0,
      t: 'MESSAGE_REACTION',
      d: { channelId, messageId, emoji, remove },
    })
  }

  pinMessage(channelId: string, messageId: string): void {
    this.send({
      op: 0,
      t: 'MESSAGE_PIN',
      d: { channelId, messageId },
    })
  }

  unpinMessage(channelId: string, messageId: string): void {
    this.send({
      op: 0,
      t: 'MESSAGE_UNPIN',
      d: { channelId, messageId },
    })
  }

  startTyping(channelId: string): void {
    this.send({
      op: 0,
      t: 'TYPING_START',
      d: { channelId },
    })
  }

  stopTyping(channelId: string): void {
    this.send({
      op: 0,
      t: 'TYPING_STOP',
      d: { channelId },
    })
  }

  updatePresence(status: string, activity?: string): void {
    this.send({
      op: 0,
      t: 'PRESENCE_UPDATE',
      d: {
        status,
        activity,
      },
    })
  }

  updateVoiceState(channelId: string | null, selfMute: boolean, selfDeaf: boolean): void {
    this.send({
      op: 0,
      t: 'VOICE_STATE_UPDATE',
      d: {
        channelId,
        selfMute,
        selfDeaf,
      },
    })
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// Create singleton instance
const wsUrl = import.meta && (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3002'
export const wsClient = new BeaconWebSocket(wsUrl)
