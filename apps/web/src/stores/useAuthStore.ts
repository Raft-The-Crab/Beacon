import { create } from 'zustand'
import { apiClient } from '../services/apiClient'
import { User } from '@beacon/types'
import { CryptoService } from '../services/cryptoService'
import { UserActivity } from './usePresenceStore'

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

function decorateSystemUser(user: User | null): User | null {
  if (!user) return null

  const normalizedBadges = new Set(
    (user.badges || []).map((badge) => {
      switch (badge) {
        case 'owner':
        case 'admin':
        case 'moderator':
        case 'beacon_plus':
        case 'bot':
        case 'early_supporter':
        case 'bug_hunter':
        case 'server_owner':
        case 'verified':
          return badge
        default:
          return String(badge)
            .toLowerCase()
            .replace('app_owner', 'owner')
            .replace('system_admin', 'admin')
            .replace('platform_moderator', 'moderator')
      }
    })
  )

  if ((user as User & { isBeaconPlus?: boolean }).isBeaconPlus) {
    normalizedBadges.add('beacon_plus')
  }

  const isRaft =
    user.username?.toLowerCase() === 'raftthecrab' &&
    String(user.discriminator || '').trim() === '1452'

  if (isRaft) {
    normalizedBadges.add('admin')
    normalizedBadges.add('verified')
  }

  return {
    ...user,
    badges: Array.from(normalizedBadges) as User['badges'],
  }
}

interface AuthState {
  user: (User & { activities?: UserActivity[]; theme?: string; isBeaconPlus?: boolean }) | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  encryptionKeys: CryptoKeyPair | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkSession: () => Promise<void>
  updateProfile: (data: Partial<User & { theme?: string; activities?: UserActivity[]; isBeaconPlus?: boolean }>) => Promise<void>
  updateStatus: (update: {
    statusText?: string,
    statusEmoji?: string,
    statusMusic?: string,
    statusMusicMetadata?: User['statusMusicMetadata'],
    activities?: UserActivity[]
  }) => Promise<void>
  updateActivities: (activities: UserActivity[]) => Promise<void>
  setUser: (user: User | null) => void

  // UI Actions
  setTheme: (theme: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  encryptionKeys: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        set({ user: decorateSystemUser(response.data.user), isAuthenticated: true, isLoading: false })
        if (response.data.user.theme) {
          get().setTheme(response.data.user.theme)
        }
        // Proactively generate keys if not present
        if (!get().encryptionKeys) {
          const keys = await CryptoService.generateKeyPair();
          set({ encryptionKeys: keys });
        }
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (err: any) {
      set({
        error: err.message || 'Login failed',
        isLoading: false
      })
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.register(email, username, password)
      if (response.success && response.data) {
        const keys = await CryptoService.generateKeyPair();
        set({ user: decorateSystemUser(response.data.user), isAuthenticated: true, isLoading: false, encryptionKeys: keys })
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (err: any) {
      set({
        error: err.message || 'Registration failed',
        isLoading: false
      })
      throw err;
    }
  },

  logout: async () => {
    await apiClient.logout()
    set({ user: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  checkSession: async () => {
    if (!apiClient.getAccessToken()) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const response = await apiClient.getCurrentUser()
      if (response.success && response.data) {
        const userData = response.data as User & { theme?: string }
        set({ user: decorateSystemUser(userData as User) as any, isAuthenticated: true, isLoading: false })
        if (userData.theme) {
          get().setTheme(userData.theme)
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await apiClient.updateUser(updates as any);
      if (response.success && response.data) {
        set({ user: decorateSystemUser(response.data as User) as any });
        if (updates.theme) get().setTheme(updates.theme);
      }
    } catch (err) {
      console.error(err);
    }
  },

  updateStatus: async (update) => {
    try {
      const { user } = get()
      if (!user) return

      const newStatus = {
        ...user,
        ...update
      }

      await get().updateProfile(update)
      set({ user: newStatus as any })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  },

  updateActivities: async (activities) => {
    const { user } = get()
    if (!user) return
    const newStatus = { ...user, activities }
    await get().updateProfile({ activities })
    set({ user: newStatus as any })
  },

  setUser: (user) => set({ user: decorateSystemUser(user) as any, isAuthenticated: !!user }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const isLight = theme === 'light'
    document.documentElement.classList.toggle('dark', !isLight)
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
  }
}))
