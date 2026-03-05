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

export interface DailyReward {
  day: number
  amount: number
  claimed: boolean
  bonus?: boolean  // streak bonus days
}

interface BeacoinState {
  balance: number
  transactions: BeacoinTransaction[]
  isLoading: boolean
  walletOpen: boolean
  lastDailyClaim: string | null
  streak: number
  dailyRewards: DailyReward[]
  messageCount: number

  fetchWallet: () => Promise<void>
  sendCoins: (toUserId: string, amount: number, note?: string) => Promise<void>
  purchaseSubscription: (tier: 'monthly' | 'yearly', couponCode?: string) => Promise<void>
  claimDaily: () => Promise<void>
  claimActivityReward: () => Promise<void>
  claimInviteBonus: (invitedUserId: string) => Promise<void>
  incrementMessages: () => void
  setWalletOpen: (open: boolean) => void
  toggleWallet: () => void
}

const DAILY_BASE = 50
const STREAK_BONUS = 25
const ACTIVITY_REWARD = 10
const ACTIVITY_THRESHOLD = 50  // messages per milestone
const INVITE_BONUS = 25

function generateDailyRewards(streak: number): DailyReward[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    amount: DAILY_BASE + (i === 6 ? STREAK_BONUS : 0),
    claimed: i < (streak % 7),
    bonus: i === 6,
  }))
}

function canClaimToday(lastClaim: string | null): boolean {
  if (!lastClaim) return true
  const last = new Date(lastClaim)
  const now = new Date()
  return last.toDateString() !== now.toDateString()
}

export const useBeacoinStore = create<BeacoinState>((set, get) => ({
  balance: 0,
  transactions: [],
  isLoading: false,
  walletOpen: false,
  lastDailyClaim: null,
  streak: 0,
  dailyRewards: generateDailyRewards(0),
  messageCount: 0,

  fetchWallet: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/users/@me/beacoin')
      set({
        balance: data.balance ?? 0,
        transactions: data.transactions ?? [],
        streak: data.streak ?? 0,
        lastDailyClaim: data.lastDailyClaim ?? null,
        dailyRewards: generateDailyRewards(data.streak ?? 0),
        isLoading: false,
      })
    } catch {
      // Offline mode — seed with starter balance
      set({
        balance: 100,
        streak: 0,
        dailyRewards: generateDailyRewards(0),
        isLoading: false,
      })
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

  purchaseSubscription: async (tier: 'monthly' | 'yearly', couponCode?: string) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/users/@me/beacoin/subscribe', { tier, couponCode })
      set((state) => ({
        isLoading: false,
        balance: state.balance - data.cost,
        transactions: [data.transaction, ...state.transactions]
      }))
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  claimDaily: async () => {
    const { lastDailyClaim, streak } = get()
    if (!canClaimToday(lastDailyClaim)) return

    const isStreakDay = (streak % 7) === 6
    const reward = DAILY_BASE + (isStreakDay ? STREAK_BONUS : 0)
    const newStreak = streak + 1
    const now = new Date().toISOString()

    const tx: BeacoinTransaction = {
      id: `daily-${Date.now()}`,
      type: 'earn',
      amount: reward,
      description: isStreakDay ? `Daily reward + ${STREAK_BONUS} streak bonus! 🔥` : 'Daily check-in reward',
      timestamp: now,
    }

    // Try API, fall back to local
    try {
      await api.post('/users/@me/beacoin/daily')
    } catch {
      // Offline — apply locally
    }

    set((state) => ({
      balance: state.balance + reward,
      streak: newStreak,
      lastDailyClaim: now,
      dailyRewards: generateDailyRewards(newStreak),
      transactions: [tx, ...state.transactions],
    }))
  },

  claimActivityReward: async () => {
    const { messageCount } = get()
    if (messageCount < ACTIVITY_THRESHOLD) return

    const tx: BeacoinTransaction = {
      id: `activity-${Date.now()}`,
      type: 'earn',
      amount: ACTIVITY_REWARD,
      description: `Activity milestone: ${ACTIVITY_THRESHOLD} messages! 💬`,
      timestamp: new Date().toISOString(),
    }

    try {
      await api.post('/users/@me/beacoin/activity')
    } catch {
      // Offline — apply locally
    }

    set((state) => ({
      balance: state.balance + ACTIVITY_REWARD,
      messageCount: 0, // reset count
      transactions: [tx, ...state.transactions],
    }))
  },

  claimInviteBonus: async (invitedUserId: string) => {
    const tx: BeacoinTransaction = {
      id: `invite-${Date.now()}`,
      type: 'bonus',
      amount: INVITE_BONUS,
      description: 'Invite bonus — a friend joined Beacon!',
      timestamp: new Date().toISOString(),
      fromUserId: invitedUserId,
    }

    try {
      await api.post('/users/@me/beacoin/invite', { invitedUserId })
    } catch {
      // Offline
    }

    set((state) => ({
      balance: state.balance + INVITE_BONUS,
      transactions: [tx, ...state.transactions],
    }))
  },

  incrementMessages: () => {
    set((state) => {
      const newCount = state.messageCount + 1
      // Auto-claim at threshold
      if (newCount >= ACTIVITY_THRESHOLD) {
        setTimeout(() => get().claimActivityReward(), 100)
      }
      return { messageCount: newCount }
    })
  },

  setWalletOpen: (open) => set({ walletOpen: open }),
  toggleWallet: () => set((s) => ({ walletOpen: !s.walletOpen })),
}))

