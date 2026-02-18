import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ReactionsState {
  customReactions: string[]
  setCustomReactions: (reactions: string[]) => void
  addReaction: (emoji: string) => void
  removeReaction: (emoji: string) => void
  resetToDefaults: () => void
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉', '😢', '🔥', '👏']

export const useReactionsStore = create<ReactionsState>()(
  persist(
    (set) => ({
      customReactions: DEFAULT_REACTIONS,
      setCustomReactions: (reactions) => set({ customReactions: reactions }),
      addReaction: (emoji) =>
        set((state) => ({
          customReactions: [...state.customReactions, emoji],
        })),
      removeReaction: (emoji) =>
        set((state) => ({
          customReactions: state.customReactions.filter((r) => r !== emoji),
        })),
      resetToDefaults: () => set({ customReactions: DEFAULT_REACTIONS }),
    }),
    {
      name: 'beacon-reactions',
    }
  )
)
