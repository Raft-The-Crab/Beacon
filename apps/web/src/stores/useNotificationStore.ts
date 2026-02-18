import { create } from 'zustand'
import { api } from '../lib/api'

export type NotificationType =
  | 'message'
  | 'mention'
  | 'friend_request'
  | 'friend_accept'
  | 'server_invite'
  | 'reaction'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
  // optional context
  serverId?: string
  channelId?: string
  userId?: string
  avatarUrl?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  dropdownOpen: boolean

  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => void
  clearAll: () => void
  addNotification: (n: Notification) => void
  setDropdownOpen: (open: boolean) => void
  toggleDropdown: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  dropdownOpen: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/users/@me/notifications')
      const notes: Notification[] = data
      set({
        notifications: notes,
        unreadCount: notes.filter((n) => !n.read).length,
        isLoading: false,
      })
    } catch {
      // Backend may not have this endpoint yet — start empty
      set({ isLoading: false })
    }
  },

  markRead: async (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      }
    })
    try {
      await api.patch(`/users/@me/notifications/${id}/read`)
    } catch { /* best-effort */ }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
    try {
      await api.post('/users/@me/notifications/read-all')
    } catch { /* best-effort */ }
  },

  deleteNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id)
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      }
    })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + (n.read ? 0 : 1),
    }))
  },

  setDropdownOpen: (open) => set({ dropdownOpen: open }),
  toggleDropdown: () => set((s) => ({ dropdownOpen: !s.dropdownOpen })),
}))
