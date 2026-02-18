import type { User, Guild, Channel, Message, Member } from '@beacon/types'

export type ApiResponseStatus = 'success' | 'error' | 'loading'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface UpdateUserRequest {
  username?: string
  customStatus?: string | null
  avatar?: string | null
  theme?: string
  bio?: string | null
  banner?: string | null
}

export interface CreateServerRequest {
  name: string
  description?: string
  icon?: File
}

export interface CreateChannelRequest {
  name: string
  type: 'text' | 'voice' | 'stage'
  parentId?: string
}

export interface SendMessageRequest {
  content: string
  files?: File[]
  embeds?: any[]
  replyTo?: string
}

export class BeaconApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiresAt: number | null = null

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl
    this.loadTokensFromStorage()
  }

  // Auth Management
  private loadTokensFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
      const expiresAt = localStorage.getItem('tokenExpiresAt')
      if (expiresAt) {
        this.tokenExpiresAt = parseInt(expiresAt, 10)
      }
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    if (typeof localStorage !== 'undefined') {
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken
      const expiresAt = Date.now() + tokens.expiresIn * 1000
      this.tokenExpiresAt = expiresAt

      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      localStorage.setItem('tokenExpiresAt', expiresAt.toString())
    }
  }

  private clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiresAt = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('tokenExpiresAt')
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true
    return Date.now() > this.tokenExpiresAt - 60000 // Refresh 1 min before expiry
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token available')
    const response = await this._request<AuthTokens>('/auth/refresh', 'POST', {
      refreshToken: this.refreshToken,
    })
    if (response.success && response.data) {
      this.saveTokensToStorage(response.data)
    }
  }

  private async _request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      // Check and refresh token if needed
      if (this.isTokenExpired() && this.refreshToken) {
        try {
          await this.refreshAccessToken()
        } catch (error) {
          this.clearTokens()
        }
      }

      const url = `${this.baseUrl}${endpoint}`
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      }

      if (this.accessToken) {
        requestHeaders['Authorization'] = `Bearer ${this.accessToken}`
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          code: errorData.code,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Auth Endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this._request<{ user: User; tokens: AuthTokens }>(
      '/auth/login',
      'POST',
      { email, password }
    )
    if (response.success && response.data?.tokens) {
      this.saveTokensToStorage(response.data.tokens)
    }
    return response
  }

  async register(email: string, username: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this._request<{ user: User; tokens: AuthTokens }>(
      '/auth/register',
      'POST',
      { email, username, password }
    )
    if (response.success && response.data?.tokens) {
      this.saveTokensToStorage(response.data.tokens)
    }
    return response
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this._request<void>('/auth/logout', 'POST')
    this.clearTokens()
    return response
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this._request<User>('/users/@me', 'GET')
  }

  async updateUser(updates: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this._request<User>('/users/profile', 'PATCH', updates)
  }

  // Server Endpoints
  async getServers(): Promise<ApiResponse<Guild[]>> {
    return this._request<Guild[]>('/guilds', 'GET')
  }

  async getServer(serverId: string): Promise<ApiResponse<Guild>> {
    return this._request<Guild>(`/guilds/${serverId}`, 'GET')
  }

  async createServer(request: CreateServerRequest): Promise<ApiResponse<Guild>> {
    return this._request<Guild>('/guilds', 'POST', request)
  }

  async updateServer(serverId: string, updates: Partial<Guild>): Promise<ApiResponse<Guild>> {
    return this._request<Guild>(`/guilds/${serverId}`, 'PUT', updates)
  }

  async deleteServer(serverId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/guilds/${serverId}`, 'DELETE')
  }

  // Channel Endpoints
  async getChannels(serverId: string): Promise<ApiResponse<Channel[]>> {
    return this._request<Channel[]>(`/guilds/${serverId}/channels`, 'GET')
  }

  async getChannel(channelId: string): Promise<ApiResponse<Channel>> {
    return this._request<Channel>(`/channels/${channelId}`, 'GET')
  }

  async createChannel(serverId: string, request: CreateChannelRequest): Promise<ApiResponse<Channel>> {
    return this._request<Channel>(`/guilds/${serverId}/channels`, 'POST', request)
  }

  async updateChannel(channelId: string, updates: Partial<Channel>): Promise<ApiResponse<Channel>> {
    return this._request<Channel>(`/channels/${channelId}`, 'PUT', updates)
  }

  async deleteChannel(channelId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/channels/${channelId}`, 'DELETE')
  }

  // Message Endpoints
  async getMessages(channelId: string, limit: number = 50, before?: string): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(before && { before }),
    })
    return this._request<Message[]>(`/channels/${channelId}/messages?${params}`, 'GET')
  }

  async getMessage(channelId: string, messageId: string): Promise<ApiResponse<Message>> {
    return this._request<Message>(`/channels/${channelId}/messages/${messageId}`, 'GET')
  }

  async sendMessage(channelId: string, request: SendMessageRequest): Promise<ApiResponse<Message>> {
    return this._request<Message>(`/channels/${channelId}/messages`, 'POST', request)
  }

  async updateMessage(channelId: string, messageId: string, content: string): Promise<ApiResponse<Message>> {
    return this._request<Message>(`/channels/${channelId}/messages/${messageId}`, 'PUT', { content })
  }

  async deleteMessage(channelId: string, messageId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/channels/${channelId}/messages/${messageId}`, 'DELETE')
  }

  // Reaction endpoints (optional persistence)
  async addReaction(channelId: string, messageId: string, emoji: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/channels/${channelId}/messages/${messageId}/reactions`, 'POST', { emoji })
  }

  async removeReaction(channelId: string, messageId: string, emoji: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/channels/${channelId}/messages/${messageId}/reactions`, 'DELETE', { emoji })
  }

  async searchMessages(serverId: string, query: string): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams({ q: query })
    return this._request<Message[]>(`/guilds/${serverId}/messages/search?${params}`, 'GET')
  }

  // User Endpoints
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this._request<User>(`/users/${userId}`, 'GET')
  }

  async getServerMembers(serverId: string): Promise<ApiResponse<Member[]>> {
    return this._request<Member[]>(`/guilds/${serverId}/members`, 'GET')
  }

  async getMember(serverId: string, userId: string): Promise<ApiResponse<Member>> {
    return this._request<Member>(`/guilds/${serverId}/members/${userId}`, 'GET')
  }

  async updateMember(serverId: string, userId: string, updates: Partial<Member>): Promise<ApiResponse<Member>> {
    return this._request<Member>(`/guilds/${serverId}/members/${userId}`, 'PUT', updates)
  }

  async removeMember(serverId: string, userId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/guilds/${serverId}/members/${userId}`, 'DELETE')
  }

  // Friend Endpoints
  async getFriends(): Promise<ApiResponse<User[]>> {
    return this._request<User[]>('/users/friends', 'GET')
  }

  async addFriend(userId: string): Promise<ApiResponse<void>> {
    return this._request<void>('/users/friends', 'POST', { userId })
  }

  async removeFriend(userId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/users/friends/${userId}`, 'DELETE')
  }

  async blockUser(userId: string): Promise<ApiResponse<void>> {
    return this._request<void>('/users/blocked', 'POST', { userId })
  }

  async unblockUser(userId: string): Promise<ApiResponse<void>> {
    return this._request<void>(`/users/blocked/${userId}`, 'DELETE')
  }

  // Utility
  getIsAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }
}

// Singleton instance
export const apiClient = new BeaconApiClient()
export const api = apiClient // Backwards compatibility
