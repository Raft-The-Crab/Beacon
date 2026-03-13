import { API_CONFIG } from '../config/api'

export interface Bot {
    id: string
    name: string
    avatar?: string
    token?: string // Only returned on creation/regeneration
    applicationId: string
    ownerId: string
    createdAt: string
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('beacon_token') || localStorage.getItem('token') || ''}`
})

const normalizeBot = (payload: any, applicationId: string, fallbackName: string = 'Beacon Bot'): Bot => ({
    id: payload?.id || '',
    name: payload?.name || fallbackName,
    avatar: payload?.avatar,
    token: payload?.token,
    applicationId: payload?.applicationId || applicationId,
    ownerId: payload?.ownerId || '',
    createdAt: payload?.createdAt || new Date().toISOString(),
})

export const botsApi = {
    create: async (data: { name: string; applicationId: string }) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${data.applicationId}/bot`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to create bot')
        }
        const bot = await res.json()
        return normalizeBot(bot, data.applicationId, data.name)
    },

    get: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${applicationId}/bot`, {
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to fetch bot details')
        const bot = await res.json()
        return normalizeBot(bot, applicationId)
    },

    list: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${applicationId}`, {
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to fetch application bots')
        const app = await res.json()
        return app.bot ? [normalizeBot(app.bot, applicationId, app.name || 'Beacon Bot')] : []
    },

    update: async (applicationId: string, data: Partial<{ name: string; avatar: string }>) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${applicationId}/bot`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to update bot')
        }
        const updated = await res.json()
        return normalizeBot(updated, applicationId, updated?.displayName || updated?.username || 'Beacon Bot')
    },

    regenerateToken: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${applicationId}/bot/token`, {
            method: 'POST',
            headers: getHeaders()
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to regenerate token')
        }
        return res.json() as Promise<{ token: string }>
    },

    delete: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/applications/${applicationId}/bot`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to delete bot')
        }
    }
}
