import { create } from 'zustand'

export type NotificationType = 'message' | 'mention' | 'call' | 'friend_request' | 'server_invite' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  icon?: string
  timestamp: string
  read: boolean
  actionUrl?: string
  userId?: string
  channelId?: string
  serverId?: string
}

interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  mentions: boolean
  directMessages: boolean
  serverMessages: boolean
  calls: boolean
}

interface NotificationsStore {
  notifications: Notification[]
  settings: NotificationSettings
  unreadCount: number
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearAll: () => void
  updateSettings: (settings: Partial<NotificationSettings>) => void
  requestPermission: () => Promise<boolean>
  showDesktopNotification: (title: string, options?: NotificationOptions) => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  settings: {
    enabled: true,
    sound: true,
    desktop: true,
    mentions: true,
    directMessages: true,
    serverMessages: true,
    calls: true,
  },
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
      unreadCount: state.unreadCount + 1,
    }))

    const { settings } = get()
    
    // Play sound if enabled
    if (settings.enabled && settings.sound) {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {
          // Ignore errors (user interaction required)
        })
      } catch (error) {
        console.error('Failed to play notification sound:', error)
      }
    }

    // Show desktop notification if enabled
    if (settings.enabled && settings.desktop) {
      get().showDesktopNotification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/logo.png',
        tag: newNotification.id,
      })
    }
  },

  markAsRead: (notificationId) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId)
      if (!notification || notification.read) return state

      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId)
      const wasUnread = notification && !notification.read

      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  },

  showDesktopNotification: (title, options) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      const notification = new Notification(title, options)
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)
      
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Failed to show desktop notification:', error)
    }
  },
}))
