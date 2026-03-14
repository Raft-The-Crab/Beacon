import { Router, Response, NextFunction } from 'express'
import { AppsService } from '../services/apps'
import { AuthService } from '../services/auth'
import { prisma } from '../db'
import { AuthRequest } from '../middleware/auth'

const router = Router()

// Middleware to protect routes
const localAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1] || (req.cookies as any)?.token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const payload = AuthService.verifyToken(token) as { id: string } | null
    if (!payload) return res.status(401).json({ error: 'Invalid token' })

    if (prisma) {
        // Validate user exists in DB (prevents P2003 from orphaned tokens)
        const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true } })
        if (!user) return res.status(401).json({ error: 'User no longer exists. Please re-register.' })
    }

    req.user = payload
    next()
}

router.get('/', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const apps = await AppsService.getUserApps(userId)
        return res.json(apps)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch applications' })
    }
})

router.post('/', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const { name, description } = req.body
        if (!name) return res.status(400).json({ error: 'Name is required' })

        const app = await AppsService.createApp(userId, name, description)
        return res.json(app)
    } catch (error: any) {
        return res.status(500).json({ error: error?.message || 'Failed to create application' })
    }
})

router.get('/:id', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const { id } = req.params
        const app = await AppsService.getApp(id)
        if (!app) return res.status(404).json({ error: 'Application not found' })
        if (app.ownerId !== userId) return res.status(403).json({ error: 'Unauthorized' })

        return res.json(app)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch application' })
    }
})

router.post('/:id/bot', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const { id } = req.params
        const app = await AppsService.getApp(id)
        if (!app) return res.status(404).json({ error: 'Application not found' })
        if (app.ownerId !== userId) return res.status(403).json({ error: 'Unauthorized' })

        const bot = await AppsService.createBot(id)
        return res.json(bot)
    } catch (error: any) {
        return res.status(500).json({ error: error?.message || 'Failed to create bot' })
    }
})

router.get('/:id/bot', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })

        const { id } = req.params
        const app = await AppsService.getApp(id)
        if (!app) return res.status(404).json({ error: 'Application not found' })
        if (app.ownerId !== userId) return res.status(403).json({ error: 'Unauthorized' })
        if (!app.bot) return res.status(404).json({ error: 'Bot not found' })

        return res.json(app.bot)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch bot' })
    }
})

router.patch('/:id/bot', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params
        const bot = await AppsService.updateBot(id, req.body)
        res.json(bot)
    } catch (error) {
        res.status(500).json({ error: 'Failed to update bot' })
    }
})

router.post('/:id/bot/token', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params
        const bot = await AppsService.regenerateBotToken(id)
        res.json({ token: bot.token })
    } catch (error) {
        res.status(500).json({ error: 'Failed to regenerate bot token' })
    }
})

router.delete('/:id/bot', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params
        await AppsService.deleteBot(id)
        res.status(204).end()
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete bot' })
    }
})

router.delete('/:id', localAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const { id } = req.params
        await AppsService.deleteApp(id, userId)
        res.status(204).end()
    } catch (error: any) {
        res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message || 'Failed to delete application' })
    }
})

export default router
