import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import fs from 'fs'
import { resolveFirstExistingConfigPath } from '../lib/configPaths'

export const isSovereign = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const developersPath = resolveFirstExistingConfigPath('developers.json')

        if (!developersPath) {
            console.error('[SOVEREIGN] CRITICAL: developers config missing!')
            return res.status(500).json({ error: 'Security configuration error' })
        }

        const { developers } = JSON.parse(fs.readFileSync(developersPath, 'utf-8'))

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
