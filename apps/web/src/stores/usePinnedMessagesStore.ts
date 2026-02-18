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
  pinnedMessages: Map<string, PinnedMessage[]> // channelId -> pinned messages
  
  // Actions
  pinMessage: (channelId: string, message: PinnedMessage) => void
  unpinMessage: (channelId: string, messageId: string) => void
  getPinnedMessages: (channelId: string) => PinnedMessage[]
  clearPinnedMessages: (channelId: string) => void
}

export const usePinnedMessagesStore = create<PinnedMessagesStore>()(
  persist(
    (set, get) => ({
      pinnedMessages: new Map(),

      pinMessage: (channelId: string, message: PinnedMessage) =>
        set((state) => {
          const pinnedMessages = new Map(state.pinnedMessages)
          const channelPins = pinnedMessages.get(channelId) || []
          
          // Check if already pinned
          if (channelPins.find((m) => m.id === message.id)) {
            return state
          }
          
          // Limit to 50 pinned messages per channel
          if (channelPins.length >= 50) {
            channelPins.shift()
          }
          
          pinnedMessages.set(channelId, [...channelPins, message])
          return { pinnedMessages }
        }),

      unpinMessage: (channelId: string, messageId: string) =>
        set((state) => {
          const pinnedMessages = new Map(state.pinnedMessages)
          const channelPins = pinnedMessages.get(channelId) || []
          const filtered = channelPins.filter((m) => m.id !== messageId)
          pinnedMessages.set(channelId, filtered)
          return { pinnedMessages }
        }),

      getPinnedMessages: (channelId: string) => {
        const pins = get().pinnedMessages.get(channelId)
        return pins || []
      },

      clearPinnedMessages: (channelId: string) =>
        set((state) => {
          const pinnedMessages = new Map(state.pinnedMessages)
          pinnedMessages.delete(channelId)
          return { pinnedMessages }
        }),
    }),
    {
      name: 'pinned-messages-storage',
    }
  )
)
