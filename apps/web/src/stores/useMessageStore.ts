import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import type { MessageWithExtras as Message, PaginatedResponse } from '@beacon/types'

interface MessageState {
  messages: Map<string, Message[]>
  isLoading: Map<string, boolean>
  hasMore: Map<string, boolean>
  oldestMessageId: Map<string, string>

  fetchMessages: (channelId: string, before?: string) => Promise<void>
  loadMoreMessages: (channelId: string) => Promise<void>
  sendMessage: (channelId: string, content: string, attachments?: any[]) => Promise<void>
  getMessages: (channelId: string) => Message[]
  getIsLoading: (channelId: string) => boolean
  getHasMore: (channelId: string) => boolean

  handleMessageCreate: (message: Message & { channelId: string }) => void
  handleMessageUpdate: (channelId: string, messageId: string, updates: Partial<Message>) => void
  handleMessageDelete: (channelId: string, messageId: string) => void
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: new Map(),
  isLoading: new Map(),
  hasMore: new Map(),
  oldestMessageId: new Map(),

  getMessages: (channelId: string) => {
    return get().messages.get(channelId) || []
  },

  getIsLoading: (channelId: string) => {
    return get().isLoading.get(channelId) || false
  },

  getHasMore: (channelId: string) => {
    return get().hasMore.get(channelId) ?? true
  },

  fetchMessages: async (channelId, before) => {
    const state = get()
    if (state.isLoading.get(channelId)) return

    set(state => {
      const newLoading = new Map(state.isLoading)
      newLoading.set(channelId, true)
      return { isLoading: newLoading }
    })

    try {
      const response = await apiRequest<PaginatedResponse<Message>>({
        method: 'GET',
        url: `/messages/${channelId}`,
        params: { limit: 50, before }
      })

      if (response.success && response.data) {
        set(state => {
          const newMessages = new Map(state.messages)
          const existing = newMessages.get(channelId) || []
          
          // Prepend older messages
          const combined = before 
            ? [...response.data!.items, ...existing]
            : response.data!.items
          
          newMessages.set(channelId, combined)

          const newHasMore = new Map(state.hasMore)
          newHasMore.set(channelId, response.data!.hasMore)

          const newOldest = new Map(state.oldestMessageId)
          if (response.data!.items.length > 0) {
            newOldest.set(channelId, response.data!.items[0].id)
          }

          const newLoading = new Map(state.isLoading)
          newLoading.set(channelId, false)

          return { 
            messages: newMessages, 
            hasMore: newHasMore,
            oldestMessageId: newOldest,
            isLoading: newLoading 
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      set(state => {
        const newLoading = new Map(state.isLoading)
        newLoading.set(channelId, false)
        return { isLoading: newLoading }
      })
    }
  },

  loadMoreMessages: async (channelId) => {
    const state = get()
    const oldestId = state.oldestMessageId.get(channelId)
    if (!oldestId || !state.hasMore.get(channelId)) return

    await state.fetchMessages(channelId, oldestId)
  },

  sendMessage: async (channelId, content, attachments) => {
    try {
      await apiRequest({
        method: 'POST',
        url: `/channels/${channelId}/messages`,
        data: { content, attachments }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  },

  handleMessageCreate: (message) => {
    const { channelId } = message
    set(state => {
      const current = state.messages.get(channelId) || []
      if (current.find(m => m.id === message.id)) {
        return state
      }

      const newMessages = new Map(state.messages)
      newMessages.set(channelId, [...current, message])
      return { messages: newMessages }
    })
  },

  handleMessageUpdate: (channelId, messageId, updates) => {
    set(state => {
      const newMessages = new Map(state.messages)
      const current = newMessages.get(channelId) || []
      const updated = current.map(m => m.id === messageId ? { ...m, ...updates } : m)
      newMessages.set(channelId, updated)
      return { messages: newMessages }
    })
  },

  handleMessageDelete: (channelId, messageId) => {
    set(state => {
      const newMessages = new Map(state.messages)
      const current = newMessages.get(channelId) || []
      const filtered = current.filter(m => m.id !== messageId)
      newMessages.set(channelId, filtered)
      return { messages: newMessages }
    })
  }
}))