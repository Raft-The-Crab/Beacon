import { Router } from 'express'
import authRouter from './auth'
import usersRouter from './users'
import guildsRouter from './guilds'
import channelsRouter from './channels'
import friendsRouter from './friends'
import dmRouter from './directMessages'
import folderRouter from './folders'
import webhookRouter from './webhooks'
import auditLogRouter from './auditLogs'
import beacoinRouter from './beacoin'
import notificationsRouter from './notifications'
import moderationRouter from './moderation'
import aiRouter from './ai'
import analyticsRouter from './analytics'
import videoModerationRouter from './videoModeration'
import appsRouter from './apps'
import shopRouter from './shop'
import interactionsRouter from './interactions'
import questRouter from './quests'
import giftingRouter from './gifting'
import gifsRouter from './gifs'
import activityRouter from '../routes/activity.routes'
import notesRouter from './notes'
import uploadRouter from '../routes/upload.routes'
import { authenticate } from '../middleware/auth'
import { isSovereign } from '../middleware/sovereign'
import { generateCSRFToken } from '../middleware/security'

const router = Router()

router.get('/version', (req, res) => {
  res.json({ version: '2.0.0', codename: 'Beacon V2', status: 'healthy', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() })
})

router.get('/test-email', async (req, res) => {
  const email = req.query.to as string || process.env.EMAIL_USER || process.env.SMTP_USER;
  if (!email) return res.status(400).json({ error: 'No recipient email provided' });

  const { NotificationService } = await import('../services/notification');
  const success = await NotificationService.sendVerificationCode(email, 'TEST-1234');
  
  if (success) {
    res.json({ success: true, message: `Test email sent to ${email}. Check your inbox and backend logs.` });
  } else {
    res.status(500).json({ success: false, error: 'Failed to send test email. Check backend logs for SMTP errors.' });
  }
});

router.get('/csrf-token', (req, res) => {
  const token = generateCSRFToken()
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1'
   const isProduction = process.env.NODE_ENV === 'production'
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // Support cross-domain cookies in production
    maxAge: 3600000,
    path: '/'
  })
  res.json({ token })
})

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/guilds', guildsRouter)
router.use('/channels', channelsRouter)
router.use('/friends', friendsRouter)
router.use('/dms', dmRouter)
router.use('/folders', folderRouter)
router.use('/beacoin', beacoinRouter)
router.use('/', beacoinRouter) // Fallback for legacy /users/@me/beacoin
router.use('/', notificationsRouter)
router.use('/moderation', moderationRouter)
router.use('/ai', aiRouter)
router.use('/moderation/video', videoModerationRouter)
router.use('/apps', appsRouter)
router.use('/analytics', analyticsRouter)
router.use('/applications', appsRouter) // Alias for SDK compatibility
router.use('/shop', shopRouter)
router.use('/interactions', interactionsRouter)
router.use('/quests', questRouter)
router.use('/gifting', giftingRouter)
router.use('/gifs', gifsRouter)
router.use('/activities', activityRouter)
router.use('/notes', notesRouter)
router.use('/upload', uploadRouter)

export default router

