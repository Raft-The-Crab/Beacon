import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'midnight' | 'aurora' | 'neon' | 'sakura' | 'ocean'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'midnight',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      }
    }),
    { name: 'beacon-theme' }
  )
)
