import { create } from 'zustand'
import { MessageReaction } from '../components/features/MessageItem'
import { PresenceStatus } from 'beacon-sdk'
import { apiClient } from '../services/apiClient'
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
  handleChannelCreateWs: (channelData: any) => void
  handleMessageCreate: (message: DirectMessage & { channelId: string }) => void
  handleMessageUpdate: (channelId: string, messageId: string, updates: Partial<DirectMessage>) => void
  handleMessageDelete: (channelId: string, messageId: string) => void
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

function injectSystemBot(channels: DMChannel[]): DMChannel[] {
  const hasBot = channels.some(c => c.participants.some(p => p.id === 'BEACON_SYSTEM_BOT' || p.username === 'Beacon Bot'))
  if (hasBot) return channels

  const botChannel: DMChannel = {
    id: 'channel_beacon_bot',
    unreadCount: 0,
    participants: [
      {
        id: 'BEACON_SYSTEM_BOT',
        username: 'Beacon Bot',
        status: 'online',
      }
    ]
  }
  return [botChannel, ...channels]
}

export const useDMStore = create<DMStore>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: new Map(),

  fetchChannels: async () => {
    try {
      const res = await apiClient.getDMs()
      if (res.success && Array.isArray(res.data)) {
        const formatted = res.data.map((channel: any) => ({
          id: channel.id,
          unreadCount: 0,
          participants: normalizeDMParticipants(channel.recipients || [])
        }))
        set({ channels: injectSystemBot(formatted) })
      }
    } catch (e) {
      console.error('Failed to fetch DMs', e)
    }
  },

  eagerLoad: async () => {
    try {
      const res = await apiClient.getDMs()
      if (res.success && Array.isArray(res.data)) {
        const formatted = res.data.map((channel: any) => ({
          id: channel.id,
          unreadCount: 0,
          participants: normalizeDMParticipants(channel.recipients || [])
        }))
        set({ channels: injectSystemBot(formatted) })
      }
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
      const res = await apiClient.createDM([userId]);
      if (!res.success) throw new Error(res.error)
      const data = res.data
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

  handleChannelCreateWs: (channelData: any) => set(state => {
    if (state.channels.find(c => c.id === channelData.id)) return state;
    const newChannel: DMChannel = {
      id: channelData.id,
      participants: normalizeDMParticipants(channelData.recipients || []),
      unreadCount: 0,
    }
    return { channels: [...state.channels, newChannel] }
  }),
  
  handleMessageCreate: (message) => {
    const { channelId } = message
    set((state) => {
      // Don't add if already exists (e.g. from optimistic update)
      const current = state.messages.get(channelId) || []
      if (current.find((m) => m.id === message.id)) return state

      const messages = new Map(state.messages)
      
      // Decryption Logic Sync
      let displayContent = message.content
      if (message.nonce && message.encryptedContent) {
        displayContent = "[Encrypted Content]"
      }

      messages.set(channelId, [...current, { ...message, content: displayContent }])
      
      // Update unread count if not in active channel
      const isCurrentChannel = state.activeChannel === channelId
      const channels = state.channels.map(c => 
        c.id === channelId && !isCurrentChannel 
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } 
          : c
      )

      return { messages, channels }
    })
  },

  handleMessageUpdate: (channelId, messageId, updates) => {
    set((state) => {
      const messages = new Map(state.messages)
      const current = messages.get(channelId) || []
      const updated = current.map((m) => 
        m.id === messageId ? { ...m, ...updates } : m
      )
      messages.set(channelId, updated)
      return { messages }
    })
  },

  handleMessageDelete: (channelId, messageId) => {
    set((state) => {
      const messages = new Map(state.messages)
      const current = messages.get(channelId) || []
      const filtered = current.filter((m) => m.id !== messageId)
      messages.set(channelId, filtered)
      return { messages }
    })
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
      await apiClient.sendMessage(channelId, payload)
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
        await apiClient.removeReaction(channelId, messageId, emoji)
      } else {
        await apiClient.addReaction(channelId, messageId, emoji)
      }
    } catch (error) {
      console.error('Failed to sync reaction with server', error)
      set({ messages: snapshot })
      throw error
    }
  },
}))
