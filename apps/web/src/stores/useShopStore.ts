import { create } from 'zustand'
import { api } from '../lib/api'
import { useAuthStore } from './useAuthStore'
import { useBeacoinStore } from './useBeacoinStore'

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
    marketplace: { effects: any[], decorations: any[] }
    myGifts: any[]
    fetchOwned: () => Promise<void>
    fetchMarketplace: () => Promise<void>
    fetchMyGifts: () => Promise<void>
    purchaseCosmetic: (cosmeticId: string, couponCode?: string) => Promise<void>
    sendGift: (recipientId: string, cosmeticId: string, type: 'COSMETIC' | 'SUBSCRIPTION', message?: string) => Promise<void>
    equipCosmetic: (cosmeticId: string | null, type: 'avatar' | 'profile') => Promise<void>
}

export const useShopStore = create<ShopState>((set) => ({
    ownedCosmetics: [],
    isLoading: false,
    error: null,
    marketplace: { effects: [], decorations: [] },
    myGifts: [],

    fetchOwned: async () => {
        try {
            set({ isLoading: true, error: null })
            const { data } = await api.get('/shop/@me')
            set({ ownedCosmetics: data, isLoading: false })
        } catch (err: any) {
            set({ error: err?.response?.data?.error || 'Failed to load cosmetics', isLoading: false })
        }
    },

    fetchMarketplace: async () => {
        try {
            set({ isLoading: true, error: null })
            const { data } = await api.get('/shop/marketplace')
            set({ marketplace: data, isLoading: false })
        } catch (err: any) {
            set({ error: err?.response?.data?.error || 'Failed to load marketplace', isLoading: false })
        }
    },

    fetchMyGifts: async () => {
        try {
            const { data } = await api.get('/gifting/my-gifts')
            set({ myGifts: data })
        } catch (err) {
            console.error('Failed to load gifts')
        }
    },

    purchaseCosmetic: async (cosmeticId: string, couponCode?: string) => {
        try {
            const { data } = await api.post('/shop/purchase', { cosmeticId, couponCode })
            set((state) => ({ ownedCosmetics: [data.cosmetic, ...state.ownedCosmetics] }))
            // Refresh wallet balance
            useBeacoinStore.getState().fetchWallet()
        } catch (err: any) {
            throw new Error(err?.response?.data?.error || 'Purchase failed')
        }
    },

    sendGift: async (recipientId, cosmeticId, type, message) => {
        try {
            await api.post('/gifting/send', { recipientId, cosmeticId, type, message })
            useBeacoinStore.getState().fetchWallet()
        } catch (err: any) {
            throw new Error(err?.response?.data?.error || 'Gifting failed')
        }
    },

    equipCosmetic: async (cosmeticId: string | null, type: 'avatar' | 'profile') => {
        try {
            await api.post('/shop/equip', { cosmeticId, type })
            // Refresh auto user to update equipped cosmetics
            useAuthStore.getState().checkSession()
        } catch (err: any) {
            throw new Error(err?.response?.data?.error || 'Equip failed')
        }
    }
}))
