import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'

const router = Router()

// GET /users/@me/notifications
router.get('/users/@me/notifications', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
      serverId: n.serverId,
      channelId: n.channelId,
      userId: n.relatedUserId,
      avatarUrl: n.avatarUrl,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /users/@me/notifications/:id/read
router.patch('/users/@me/notifications/:id/read', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/notifications/read-all
router.post('/users/@me/notifications/read-all', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
