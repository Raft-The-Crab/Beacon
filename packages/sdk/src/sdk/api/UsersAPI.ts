import type { HTTPClient } from './HTTPClient'
import type { User, ApiResponse } from '../types'

/**
 * Users API
 */
export class UsersAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Get a user
   */
  async get(userId: string): Promise<ApiResponse<User>> {
    return this.client.get<User>(`/users/${userId}`)
  }

  /**
   * Update own profile
   */
  async updateProfile(data: {
    displayName?: string
    bio?: string
    avatar?: string | File
    banner?: string | File
  }): Promise<ApiResponse<User>> {
    return this.client.patch<User>('/users/@me', data)
  }

  /**
   * Get direct messages
   */
  async getDMs(): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>('/users/@me/channels')
  }

  /**
   * Create DM channel
   */
  async createDM(userId: string): Promise<ApiResponse<any>> {
    return this.client.post<any>('/users/@me/channels', {
      recipient_id: userId
    })
  }

  /**
   * Get friends
   */
  async getFriends(): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users/@me/friends')
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/users/@me/friends/${userId}`)
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string): Promise<ApiResponse<void>> {
    return this.client.put<void>(`/users/@me/friends/${userId}`)
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(userId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/users/@me/friends/${userId}`)
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/users/@me/friends/${userId}`)
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>('/users/@me/friend-requests')
  }

  /**
   * Block a user
   */
  async block(userId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/users/@me/blocked/${userId}`)
  }

  /**
   * Unblock a user
   */
  async unblock(userId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/users/@me/blocked/${userId}`)
  }

  /**
   * Get blocked users
   */
  async getBlocked(): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users/@me/blocked')
  }

  /**
   * Get user connections (e.g., Spotify, GitHub)
   */
  async getConnections(): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>('/users/@me/connections')
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<any>> {
    return this.client.get<any>('/users/@me/settings')
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return this.client.patch<any>('/users/@me/settings', settings)
  }

  /**
   * Get user guilds
   */
  async getServers(): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>('/users/@me/servers')
  }
}
