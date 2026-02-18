import { create } from 'zustand'
import type { User, PresenceStatus } from '@beacon/types'
import { api } from '../lib/api'

export interface Friend extends User {
  status: PresenceStatus
  lastSeen?: string
}

interface UserListState {
  friends: Friend[]
  blockedUsers: string[]
  currentUser: User | null
  users: Map<string, User>
  
  fetchFriends: () => Promise<void>;
  setCurrentUser: (user: User) => void
  addFriend: (friend: Friend) => void
  removeFriend: (userId: string) => void
  updateFriendStatus: (userId: string, status: PresenceStatus) => void
  
  blockUser: (userId: string) => void
  unblockUser: (userId: string) => void
  isBlocked: (userId: string) => boolean
  
  addUser: (user: User) => void
  getUser: (userId: string) => User | null
  updateUser: (userId: string, updates: Partial<User>) => void
}

export const useUserListStore = create<UserListState>((set, get) => ({
  friends: [],
  blockedUsers: [],
  currentUser: null,
  users: new Map(),

  fetchFriends: async () => {
    try {
      const { data } = await api.get('/friends')
      // Map backend friendship objects to Friend interface
      const friendsList = data.map((f: any) => ({
        ...f.friend,
        status: f.friend.status || 'offline'
      }))
      set({ friends: friendsList })
    } catch (e) {
      console.error('Failed to fetch friends', e)
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
          f.id === userId ? { ...f, status } : f
        ),
      }
    }),

  blockUser: (userId) =>
    set((state) => {
      if (state.blockedUsers.includes(userId)) return state
      return {
        blockedUsers: [...state.blockedUsers, userId],
      }
    }),

  unblockUser: (userId) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((id) => id !== userId),
    })),

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
      newUsers.set(userId, { ...user, ...updates })
      return { users: newUsers }
    }),
}))
