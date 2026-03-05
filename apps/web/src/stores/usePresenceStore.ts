import { create } from 'zustand'
import { PresenceStatus } from './useAuthStore'

export interface UserActivity {
  type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom'
  name: string
  details?: string
  state?: string
  assets?: {
    largeImage?: string
    smallImage?: string
    largeText?: string
    smallText?: string
  }
  timestamps?: {
    start: number
    end?: number
  }
  url?: string
}

export interface UserPresence {
  userId: string
  status: PresenceStatus
  customStatus?: string
  activities: UserActivity[]
  lastSeen: string
}

interface PresenceStore {
  presences: Record<string, UserPresence>

  // Actions
  setPresence: (userId: string, status: PresenceStatus, customStatus?: string, activities?: UserActivity[]) => void
  setMultiplePresences: (presences: UserPresence[]) => void
  getPresence: (userId: string) => UserPresence | undefined
  clearPresences: () => void
  updateLastSeen: (userId: string) => void
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  presences: {},

  setPresence: (userId: string, status: PresenceStatus, customStatus?: string, activities: UserActivity[] = []) =>
    set((state) => ({
      presences: {
        ...state.presences,
        [userId]: {
          userId,
          status,
          customStatus,
          activities,
          lastSeen: new Date().toISOString(),
        }
      }
    })),

  setMultiplePresences: (newPresences: UserPresence[]) =>
    set((state) => {
      const presences = { ...state.presences }
      newPresences.forEach((presence) => {
        presences[presence.userId] = presence
      })
      return { presences }
    }),

  getPresence: (userId: string) => {
    return get().presences[userId]
  },

  clearPresences: () => set({ presences: {} }),

  updateLastSeen: (userId: string) =>
    set((state) => {
      const presence = state.presences[userId]
      if (!presence) return state
      return {
        presences: {
          ...state.presences,
          [userId]: {
            ...presence,
            lastSeen: new Date().toISOString()
          }
        }
      }
    }),
}))
