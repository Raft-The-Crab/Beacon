import type { HTTPClient } from './HTTPClient'
import type { ApiResponse } from '../types'

export interface NotificationData {
  id: string
  type: 'message' | 'mention' | 'friend_request' | 'server_invite' | 'system'
  title: string
  body: string
  read: boolean
  createdAt: string
  metadata?: Record<string, any>
}

/**
 * Notifications API
 */
export class NotificationsAPI {
  constructor(private client: HTTPClient) {}

  /** Get all notifications for the current user */
  async getAll(options?: { unreadOnly?: boolean; limit?: number }): Promise<ApiResponse<NotificationData[]>> {
    const params = new URLSearchParams()
    if (options?.unreadOnly) params.append('unread', 'true')
    if (options?.limit) params.append('limit', String(options.limit))
    const query = params.toString() ? `?${params}` : ''
    return this.client.get<NotificationData[]>(`/notifications${query}`)
  }

  /** Mark a notification as read */
  async markRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.client.patch<void>(`/notifications/${notificationId}/read`)
  }

  /** Mark all notifications as read */
  async markAllRead(): Promise<ApiResponse<void>> {
    return this.client.post<void>('/notifications/mark-all-read')
  }

  /** Delete a single notification */
  async delete(notificationId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/notifications/${notificationId}`)
  }

  /** Clear all notifications */
  async clearAll(): Promise<ApiResponse<void>> {
    return this.client.delete<void>('/notifications')
  }

  /** Get the unread notification count */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.client.get<{ count: number }>('/notifications/unread-count')
  }
}
