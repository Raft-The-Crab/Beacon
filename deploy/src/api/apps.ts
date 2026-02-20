import { Router } from 'express'
import { AppsService } from '../services/apps'
import { AuthService } from '../services/auth'

const router = Router()

// Middleware to protect routes (can be moved to a separate file later)
const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const payload = AuthService.verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Invalid token' })

    req.user = payload
    next()
}

router.get('/', authenticate, async (req: any, res) => {
    try {
        const apps = await AppsService.getUserApps(req.user.id)
        return res.json(apps)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch applications' })
    }
})

router.post('/', authenticate, async (req: any, res) => {
    try {
        const { name, description } = req.body
        if (!name) return res.status(400).json({ error: 'Name is required' })

        const app = await AppsService.createApp(req.user.id, name, description)
        return res.json(app)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create application' })
    }
})

router.post('/:id/bot', authenticate, async (req, res) => {
    try {
        const { id } = req.params
        const bot = await AppsService.createBot(id)
        res.json(bot)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create/reset bot token' })
    }
})

export default router
