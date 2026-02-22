import { create } from 'zustand'
import { MessageReaction } from '../components/features/MessageItem'
import { PresenceStatus } from '@beacon/types'
import { api } from '../lib/api'

export interface DirectMessage {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  timestamp: string
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
  createDMChannel: (participant: DMParticipant | string) => Promise<void>
  updateUserStatus: (userId: string, status: DMParticipant['status']) => void
  sendMessage: (channelId: string, content: string) => Promise<void>
  editMessage: (channelId: string, messageId: string, newContent: string) => Promise<void>
  deleteMessage: (channelId: string, messageId: string) => Promise<void>
  addReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>
}

const EMPTY_ARRAY: any[] = []

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
        participants: channel.recipients.map((r: any) => ({
          id: r.user.id,
          username: r.user.username,
          avatar: r.user.avatar,
          status: 'offline'
        }))
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
        participants: channel.recipients.map((r: any) => ({
          id: r.user.id,
          username: r.user.username,
          avatar: r.user.avatar,
          status: 'offline'
        }))
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
  },

  addMessage: (channelId: string, message: DirectMessage) =>
    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []
      messages.set(channelId, [...channelMessages, message])
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
      const { data } = await api.post('/dms', { userId });
      const newChannel: DMChannel = {
        id: data.id,
        participants: data.recipients.map((r: any) => ({
          id: r.user.id,
          username: r.user.username,
          avatar: r.user.avatar,
          status: 'offline'
        })),
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
    } catch (e) {
      console.error('Failed to create DM channel', e)
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

  sendMessage: async (channelId: string, content: string) => {
    try {
      await api.post(`/channels/${channelId}/messages`, { content })
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
    set((state) => {
      const messages = new Map(state.messages)
      const channelMessages = messages.get(channelId) || []
      const updatedMessages = channelMessages.map((m) => {
        if (m.id !== messageId) return m

        const reactions = m.reactions || []
        const existingReaction = reactions.find((r) => r.emoji === emoji)

        if (existingReaction) {
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
  },
}))
