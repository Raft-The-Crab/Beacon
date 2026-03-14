import type { HTTPClient } from './HTTPClient'
import type { Channel, ApiResponse, CreateChannelOptions, ChannelPermissionOverwrite } from '../types'

/**
 * Channels API
 */
export class ChannelsAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Get a channel
   */
  async get(channelId: string): Promise<ApiResponse<Channel>> {
    return this.client.get<Channel>(`/channels/${channelId}`)
  }

  /**
   * Update a channel
   */
  async update(channelId: string, data: Partial<CreateChannelOptions>): Promise<ApiResponse<Channel>> {
    return this.client.patch<Channel>(`/channels/${channelId}`, data)
  }

  /**
   * Delete a channel
   */
  async delete(channelId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/channels/${channelId}`)
  }

  /**
   * Set channel permissions
   */
  async setPermissions(
    channelId: string,
    targetId: string,
    permissions: ChannelPermissionOverwrite
  ): Promise<ApiResponse<void>> {
    return this.client.put<void>(`/channels/${channelId}/permissions/${targetId}`, permissions)
  }

  /**
   * Delete channel permissions
   */
  async deletePermissions(channelId: string, targetId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/channels/${channelId}/permissions/${targetId}`)
  }

  /**
   * Get channel webhooks
   */
  async getWebhooks(channelId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/channels/${channelId}/webhooks`)
  }

  /**
   * Create channel webhook
   */
  async createWebhook(channelId: string, name: string, avatar?: string): Promise<ApiResponse<any>> {
    return this.client.post<any>(`/channels/${channelId}/webhooks`, { name, avatar })
  }

  /**
   * Delete channel webhook
   */
  async deleteWebhook(channelId: string, webhookId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/channels/${channelId}/webhooks/${webhookId}`)
  }

  /**
   * Follow a news channel
   */
  async follow(channelId: string, targetChannelId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/channels/${channelId}/followers`, {
      webhook_channel_id: targetChannelId
    })
  }
}
