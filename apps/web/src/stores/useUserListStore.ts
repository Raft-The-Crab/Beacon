import { create } from 'zustand'
import type { User, PresenceStatus } from 'beacon-sdk'
import { apiClient } from '../services/apiClient'

function extractFriendsPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.friends)) return payload.friends
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.friends)) return payload.data.friends
  return []
}

async function fetchFriendsList() {
  let res = await apiClient.request('GET', '/users/me/friends')
  if (res.success) return extractFriendsPayload(res.data)
  
  res = await apiClient.request('GET', '/friends')
  if (res.success) return extractFriendsPayload(res.data)
  
  return []
}

export interface Friend extends User {
  id: string
  username: string
  status: PresenceStatus
  lastSeen?: string
}

interface UserListState {
  friends: Friend[]
  pendingRequests: any[]
  blockedUsers: string[]
  currentUser: User | null
  users: Map<string, User>

  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  eagerLoad: () => Promise<void>;
  setCurrentUser: (user: User) => void
  addFriend: (friend: Friend) => void
  removeFriend: (userId: string) => void
  updateFriendStatus: (userId: string, status: PresenceStatus) => void

  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  isBlocked: (userId: string) => boolean

  addUser: (user: User) => void
  getUser: (userId: string) => User | null
  updateUser: (userId: string, updates: Partial<User>) => void
}

export const useUserListStore = create<UserListState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  blockedUsers: [],
  currentUser: null,
  users: new Map(),

  fetchFriends: async () => {
    try {
      const data = await fetchFriendsList()
      const deduped = new Map<string, any>()
      for (const friend of extractFriendsPayload(data)) {
        const key = String(friend?.id || `${friend?.username || ''}#${friend?.discriminator || '0000'}`)
        if (!key) continue
        deduped.set(key, friend)
      }
      const friendsList = Array.from(deduped.values()).map((friend: any) => ({
        ...friend,
        discriminator: friend?.discriminator || '0000',
        status: friend?.status || 'offline'
      }))
      set((state) => {
        const users = new Map(state.users)
        for (const friend of friendsList) {
          if (friend?.id) {
            users.set(friend.id, friend)
          }
        }
        return { friends: friendsList, users }
      })
    } catch (e) {
      console.error('Failed to fetch friends', e)
    }
  },

  fetchPendingRequests: async () => {
    try {
      const res = await apiClient.request('GET', '/friends/pending')
      if (res.success) {
        const data = res.data
        const pendingList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        set({ pendingRequests: pendingList })
      }
    } catch (e) {
      console.error('Failed to fetch pending requests', e)
    }
  },

  eagerLoad: async () => {
    try {
      const data = await fetchFriendsList()
      const deduped = new Map<string, any>()
      for (const friend of extractFriendsPayload(data)) {
        const key = String(friend?.id || `${friend?.username || ''}#${friend?.discriminator || '0000'}`)
        if (!key) continue
        deduped.set(key, friend)
      }
      const friendsList = Array.from(deduped.values()).map((friend: any) => ({
        ...friend,
        discriminator: friend?.discriminator || '0000',
        status: friend?.status || 'offline'
      }))
      set((state) => {
        const users = new Map(state.users)
        for (const friend of friendsList) {
          if (friend?.id) {
            users.set(friend.id, friend)
          }
        }
        return { friends: friendsList, users }
      })
    } catch (e) {
      console.error('UserList eager load failed', e)
    }
  },

  setCurrentUser: (user) =>
    set((state) => {
      const newUsers = new Map(state.users)
      newUsers.set(user.id, user)
      return {
        currentUser: user,
        users: newUsers,
      }
    }),

  addFriend: (friend) =>
    set((state) => {
      const existing = state.friends.find((f) => f.id === friend.id)
      if (existing) return state
      const newUsers = new Map(state.users)
      newUsers.set(friend.id, friend)
      return {
        friends: [...state.friends, friend],
        users: newUsers,
      }
    }),

  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== userId),
    })),

  updateFriendStatus: (userId, status) =>
    set((state) => {
      const friend = state.friends.find((f) => f.id === userId)
      if (!friend) return state
      return {
        friends: state.friends.map((f) =>
          f.id === userId ? ({ ...f, status } as any) : f
        ),
      }
    }),

  fetchBlockedUsers: async () => {
    try {
      const res = await apiClient.request('GET', '/users/me/blocked')
      if (res.success) {
        const data = res.data
        const blockedList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        set({ blockedUsers: blockedList.map((u: any) => u.id) })
      }
    } catch (e) {
      console.error('Failed to fetch blocked users', e)
    }
  },

  blockUser: async (userId) => {
    try {
      const res = await apiClient.request('POST', '/users/block', { targetId: userId })
      if (res.success) {
        set((state) => {
          if (state.blockedUsers.includes(userId)) return state
          return {
            blockedUsers: [...state.blockedUsers, userId],
            friends: state.friends.filter(f => f.id !== userId)
          }
        })
      }
    } catch (e) {
      console.error('Failed to block user', e)
    }
  },

  unblockUser: async (userId) => {
    try {
      const res = await apiClient.request('POST', '/users/unblock', { targetId: userId })
      if (res.success) {
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((id) => id !== userId),
        }))
      }
    } catch (e) {
      console.error('Failed to unblock user', e)
    }
  },

  isBlocked: (userId) => {
    return get().blockedUsers.includes(userId)
  },

  addUser: (user) =>
    set((state) => {
      const newUsers = new Map(state.users)
      newUsers.set(user.id, user)
      return { users: newUsers }
    }),

  getUser: (userId) => {
    return get().users.get(userId) || null
  },

  updateUser: (userId, updates) =>
    set((state) => {
      const user = state.users.get(userId)
      if (!user) return state
      const newUsers = new Map(state.users)
      newUsers.set(userId, { ...user, ...updates } as any)
      return { users: newUsers }
    }),
}))
