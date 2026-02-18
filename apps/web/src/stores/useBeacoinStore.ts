import { create } from 'zustand'
import { api } from '../lib/api'

export interface BeacoinTransaction {
  id: string
  type: 'earn' | 'spend' | 'transfer_in' | 'transfer_out' | 'bonus'
  amount: number
  description: string
  timestamp: string
  fromUserId?: string
  toUserId?: string
  fromUsername?: string
  toUsername?: string
}

interface BeacoinState {
  balance: number
  transactions: BeacoinTransaction[]
  isLoading: boolean
  walletOpen: boolean

  fetchWallet: () => Promise<void>
  sendCoins: (toUserId: string, amount: number, note?: string) => Promise<void>
  setWalletOpen: (open: boolean) => void
  toggleWallet: () => void
}

export const useBeacoinStore = create<BeacoinState>((set, get) => ({
  balance: 0,
  transactions: [],
  isLoading: false,
  walletOpen: false,

  fetchWallet: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/users/@me/beacoin')
      set({
        balance: data.balance ?? 0,
        transactions: data.transactions ?? [],
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  sendCoins: async (toUserId, amount, note) => {
    try {
      const { data } = await api.post('/users/@me/beacoin/send', {
        toUserId,
        amount,
        note,
      })
      set((state) => ({
        balance: state.balance - amount,
        transactions: [data.transaction, ...state.transactions],
      }))
    } catch (err) {
      throw err
    }
  },

  setWalletOpen: (open) => set({ walletOpen: open }),
  toggleWallet: () => set((s) => ({ walletOpen: !s.walletOpen })),
}))
