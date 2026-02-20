import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/mfa/verify', AuthController.verifyMFA)
router.post('/refresh', AuthController.refresh)
router.get('/me', authenticate, AuthController.getMe)

// 2FA Routes
router.post('/2fa/setup', authenticate, AuthController.setup2FA)
router.post('/2fa/verify', authenticate, AuthController.verify2FA)
router.post('/2fa/disable', authenticate, AuthController.disable2FA)

export default router
