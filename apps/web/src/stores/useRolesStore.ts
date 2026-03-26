import { create } from 'zustand'
import { apiClient } from '../services/apiClient'
import { PermissionBit } from 'beacon-sdk'

export type Permission = keyof typeof PermissionBit

export const PermissionMap: Record<Permission, bigint> = PermissionBit

export function permissionsToBitfield(permissions: Permission[]): string {
  let bitfield = 0n;
  permissions.forEach(p => {
    if (PermissionMap[p]) bitfield |= PermissionMap[p];
  });
  return bitfield.toString();
}

export function bitfieldToPermissions(bitfield: string | bigint): Permission[] {
  const bf = BigInt(bitfield);
  const permissions: Permission[] = [];
  (Object.keys(PermissionMap) as Permission[]).forEach(perm => {
    if ((bf & PermissionMap[perm]) !== 0n) {
      permissions.push(perm);
    }
  });
  return permissions;
}

export interface Role {
  id: string
  serverId: string
  name: string
  color: string
  icon?: string
  permissions: Permission[]
  position: number
  mentionable: boolean
  hoist: boolean
  memberCount: number
}

export interface RoleAssignment {
  userId: string
  roleIds: string[]
}

interface RolesStore {
  roles: Record<string, Role[]> // serverId -> roles
  assignments: Record<string, RoleAssignment[]> // serverId -> assignments

  // Actions
  fetchRoles: (serverId: string) => Promise<void>
  setRoles: (serverId: string, roles: Role[]) => void
  addRole: (serverId: string, roleData: Partial<Role>) => Promise<void>
  updateRole: (serverId: string, roleId: string, updates: Partial<Role>) => Promise<void>
  deleteRole: (serverId: string, roleId: string) => Promise<void>
  reorderRoles: (serverId: string, reorderedRoles: Role[]) => Promise<void>
  getRoles: (serverId: string) => Role[]
  getRole: (serverId: string, roleId: string) => Role | undefined

  assignRole: (serverId: string, userId: string, roleId: string) => Promise<void>
  removeRole: (serverId: string, userId: string, roleId: string) => Promise<void>
  getUserRoles: (serverId: string, userId: string) => Role[]
  hasPermission: (serverId: string, userId: string, permission: Permission) => boolean
}

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: {},
  assignments: {},

  fetchRoles: async (serverId) => {
    try {
      const res = await apiClient.request('GET', `/guilds/${serverId}/roles`)
      if (res.success) {
        const mappedRoles = (res.data as any[]).map((r: any) => ({
          ...r,
          permissions: bitfieldToPermissions(r.permissions)
        }))
        get().setRoles(serverId, mappedRoles)
      }
    } catch (error) {
      console.error('Failed to fetch roles', error)
    }
  },

  setRoles: (serverId, roles) =>
    set((state) => ({
      roles: { ...state.roles, [serverId]: roles }
    })),

  addRole: async (serverId, roleData) => {
    try {
      const payload = {
        ...roleData,
        permissions: permissionsToBitfield(roleData.permissions || [])
      }
      const res = await apiClient.request('POST', `/guilds/${serverId}/roles`, payload)
      if (res.success) {
        const data = res.data
        const mappedRole = { ...data, permissions: bitfieldToPermissions(data.permissions) }
        set((state) => {
          const serverRoles = state.roles[serverId] || []
          return {
            roles: { ...state.roles, [serverId]: [...serverRoles, mappedRole] }
          }
        })
      }
    } catch (error) {
      console.error('Failed to add role', error)
    }
  },

  updateRole: async (serverId, roleId, updates) => {
    try {
      const payload = {
        ...updates,
        permissions: updates.permissions ? permissionsToBitfield(updates.permissions) : undefined
      }
      const res = await apiClient.request('PATCH', `/guilds/${serverId}/roles/${roleId}`, payload)
      if (res.success) {
        const data = res.data
        const mappedRole = { ...data, permissions: bitfieldToPermissions(data.permissions) }
        set((state) => {
          const serverRoles = state.roles[serverId] || []
          const updatedRoles = serverRoles.map((role) =>
            role.id === roleId ? { ...role, ...mappedRole } : role
          )
          return {
            roles: { ...state.roles, [serverId]: updatedRoles }
          }
        })
      }
    } catch (error) {
      console.error('Failed to update role', error)
    }
  },

  deleteRole: async (serverId, roleId) => {
    try {
      const res = await apiClient.request('DELETE', `/guilds/${serverId}/roles/${roleId}`)
      if (res.success) {
        set((state) => {
          const serverRoles = state.roles[serverId] || []
          return {
            roles: { ...state.roles, [serverId]: serverRoles.filter((role) => role.id !== roleId) }
          }
        })
      }
    } catch (error) {
      console.error('Failed to delete role', error)
    }
  },

  reorderRoles: async (serverId, reorderedRoles) => {
    try {
      const roleOrder = reorderedRoles.map((r, i) => ({ id: r.id, position: reorderedRoles.length - i }))
      const res = await apiClient.request('PUT', `/guilds/${serverId}/roles/reorder`, { roles: roleOrder })
      if (res.success) {
        set((state) => ({
          roles: { ...state.roles, [serverId]: reorderedRoles.map((r, i) => ({ ...r, position: reorderedRoles.length - i })) }
        }))
      }
    } catch (error) {
      console.error('Failed to reorder roles', error)
    }
  },

  getRoles: (serverId) => {
    return get().roles[serverId] || []
  },

  getRole: (serverId, roleId) => {
    const serverRoles = get().roles[serverId] || []
    return serverRoles.find((role) => role.id === roleId)
  },

  assignRole: async (serverId, userId, roleId) => {
    try {
      const { success } = await apiClient.addMemberRole(serverId, userId, roleId)
      if (success) {
        set((state) => {
          const serverAssignments = state.assignments[serverId] || []
          const userAssignment = serverAssignments.find((a) => a.userId === userId)
          const newAssignments = [...serverAssignments]

          if (userAssignment) {
            if (!userAssignment.roleIds.includes(roleId)) {
              userAssignment.roleIds = [...userAssignment.roleIds, roleId]
            }
          } else {
            newAssignments.push({ userId, roleIds: [roleId] })
          }

          return { assignments: { ...state.assignments, [serverId]: newAssignments } }
        })
      }
    } catch (error) {
      console.error('Failed to assign role', error)
    }
  },

  removeRole: async (serverId, userId, roleId) => {
    try {
      const { success } = await apiClient.removeMemberRole(serverId, userId, roleId)
      if (success) {
        set((state) => {
          const serverAssignments = state.assignments[serverId] || []
          const newAssignments = serverAssignments.map(a =>
            a.userId === userId ? { ...a, roleIds: a.roleIds.filter(id => id !== roleId) } : a
          )
          return { assignments: { ...state.assignments, [serverId]: newAssignments } }
        })
      }
    } catch (error) {
      console.error('Failed to remove role', error)
    }
  },

  getUserRoles: (serverId: string, userId: string) => {
    const assignments = get().assignments[serverId] || []
    const userAssignment = assignments.find((a) => a.userId === userId)
    if (!userAssignment) return []

    const serverRoles = get().roles[serverId] || []
    return serverRoles.filter((role) => userAssignment.roleIds.includes(role.id))
  },

  hasPermission: (serverId: string, userId: string, permission: Permission) => {
    const userRoles = get().getUserRoles(serverId, userId)

    // Check for administrator permission (grants all permissions)
    if (userRoles.some((role) => role.permissions.includes('ADMINISTRATOR'))) {
      return true
    }

    // Check if any role has the specific permission
    return userRoles.some((role) => role.permissions.includes(permission))
  },
}))
