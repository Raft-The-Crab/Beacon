import type { HTTPClient } from './HTTPClient'
import type { ApiResponse } from '../types'

export interface WebhookData {
  id: string
  name: string
  channelId: string
  serverId?: string
  token?: string
  avatar?: string
  url: string
  createdAt: string
}

export interface CreateWebhookOptions {
  name: string
  avatar?: string
}

export interface ExecuteWebhookOptions {
  content?: string
  username?: string
  avatarUrl?: string
  tts?: boolean
  embeds?: any[]
  components?: any[]
  files?: Array<{ name: string; data: Buffer | Blob | string }>
  threadId?: string
  wait?: boolean
}

/**
 * Webhooks API — create, manage, and execute webhooks
 */
export class WebhooksAPI {
  constructor(private client: HTTPClient) {}

  /** Get a webhook by ID */
  async get(webhookId: string): Promise<ApiResponse<WebhookData>> {
    return this.client.get<WebhookData>(`/webhooks/${webhookId}`)
  }

  /** Get all webhooks for a channel */
  async getForChannel(channelId: string): Promise<ApiResponse<WebhookData[]>> {
    return this.client.get<WebhookData[]>(`/channels/${channelId}/webhooks`)
  }

  /** Get all webhooks for a server */
  async getForServer(serverId: string): Promise<ApiResponse<WebhookData[]>> {
    return this.client.get<WebhookData[]>(`/servers/${serverId}/webhooks`)
  }

  /** Create a webhook in a channel */
  async create(channelId: string, options: CreateWebhookOptions): Promise<ApiResponse<WebhookData>> {
    return this.client.post<WebhookData>(`/channels/${channelId}/webhooks`, options)
  }

  /** Edit a webhook */
  async edit(webhookId: string, options: Partial<CreateWebhookOptions & { channelId?: string }>): Promise<ApiResponse<WebhookData>> {
    return this.client.patch<WebhookData>(`/webhooks/${webhookId}`, options)
  }

  /** Delete a webhook */
  async delete(webhookId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/webhooks/${webhookId}`)
  }

  /** Execute a webhook (send a message through it) */
  async execute(webhookId: string, token: string, options: ExecuteWebhookOptions): Promise<ApiResponse<any>> {
    const wait = options.wait !== false
    const query = options.threadId
      ? `?thread_id=${options.threadId}&wait=${wait}`
      : `?wait=${wait}`
    return this.client.post<any>(`/webhooks/${webhookId}/${token}${query}`, {
      content:    options.content,
      username:   options.username,
      avatar_url: options.avatarUrl,
      tts:        options.tts,
      embeds:     options.embeds,
      components: options.components,
    })
  }

  /** Edit a message sent via webhook */
  async editMessage(webhookId: string, token: string, messageId: string, options: Partial<ExecuteWebhookOptions>): Promise<ApiResponse<any>> {
    return this.client.patch<any>(`/webhooks/${webhookId}/${token}/messages/${messageId}`, options)
  }

  /** Delete a message sent via webhook */
  async deleteMessage(webhookId: string, token: string, messageId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/webhooks/${webhookId}/${token}/messages/${messageId}`)
  }
}
