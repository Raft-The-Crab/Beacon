import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../db'

const router = Router()

function buildNotificationDedupKey(notification: any): string {
  const metadata = (notification.metadata as any) || {}
  return [
    notification.type,
    metadata.relatedUserId || '',
    metadata.serverId || '',
    metadata.channelId || '',
    notification.title || '',
    notification.body || '',
  ].join(':')
}

// GET /users/@me/notifications with deduplication
router.get('/users/@me/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!prisma) return res.status(500).json({ error: 'Database not connected' })

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Deduplicate on the fields users actually see in the UI.
    const seen = new Set<string>()
    const deduplicated = notifications.filter(n => {
      const key = buildNotificationDedupKey(n)
      
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })

    res.json(deduplicated.map((n) => {
      const metadata = n.metadata as any || {}
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
        serverId: metadata.serverId,
        channelId: metadata.channelId,
        userId: metadata.relatedUserId,
        avatarUrl: n.iconUrl || metadata.avatarUrl,
      }
    }))
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /users/@me/notifications/:id/read
router.patch('/users/@me/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!prisma) return res.status(500).json({ error: 'Database not connected' })

    const { id } = req.params
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/notifications/read-all
router.post('/users/@me/notifications/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!prisma) return res.status(500).json({ error: 'Database not connected' })

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /users/@me/notifications/:id
router.delete('/users/@me/notifications/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!prisma) return res.status(500).json({ error: 'Database not connected' })

    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId },
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /users/@me/notifications
router.delete('/users/@me/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!prisma) return res.status(500).json({ error: 'Database not connected' })

    await prisma.notification.deleteMany({
      where: { userId },
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
