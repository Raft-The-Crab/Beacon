import type { HTTPClient } from './HTTPClient'
import type { Message, ApiResponse, SendMessageOptions, PaginationOptions } from '../types'

/**
 * Messages API
 */
export class MessagesAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Send a message
   */
  async send(channelId: string, options: SendMessageOptions): Promise<ApiResponse<Message>> {
    return this.client.post<Message>(`/channels/${channelId}/messages`, options)
  }

  /**
   * Get message history
   */
  async getHistory(channelId: string, options?: PaginationOptions): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams()
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.before) params.append('before', options.before)
    if (options?.after) params.append('after', options.after)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.client.get<Message[]>(`/channels/${channelId}/messages${query}`)
  }

  /**
   * Get a specific message
   */
  async get(channelId: string, messageId: string): Promise<ApiResponse<Message>> {
    return this.client.get<Message>(`/channels/${channelId}/messages/${messageId}`)
  }

  /**
   * Edit a message
   */
  async edit(channelId: string, messageId: string, content: string): Promise<ApiResponse<Message>> {
    return this.client.patch<Message>(`/channels/${channelId}/messages/${messageId}`, {
      content
    })
  }

  /**
   * Delete a message
   */
  async delete(channelId: string, messageId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/channels/${channelId}/messages/${messageId}`)
  }

  /**
   * Add reaction to a message
   */
  async addReaction(channelId: string, messageId: string, emoji: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    )
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(channelId: string, messageId: string, emoji: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    )
  }

  /**
   * Get reactions for a message
   */
  async getReactions(channelId: string, messageId: string, emoji: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    )
  }

  /**
   * Pin a message
   */
  async pin(channelId: string, messageId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/channels/${channelId}/pins/${messageId}`)
  }

  /**
   * Unpin a message
   */
  async unpin(channelId: string, messageId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/channels/${channelId}/pins/${messageId}`)
  }

  /**
   * Get pinned messages
   */
  async getPinned(channelId: string): Promise<ApiResponse<Message[]>> {
    return this.client.get<Message[]>(`/channels/${channelId}/pins`)
  }

  /**
   * Bulk delete messages
   */
  async bulkDelete(channelId: string, messageIds: string[]): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/channels/${channelId}/messages/bulk-delete`, {
      messages: messageIds
    })
  }

  /**
   * Search messages
   */
  async search(channelId: string, query: string, options?: PaginationOptions): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams({ query })
    
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.before) params.append('before', options.before)
    if (options?.after) params.append('after', options.after)

    return this.client.get<Message[]>(`/channels/${channelId}/messages/search?${params.toString()}`)
  }

  /**
   * Start typing indicator
   */
  async typing(channelId: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/channels/${channelId}/typing`)
  }
}
