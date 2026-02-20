import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { moderationService } from '../services/moderation'
import { ModerationController } from '../controllers/moderation.controller'

const router = Router()

// @route   GET /api/moderation/reports
// @desc    List all moderation reports (Admin only)
router.get('/reports', authenticate, ModerationController.listReports)

// @route   PATCH /api/moderation/reports/:reportId
// @desc    Resolve or archive a report
router.patch('/reports/:reportId', authenticate, ModerationController.resolveReport)

// @route   POST /api/moderation/check
// @desc    Manual check of content (Dev tool)
router.post('/check', authenticate, async (req: Request, res: Response) => {
  try {
    const { content, channelId } = req.body
    // @ts-ignore
    const userId = req.user?.id || 'unknown'
    if (!content) return res.status(400).json({ error: 'content required' })
    const { result, action } = await moderationService.checkMessage(content, userId, channelId)
    res.json({ result, action })
  } catch (err) {
    res.status(500).json({ error: 'Moderation check failed' })
  }
})

// @route   GET /api/moderation/offense-count/:userId
// @desc    Get offense history for a user
router.get('/offense-count/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const count = moderationService.getOffenses(userId as string)
    res.json({ userId, offenses: count })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offense count' })
  }
})

export default router
