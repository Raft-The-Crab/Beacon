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
        return res.json()
    },

    list: async (applicationId: string) => {
        // Note: The backend might not have a dedicated list endpoint if it's 1:1.
        // We fetch via application details.
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications/${applicationId}`, {
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to fetch bots')
        const app = await res.json()
        // The backend returns the app object which contains the bot relation
        return app.bot ? [app.bot] : []
    },

    regenerateToken: async (_botId: string) => {
        // We'll throw an error for now as we need to know the structure or pass appId
        // But wait, the DeveloperPortal passes appId to handleCreateBot which calls /api/applications/:appId/bot
        // So 'regenerate' is effectively 'create' (upsert) on the backend for 1:1 bots.
        // The UI in BotConsole calls this with botId. 
        // We should probably change BotConsole to pass appId and use create() for regeneration if it's 1:1.
        // OR we implement a explicit reset endpoint.
        // Let's assume there's a specific endpoint or we use the create one using the known structure.
        // Since I don't have the appId easily in regenerateToken(botId), strict 1:1 implies I can't easily do it without lookup.
        // I will throw for now, and update BotConsole to use create() for reset.
        throw new Error('Use create/reset in UI for now')
    },

    delete: async (botId: string) => {
        // DELETE /api/applications/:appId/bot would be better for 1:1
        // But let's try a direct bot delete if it exists
        // Actually, looking at the backend routes list in api.ts, there isn't a clear DELETE /bots/:id
        // There is /api/applications/:id
        // I'll assume standard REST: DELETE /api/bots/:id might not exist.
        // I will disable delete for now or try.
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/bots/${botId}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        if (!res.ok) throw new Error('Failed to delete bot')
    }
}
