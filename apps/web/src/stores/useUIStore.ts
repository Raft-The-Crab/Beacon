import { create } from 'zustand'

interface UIState {
  currentChannelId: string | null
  isSidebarCollapsed: boolean
  theme: 'classic' | 'glass' | 'light' | 'auto'
  showUserSettings: boolean
  selectedUserId: string | null
  darkMode: boolean
  developerMode: boolean
  showUserProfile: boolean
  showServerSettings: boolean
  showDeveloperPortal: boolean
  showLandingPage: boolean
  showLoginPage: boolean
  showMessagingHome: boolean
  showVoiceChannel: boolean
  showCreateServer: boolean
  showCreateChannel: boolean
  showMobileSidebar: boolean
  customBackground: string | null
  customAccentColor: string | null

  // New modal state
  showCustomStatus: boolean
  showGroupDM: boolean
  showWebhooks: boolean
  webhooksGuildId: string | null
  showAuditLog: boolean
  auditLogGuildId: string | null
  showPinnedMessages: boolean
  pinnedMessagesChannelId: string | null
  // Pinned messages panel (inline, not full modal)
  pinnedMessagesPanelOpen: boolean

  setCurrentChannel: (channelId: string | null) => void
  toggleSidebar: () => void
  setTheme: (theme: 'classic' | 'glass' | 'light' | 'auto') => void
  setShowUserSettings: (show: boolean) => void
  setSelectedUser: (userId: string | null) => void
  setDarkMode: (darkMode: boolean) => void
  setDeveloperMode: (enabled: boolean) => void
  setShowUserProfile: (show: boolean) => void
  setShowServerSettings: (show: boolean) => void
  setShowDeveloperPortal: (show: boolean) => void
  setShowLandingPage: (show: boolean) => void
  setShowLoginPage: (show: boolean) => void
  setShowMessagingHome: (show: boolean) => void
  setShowVoiceChannel: (show: boolean) => void
  setShowCreateServer: (show: boolean) => void
  setShowCreateChannel: (show: boolean) => void
  setShowMobileSidebar: (show: boolean) => void
  setCustomBackground: (url: string | null) => void
  setCustomAccentColor: (color: string | null) => void
  syncTheme: () => void

  // New modal setters
  setShowCustomStatus: (show: boolean) => void
  setShowGroupDM: (show: boolean) => void
  setShowWebhooks: (show: boolean, guildId?: string) => void
  setShowAuditLog: (show: boolean, guildId?: string) => void
  setShowPinnedMessages: (show: boolean, channelId?: string) => void
  setPinnedMessagesPanelOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentChannelId: null,
  isSidebarCollapsed: false,
  theme: 'classic',
  showUserSettings: false,
  selectedUserId: null,
  darkMode: true,
  developerMode: false,
  showUserProfile: false,
  showServerSettings: false,
  showDeveloperPortal: false,
  showLandingPage: false,
  showLoginPage: false,
  showMessagingHome: false,
  showVoiceChannel: false,
  showCreateServer: false,
  showCreateChannel: false,
  showMobileSidebar: false,
  customBackground: typeof localStorage !== 'undefined' ? localStorage.getItem('beacon:custom_bg') : null,
  customAccentColor: typeof localStorage !== 'undefined' ? localStorage.getItem('beacon:custom_accent') : null,

  // New modal initial state
  showCustomStatus: false,
  showGroupDM: false,
  showWebhooks: false,
  webhooksGuildId: null,
  showAuditLog: false,
  auditLogGuildId: null,
  showPinnedMessages: false,
  pinnedMessagesChannelId: null,
  pinnedMessagesPanelOpen: false,

  setCurrentChannel: (channelId) =>
    set({ currentChannelId: channelId }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setTheme: (theme) => {
    set({ theme })
  },

  setShowUserSettings: (show) =>
    set({ showUserSettings: show }),

  setSelectedUser: (userId) =>
    set({ selectedUserId: userId }),

  setDarkMode: (darkMode) => {
    set({ darkMode })
  },

  setDeveloperMode: (enabled) => {
    set({ developerMode: enabled })
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beacon:developer_mode', enabled ? 'true' : 'false')
    }
  },

  setShowUserProfile: (show) => {
    set({ showUserProfile: show })
    if (show) {
      set({ showUserSettings: false, showServerSettings: false })
    }
  },

  setShowServerSettings: (show) => {
    set({ showServerSettings: show })
    if (show) {
      set({ showUserSettings: false, showUserProfile: false })
    }
  },

  setShowDeveloperPortal: (show) => set({ showDeveloperPortal: show }),
  setShowLandingPage: (show) => set({ showLandingPage: show }),
  setShowLoginPage: (show) => set({ showLoginPage: show }),
  setShowMessagingHome: (show) => set({ showMessagingHome: show }),
  setShowVoiceChannel: (show) => set({ showVoiceChannel: show }),
  setShowCreateServer: (show) => set({ showCreateServer: show }),
  setShowCreateChannel: (show) => set({ showCreateChannel: show }),
  setShowMobileSidebar: (show: boolean) => set({ showMobileSidebar: show }),

  setCustomBackground: (url) => {
    set({ customBackground: url })
    if (typeof localStorage !== 'undefined') {
      if (url) localStorage.setItem('beacon:custom_bg', url)
      else localStorage.removeItem('beacon:custom_bg')
    }
  },

  setCustomAccentColor: (color) => {
    set({ customAccentColor: color })
    if (typeof localStorage !== 'undefined') {
      if (color) localStorage.setItem('beacon:custom_accent', color)
      else localStorage.removeItem('beacon:custom_accent')
    }
  },

  // New modal setters
  setShowCustomStatus: (show) => set({ showCustomStatus: show }),
  setShowGroupDM: (show) => set({ showGroupDM: show }),
  setShowWebhooks: (show, guildId) =>
    set({ showWebhooks: show, webhooksGuildId: guildId ?? null }),
  setShowAuditLog: (show, guildId) =>
    set({ showAuditLog: show, auditLogGuildId: guildId ?? null }),
  setShowPinnedMessages: (show, channelId) =>
    set({ showPinnedMessages: show, pinnedMessagesChannelId: channelId ?? null }),
  setPinnedMessagesPanelOpen: (open) => set({ pinnedMessagesPanelOpen: open }),

  syncTheme: () => {},
}))
