import { create } from 'zustand'
import { api } from '../lib/api'

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
            const { data } = await api.get('/quests')
            set({ quests: data, isLoading: false })
        } catch (err) {
            set({ isLoading: false })
            console.error('Failed to fetch quests', err)
        }
    },

    claimReward: async (questId: string) => {
        try {
            await api.post('/quests/claim', { questId })
            set((state) => ({
                quests: state.quests.map(q =>
                    q.questId === questId ? { ...q, claimed: true } : q
                )
            }))
        } catch (err) {
            console.error('Failed to claim reward', err)
            throw err
        }
    }
}))
