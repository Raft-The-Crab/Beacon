import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { sendGift, getMyGifts } from '../controllers/gifting.controller'

const router = Router()

router.use(authenticate)

router.post('/send', sendGift)
router.get('/my-gifts', getMyGifts)

export default router
