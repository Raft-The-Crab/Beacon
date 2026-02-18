import type { HTTPClient } from './HTTPClient'
import type { Presence, ApiResponse, UpdatePresenceOptions } from '../types'
import type { WSClient } from '../ws/WSClient'

/**
 * Presence API
 */
export class PresenceAPI {
  constructor(
    private client: HTTPClient,
    private ws: WSClient
  ) {}

  /**
   * Update own presence
   */
  async updateStatus(options: UpdatePresenceOptions): Promise<ApiResponse<void>> {
    // Update via WebSocket for real-time
    if (this.ws.isConnected()) {
      this.ws.updatePresence(options.status, options.customStatus)
    }

    // Also update via REST API for persistence
    return this.client.patch<void>('/users/@me/presence', options)
  }

  /**
   * Get user presence
   */
  async get(userId: string): Promise<ApiResponse<Presence>> {
    return this.client.get<Presence>(`/users/${userId}/presence`)
  }

  /**
   * Get multiple user presences
   */
  async getBulk(userIds: string[]): Promise<ApiResponse<Record<string, Presence>>> {
    return this.client.post<Record<string, Presence>>('/presences', { user_ids: userIds })
  }

  /**
   * Get server presences
   */
  async getServerPresences(serverId: string): Promise<ApiResponse<Record<string, Presence>>> {
    return this.client.get<Record<string, Presence>>(`/servers/${serverId}/presences`)
  }
}
