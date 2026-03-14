import type { HTTPClient } from './HTTPClient'
import type { Role, ApiResponse, CreateRoleOptions, Permission } from '../types'

/**
 * Roles API
 */
export class RolesAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Create a role
   */
  async create(serverId: string, options: CreateRoleOptions): Promise<ApiResponse<Role>> {
    return this.client.post<Role>(`/servers/${serverId}/roles`, options)
  }

  /**
   * Get a role
   */
  async get(serverId: string, roleId: string): Promise<ApiResponse<Role>> {
    return this.client.get<Role>(`/servers/${serverId}/roles/${roleId}`)
  }

  /**
   * Update a role
   */
  async update(serverId: string, roleId: string, data: Partial<CreateRoleOptions>): Promise<ApiResponse<Role>> {
    return this.client.patch<Role>(`/servers/${serverId}/roles/${roleId}`, data)
  }

  /**
   * Delete a role
   */
  async delete(serverId: string, roleId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}/roles/${roleId}`)
  }

  /**
   * Assign role to user
   */
  async assignToUser(serverId: string, userId: string, roleId: string): Promise<ApiResponse<void>> {
    return this.client.put<void>(`/servers/${serverId}/members/${userId}/roles/${roleId}`)
  }

  /**
   * Remove role from user
   */
  async removeFromUser(serverId: string, userId: string, roleId: string): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/servers/${serverId}/members/${userId}/roles/${roleId}`)
  }

  /**
   * Update role positions
   */
  async updatePositions(serverId: string, positions: Array<{ id: string; position: number }>): Promise<ApiResponse<Role[]>> {
    return this.client.patch<Role[]>(`/servers/${serverId}/roles`, { positions })
  }

  /**
   * Get role members
   */
  async getMembers(serverId: string, roleId: string): Promise<ApiResponse<any[]>> {
    return this.client.get<any[]>(`/servers/${serverId}/roles/${roleId}/members`)
  }

  /**
   * Check if user has permission
   */
  async checkPermission(serverId: string, userId: string, permission: Permission): Promise<ApiResponse<boolean>> {
    return this.client.get<boolean>(
      `/servers/${serverId}/members/${userId}/permissions/${permission}`
    )
  }
}
