import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { getQuests, claimReward, updateProgress } from '../controllers/quest.controller'

const router = Router()

router.use(authenticate)

router.get('/', getQuests)
router.post('/claim', claimReward)
router.post('/progress', updateProgress)

export default router
