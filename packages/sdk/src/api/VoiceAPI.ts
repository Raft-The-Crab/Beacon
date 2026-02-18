import type { HTTPClient } from './HTTPClient'
import type { ApiResponse, VoiceState } from '../types'
import type { WSClient } from '../ws/WSClient'

/**
 * Voice API
 */
export class VoiceAPI {
  private currentChannelId?: string
  private currentServerId?: string
  private muted: boolean = false
  private deafened: boolean = false

  constructor(
    private client: HTTPClient,
    private ws: WSClient
  ) {}

  /**
   * Join a voice channel
   */
  async join(channelId: string, serverId: string, muted?: boolean, deafened?: boolean): Promise<ApiResponse<VoiceState>> {
    this.currentChannelId = channelId
    this.currentServerId = serverId
    this.muted = muted || false
    this.deafened = deafened || false

    // Update voice state via WebSocket
    if (this.ws.isConnected()) {
      this.ws.updateVoiceState(serverId, channelId, this.muted, this.deafened)
    }

    // Get voice server info via REST
    return this.client.get<VoiceState>(`/channels/${channelId}/voice`)
  }

  /**
   * Leave current voice channel
   */
  async leave(): Promise<ApiResponse<void>> {
    if (this.currentServerId && this.ws.isConnected()) {
      this.ws.updateVoiceState(this.currentServerId, null, false, false)
    }

    this.currentChannelId = undefined
    this.currentServerId = undefined
    this.muted = false
    this.deafened = false

    return { success: true }
  }

  /**
   * Set mute state
   */
  async setMute(muted: boolean): Promise<ApiResponse<void>> {
    this.muted = muted

    if (this.currentServerId && this.currentChannelId && this.ws.isConnected()) {
      this.ws.updateVoiceState(this.currentServerId, this.currentChannelId, this.muted, this.deafened)
    }

    return { success: true }
  }

  /**
   * Set deafen state
   */
  async setDeafen(deafened: boolean): Promise<ApiResponse<void>> {
    this.deafened = deafened

    if (this.currentServerId && this.currentChannelId && this.ws.isConnected()) {
      this.ws.updateVoiceState(this.currentServerId, this.currentChannelId, this.muted, this.deafened)
    }

    return { success: true }
  }

  /**
   * Start video
   */
  async startVideo(): Promise<ApiResponse<void>> {
    return this.client.post<void>('/voice/video/start')
  }

  /**
   * Stop video
   */
  async stopVideo(): Promise<ApiResponse<void>> {
    return this.client.post<void>('/voice/video/stop')
  }

  /**
   * Start screen share
   */
  async startScreenShare(): Promise<ApiResponse<void>> {
    return this.client.post<void>('/voice/screen-share/start')
  }

  /**
   * Stop screen share
   */
  async stopScreenShare(): Promise<ApiResponse<void>> {
    return this.client.post<void>('/voice/screen-share/stop')
  }

  /**
   * Get voice region
   */
  async getRegions(): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>('/voice/regions')
  }

  /**
   * Get current voice state
   */
  getCurrentState(): {
    channelId?: string
    serverId?: string
    muted: boolean
    deafened: boolean
  } {
    return {
      channelId: this.currentChannelId,
      serverId: this.currentServerId,
      muted: this.muted,
      deafened: this.deafened
    }
  }
}
