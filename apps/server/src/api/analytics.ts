import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { redis, MessageModel } from '../db'

const router = Router()

// GET /api/analytics/server/:guildId
router.get('/server/:guildId', authMiddleware, async (req, res) => {
  try {
    const { guildId } = req.params
    const { period = '7d' } = req.query
    
    const days = period === '30d' ? 30 : 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Message count
    const messageCount = await MessageModel.countDocuments({
      guild_id: guildId,
      timestamp: { $gte: startDate }
    })

    // Active users (from Redis presence)
    const onlineUsers = await redis.scard(`guild:${guildId}:online`)

    // Peak hours
    const hourlyActivity = await MessageModel.aggregate([
      { $match: { guild_id: guildId, timestamp: { $gte: startDate } } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    // Top channels
    const topChannels = await MessageModel.aggregate([
      { $match: { guild_id: guildId, timestamp: { $gte: startDate } } },
      { $group: { _id: '$channel_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    res.json({
      period,
      metrics: {
        totalMessages: messageCount,
        activeUsers: onlineUsers,
        avgMessagesPerDay: Math.round(messageCount / days),
        peakHours: hourlyActivity.map(h => ({ hour: h._id, messages: h.count })),
        topChannels: topChannels.map(c => ({ channelId: c._id, messages: c.count }))
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// GET /api/analytics/bot/:botId
router.get('/bot/:botId', authMiddleware, async (req, res) => {
  try {
    const { botId } = req.params
    
    const commandUsage = await redis.hgetall(`bot:${botId}:commands`)
    const errorCount = await redis.get(`bot:${botId}:errors`) || '0'
    const uptime = await redis.get(`bot:${botId}:uptime`) || '0'

    res.json({
      botId,
      metrics: {
        commandUsage,
        errorCount: parseInt(errorCount),
        uptimeSeconds: parseInt(uptime)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bot analytics' })
  }
})

export default router
