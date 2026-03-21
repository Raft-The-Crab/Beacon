import { create } from 'zustand'
import { apiClient } from '../services/apiClient'

interface SlashCommand {
    name: string
    description: string
    usage?: string
    category: string
    options?: any[]
}

interface InteractionStore {
    commands: SlashCommand[]
    loading: boolean
    error: string | null
    fetchCommands: (guildId?: string) => Promise<void>
    executeCommand: (channelId: string, name: string, args: string, applicationId?: string) => Promise<boolean>
    getAutocompleteChoices: (channelId: string, name: string, focusedOption: string, value: string) => Promise<any[]>
}

export const useInteractionStore = create<InteractionStore>((set) => ({
    commands: [],
    loading: false,
    error: null,

    fetchCommands: async (guildId) => {
        set({ loading: true, error: null })
        try {
            const res = await apiClient.getSlashCommands(guildId)
            if (res.success) {
                // Flatten the categorized commands from multiple bots into a single list
                const allCommands: SlashCommand[] = []
                if (Array.isArray(res.data)) {
                    res.data.forEach((botEntry: any) => {
                        if (botEntry.commands && Array.isArray(botEntry.commands)) {
                            botEntry.commands.forEach((cmd: any) => {
                                allCommands.push({
                                    name: cmd.name,
                                    description: cmd.description,
                                    usage: cmd.usage || `/${cmd.name}`,
                                    category: cmd.category || 'bot'
                                })
                            })
                        }
                    })
                }
                set({ commands: allCommands, loading: false })
            } else {
                set({ error: res.error || 'Failed to fetch commands', loading: false })
            }
        } catch (err) {
            set({ error: 'Internal error fetching commands', loading: false })
        }
    },

    executeCommand: async (channelId, name, args, applicationId) => {
        try {
            const res = await apiClient.executeInteraction({
                type: 2, // APPLICATION_COMMAND
                channelId,
                applicationId,
                data: {
                    name,
                    options: [{ name: 'input', value: args }]
                }
            })
            return res.success
        } catch (err) {
            console.error('Failed to execute command:', err)
            return false
        }
    },

    getAutocompleteChoices: async (channelId, name, focusedOption, value) => {
        try {
            const res = await apiClient.executeInteraction({
                type: 4, // APPLICATION_COMMAND_AUTOCOMPLETE
                channelId,
                data: {
                    name,
                    options: [{ name: focusedOption, value, focused: true }]
                }
            })
            if (res.success && res.data?.type === 8) {
                return res.data.data.choices || []
            }
            return []
        } catch (err) {
            console.error('Autocomplete failed:', err)
            return []
        }
    }
}))
