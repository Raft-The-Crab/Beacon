import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'classic' | 'glass' | 'light' | 'oled' | 'neon' | 'midnight' | 'auto'
export type MessageDensity = 'cozy' | 'compact' | 'ultra-compact'

interface UIState {
  currentChannelId: string | null
  isSidebarCollapsed: boolean
  theme: Theme
  messageDensity: MessageDensity
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

  // Modal state
  showCustomStatus: boolean
  showGroupDM: boolean
  showWebhooks: boolean
  webhooksGuildId: string | null
  showAuditLog: boolean
  auditLogGuildId: string | null
  showPinnedMessages: boolean
  pinnedMessagesChannelId: string | null
  pinnedMessagesPanelOpen: boolean

  // Member list panel
  showMemberList: boolean

  // Keyboard shortcuts panel
  showKeyboardShortcuts: boolean

  setCurrentChannel: (channelId: string | null) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  setMessageDensity: (density: MessageDensity) => void
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

  setShowCustomStatus: (show: boolean) => void
  setShowGroupDM: (show: boolean) => void
  setShowWebhooks: (show: boolean, guildId?: string) => void
  setShowAuditLog: (show: boolean, guildId?: string) => void
  setShowPinnedMessages: (show: boolean, channelId?: string) => void
  setPinnedMessagesPanelOpen: (open: boolean) => void
  toggleMemberList: () => void
  setShowMemberList: (show: boolean) => void
  setShowKeyboardShortcuts: (show: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      currentChannelId: null,
      isSidebarCollapsed: false,
      theme: 'classic',
      messageDensity: 'cozy',
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

      showCustomStatus: false,
      showGroupDM: false,
      showWebhooks: false,
      webhooksGuildId: null,
      showAuditLog: false,
      auditLogGuildId: null,
      showPinnedMessages: false,
      pinnedMessagesChannelId: null,
      pinnedMessagesPanelOpen: false,
      showMemberList: true,
      showKeyboardShortcuts: false,

      setCurrentChannel: (channelId) =>
        set({ currentChannelId: channelId }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setTheme: (theme) => {
        set({ theme })
        // Apply to document immediately
        const root = document.documentElement
        if (theme === 'classic' || theme === 'auto') {
          root.removeAttribute('data-theme')
        } else {
          root.setAttribute('data-theme', theme)
        }
        // Persist
        localStorage.setItem('beacon:theme', theme)
      },

      setMessageDensity: (density) => {
        set({ messageDensity: density })
        document.documentElement.setAttribute('data-density', density)
        localStorage.setItem('beacon:density', density)
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
        // Apply CSS variable immediately
        if (url) {
          document.documentElement.style.setProperty('--custom-bg', `url(${url})`)
        } else {
          document.documentElement.style.removeProperty('--custom-bg')
        }
      },

      setCustomAccentColor: (color) => {
        set({ customAccentColor: color })
        if (typeof localStorage !== 'undefined') {
          if (color) localStorage.setItem('beacon:custom_accent', color)
          else localStorage.removeItem('beacon:custom_accent')
        }
        // Apply CSS variable immediately
        if (color) {
          document.documentElement.style.setProperty('--beacon-brand', color)
        } else {
          document.documentElement.style.removeProperty('--beacon-brand')
        }
      },

      setShowCustomStatus: (show) => set({ showCustomStatus: show }),
      setShowGroupDM: (show) => set({ showGroupDM: show }),
      setShowWebhooks: (show, guildId) =>
        set({ showWebhooks: show, webhooksGuildId: guildId ?? null }),
      setShowAuditLog: (show, guildId) =>
        set({ showAuditLog: show, auditLogGuildId: guildId ?? null }),
      setShowPinnedMessages: (show, channelId) =>
        set({ showPinnedMessages: show, pinnedMessagesChannelId: channelId ?? null }),
      setPinnedMessagesPanelOpen: (open) => set({ pinnedMessagesPanelOpen: open }),
      toggleMemberList: () => set((state) => ({ showMemberList: !state.showMemberList })),
      setShowMemberList: (show) => set({ showMemberList: show }),
      setShowKeyboardShortcuts: (show) => set({ showKeyboardShortcuts: show }),

      syncTheme: () => {
        const stored = localStorage.getItem('beacon:theme') as Theme | null
        const density = localStorage.getItem('beacon:density') as MessageDensity | null
        const accent = localStorage.getItem('beacon:custom_accent')
        const bg = localStorage.getItem('beacon:custom_bg')

        if (stored) {
          set({ theme: stored })
          if (stored !== 'classic' && stored !== 'auto') {
            document.documentElement.setAttribute('data-theme', stored)
          }
        }
        if (density) {
          set({ messageDensity: density })
          document.documentElement.setAttribute('data-density', density)
        }
        if (accent) {
          document.documentElement.style.setProperty('--beacon-brand', accent)
        }
        if (bg) {
          document.documentElement.style.setProperty('--custom-bg', `url(${bg})`)
        }
      },
    }),
    {
      name: 'beacon:ui',
      partialize: (state) => ({
        theme: state.theme,
        messageDensity: state.messageDensity,
        developerMode: state.developerMode,
        showMemberList: state.showMemberList,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Apply theme + density on rehydrate
        if (state.theme && state.theme !== 'classic' && state.theme !== 'auto') {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
        if (state.messageDensity) {
          document.documentElement.setAttribute('data-density', state.messageDensity)
        }
      },
    }
  )
)
