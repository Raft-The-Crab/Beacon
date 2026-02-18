import type { HTTPClient } from './HTTPClient'
import type { Server, Channel, Role, User, ApiResponse, CreateServerOptions, CreateChannelOptions } from '../types'

/**
 * Servers API
 */
export class ServersAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Create a server
   */
  async create(options: CreateServerOptions): Promise<ApiResponse<Server>> {
    return this.client.post<Server>('/servers', options)
  }

  /**
   * Get a server
   */
  async get(serverId: string): Promise<ApiResponse<Server>> {
    return this.client.get<Server>(`/servers/${serverId}`)
  }

  /**
   * Get all servers for current user
   */
  async getAll(): Promise<ApiResponse<Server[]>> {
    return this.client.get<Server[]>('/servers')
  }

  /**
   * Update a server
   */
  async update(serverId: string, data: Partial<CreateServerOptions>): Promise<ApiResponse<Server>> {
    return this.client.patch<Server>(`/servers/${serverId}`, data)
  }

  /**
   * Delete a server
   */
  async delete(serverId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}`)
  }

  /**
   * Leave a server
   */
  async leave(serverId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/servers/${serverId}/leave`)
  }

  /**
   * Get server channels
   */
  async getChannels(serverId: string): Promise<ApiResponse<Channel[]>> {
    return this.client.get<Channel[]>(`/servers/${serverId}/channels`)
  }

  /**
   * Create a channel
   */
  async createChannel(serverId: string, options: CreateChannelOptions): Promise<ApiResponse<Channel>> {
    return this.client.post<Channel>(`/servers/${serverId}/channels`, options)
  }

  /**
   * Get server members
   */
  async getMembers(serverId: string): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>(`/servers/${serverId}/members`)
  }

  /**
   * Get a member
   */
  async getMember(serverId: string, userId: string): Promise<ApiResponse<User>> {
    return this.client.get<User>(`/servers/${serverId}/members/${userId}`)
  }

  /**
   * Kick a member
   */
  async kickMember(serverId: string, userId: string, reason?: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/servers/${serverId}/members/${userId}/kick`, { reason })
  }

  /**
   * Ban a member
   */
  async banMember(serverId: string, userId: string, reason?: string, deleteMessageDays?: number): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/servers/${serverId}/bans/${userId}`, {
      reason,
      delete_message_days: deleteMessageDays
    })
  }

  /**
   * Unban a member
   */
  async unbanMember(serverId: string, userId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}/bans/${userId}`)
  }

  /**
   * Get server bans
   */
  async getBans(serverId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/servers/${serverId}/bans`)
  }

  /**
   * Get server roles
   */
  async getRoles(serverId: string): Promise<ApiResponse<Role[]>> {
    return this.client.get<Role[]>(`/servers/${serverId}/roles`)
  }

  /**
   * Create an invite
   */
  async createInvite(serverId: string, options?: {
    maxAge?: number
    maxUses?: number
    temporary?: boolean
  }): Promise<ApiResponse<{ code: string; url: string }>> {
    return this.client.post<{ code: string; url: string }>(`/servers/${serverId}/invites`, options)
  }

  /**
   * Get server invites
   */
  async getInvites(serverId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/servers/${serverId}/invites`)
  }

  /**
   * Delete an invite
   */
  async deleteInvite(serverId: string, inviteCode: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}/invites/${inviteCode}`)
  }

  /**
   * Get server audit log
   */
  async getAuditLog(serverId: string, limit?: number): Promise<ApiResponse<any[]>> {
    const query = limit ? `?limit=${limit}` : ''
    return this.client.get<any[]>(`/servers/${serverId}/audit-log${query}`)
  }

  /**
   * Get server webhooks
   */
  async getWebhooks(serverId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/servers/${serverId}/webhooks`)
  }

  /**
   * Get server emojis
   */
  async getEmojis(serverId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/servers/${serverId}/emojis`)
  }

  /**
   * Create server emoji
   */
  async createEmoji(serverId: string, name: string, image: string): Promise<ApiResponse<any>> {
    return this.client.post<any>(`/servers/${serverId}/emojis`, { name, image })
  }

  /**
   * Delete server emoji
   */
  async deleteEmoji(serverId: string, emojiId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}/emojis/${emojiId}`)
  }
}
