import { create } from 'zustand'
import { apiClient } from '../services/apiClient'
import type { User, UserBadge } from 'beacon-sdk'
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
    ...(user as any),
    badges: Array.from(normalizedBadges) as any,
  } as any
}

interface AuthState {
  user: (User & { activities?: UserActivity[]; theme?: string; isBeaconPlus?: boolean; globalName?: string | null; accountTier?: string; locale?: string | null }) | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  encryptionKeys: CryptoKeyPair | null
  mfaRequired: boolean
  tempUserId: string | null
  verificationRequired: boolean
  verificationEmail: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  socialLogin: (idToken: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  verifyMFA: (token: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  resendVerification: () => Promise<void>
  logout: () => void
  checkSession: () => Promise<void>
  updateProfile: (data: Partial<User & { theme?: string; activities?: UserActivity[]; isBeaconPlus?: boolean; globalName?: string | null; accountTier?: string; locale?: string | null }>) => Promise<void>
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
  mfaRequired: false,
  tempUserId: null,
  verificationRequired: false,
  verificationEmail: null,

  login: async (identifier, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.login(identifier, password)
      
      if (response.success && response.data) {
        if (response.data.verificationRequired) {
          set({ 
            verificationRequired: true, 
            verificationEmail: response.data.email,
            isLoading: false 
          })
          return
        }

        set({ 
          user: decorateSystemUser(response.data.user), 
          isAuthenticated: true, 
          isLoading: false,
          mfaRequired: false,
          tempUserId: null,
          verificationRequired: false,
          verificationEmail: null
        })
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
        isLoading: false,
        mfaRequired: false
      })
      throw err;
    }
  },

  verifyMFA: async (token) => {
    const { tempUserId } = get()
    if (!tempUserId) throw new Error('No pending login session')

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.verifyMFA(tempUserId, token)
      if (response.success && response.data) {
        set({ 
          user: decorateSystemUser(response.data.user), 
          isAuthenticated: true, 
          isLoading: false,
          mfaRequired: false,
          tempUserId: null
        })
        if (response.data.user.theme) {
          get().setTheme(response.data.user.theme)
        }
      } else {
        throw new Error(response.error || 'MFA verification failed')
      }
    } catch (err: any) {
      set({ error: err.message || 'MFA verification failed', isLoading: false })
      throw err
    }
  },

  verifyEmail: async (code) => {
    const { verificationEmail } = get()
    if (!verificationEmail) throw new Error('No pending verification')

    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.verifyEmail(verificationEmail, code)
      if (response.success && response.data) {
        set({ 
          user: decorateSystemUser(response.data.user), 
          isAuthenticated: true, 
          isLoading: false,
          verificationRequired: false,
          verificationEmail: null
        })
        const keys = await CryptoService.generateKeyPair();
        set({ encryptionKeys: keys });
        if (response.data.user.theme) {
          get().setTheme(response.data.user.theme)
        }
      } else {
        throw new Error(response.error || 'Verification failed')
      }
    } catch (err: any) {
      set({ error: err.message || 'Verification failed', isLoading: false })
      throw err
    }
  },

  resendVerification: async () => {
    const { verificationEmail } = get()
    if (!verificationEmail) return
    await apiClient.resendVerification(verificationEmail)
  },

  socialLogin: async (idToken) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.socialLogin(idToken)
      if (response.success && response.data) {
        set({ user: decorateSystemUser(response.data.user), isAuthenticated: true, isLoading: false })
        if (response.data.user.theme) {
          get().setTheme(response.data.user.theme)
        }
        if (!get().encryptionKeys) {
          const keys = await CryptoService.generateKeyPair();
          set({ encryptionKeys: keys });
        }
      } else {
        throw new Error(response.error || 'Social login failed')
      }
    } catch (err: any) {
      set({ error: err.message || 'Social login failed', isLoading: false })
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.register(email, username, password)
      if (response.success && response.data) {
        if (response.data.verificationRequired) {
          set({ 
            verificationRequired: true, 
            verificationEmail: response.data.email,
            isLoading: false 
          })
          return
        }
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
        set((state) => ({ 
          user: decorateSystemUser({ ...(state.user as any), ...(response.data as any) }) as any 
        }));
        if (updates.theme) get().setTheme(updates.theme);
      }
    } catch (err) {
      console.error('[AuthStore] UpdateProfile failed:', err);
    }
  },

  updateStatus: async (update) => {
    try {
      await get().updateProfile(update);
    } catch (err) {
      console.error('[AuthStore] UpdateStatus failed:', err);
    }
  },

  updateActivities: async (activities) => {
    try {
      await get().updateProfile({ activities });
    } catch (err) {
      console.error('[AuthStore] UpdateActivities failed:', err);
    }
  },

  setUser: (user) => set({ user: decorateSystemUser(user) as any, isAuthenticated: !!user }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const isLight = theme === 'light'
    document.documentElement.classList.toggle('dark', !isLight)
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
  }
}))
