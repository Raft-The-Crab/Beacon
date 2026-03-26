import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'

export interface ProfileArt {
  id: string
  name: string
  type: 'frame'
  preview: string
  imageUrl?: string
  animation?: 'spin-slow' | 'pulse-glow' | 'float' | 'shake'
  rarity: 'common' | 'rare' | 'epic'
  price: number
  unlocked: boolean
}

interface ProfileArtState {
  arts: ProfileArt[]
  equippedFrame: string | null
  fetchArts: () => void
  syncWithUser: () => void
  equipArt: (artId: string, type: 'frame') => Promise<void>
  unequipArt: (type: 'frame') => Promise<void>
  unlockArt: (artId: string) => void
}

const DEFAULT_ARTS: ProfileArt[] = [
  {
    id: 'frame-beacon-og',
    name: 'Beacon',
    type: 'frame',
    preview: 'linear-gradient(135deg, var(--beacon-brand) 0%, #7b2ff7 50%, #ff73fa 100%)',
    animation: 'spin-slow',
    rarity: 'common',
    price: 0,
    unlocked: true,
  },
  {
    id: 'frame-neon-pulse',
    name: 'Neon Ring',
    type: 'frame',
    preview: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)',
    animation: 'pulse-glow',
    rarity: 'common',
    price: 0,
    unlocked: true,
  },
  {
    id: 'frame-golden-crown',
    name: 'Gilded',
    type: 'frame',
    preview: 'linear-gradient(135deg, #f0b232 0%, #e8a517 50%, #ffd700 100%)',
    animation: 'float',
    rarity: 'rare',
    price: 0,
    unlocked: true,
  },
]

export const useProfileArtStore = create<ProfileArtState>((set, get) => ({
  arts: DEFAULT_ARTS,
  equippedFrame: 'frame-beacon-og',

  fetchArts: () => {
    set({ arts: DEFAULT_ARTS })
  },

  syncWithUser: () => {
    const user = useAuthStore.getState().user
    if (!user) return

    set({
      equippedFrame: user.avatarDecorationId || 'frame-beacon-og',
    })
  },

  equipArt: async (artId, type) => {
    const state = get()
    const art = state.arts.find((entry) => entry.id === artId)
    if (!art || !art.unlocked) return

    set({
      ...(type === 'frame' ? { equippedFrame: artId } : {}),
    })

    const update: Record<string, string | null> = {}
    if (type === 'frame') update.avatarDecorationId = artId

    await useAuthStore.getState().updateProfile(update as any)
  },

  unequipArt: async (_type) => {
    set({ equippedFrame: 'frame-beacon-og' })
    await useAuthStore.getState().updateProfile({ avatarDecorationId: 'frame-beacon-og' } as any)
  },

  unlockArt: (artId) => {
    set((state) => ({
      arts: state.arts.map((art) => (art.id === artId ? { ...art, unlocked: true } : art)),
    }))
  },
}))

export function getSimulatedFrameForUser(username?: string) {
  if (!username) return null

  const storeArts = useProfileArtStore.getState().arts
  const lowerName = String(username || '').toLowerCase()
  if (lowerName.includes('beaconbot') || lowerName === 'system') {
    return storeArts.find((entry) => entry.id === 'frame-beacon-og') || null
  }

  const showcaseFrames = ['frame-golden-crown', 'frame-neon-pulse', 'frame-beacon-og']
  let hash = 0
  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }

  if (Math.abs(hash) % 10 <= 3) {
    const frameId = showcaseFrames[Math.abs(hash) % showcaseFrames.length]
    return storeArts.find((entry) => entry.id === frameId) || null
  }

  return null
}
