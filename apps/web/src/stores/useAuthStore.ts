import { create } from 'zustand'
import { apiClient } from '@beacon/api-client'
import { User } from '@beacon/types'

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible'

// Extend the imported User type if needed, or just use it
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkSession: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  updateStatus: (update: {
    statusText?: string,
    statusEmoji?: string,
    statusMusic?: string,
    statusMusicMetadata?: User['statusMusicMetadata']
  }) => Promise<void>
  setUser: (user: User | null) => void

  // UI Actions
  setTheme: (theme: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false })
        if (response.data.user.theme) {
          get().setTheme(response.data.user.theme)
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
        set({ user: response.data.user, isAuthenticated: true, isLoading: false })
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
        set({ user: response.data, isAuthenticated: true, isLoading: false })
        // @ts-ignore
        if (response.data.theme) {
          // @ts-ignore
          get().setTheme(response.data.theme)
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
      const response = await apiClient.updateUser(updates);
      if (response.success && response.data) {
        set({ user: response.data });
        // @ts-ignore
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

      // Simulate API call for now or use updateProfile if backend supports it
      await get().updateProfile(update as any)
      set({ user: newStatus })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  }
}))
