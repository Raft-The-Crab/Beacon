import { create } from 'zustand'
import { PresenceStatus } from './useAuthStore'

export interface UserPresence {
  userId: string
  status: PresenceStatus
  customStatus?: string
  lastSeen: string
}

interface PresenceStore {
  presences: Map<string, UserPresence>
  
  // Actions
  setPresence: (userId: string, status: PresenceStatus, customStatus?: string) => void
  setMultiplePresences: (presences: UserPresence[]) => void
  getPresence: (userId: string) => UserPresence | undefined
  clearPresences: () => void
  updateLastSeen: (userId: string) => void
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  presences: new Map(),

  setPresence: (userId: string, status: PresenceStatus, customStatus?: string) =>
    set((state) => {
      const presences = new Map(state.presences)
      presences.set(userId, {
        userId,
        status,
        customStatus,
        lastSeen: new Date().toISOString(),
      })
      return { presences }
    }),

  setMultiplePresences: (newPresences: UserPresence[]) =>
    set((state) => {
      const presences = new Map(state.presences)
      newPresences.forEach((presence) => {
        presences.set(presence.userId, presence)
      })
      return { presences }
    }),

  getPresence: (userId: string) => {
    return get().presences.get(userId)
  },

  clearPresences: () => set({ presences: new Map() }),

  updateLastSeen: (userId: string) =>
    set((state) => {
      const presences = new Map(state.presences)
      const presence = presences.get(userId)
      if (presence) {
        presences.set(userId, {
          ...presence,
          lastSeen: new Date().toISOString(),
        })
      }
      return { presences }
    }),
}))
