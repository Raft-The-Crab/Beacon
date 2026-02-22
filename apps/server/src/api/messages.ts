import { Router, Request, Response } from 'express'
import { MessageModel } from '../db'
import { authMiddleware } from '../middleware/auth'
import { sanitizeMessage } from '../utils/sanitize'
import type { PaginatedResponse, MessageSearchQuery } from '@beacon/types'

const router = Router()

// GET /api/messages/:channelId - Paginated messages
router.get('/:channelId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const before = req.query.before as string // Message ID
    const after = req.query.after as string

    const query: any = { channel_id: channelId }
    
    if (before) {
      const beforeMsg = await MessageModel.findOne({ id: before })
      if (beforeMsg) {
        query.timestamp = { $lt: beforeMsg.timestamp }
      }
    } else if (after) {
      const afterMsg = await MessageModel.findOne({ id: after })
      if (afterMsg) {
        query.timestamp = { $gt: afterMsg.timestamp }
      }
    }

    const messages = await MessageModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()

    const total = await MessageModel.countDocuments({ channel_id: channelId })

    const response: PaginatedResponse<any> = {
      items: messages.reverse(), // Oldest first
      page: 0,
      limit,
      total,
      hasMore: messages.length === limit
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/messages/search - Search messages
router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query: MessageSearchQuery = req.body
    const limit = Math.min(query.limit || 50, 100)
    const offset = query.offset || 0

    const mongoQuery: any = {}

    if (query.content) {
      mongoQuery.$text = { $search: sanitizeMessage(query.content) }
    }

    if (query.authorId) {
      mongoQuery['author.id'] = query.authorId
    }

    if (query.channelId) {
      mongoQuery.channel_id = query.channelId
    }

    if (query.guildId) {
      mongoQuery.guild_id = query.guildId
    }

    if (query.before) {
      const beforeMsg = await MessageModel.findOne({ id: query.before })
      if (beforeMsg) {
        mongoQuery.timestamp = { ...mongoQuery.timestamp, $lt: beforeMsg.timestamp }
      }
    }

    if (query.after) {
      const afterMsg = await MessageModel.findOne({ id: query.after })
      if (afterMsg) {
        mongoQuery.timestamp = { ...mongoQuery.timestamp, $gt: afterMsg.timestamp }
      }
    }

    const messages = await MessageModel
      .find(mongoQuery)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    const total = await MessageModel.countDocuments(mongoQuery)

    res.json({
      messages,
      total,
      hasMore: offset + messages.length < total
    })
  } catch (error) {
    console.error('Error searching messages:', error)
    res.status(500).json({ error: 'Failed to search messages' })
  }
})

export default router
