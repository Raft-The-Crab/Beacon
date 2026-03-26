import { create } from 'zustand'
import { apiClient } from '../services/apiClient'
import { useAuthStore } from './useAuthStore'
import { useBeacoinStore } from './useBeacoinStore'

const LOCAL_OWNED_KEY = 'beacon:shop:owned-local'

const FALLBACK_MARKETPLACE = {
    effects: [
        { id: 'effect-nebula-pulse', name: 'Nebula Pulse', price: 1200, color: '#7b61ff' },
        { id: 'effect-cyber-static', name: 'Cyber Static', price: 900, color: '#00c2ff' },
    ],
    decorations: [
        { id: 'deco-royal-orbit', name: 'Royal Orbit', price: 800, color: '#f0b232' },
        { id: 'deco-ember-crown', name: 'Ember Crown', price: 1000, color: 'var(--status-error)' },
    ],
    themes: [
        { id: 'theme-midnight', name: 'Midnight', price: 1200, accentColor: 'var(--beacon-brand)', description: 'Deep midnight blue with beacon brand accent' },
        { id: 'theme-aurora', name: 'Aurora', price: 1500, accentColor: '#c471ed', description: 'Ethereal aurora borealis inspired theme' },
        { id: 'theme-sunset', name: 'Sunset', price: 1200, accentColor: '#f0743d', description: 'Warm golden sunset with amber accents' },
        { id: 'theme-ocean', name: 'Ocean', price: 1300, accentColor: '#00d9ff', description: 'Serene deep ocean with cyan waves' },
        { id: 'theme-forest', name: 'Forest', price: 1200, accentColor: 'var(--status-success)', description: 'Lush forest green with nature vibes' },
    ],
}

function readLocalOwned(): OwnedCosmetic[] {
    if (typeof localStorage === 'undefined') return []
    try {
        const raw = localStorage.getItem(LOCAL_OWNED_KEY)
        const data = raw ? JSON.parse(raw) : []
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

function writeLocalOwned(items: OwnedCosmetic[]) {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(LOCAL_OWNED_KEY, JSON.stringify(items))
    } catch {
        // no-op
    }
}

function isDbOrNetworkError(err: any): boolean {
    const errorData = err?.response?.data || err?.error || err;
    const msg = String(errorData?.error || err?.message || '').toLowerCase()
    return msg.includes('database not connected') || msg.includes('network') || msg.includes('failed to fetch')
}

interface OwnedCosmetic {
    id: string
    cosmeticId: string
    type: 'avatar' | 'profile'
    purchasedAt: string
}

interface ShopState {
    ownedCosmetics: OwnedCosmetic[]
    isLoading: boolean
    error: string | null
    marketplace: { effects: any[], decorations: any[], themes: any[] }
    myGifts: any[]
    fetchOwned: () => Promise<void>
    fetchMarketplace: () => Promise<void>
    fetchMyGifts: () => Promise<void>
    purchaseCosmetic: (cosmeticId: string, couponCode?: string) => Promise<void>
    sendGift: (recipientId: string, cosmeticId: string | null, type: 'COSMETIC' | 'SUBSCRIPTION', message?: string, tier?: 'monthly' | 'yearly') => Promise<void>
    equipCosmetic: (cosmeticId: string | null, type: 'avatar' | 'profile' | 'theme') => Promise<void>
}

export const useShopStore = create<ShopState>((set) => ({
    ownedCosmetics: [],
    isLoading: false,
    error: null,
    marketplace: { effects: [], decorations: [], themes: [] },
    myGifts: [],

    fetchOwned: async () => {
        try {
            set({ isLoading: true, error: null })
            const res = await apiClient.request('GET', '/shop/@me')
            if (res.success) {
                set({ ownedCosmetics: res.data, isLoading: false })
            } else {
                throw res
            }
        } catch (err: any) {
            const fallbackOwned = readLocalOwned()
            set({
                ownedCosmetics: fallbackOwned,
                error: isDbOrNetworkError(err) ? 'Store backend unavailable. Running in local mode.' : (err?.error?.message || err?.message || 'Failed to load cosmetics'),
                isLoading: false
            })
        }
    },

    fetchMarketplace: async () => {
        try {
            set({ isLoading: true, error: null })
            const res = await apiClient.request('GET', '/shop/marketplace')
            if (res.success) {
                set({ marketplace: res.data, isLoading: false })
            } else {
                throw res
            }
        } catch (err: any) {
            set({
                marketplace: FALLBACK_MARKETPLACE,
                error: isDbOrNetworkError(err) ? 'Marketplace is in offline mode (database unavailable).' : (err?.error?.message || err?.message || 'Failed to load marketplace'),
                isLoading: false
            })
        }
    },

    fetchMyGifts: async () => {
        try {
            const res = await apiClient.request('GET', '/gifting/my-gifts')
            if (res.success) {
                set({ myGifts: res.data })
            }
        } catch (err) {
            console.error('Failed to load gifts')
        }
    },

    purchaseCosmetic: async (cosmeticId: string, couponCode?: string) => {
        try {
            const res = await apiClient.request('POST', '/shop/purchase', { cosmeticId, couponCode })
            if (res.success) {
                set((state) => ({ ownedCosmetics: [res.data.cosmetic, ...state.ownedCosmetics] }))
                useBeacoinStore.getState().fetchWallet()
            } else {
                throw res
            }
        } catch (err: any) {
            if (!isDbOrNetworkError(err)) {
                throw new Error(err?.error?.message || err?.message || 'Purchase failed')
            }

            const state = useShopStore.getState()
            const item = [...state.marketplace.decorations, ...state.marketplace.effects].find((x: any) => x.id === cosmeticId)
            const price = Number(item?.price || 0)

            const wallet = useBeacoinStore.getState()
            if (wallet.balance < price) {
                throw new Error('Insufficient Beacoins')
            }

            const userId = useAuthStore.getState().user?.id || 'local-user'
            const type: 'avatar' | 'profile' = state.marketplace.decorations.some((x: any) => x.id === cosmeticId) ? 'avatar' : 'profile'
            const localItem: OwnedCosmetic = {
                id: `local-${Date.now()}`,
                cosmeticId,
                type,
                purchasedAt: new Date().toISOString(),
            }

            const nextOwned = [localItem, ...state.ownedCosmetics.filter((x) => x.cosmeticId !== cosmeticId)]
            writeLocalOwned(nextOwned)
            useBeacoinStore.setState((s) => ({
                balance: Math.max(0, s.balance - price),
                transactions: [{
                    id: `local-shop-${Date.now()}`,
                    type: 'spend',
                    amount: price,
                    description: `Purchased ${item?.name || 'cosmetic'} (offline mode)`,
                    timestamp: new Date().toISOString(),
                    fromUserId: userId,
                } as any, ...s.transactions],
            }))

            set({ ownedCosmetics: nextOwned, error: 'Purchased in offline mode. Sync will resume when backend recovers.' })
        }
    },

    sendGift: async (recipientId, cosmeticId, type, message, tier) => {
        try {
            const res = await apiClient.request('POST', '/gifting/send', { recipientId, cosmeticId, type, message, tier })
            if (res.success) {
                useBeacoinStore.getState().fetchWallet()
            } else {
                throw res
            }
        } catch (err: any) {
            throw new Error(err?.error?.message || err?.message || 'Gifting failed')
        }
    },

    equipCosmetic: async (cosmeticId: string | null, type: 'avatar' | 'profile' | 'theme') => {
        try {
            const res = await apiClient.request('POST', '/shop/equip', { cosmeticId, type })
            if (res.success) {
                useAuthStore.getState().checkSession()
            } else {
                throw res
            }
        } catch (err: any) {
            if (!isDbOrNetworkError(err)) {
                throw new Error(err?.error?.message || err?.message || 'Equip failed')
            }

            const user = useAuthStore.getState().user
            if (!user) return

            if (type === 'avatar') {
                await useAuthStore.getState().updateProfile({ avatarDecorationId: cosmeticId } as any)
            } else if (type === 'profile') {
                await useAuthStore.getState().updateProfile({ profileEffectId: cosmeticId } as any)
            } else if (type === 'theme') {
                set({ error: 'Theme equipped! Changes will sync when backend is available.' })
            }
            set({ error: 'Equipped in offline mode. Changes will sync when backend is available.' })
        }
    }
}))
