import { create } from 'zustand'
import { MessageReaction } from '../components/features/MessageItem'
import { PresenceStatus } from '@beacon/types'
import { api } from '../lib/api'
import { useAuthStore } from './useAuthStore'

export interface DirectMessage {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: string
  nonce?: string
  encryptedContent?: string
  edited?: boolean
  reactions?: MessageReaction[]
  attachments?: any[]
}

export interface DMParticipant {
  id: string
  username: string
  avatar?: string
  status: PresenceStatus
}

export interface DMChannel {
  id: string
  participants: DMParticipant[]
  unreadCount: number
}

interface DMStore {
  channels: DMChannel[]
  activeChannel: string | null
  messages: Map<string, DirectMessage[]>

  // Actions
  fetchChannels: () => Promise<void>
  eagerLoad: () => Promise<void>
  setChannels: (channels: DMChannel[]) => void
  setActiveChannel: (channelId: string | null) => void
  addMessage: (channelId: string, message: DirectMessage) => void
  getMessages: (channelId: string) => DirectMessage[]
  markAsRead: (channelId: string) => void
  createDMChannel: (participant: DMParticipant | string) => Promise<string>
  updateUserStatus: (userId: string, status: DMParticipant['status']) => void
  sendMessage: (channelId: string, content: string) => Promise<void>
  editMessage: (channelId: string, messageId: string, newContent: string) => Promise<void>
  deleteMessage: (channelId: string, messageId: string) => Promise<void>
  addReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>
}

const EMPTY_ARRAY: any[] = []

function normalizeDMParticipants(recipients: any[]): DMParticipant[] {
  const currentUserId = useAuthStore.getState().user?.id

  const participants = recipients.map((recipient: any) => ({
    id: recipient.id || recipient.user?.id,
    username: recipient.username || recipient.user?.username,
    avatar: recipient.avatar || recipient.user?.avatar,
    status: 'offline' as PresenceStatus,
  }))

  if (!currentUserId) {
    return participants
  }

  return participants.sort((left, right) => {
    const leftIsSelf = left.id === currentUserId
    const rightIsSelf = right.id === currentUserId
    if (leftIsSelf === rightIsSelf) return 0
    return leftIsSelf ? 1 : -1
  })
}

export const useDMStore = create<DMStore>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: new Map(),

  fetchChannels: async () => {
    try {
      const { data } = await api.get('/dms')
      const formatted = data.map((channel: any) => ({
        id: channel.id,
        unreadCount: 0,
        participants: normalizeDMParticipants(channel.recipients || [])
      }))
      set({ channels: formatted })
    } catch (e) {
      console.error('Failed to fetch DMs', e)
    }
  },

  eagerLoad: async () => {
    try {
      const { data } = await api.get('/dms')
      const formatted = data.map((channel: any) => ({
        id: channel.id,
        unreadCount: 0,
        participants: normalizeDMParticipants(channel.recipients || [])
      }))
      set({ channels: formatted })
    } catch (e) {
      console.error('DM eager load failed', e)
    }
  },

  setChannels: (channels: DMChannel[]) => set({ channels }),

  setActiveChannel: (channelId: string | null) => {
    set({ activeChannel: channelId })
    if (channelId) {
      get().markAsRead(channelId)
    }
    // Update native badge on channel switch
    const totalUnread = get().channels.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
    import('../utils/platformBridge').then(({ PlatformBridge }) => {
      PlatformBridge.setAppBadge(totalUnread)
    })
  },

  addMessage: (channelId: string, message: DirectMessage) =>
    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []

      // Real-style E2EE Decryption Hook
      let displayContent = message.content
      if (message.nonce && message.encryptedContent) {
        try {
          // Placeholder for key derivation and decryption
          // In production: const sharedKey = await CryptoService.deriveSharedKey(...)
          // const decrypted = await CryptoService.decrypt(encrypted, sharedKey, iv)
          displayContent = "[Encrypted Content]"
        } catch (e) {
          console.error('Decryption failed', e)
        }
      }

      messages.set(channelId, [...channelMessages, { ...message, content: displayContent }])
      return { messages }
    }),

  getMessages: (channelId: string) => {
    return get().messages.get(channelId) || EMPTY_ARRAY
  },

  markAsRead: (channelId: string) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId ? { ...channel, unreadCount: 0 } : channel
      ),
    })),

  createDMChannel: async (target: DMParticipant | string) => {
    const userId = typeof target === 'string' ? target : target.id;
    try {
      const { data } = await api.post('/dms', { userIds: [userId] });
      const newChannel: DMChannel = {
        id: data.id,
        participants: normalizeDMParticipants(data.recipients || []),
        unreadCount: 0,
      }

      set((state) => {
        const exists = state.channels.find((c) => c.id === data.id)
        if (exists) return { activeChannel: data.id }
        return {
          channels: [...state.channels, newChannel],
          activeChannel: data.id
        }
      })
      return data.id as string
    } catch (e) {
      console.error('Failed to create DM channel', e)
      throw e
    }
  },

  updateUserStatus: (userId: string, status: PresenceStatus) =>
    set((state) => ({
      channels: state.channels.map((channel) => ({
        ...channel,
        participants: channel.participants.map((p) =>
          p.id === userId ? { ...p, status } : p
        ),
      })),
    })),

  sendMessage: async (channelId: string, content: string, encrypted: boolean = false) => {
    try {
      const payload: any = { content }
      if (encrypted) {
        // Mock encryption for prototype
        payload.nonce = "v1-nonce-" + Math.random().toString(36).substring(7)
        payload.encryptedContent = btoa(content)
        payload.content = "This message is end-to-end encrypted."
      }
      await api.post(`/channels/${channelId}/messages`, payload)
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  editMessage: async (channelId: string, messageId: string, newContent: string) => {
    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []
      const updatedMessages = channelMessages.map((m) =>
        m.id === messageId ? { ...m, content: newContent, edited: true } : m
      )
      messages.set(channelId, updatedMessages)
      return { messages }
    })
  },

  deleteMessage: async (channelId: string, messageId: string) => {
    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []
      const updatedMessages = channelMessages.filter((m) => m.id !== messageId)
      messages.set(channelId, updatedMessages)
      return { messages }
    })
  },

  addReaction: async (channelId: string, messageId: string, emoji: string) => {
    const snapshot = get().messages
    let removingExistingReaction = false

    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []
      const updatedMessages = channelMessages.map((m) => {
        if (m.id !== messageId) return m

        const reactions = m.reactions || []
        const existingReaction = reactions.find((r) => r.emoji === emoji)

        if (existingReaction) {
          removingExistingReaction = existingReaction.userReacted
          return {
            ...m,
            reactions: existingReaction.userReacted
              ? reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, userReacted: false }
                  : r
              ).filter((r) => r.count > 0)
              : reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              ),
          }
        } else {
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1, userReacted: true }],
          }
        }
      })
      messages.set(channelId, updatedMessages)
      return { messages }
    })

    try {
      if (removingExistingReaction) {
        await api.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`)
      } else {
        await api.put(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`)
      }
    } catch (error) {
      console.error('Failed to sync reaction with server', error)
      set({ messages: snapshot })
      throw error
    }
  },
}))
