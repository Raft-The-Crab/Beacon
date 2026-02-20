import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface StreakPet {
  id: string
  name: string
  emoji: string
  level: number
  xp: number
}

interface Streak {
  userId: string
  username: string
  days: number
  lastMessageDate: string
  emoji: string
  color: string
  pet?: StreakPet
}

export const STREAK_EMOJIS = ['🔥', '⚡', '✨', '💫', '🌟', '⭐', '💥', '🎯', '🚀', '💪']

export const STREAK_PETS = [
  { id: 'dragon', name: 'Fire Dragon', emoji: '🐉', unlockDays: 0 },
  { id: 'phoenix', name: 'Phoenix', emoji: '🦅', unlockDays: 7 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', unlockDays: 14 },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', unlockDays: 30 },
  { id: 'crown', name: 'Royal Crown', emoji: '👑', unlockDays: 100 },
  { id: 'gem', name: 'Diamond', emoji: '💎', unlockDays: 365 }
]

const STREAK_COLORS = {
  1: '#ff6b6b',
  7: '#ff8c42',
  14: '#ffd93d',
  30: '#6bcf7f',
  60: '#4ecdc4',
  100: '#a78bfa',
  365: '#ffd700'
}

interface StreakStore {
  streaks: Map<string, Streak>
  updateStreak: (userId: string, username: string) => Promise<void>
  getStreak: (userId: string) => Streak | null
  getAllStreaks: () => Streak[]
  changeStreakEmoji: (userId: string, emoji: string) => void
  getAvailablePets: (days: number) => typeof STREAK_PETS
  equipPet: (userId: string, petId: string) => void
  levelUpPet: (userId: string) => void
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

          if (daysDiff === 0) return
          
          if (daysDiff === 1) {
            const newDays = existing.days + 1
            set(state => {
              const newStreaks = new Map(state.streaks)
              newStreaks.set(userId, {
                ...existing,
                days: newDays,
                lastMessageDate: today,
                color: getStreakColor(newDays)
              })
              return { streaks: newStreaks }
            })

            get().levelUpPet(userId)
            await api.post('/beacoin/earn', { type: 'STREAK_MAINTAINED', amount: Math.min(newDays, 10) })
          } else {
            set(state => {
              const newStreaks = new Map(state.streaks)
              newStreaks.set(userId, {
                userId, username, days: 1, lastMessageDate: today,
                emoji: '🔥', color: '#ff6b6b', pet: undefined
              })
              return { streaks: newStreaks }
            })
          }
        } else {
          set(state => {
            const newStreaks = new Map(state.streaks)
            newStreaks.set(userId, {
              userId, username, days: 1, lastMessageDate: today,
              emoji: '🔥', color: '#ff6b6b'
            })
            return { streaks: newStreaks }
          })
        }
      },

      getStreak: (userId: string) => get().streaks.get(userId) || null,

      getAllStreaks: () => Array.from(get().streaks.values()).sort((a, b) => b.days - a.days),

      changeStreakEmoji: (userId: string, emoji: string) => {
        set(state => {
          const streak = state.streaks.get(userId)
          if (!streak) return state
          const newStreaks = new Map(state.streaks)
          newStreaks.set(userId, { ...streak, emoji })
          return { streaks: newStreaks }
        })
      },

      getAvailablePets: (days: number) => STREAK_PETS.filter(pet => days >= pet.unlockDays),

      equipPet: (userId: string, petId: string) => {
        set(state => {
          const streak = state.streaks.get(userId)
          if (!streak) return state
          const petData = STREAK_PETS.find(p => p.id === petId)
          if (!petData || streak.days < petData.unlockDays) return state
          const newStreaks = new Map(state.streaks)
          newStreaks.set(userId, {
            ...streak,
            pet: { id: petData.id, name: petData.name, emoji: petData.emoji, level: 1, xp: 0 }
          })
          return { streaks: newStreaks }
        })
      },

      levelUpPet: (userId: string) => {
        set(state => {
          const streak = state.streaks.get(userId)
          if (!streak || !streak.pet) return state
          const newXp = streak.pet.xp + 10
          const newLevel = Math.floor(newXp / 100) + 1
          const newStreaks = new Map(state.streaks)
          newStreaks.set(userId, {
            ...streak,
            pet: { ...streak.pet, xp: newXp, level: newLevel }
          })
          return { streaks: newStreaks }
        })
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

function getStreakColor(days: number): string {
  if (days >= 365) return STREAK_COLORS[365]
  if (days >= 100) return STREAK_COLORS[100]
  if (days >= 60) return STREAK_COLORS[60]
  if (days >= 30) return STREAK_COLORS[30]
  if (days >= 14) return STREAK_COLORS[14]
  if (days >= 7) return STREAK_COLORS[7]
  return STREAK_COLORS[1]
}
