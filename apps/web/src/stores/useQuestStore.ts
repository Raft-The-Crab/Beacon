import { create } from 'zustand'
import { apiClient } from '../services/apiClient'

interface Quest {
    id: string
    userId: string
    questId: string
    progress: number
    completed: boolean
    claimed: boolean
    quest: {
        id: string
        title: string
        description: string
        reward: number
        total: number
        type: string
    }
}

interface QuestState {
    quests: Quest[]
    isLoading: boolean
    fetchQuests: () => Promise<void>
    claimReward: (questId: string) => Promise<void>
}

export const useQuestStore = create<QuestState>((set) => ({
    quests: [],
    isLoading: false,

    fetchQuests: async () => {
        set({ isLoading: true })
        try {
            const res = await apiClient.request('GET', '/quests')
            if (res.success) {
                set({ quests: res.data, isLoading: false })
            } else {
                set({ isLoading: false })
            }
        } catch (err) {
            set({ isLoading: false })
            console.error('Failed to fetch quests', err)
        }
    },

    claimReward: async (questId: string) => {
        try {
            const res = await apiClient.request('POST', '/quests/claim', { questId })
            if (res.success) {
                set((state) => ({
                    quests: state.quests.map(q =>
                        q.questId === questId ? { ...q, claimed: true } : q
                    )
                }))
            }
        } catch (err) {
            console.error('Failed to claim reward', err)
            throw err
        }
    }
}))
