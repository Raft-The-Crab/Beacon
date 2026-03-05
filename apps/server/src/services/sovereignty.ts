import fs from 'fs'
import path from 'path'

const DEVELOPERS_PATH = path.join(process.cwd(), 'apps/server/config/developers.json')

export class SovereigntyService {
    private static developers: string[] = []
    private static loaded = false

    private static loadDevelopers() {
        if (this.loaded) return
        try {
            if (fs.existsSync(DEVELOPERS_PATH)) {
                const data = JSON.parse(fs.readFileSync(DEVELOPERS_PATH, 'utf-8'))
                this.developers = data.developers || []
            }
        } catch (err) {
            console.error('[SOVEREIGNTY] Failed to load developers:', err)
        }
        this.loaded = true
    }

    static isSovereign(userId: string): boolean {
        this.loadDevelopers()
        return this.developers.includes(userId)
    }
    /**
     * Determines if a request should use "Zero-Data" (minimal) mode
     * based on user settings or headers.
     */
    static isZeroDataMode(headers: any, userSettings?: any): boolean {
        if (userSettings?.zeroDataMode) return true

        // Check for "Lite" or "Zero" custom headers (often used by mobile carriers in specific markets)
        const protocol = headers['x-beacon-protocol']
        if (protocol === 'zero-data' || protocol === 'lite') return true

        return false
    }

    /**
     * Truncates message content for Zero-Data mode
     */
    static optimizePayload(payload: any, isZeroData: boolean) {
        if (!isZeroData) return payload

        const optimized = { ...payload }

        // In Zero-Data mode, we strip large attachments, embeds, and premium avatars
        if (optimized.content && optimized.content.length > 200) {
            optimized.content = optimized.content.substring(0, 200) + '... (Lite Mode)'
        }

        delete optimized.embeds
        delete optimized.attachments
        delete optimized.sticker_items

        return optimized
    }
}
