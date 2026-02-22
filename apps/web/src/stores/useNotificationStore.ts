import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
  priority: 'all' | 'high' | 'mentions'
  quietHours: { start: string; end: string } | null
  keywords: string[]
  mutedChannels: string[]
  mutedServers: string[]
}

interface SmartNotification {
  id: string
  type: 'message' | 'mention' | 'dm' | 'call'
  priority: 'low' | 'medium' | 'high'
  title: string
  body: string
  createdAt: string
  read: boolean
}

interface NotificationStore {
  settings: NotificationSettings
  notifications: SmartNotification[]
  unreadCount: number
  dropdownOpen: boolean
  isLoading: boolean

  updateSettings: (settings: Partial<NotificationSettings>) => void
  addNotification: (notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  toggleDropdown: () => void
  setDropdownOpen: (open: boolean) => void
  clearAll: () => void
  shouldNotify: (notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>) => boolean
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
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          read: false
        }

        set(state => ({
          notifications: [newNotif, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1
        }))

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/logo.png'
          })
        }
      },

      markRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      },

      markAllRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },

      deleteNotification: (id) => {
        set(state => {
          const notif = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notif && !notif.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          }
        })
      },

      toggleDropdown: () => {
        set(state => ({ dropdownOpen: !state.dropdownOpen }))
      },

      setDropdownOpen: (open) => {
        set({ dropdownOpen: open })
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
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
    { name: 'beacon-notifications' }
  )
)
