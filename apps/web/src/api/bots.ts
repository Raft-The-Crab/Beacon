import { apiClient } from '../services/apiClient'

export interface Bot {
    id: string
    name: string
    avatar?: string
    token?: string // Only returned on creation/regeneration
    applicationId: string
    ownerId: string
    description?: string
    banner?: string
    accentColor?: string
    createdAt: string
}

const normalizeBot = (payload: any, applicationId: string, fallbackName: string = 'Beacon Bot'): Bot => ({
    id: payload?.id || '',
    name: payload?.name || fallbackName,
    avatar: payload?.avatar,
    token: payload?.token,
    applicationId: payload?.applicationId || applicationId,
    ownerId: payload?.ownerId || '',
    banner: payload?.banner,
    accentColor: payload?.accentColor,
    createdAt: payload?.createdAt || new Date().toISOString(),
})

export const botsApi = {
    create: async (data: { name: string; applicationId: string }) => {
        const res = await apiClient.request('POST', `/applications/${data.applicationId}/bot`, data)
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to create bot')
        }
        const bot = res.data
        return normalizeBot(bot, data.applicationId, data.name)
    },

    get: async (applicationId: string) => {
        const res = await apiClient.request('GET', `/applications/${applicationId}/bot`)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch bot details')
        const bot = res.data
        return normalizeBot(bot, applicationId)
    },

    list: async (applicationId: string) => {
        const res = await apiClient.request('GET', `/applications/${applicationId}`)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch application bots')
        const app = res.data
        return app.bot ? [normalizeBot(app.bot, applicationId, app.name || 'Beacon Bot')] : []
    },

    update: async (applicationId: string, data: Partial<{ name: string; avatar: string; description: string; banner: string; accentColor: string }>) => {
        const res = await apiClient.request('PATCH', `/applications/${applicationId}/bot`, data)
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to update bot')
        }
        const updated = res.data
        return normalizeBot(updated, applicationId, updated?.displayName || updated?.username || 'Beacon Bot')
    },

    regenerateToken: async (applicationId: string) => {
        const res = await apiClient.request('POST', `/applications/${applicationId}/bot/token`)
        if (!res.success || !res.data) {
            throw new Error(res.error || 'Failed to regenerate token')
        }
        return res.data as { token: string }
    },

    delete: async (applicationId: string) => {
        const res = await apiClient.request('DELETE', `/applications/${applicationId}/bot`)
        if (!res.success) {
            throw new Error(res.error || 'Failed to delete bot')
        }
    }
}
