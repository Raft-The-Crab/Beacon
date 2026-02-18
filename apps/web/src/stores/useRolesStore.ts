import { create } from 'zustand'

export type Permission =
  | 'ADMINISTRATOR'
  | 'MANAGE_SERVER'
  | 'MANAGE_ROLES'
  | 'MANAGE_CHANNELS'
  | 'KICK_MEMBERS'
  | 'BAN_MEMBERS'
  | 'CREATE_INVITE'
  | 'CHANGE_NICKNAME'
  | 'MANAGE_NICKNAMES'
  | 'MANAGE_MESSAGES'
  | 'SEND_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'ADD_REACTIONS'
  | 'USE_EXTERNAL_EMOJIS'
  | 'MENTION_EVERYONE'
  | 'MANAGE_WEBHOOKS'
  | 'VIEW_CHANNELS'
  | 'SEND_TTS_MESSAGES'
  | 'CONNECT_VOICE'
  | 'SPEAK_VOICE'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS'
  | 'USE_VOICE_ACTIVITY'
  | 'PRIORITY_SPEAKER'

export interface Role {
  id: string
  serverId: string
  name: string
  color: string
  icon?: string
  permissions: Permission[]
  position: number
  mentionable: boolean
  hoist: boolean // Display separately in member list
  memberCount: number
}

export interface RoleAssignment {
  userId: string
  roleIds: string[]
}

interface RolesStore {
  roles: Map<string, Role[]> // serverId -> roles
  assignments: Map<string, RoleAssignment[]> // serverId -> assignments
  
  // Actions
  setRoles: (serverId: string, roles: Role[]) => void
  addRole: (serverId: string, role: Role) => void
  updateRole: (serverId: string, roleId: string, updates: Partial<Role>) => void
  deleteRole: (serverId: string, roleId: string) => void
  getRoles: (serverId: string) => Role[]
  getRole: (serverId: string, roleId: string) => Role | undefined
  
  assignRole: (serverId: string, userId: string, roleId: string) => void
  removeRole: (serverId: string, userId: string, roleId: string) => void
  getUserRoles: (serverId: string, userId: string) => Role[]
  hasPermission: (serverId: string, userId: string, permission: Permission) => boolean
}

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: new Map(),
  assignments: new Map(),

  setRoles: (serverId: string, roles: Role[]) =>
    set((state) => {
      const newRoles = new Map(state.roles)
      newRoles.set(serverId, roles)
      return { roles: newRoles }
    }),

  addRole: (serverId: string, role: Role) =>
    set((state) => {
      const newRoles = new Map(state.roles)
      const serverRoles = newRoles.get(serverId) || []
      newRoles.set(serverId, [...serverRoles, role])
      return { roles: newRoles }
    }),

  updateRole: (serverId: string, roleId: string, updates: Partial<Role>) =>
    set((state) => {
      const newRoles = new Map(state.roles)
      const serverRoles = newRoles.get(serverId) || []
      const updatedRoles = serverRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      )
      newRoles.set(serverId, updatedRoles)
      return { roles: newRoles }
    }),

  deleteRole: (serverId: string, roleId: string) =>
    set((state) => {
      const newRoles = new Map(state.roles)
      const serverRoles = newRoles.get(serverId) || []
      newRoles.set(serverId, serverRoles.filter((role) => role.id !== roleId))
      return { roles: newRoles }
    }),

  getRoles: (serverId: string) => {
    return get().roles.get(serverId) || []
  },

  getRole: (serverId: string, roleId: string) => {
    const roles = get().roles.get(serverId) || []
    return roles.find((role) => role.id === roleId)
  },

  assignRole: (serverId: string, userId: string, roleId: string) =>
    set((state) => {
      const newAssignments = new Map(state.assignments)
      const serverAssignments = newAssignments.get(serverId) || []
      const userAssignment = serverAssignments.find((a) => a.userId === userId)

      if (userAssignment) {
        if (!userAssignment.roleIds.includes(roleId)) {
          userAssignment.roleIds.push(roleId)
        }
      } else {
        serverAssignments.push({ userId, roleIds: [roleId] })
      }

      newAssignments.set(serverId, serverAssignments)
      return { assignments: newAssignments }
    }),

  removeRole: (serverId: string, userId: string, roleId: string) =>
    set((state) => {
      const newAssignments = new Map(state.assignments)
      const serverAssignments = newAssignments.get(serverId) || []
      const userAssignment = serverAssignments.find((a) => a.userId === userId)

      if (userAssignment) {
        userAssignment.roleIds = userAssignment.roleIds.filter((id) => id !== roleId)
      }

      newAssignments.set(serverId, serverAssignments)
      return { assignments: newAssignments }
    }),

  getUserRoles: (serverId: string, userId: string) => {
    const assignments = get().assignments.get(serverId) || []
    const userAssignment = assignments.find((a) => a.userId === userId)
    if (!userAssignment) return []

    const roles = get().roles.get(serverId) || []
    return roles.filter((role) => userAssignment.roleIds.includes(role.id))
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
