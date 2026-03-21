import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'classic' | 'dark' | 'glass' | 'light' | 'oled' | 'neon' | 'midnight' | 'auto' | 'dracula'
export type MessageDensity = 'cozy' | 'compact' | 'ultra-compact'
export type CreateChannelType = 'text' | 'voice' | 'stage' | 'forum' | 'announcement' | 'category'
export type ChatBubbleStyle = 'reef' | 'jelly' | 'comic' | 'aurora' | 'prism' | 'carbon'
export type ChatBubbleIntensity = 'low' | 'medium' | 'high'

interface UIState {
  currentChannelId: string | null
  isSidebarCollapsed: boolean
  theme: Theme
  glassEnabled: boolean
  messageDensity: MessageDensity
  chatBubbleStyle: ChatBubbleStyle
  chatBubbleIntensity: ChatBubbleIntensity
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
  createChannelType: CreateChannelType | null
  createChannelParentId: string | null
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
  
  // Bot Modal state
  showBotModal: boolean
  botModalData: {
    id: string
    token: string
    applicationId: string
    title: string
    customId: string
    components: any[]
  } | null

  // Member list panel
  showMemberList: boolean

  // Keyboard shortcuts panel
  showKeyboardShortcuts: boolean
  showQuickSwitcher: boolean

  // Editing state
  editingMessageId: string | null
  editingMessageContent: string

  setCurrentChannel: (channelId: string | null) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  setGlassEnabled: (enabled: boolean) => void
  setMessageDensity: (density: MessageDensity) => void
  setChatBubbleStyle: (style: ChatBubbleStyle) => void
  setChatBubbleIntensity: (intensity: ChatBubbleIntensity) => void
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
  setCreateChannelContext: (type?: CreateChannelType, parentId?: string) => void
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
  setShowBotModal: (show: boolean, data?: UIState['botModalData']) => void
  toggleMemberList: () => void
  setShowMemberList: (show: boolean) => void
  setShowKeyboardShortcuts: (show: boolean) => void
  setShowQuickSwitcher: (show: boolean) => void
  setEditingMessage: (id: string | null, content?: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      currentChannelId: null,
      isSidebarCollapsed: false,
      theme: 'dark',
      glassEnabled: true,
      messageDensity: 'cozy',
      chatBubbleStyle: 'reef',
      chatBubbleIntensity: 'medium',
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
      createChannelType: null,
      createChannelParentId: null,
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
      showQuickSwitcher: false,
      editingMessageId: null,
      editingMessageContent: '',
      showBotModal: false,
      botModalData: null,

      setCurrentChannel: (channelId) =>
        set({ currentChannelId: channelId }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      
      

      setTheme: (theme) => {
        set({ theme })
        const root = document.documentElement
        const isLight = theme === 'light'

        if (theme === 'classic' || theme === 'auto') {
          root.removeAttribute('data-theme')
        } else {
          root.setAttribute('data-theme', theme)
        }

        root.classList.toggle('dark', !isLight)
        root.style.colorScheme = isLight ? 'light' : 'dark'

        // Persist
        localStorage.setItem('beacon:theme', theme)
      },

      setGlassEnabled: (enabled) => {
        set({ glassEnabled: enabled })
        const root = document.documentElement
        if (enabled) {
          document.body.classList.add('glass-theme-active')
          // Stack glass CSS variables on top of current theme
          root.setAttribute('data-glass', 'true')
        } else {
          document.body.classList.remove('glass-theme-active')
          root.removeAttribute('data-glass')
        }
        localStorage.setItem('beacon:glass_enabled', enabled ? 'true' : 'false')
      },

      setMessageDensity: (density) => {
        set({ messageDensity: density })
        document.documentElement.setAttribute('data-density', density)
        localStorage.setItem('beacon:density', density)
      },

      setChatBubbleStyle: (style) => {
        set({ chatBubbleStyle: style })
        localStorage.setItem('beacon:chat_bubble_style', style)
      },

      setChatBubbleIntensity: (intensity) => {
        set({ chatBubbleIntensity: intensity })
        localStorage.setItem('beacon:chat_bubble_intensity', intensity)
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
      setShowCreateChannel: (show) => set((state) => ({
        showCreateChannel: show,
        createChannelType: show ? state.createChannelType : null,
        createChannelParentId: show ? state.createChannelParentId : null,
      })),
      setCreateChannelContext: (type, parentId) => set({
        createChannelType: type ?? null,
        createChannelParentId: parentId ?? null,
      }),
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
      setShowQuickSwitcher: (show) => set({ showQuickSwitcher: show }),
      setEditingMessage: (id, content) => set({ editingMessageId: id, editingMessageContent: content || '' }),
      setShowBotModal: (show, data) => set({ showBotModal: show, botModalData: data || null }),

      syncTheme: () => {
        const stored = localStorage.getItem('beacon:theme') as Theme | null
        const glass = localStorage.getItem('beacon:glass_enabled') !== 'false'
        const density = localStorage.getItem('beacon:density') as MessageDensity | null
        const chatBubbleStyle = localStorage.getItem('beacon:chat_bubble_style') as ChatBubbleStyle | null
        const chatBubbleIntensity = localStorage.getItem('beacon:chat_bubble_intensity') as ChatBubbleIntensity | null
        const accent = localStorage.getItem('beacon:custom_accent')
        const bg = localStorage.getItem('beacon:custom_bg')

        if (stored) {
          set({ theme: stored })
          if (stored !== 'classic' && stored !== 'auto') {
            document.documentElement.setAttribute('data-theme', stored)
          } else {
            document.documentElement.removeAttribute('data-theme')
          }
          const isLight = stored === 'light'
          document.documentElement.classList.toggle('dark', !isLight)
          document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
        } else {
          document.documentElement.classList.add('dark')
          document.documentElement.style.colorScheme = 'dark'
        }

        set({ glassEnabled: glass })
        if (glass) {
          document.body.classList.add('glass-theme-active')
        } else {
          document.body.classList.remove('glass-theme-active')
        }

        if (density) {
          set({ messageDensity: density })
          document.documentElement.setAttribute('data-density', density)
        }
        if (chatBubbleStyle) {
          set({ chatBubbleStyle })
        }
        if (chatBubbleIntensity) {
          set({ chatBubbleIntensity })
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
        glassEnabled: state.glassEnabled,
        messageDensity: state.messageDensity,
        chatBubbleStyle: state.chatBubbleStyle,
        chatBubbleIntensity: state.chatBubbleIntensity,
        developerMode: state.developerMode,
        showMemberList: state.showMemberList,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Apply theme on rehydrate — even for 'dark' which is the default
        const theme = state.theme
        if (theme && theme !== 'classic' && theme !== 'auto') {
          document.documentElement.setAttribute('data-theme', theme)
        } else if (!theme || theme === 'classic') {
          document.documentElement.removeAttribute('data-theme')
        }
        const isLight = theme === 'light'
        document.documentElement.classList.toggle('dark', !isLight)
        document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
        if (state.glassEnabled) {
          document.body.classList.add('glass-theme-active')
        } else {
          document.body.classList.remove('glass-theme-active')
        }
        if (state.messageDensity) {
          document.documentElement.setAttribute('data-density', state.messageDensity)
        }
      },
    }
  )
)
