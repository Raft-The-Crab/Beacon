import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import fs from 'fs'
import path from 'path'

const DEVELOPERS_PATH = path.join(process.cwd(), 'apps/server/config/developers.json')

export const isSovereign = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        if (!fs.existsSync(DEVELOPERS_PATH)) {
            console.error('[SOVEREIGN] CRITICAL: developers.json missing!')
            return res.status(500).json({ error: 'Security configuration error' })
        }

        const { developers } = JSON.parse(fs.readFileSync(DEVELOPERS_PATH, 'utf-8'))

        if (Array.isArray(developers) && developers.includes(userId)) {
            console.log(`[SOVEREIGN] Access granted to user: ${userId}`)
            return next()
        }

        console.warn(`[SOVEREIGN] Access REJECTED for user: ${userId}`)
        return res.status(403).json({ error: 'Sovereign clearance required' })
    } catch (err) {
        console.error('[SOVEREIGN] Error validating clearance:', err)
        return res.status(500).json({ error: 'Internal Security Error' })
    }
}
