import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PinnedMessage {
  id: string
  channelId: string
  content: string
  authorName: string
  authorAvatar?: string
  timestamp: string
  pinnedBy: string
  pinnedAt: string
}

interface PinnedMessagesStore {
  pinnedMessages: Record<string, PinnedMessage[]> // channelId -> pinned messages

  // Actions
  pinMessage: (channelId: string, message: PinnedMessage) => void
  unpinMessage: (channelId: string, messageId: string) => void
  getPinnedMessages: (channelId: string) => PinnedMessage[]
  clearPinnedMessages: (channelId: string) => void
}

export const usePinnedMessagesStore = create<PinnedMessagesStore>()(
  persist(
    (set, get) => ({
      pinnedMessages: {},

      pinMessage: (channelId: string, message: PinnedMessage) =>
        set((state) => {
          const pinnedMessages = { ...state.pinnedMessages }
          const channelPins = [...(pinnedMessages[channelId] || [])]

          // Check if already pinned
          if (channelPins.find((m) => m.id === message.id)) {
            return state
          }

          // Limit to 50 pinned messages per channel
          if (channelPins.length >= 50) {
            channelPins.shift()
          }

          pinnedMessages[channelId] = [...channelPins, message]
          return { pinnedMessages }
        }),

      unpinMessage: (channelId: string, messageId: string) =>
        set((state) => {
          const pinnedMessages = { ...state.pinnedMessages }
          const channelPins = pinnedMessages[channelId] || []
          pinnedMessages[channelId] = channelPins.filter((m) => m.id !== messageId)
          return { pinnedMessages }
        }),

      getPinnedMessages: (channelId: string) => {
        return get().pinnedMessages[channelId] || []
      },

      clearPinnedMessages: (channelId: string) =>
        set((state) => {
          const pinnedMessages = { ...state.pinnedMessages }
          delete pinnedMessages[channelId]
          return { pinnedMessages }
        }),
    }),
    {
      name: 'pinned-messages-storage',
    }
  )
)
