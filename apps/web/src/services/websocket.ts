import type { WSEventType, WSPayload } from 'beacon-sdk'
import { WEB_SDK_ENDPOINTS } from '../lib/beaconSdk'
import { API_CONFIG } from '../config/api'

// Conditional Tauri types
type InvokeFunction = (cmd: string, args?: any) => Promise<any>

export interface WebSocketEvent<T = any> {
  type: WSEventType | string
  data: T
  timestamp: number
}

export class BeaconWebSocket {
  private ws: WebSocket | null = null
  private heartbeatInterval: number | null = null
  private sequence: number = 0
  private reconnectAttempts = 0
  private isIntentionalClose = false
  private messageQueue: WSPayload[] = []
  private isTauri = false
  private tauriInvoke: InvokeFunction | null = null
  private listeners: Map<string | '*', Set<(event: WebSocketEvent) => void>> = new Map()

  constructor() {
    this.isTauri = typeof window !== 'undefined' && '__TAURI__' in window
    if (this.isTauri) this.initializeTauri()
  }

  private async initializeTauri() {
    try {
      // Use runtime path construction to prevent Vite static analysis from resolving this
      const tauriModule = '@tauri-apps/api' + '/core'
      // @ts-ignore
      const { invoke } = await import(/* @vite-ignore */ tauriModule).catch(() => ({ invoke: null }))
      if (invoke) {
        this.tauriInvoke = invoke as InvokeFunction
      }
    } catch (error) {
      this.isTauri = false
    }
  }

  async connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      // Prefer SDK-resolved WS URL (correctly points to Railway backend)
      // Falls back to API_CONFIG.WS_URL which may resolve to CDN domain
      const wsUrl = WEB_SDK_ENDPOINTS.wsUrl || API_CONFIG.WS_URL
      const url = `${wsUrl}?token=${encodeURIComponent(token)}`
      console.log('[WebSocket] Connecting to:', wsUrl)
      this.ws = new WebSocket(url)
      this.isIntentionalClose = false

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.reconnectAttempts = 0
        this.identify(token)
        this.flushMessageQueue()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.cleanup()
        if (!this.isIntentionalClose && this.reconnectAttempts < API_CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect(token)
        }
      }

      this.ws.onerror = (err) => console.error('[WebSocket] Error:', err)
    } catch (error) {
      this.scheduleReconnect(token)
    }
  }

  private identify(token: string) {
    this.send({
      op: 2, // IDENTIFY
      d: {
        token,
        properties: { os: navigator.platform, browser: 'Beacon-v2', device: 'Beacon' }
      }
    })
  }

  private handleMessage(payload: WSPayload) {
    if (payload.s) this.sequence = payload.s

    switch (payload.op) {
      case 10: // HELLO
        this.startHeartbeat(payload.d.heartbeat_interval || 30000)
        break
      case 0: // DISPATCH
        if (payload.t) {
          this.emit(payload.t, payload.d)
          if (payload.t === 'READY') {
            // handle session_id if needed in future
          }
        }
        break
      case 7: // RECONNECT
        this.reconnect()
        break
      default:
        break
    }
  }

  private startHeartbeat(interval: number) {
    this.cleanup()
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ op: 1, d: this.sequence })
    }, interval)
  }

  private send(payload: WSPayload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    } else {
      this.messageQueue.push(payload)
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()
      if (msg) this.send(msg)
    }
  }

  on(event: string | '*', listener: (event: WebSocketEvent) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
  }

  off(event: string | '*', listener: (event: WebSocketEvent) => void) {
    this.listeners.get(event)?.delete(listener)
  }

  private emit(type: string, data: any) {
    const event: WebSocketEvent = { type, data, timestamp: Date.now() }
    this.listeners.get(type)?.forEach(l => l(event))
    this.listeners.get('*')?.forEach(l => l(event))
  }

  private scheduleReconnect(token: string) {
    this.reconnectAttempts++
    setTimeout(() => this.connect(token), 3000 * this.reconnectAttempts)
  }

  private reconnect() {
    this.ws?.close()
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
  }

  disconnect() {
    this.isIntentionalClose = true
    this.cleanup()
    this.ws?.close()
    this.ws = null
  }

  async callTauri(cmd: string, args?: any) {
    if (this.tauriInvoke) return this.tauriInvoke(cmd, args)
    return null
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Backward compatible helper methods
  sendMessage(channelId: string, content: string) {
    this.send({ op: 0, t: 'MESSAGE_CREATE', d: { channelId, content } })
  }

  pinMessage(channelId: string, messageId: string) {
    this.send({ op: 0, t: 'MESSAGE_PIN', d: { channelId, messageId } })
  }

  unpinMessage(channelId: string, messageId: string) {
    this.send({ op: 0, t: 'MESSAGE_UNPIN', d: { channelId, messageId } })
  }

  editMessage(channelId: string, messageId: string, content: string) {
    this.send({ op: 0, t: 'MESSAGE_UPDATE', d: { channelId, messageId, content } })
  }

  deleteMessage(channelId: string, messageId: string) {
    this.send({ op: 0, t: 'MESSAGE_DELETE', d: { channelId, messageId } })
  }

  reactMessage(channelId: string, messageId: string, emoji: string) {
    this.send({ op: 0, t: 'MESSAGE_REACTION', d: { channelId, messageId, emoji } } as any)
  }

  startTyping(channelId: string) {
    this.send({ op: 0, t: 'TYPING_START', d: { channelId } } as any)
  }

  stopTyping(channelId: string) {
    this.send({ op: 0, t: 'TYPING_STOP', d: { channelId } } as any)
  }

  updatePresence(status: string, activity?: any) {
    this.send({ op: 3, d: { status, activities: activity ? [activity] : [], since: Date.now(), afk: false } })
  }

  getSocket() {
    return this.ws
  }

  sendVoiceStateUpdate(guildId: string, channelId: string | null, options: { mute?: boolean, deaf?: boolean, video?: boolean } = {}) {
    this.send({
      op: 4, // VOICE_STATE_UPDATE
      d: {
        guild_id: guildId,
        channel_id: channelId,
        self_mute: !!options.mute,
        self_deaf: !!options.deaf,
        self_video: !!options.video,
        is_beacon_plus: !!(options as any).isBeaconPlus
      }
    })
  }

  sendWebRTCSignal(targetUserId: string, signal: any) {
    this.send({
      op: 0,
      t: 'WEBRTC_SIGNAL',
      d: { targetUserId, signal }
    })
  }
}

export const wsClient = new BeaconWebSocket()
