import { Router } from 'express'
import { prisma } from '../db'
import { authenticate } from '../middleware/auth'

const router = Router()

// Admin/Developer only route to get high-level metrics
router.get('/metrics', authenticate, async (_req: any, res) => {
    try {
        const userCount = await prisma.user.count()
        const guildCount = await prisma.guild.count()
        const messageCount = await prisma.message.count()
        const applicationCount = await prisma.application.count()

        // Average messages per user (simple heuristic)
        const avgMessages = userCount > 0 ? (messageCount / userCount).toFixed(2) : 0

        res.json({
            timestamp: new Date().toISOString(),
            stats: {
                totalUsers: userCount,
                totalGuilds: guildCount,
                totalMessages: messageCount,
                totalApps: applicationCount,
                engagementIndex: parseFloat(avgMessages as string)
            }
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' })
    }
})

export default router
