// Native WebSocket Service with Tauri Integration
import { API_CONFIG, WS_EVENTS } from '../config/api'

// Conditional Tauri imports (only when running in Tauri)
type InvokeFunction = (cmd: string, args?: any) => Promise<any>

export interface WebSocketMessage {
  op: number // Opcode
  d?: any // Data payload
  s?: number // Sequence number
  t?: string // Event type
}

export class NativeWebSocketService {
  private ws: WebSocket | null = null
  private heartbeatInterval: number | null = null
  private sequence: number = 0
  private sessionId: string | null = null
  private reconnectAttempts = 0
  private isIntentionalClose = false
  private messageQueue: WebSocketMessage[] = []
  private isTauri = false
  private tauriInvoke: InvokeFunction | null = null
  
  // Event handlers
  private handlers = new Map<string, Set<(data: any) => void>>()

  constructor() {
    // Detect if running in Tauri
    this.isTauri = typeof window !== 'undefined' && '__TAURI__' in window
    
    if (this.isTauri) {
      console.log('🚀 Running in Tauri - enabling native optimizations')
      this.initializeTauri()
    }
  }

  private async initializeTauri() {
    try {
      // Dynamically import Tauri APIs only when in Tauri environment
      // @ts-ignore
      const { invoke } = await import('@tauri-apps/api/core').catch(() => ({ invoke: null }))
      if (invoke) {
        this.tauriInvoke = invoke as InvokeFunction
        this.registerTauriHandlers()
      }
    } catch (error) {
      console.warn('Failed to initialize Tauri APIs:', error)
      this.isTauri = false
    }
  }

  async connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return
    }

    try {
      // Register WebSocket connection with native layer if in Tauri
      if (this.isTauri && this.tauriInvoke) {
        await this.tauriInvoke('register_websocket', { connectionId: Date.now().toString() })
      }

      this.ws = new WebSocket(API_CONFIG.WS_URL)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        this.identify(token)
        this.flushMessageQueue()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason)
        this.cleanup()
        
        if (!this.isIntentionalClose && this.reconnectAttempts < API_CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect(token)
        }
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.scheduleReconnect(token)
    }
  }

  private identify(token: string) {
    this.send({
      op: 2, // IDENTIFY
      d: {
        token,
        intents: 32767, // All intents
        properties: {
          os: navigator.platform,
          browser: this.isTauri ? 'Tauri' : 'Web',
          device: 'Beacon',
        },
      },
    })
  }

  private handleMessage(msg: WebSocketMessage) {
    if (msg.s) this.sequence = msg.s

    switch (msg.op) {
      case 10: // HELLO
        console.log('👋 Gateway HELLO received')
        this.startHeartbeat(msg.d.heartbeat_interval)
        break

      case 11: // HEARTBEAT_ACK
        // Heartbeat acknowledged
        break

      case 0: // DISPATCH
        if (msg.t) {
          this.emit(msg.t, msg.d)
        }
        
        if (msg.t === WS_EVENTS.READY) {
          this.sessionId = msg.d.session_id
          console.log('✅ Gateway READY - Session:', this.sessionId)
        }
        break

      case 9: // INVALID_SESSION
        console.warn('⚠️  Invalid session, re-identifying...')
        this.sessionId = null
        break

      case 7: // RECONNECT
        console.log('🔄 Server requested reconnect')
        this.reconnect()
        break

      default:
        console.log('Unknown opcode:', msg.op)
    }
  }

  private startHeartbeat(interval: number) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = window.setInterval(() => {
      this.send({
        op: 1, // HEARTBEAT
        d: this.sequence,
      })
    }, interval)
  }

  private send(data: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue messages if not connected
      this.messageQueue.push(data)
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()
      if (msg) this.send(msg)
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: (data: any) => void) {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: any) {
    // Cache messages in native layer if Tauri
    if (this.isTauri && event === WS_EVENTS.MESSAGE_CREATE) {
      this.cacheMessageNative(data)
    }

    this.handlers.get(event)?.forEach((handler) => handler(data))
  }

  private async cacheMessageNative(message: any) {
    if (!this.isTauri || !this.tauriInvoke) return
    
    try {
      await this.tauriInvoke('cache_messages', {
        messages: [message],
      })
    } catch (error) {
      console.error('Failed to cache message natively:', error)
    }
  }

  private async registerTauriHandlers() {
    if (!this.isTauri) return
    
    try {
      // Dynamically import Tauri event listener
      // @ts-ignore
      const tauriApi = await import('@tauri-apps/api/event').catch(() => null)
      if (!tauriApi) return
      
      const { listen } = tauriApi
      
      listen('notification-clicked', (event: any) => {
        console.log('Notification clicked:', event)
        // Handle notification click
      })
    } catch (error) {
      console.error('Failed to register Tauri handlers:', error)
    }
  }

  private scheduleReconnect(token: string) {
    this.reconnectAttempts++
    const delay = Math.min(
      API_CONFIG.WS_RECONNECT_INTERVAL * this.reconnectAttempts,
      30000
    )

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`)

    setTimeout(() => {
      this.connect(token)
    }, delay)
  }

  private reconnect() {
    this.cleanup()
    // Reconnect logic handled by onclose
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  async disconnect() {
    this.isIntentionalClose = true
    
    if (this.isTauri && this.tauriInvoke) {
      try {
        await this.tauriInvoke('unregister_websocket', { connectionId: Date.now().toString() })
      } catch (error) {
        console.error('Failed to unregister WebSocket:', error)
      }
    }
    
    this.cleanup()
    this.ws?.close(1000, 'Client disconnect')
    this.ws = null
  }

  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const nativeWebSocket = new NativeWebSocketService()
