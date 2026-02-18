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

const router = Router()

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/guilds', guildsRouter)
router.use('/channels', channelsRouter)
router.use('/friends', friendsRouter)
router.use('/dms', dmRouter)
router.use('/folders', folderRouter)
router.use('/webhooks', webhookRouter)
router.use('/audit-logs', auditLogRouter)

export default router

