import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface Streak {
  userId: string
  username: string
  days: number
  lastMessageDate: string
  emoji: string
}

interface StreakStore {
  streaks: Map<string, Streak>
  
  updateStreak: (userId: string, username: string) => Promise<void>
  getStreak: (userId: string) => Streak | null
  getAllStreaks: () => Streak[]
}

export const useStreakStore = create<StreakStore>()(
  persist(
    (set, get) => ({
      streaks: new Map(),

      updateStreak: async (userId: string, username: string) => {
        const today = new Date().toDateString()
        const existing = get().streaks.get(userId)

        if (existing) {
          const lastDate = new Date(existing.lastMessageDate)
          const daysDiff = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysDiff === 0) {
            // Same day, no update
            return
          } else if (daysDiff === 1) {
            // Consecutive day, increment streak
            const newDays = existing.days + 1
            set(state => {
              const newStreaks = new Map(state.streaks)
              newStreaks.set(userId, {
                ...existing,
                days: newDays,
                lastMessageDate: today,
                emoji: getStreakEmoji(newDays)
              })
              return { streaks: newStreaks }
            })

            // Award Beacoin for streak
            await api.post('/beacoin/earn', {
              type: 'STREAK_MAINTAINED',
              amount: Math.min(newDays, 10) // Max 10 coins per day
            })
          } else {
            // Streak broken, reset to 1
            set(state => {
              const newStreaks = new Map(state.streaks)
              newStreaks.set(userId, {
                userId,
                username,
                days: 1,
                lastMessageDate: today,
                emoji: '🔥'
              })
              return { streaks: newStreaks }
            })
          }
        } else {
          // New streak
          set(state => {
            const newStreaks = new Map(state.streaks)
            newStreaks.set(userId, {
              userId,
              username,
              days: 1,
              lastMessageDate: today,
              emoji: '🔥'
            })
            return { streaks: newStreaks }
          })
        }
      },

      getStreak: (userId: string) => {
        return get().streaks.get(userId) || null
      },

      getAllStreaks: () => {
        return Array.from(get().streaks.values()).sort((a, b) => b.days - a.days)
      }
    }),
    {
      name: 'beacon-streaks',
      partialize: (state) => ({ streaks: Array.from(state.streaks.entries()) }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.streaks)) {
          state.streaks = new Map(state.streaks as any)
        }
      }
    }
  )
)

function getStreakEmoji(days: number): string {
  if (days >= 365) return '👑' // Year streak
  if (days >= 100) return '💎' // 100 days
  if (days >= 30) return '⭐' // Month
  if (days >= 7) return '✨' // Week
  return '🔥' // Default
}
