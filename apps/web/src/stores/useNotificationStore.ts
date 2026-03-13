import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../services/apiClient'

interface NotificationSettings {
  priority: 'all' | 'high' | 'mentions'
  quietHours: { start: string; end: string } | null
  keywords: string[]
  mutedChannels: string[]
  mutedServers: string[]
}

export interface SmartNotification {
  id: string
  type: 'message' | 'mention' | 'dm' | 'call' | 'friend_request' | 'friend_accept' | 'reaction' | 'server_invite' | 'system' | 'info'
  priority: 'low' | 'medium' | 'high'
  title: string
  body: string
  createdAt: string
  read: boolean
  avatarUrl?: string
  userId?: string
  serverId?: string
  channelId?: string
}

type NotificationInput = Omit<SmartNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<SmartNotification, 'id' | 'createdAt'>>

function normalizeNotificationType(type: unknown): SmartNotification['type'] {
  const value = String(type || '').trim().toLowerCase()
  if (value === 'friend_request') return 'friend_request'
  if (value === 'friend_accepted' || value === 'friend_accept') return 'friend_accept'
  if (value === 'server_invite') return 'server_invite'
  if (value === 'mention') return 'mention'
  if (value === 'dm') return 'dm'
  if (value === 'call') return 'call'
  if (value === 'reaction') return 'reaction'
  if (value === 'system') return 'system'
  if (value === 'message') return 'message'
  return 'info'
}

function getNotificationPriority(type: SmartNotification['type']): SmartNotification['priority'] {
  if (type === 'mention' || type === 'call' || type === 'friend_request' || type === 'server_invite') return 'high'
  if (type === 'dm' || type === 'reaction' || type === 'friend_accept') return 'medium'
  return 'low'
}

function getNotificationKey(notification: Pick<SmartNotification, 'type' | 'title' | 'body' | 'userId' | 'serverId' | 'channelId'>): string {
  return [
    notification.type,
    notification.userId || '',
    notification.serverId || '',
    notification.channelId || '',
    notification.title.trim().toLowerCase(),
    notification.body.trim().toLowerCase(),
  ].join('|')
}

function dedupeNotifications(notifications: SmartNotification[]): SmartNotification[] {
  const seen = new Set<string>()
  const deduped: SmartNotification[] = []

  for (const notification of notifications) {
    const key = getNotificationKey(notification)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(notification)
  }

  return deduped
}

interface NotificationStore {
  settings: NotificationSettings
  notifications: SmartNotification[]
  unreadCount: number
  dropdownOpen: boolean
  isLoading: boolean

  updateSettings: (settings: Partial<NotificationSettings>) => void
  fetchNotifications: () => Promise<void>
  addNotification: (notification: NotificationInput) => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  toggleDropdown: () => void
  setDropdownOpen: (open: boolean) => void
  clearAll: () => Promise<void>
  shouldNotify: (notification: NotificationInput) => boolean
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      settings: {
        priority: 'high',
        quietHours: { start: '22:00', end: '08:00' },
        keywords: ['urgent', '@me'],
        mutedChannels: [],
        mutedServers: []
      },
      notifications: [],
      unreadCount: 0,
      dropdownOpen: false,
      isLoading: false,

      fetchNotifications: async () => {
        set({ isLoading: true })
        try {
          const response = await apiClient.getNotifications()
          if (!response.success || !Array.isArray(response.data)) {
            return
          }

          const notifications = dedupeNotifications(
            response.data.map((notification: any): SmartNotification => ({
              id: String(notification.id),
              type: normalizeNotificationType(notification.type),
              priority: getNotificationPriority(normalizeNotificationType(notification.type)),
              title: notification.title,
              body: notification.body,
              createdAt: notification.createdAt,
              read: Boolean(notification.read),
              avatarUrl: notification.avatarUrl,
              userId: notification.userId,
              serverId: notification.serverId,
              channelId: notification.channelId,
            }))
          )

          set({
            notifications,
            unreadCount: notifications.filter((notification) => !notification.read).length,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      addNotification: (notification) => {
        const { shouldNotify } = get()
        if (!shouldNotify(notification)) return

        const newNotif: SmartNotification = {
          ...notification,
          type: normalizeNotificationType(notification.type),
          id: notification.id || `${Date.now()}`,
          createdAt: notification.createdAt || new Date().toISOString(),
          priority: notification.priority || getNotificationPriority(normalizeNotificationType(notification.type)),
          read: false
        }

        let inserted = false

        set(state => {
          const hasDuplicate = state.notifications.some((item) => getNotificationKey(item) === getNotificationKey(newNotif))
          if (hasDuplicate) {
            return state
          }

          inserted = true
          const notifications = dedupeNotifications([newNotif, ...state.notifications]).slice(0, 100)
          return {
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
          }
        })

        if (!inserted) return

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/logo.png'
          })
        }
      },

      markRead: async (id) => {
        let shouldSync = false

        set(state => {
          const target = state.notifications.find((notification) => notification.id === id)
          if (!target || target.read) return state

          shouldSync = true
          const notifications = state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )

          return {
            notifications,
            unreadCount: notifications.filter((notification) => !notification.read).length,
          }
        })

        if (shouldSync) {
          await apiClient.markNotificationRead(id)
        }
      },

      markAllRead: async () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))

        await apiClient.markAllNotificationsRead()
      },

      deleteNotification: async (id) => {
        set(state => {
          const notif = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notif && !notif.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          }
        })

        await apiClient.deleteNotification(id)
      },

      toggleDropdown: () => {
        set(state => ({ dropdownOpen: !state.dropdownOpen }))
      },

      setDropdownOpen: (open) => {
        set({ dropdownOpen: open })
      },

      clearAll: async () => {
        set({ notifications: [], unreadCount: 0 })

        await apiClient.clearNotifications()
      },

      shouldNotify: (notification) => {
        const { settings } = get()

        // Check quiet hours
        if (settings.quietHours) {
          const now = new Date()
          const hour = now.getHours()
          const start = parseInt(settings.quietHours.start.split(':')[0])
          const end = parseInt(settings.quietHours.end.split(':')[0])

          if (hour >= start || hour < end) {
            return notification.priority === 'high'
          }
        }

        // Check priority filter
        if (settings.priority === 'high' && notification.priority !== 'high') {
          return false
        }

        if (settings.priority === 'mentions' && notification.type !== 'mention') {
          return false
        }

        return true
      }
    }),
    {
      name: 'beacon-notifications',
      version: 2,
      partialize: (state) => ({
        settings: state.settings,
        notifications: [],
        unreadCount: 0,
        dropdownOpen: false,
        isLoading: false,
      }),
      migrate: (persistedState: any) => ({
        settings: persistedState?.settings || {
          priority: 'high',
          quietHours: { start: '22:00', end: '08:00' },
          keywords: ['urgent', '@me'],
          mutedChannels: [],
          mutedServers: []
        },
        notifications: [],
        unreadCount: 0,
        dropdownOpen: false,
        isLoading: false,
      })
    }
  )
)
