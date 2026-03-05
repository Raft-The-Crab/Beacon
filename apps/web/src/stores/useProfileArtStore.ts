import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'

export interface ProfileArt {
    id: string
    name: string
    type: 'frame' | 'banner' | 'effect'
    preview: string    // CSS gradient for preview cards
    imageUrl?: string  // Actual image URL for the art
    animation?: 'spin-slow' | 'pulse-glow' | 'float' | 'shake' | 'obsidian' | 'supernova' | 'void' // CSS animation class
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    price: number      // 0 = free
    unlocked: boolean
}

interface ProfileArtState {
    arts: ProfileArt[]
    equippedFrame: string | null
    equippedBanner: string | null
    equippedEffect: string | null

    fetchArts: () => void
    syncWithUser: () => void
    equipArt: (artId: string, type: 'frame' | 'banner' | 'effect') => Promise<void>
    unequipArt: (type: 'frame' | 'banner' | 'effect') => Promise<void>
    unlockArt: (artId: string) => void
}

const DEFAULT_ARTS: ProfileArt[] = [
    // FREE starter arts (guaranteed on signup)
    {
        id: 'frame-beacon-og',
        name: 'Beacon OG',
        type: 'frame',
        preview: 'linear-gradient(135deg, #5865f2 0%, #7b2ff7 50%, #ff73fa 100%)',
        imageUrl: '/art/frames/beacon-og.png',
        animation: 'spin-slow',
        rarity: 'common',
        price: 0,
        unlocked: true,
    },
    {
        id: 'frame-neon-pulse',
        name: 'Neon Pulse',
        type: 'frame',
        preview: 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)',
        imageUrl: '/art/frames/neon-pulse.png',
        animation: 'pulse-glow',
        rarity: 'common',
        price: 0,
        unlocked: true,
    },
    {
        id: 'banner-midnight',
        name: 'Midnight Wave',
        type: 'banner',
        preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        imageUrl: '/art/banners/midnight.png',
        rarity: 'common',
        price: 0,
        unlocked: true,
    },
    {
        id: 'banner-sunset-glow',
        name: 'Sunset Glow',
        type: 'banner',
        preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ff9a8b 100%)',
        imageUrl: '/art/banners/sunset-glow.png',
        rarity: 'common',
        price: 0,
        unlocked: true,
    },
    // Purchasable arts
    {
        id: 'frame-golden-crown',
        name: 'Golden Crown',
        type: 'frame',
        preview: 'linear-gradient(135deg, #f0b232 0%, #e8a517 50%, #ffd700 100%)',
        imageUrl: '/art/frames/golden-crown.png',
        animation: 'float',
        rarity: 'rare',
        price: 200,
        unlocked: false,
    },
    {
        id: 'frame-cyber-grid',
        name: 'Cyber Grid',
        type: 'frame',
        preview: 'linear-gradient(135deg, #00f5d4 0%, #00bbf9 50%, #9b5de5 100%)',
        animation: 'spin-slow',
        rarity: 'rare',
        price: 200,
        unlocked: false,
    },
    {
        id: 'frame-inferno',
        name: 'Inferno',
        type: 'frame',
        preview: 'linear-gradient(135deg, #ff0844 0%, #ffb199 50%, #f6d365 100%)',
        animation: 'shake',
        rarity: 'epic',
        price: 500,
        unlocked: false,
    },
    {
        id: 'banner-aurora',
        name: 'Aurora Borealis',
        type: 'banner',
        preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8edea 100%)',
        imageUrl: '/art/banners/aurora.png',
        rarity: 'rare',
        price: 200,
        unlocked: false,
    },
    {
        id: 'banner-galaxy',
        name: 'Galaxy Drift',
        type: 'banner',
        preview: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a4e 30%, #8b5cf6 60%, #ec4899 100%)',
        imageUrl: '/art/banners/galaxy.png',
        rarity: 'epic',
        price: 500,
        unlocked: false,
    },
    {
        id: 'effect-sparkle',
        name: 'Sparkle',
        type: 'effect',
        preview: 'linear-gradient(135deg, #ffd700 0%, #fff 50%, #ffd700 100%)',
        rarity: 'legendary',
        price: 1000,
        unlocked: false,
    },
    // Elite Frames (Ultimate Universal Update)
    {
        id: 'frame-obsidian',
        name: 'Obsidian Glow',
        type: 'frame',
        preview: 'linear-gradient(45deg, #1a1b1e, #2c2e33, #1a1b1e)',
        animation: 'obsidian',
        rarity: 'legendary',
        price: 2500,
        unlocked: false,
    },
    {
        id: 'frame-supernova',
        name: 'Supernova',
        type: 'frame',
        preview: 'linear-gradient(-45deg, #ff4e50, #f9d423, #ff4e50)',
        animation: 'supernova',
        rarity: 'legendary',
        price: 3000,
        unlocked: false,
    },
    {
        id: 'frame-void',
        name: 'Void Pulse',
        type: 'frame',
        preview: 'radial-gradient(circle, #7b2ff7 0%, #1a1b1e 100%)',
        animation: 'void',
        rarity: 'legendary',
        price: 3500,
        unlocked: false,
    },
]

export const useProfileArtStore = create<ProfileArtState>((set, get) => ({
    arts: DEFAULT_ARTS,
    equippedFrame: 'frame-beacon-og',    // Free starter frame auto-equipped
    equippedBanner: 'banner-midnight',   // Free starter banner auto-equipped
    equippedEffect: null,

    fetchArts: () => {
        set({ arts: DEFAULT_ARTS })
    },

    syncWithUser: () => {
        const user = useAuthStore.getState().user
        if (user) {
            set({
                equippedFrame: user.avatarDecorationId || null,
                equippedBanner: user.banner || 'banner-midnight',
                equippedEffect: user.profileEffectId || null
            })
        }
    },

    equipArt: async (artId, type) => {
        const state = get()
        const art = state.arts.find((a: ProfileArt) => a.id === artId)
        if (!art || !art.unlocked) return

        // Optimistic update
        set({
            ...(type === 'frame' ? { equippedFrame: artId } : {}),
            ...(type === 'banner' ? { equippedBanner: artId } : {}),
            ...(type === 'effect' ? { equippedEffect: artId } : {}),
        })

        // Persist to backend
        const update: any = {}
        if (type === 'frame') update.avatarDecorationId = artId
        if (type === 'banner') update.banner = art.imageUrl || art.preview
        if (type === 'effect') update.profileEffectId = artId

        await useAuthStore.getState().updateProfile(update)
    },

    unequipArt: async (type) => {
        set({
            ...(type === 'frame' ? { equippedFrame: null } : {}),
            ...(type === 'banner' ? { equippedBanner: null } : {}),
            ...(type === 'effect' ? { equippedEffect: null } : {}),
        })

        const update: any = {}
        if (type === 'frame') update.avatarDecorationId = null
        if (type === 'banner') update.banner = null
        if (type === 'effect') update.profileEffectId = null

        await useAuthStore.getState().updateProfile(update)
    },

    unlockArt: (artId) => {
        set((state) => ({
            arts: state.arts.map((a: ProfileArt) => a.id === artId ? { ...a, unlocked: true } : a),
        }))
    },
}))

// Export a helper to assign frames to other users in the demo environment
export function getSimulatedFrameForUser(username?: string) {
    if (!username) return null
    const storeArts = useProfileArtStore.getState().arts

    // Always give system bots the OG frame
    if (username.toLowerCase().includes('beaconbot') || username.toLowerCase() === 'system') {
        return storeArts.find(a => a.id === 'frame-beacon-og') || null
    }

    // Random 30% chance of other users having a premium frame (seeded by username)
    const showcaseFrames = ['frame-golden-crown', 'frame-neon-pulse', 'frame-beacon-og']
    let hash = 0
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }

    if (Math.abs(hash) % 10 <= 3) {
        const frameId = showcaseFrames[Math.abs(hash) % showcaseFrames.length]
        return storeArts.find(a => a.id === frameId) || null
    }

    return null
}
