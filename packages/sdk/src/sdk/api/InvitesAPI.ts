import type { HTTPClient } from './HTTPClient'
import type { ApiResponse } from '../types'

export interface InviteData {
  code: string
  channelId?: string
  serverId?: string
  inviterId?: string
  maxAge: number        // seconds, 0 = permanent
  maxUses: number       // 0 = unlimited
  uses: number
  temporary: boolean
  createdAt: string
  expiresAt?: string
  server?: {
    id: string
    name: string
    icon?: string
    memberCount?: number
  }
}

export interface CreateInviteOptions {
  maxAge?: number      // default 86400 (24h), 0 = permanent
  maxUses?: number     // default 0 (unlimited)
  temporary?: boolean
  unique?: boolean
}

/**
 * Invites API
 */
export class InvitesAPI {
  constructor(private client: HTTPClient) {}

  /** Resolve an invite by code (preview without joining) */
  async get(code: string): Promise<ApiResponse<InviteData>> {
    return this.client.get<InviteData>(`/invites/${code}`)
  }

  /** Create an invite for a channel */
  async create(channelId: string, options?: CreateInviteOptions): Promise<ApiResponse<InviteData>> {
    return this.client.post<InviteData>(`/channels/${channelId}/invites`, {
      max_age:   options?.maxAge ?? 86400,
      max_uses:  options?.maxUses ?? 0,
      temporary: options?.temporary ?? false,
      unique:    options?.unique ?? false,
    })
  }

  /** Delete (revoke) an invite */
  async delete(code: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/invites/${code}`)
  }

  /** Get all invites for a channel (requires Manage Channel permission) */
  async getForChannel(channelId: string): Promise<ApiResponse<InviteData[]>> {
    return this.client.get<InviteData[]>(`/channels/${channelId}/invites`)
  }

  /** Get all invites for a server (requires Manage Server permission) */
  async getForServer(serverId: string): Promise<ApiResponse<InviteData[]>> {
    return this.client.get<InviteData[]>(`/servers/${serverId}/invites`)
  }

  /** Accept/use an invite — joins the server */
  async accept(code: string): Promise<ApiResponse<{ serverId: string; channelId?: string }>> {
    return this.client.post<any>(`/invites/${code}`)
  }
}
