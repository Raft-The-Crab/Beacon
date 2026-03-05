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
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})

export const botsApi = {
    create: async (data: { name: string; applicationId: string }) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${data.applicationId}/bot`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to create bot')
        }
        return res.json() as Promise<Bot>
    },

    get: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}/bot`, {
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to fetch bot details')
        return res.json() as Promise<Bot>
    },

    list: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}`, {
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to fetch application bots')
        const app = await res.json()
        return app.bot ? [app.bot] : []
    },

    update: async (applicationId: string, data: Partial<{ name: string; avatar: string }>) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}/bot`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to update bot')
        }
        return res.json() as Promise<Bot>
    },

    regenerateToken: async (applicationId: string) => {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}/bot/token`, {
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
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}/bot`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Failed to delete bot')
        }
    }
}
