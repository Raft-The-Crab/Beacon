import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/google', AuthController.googleLogin)
router.post('/logout', AuthController.logout)
router.post('/verify-mfa', AuthController.verifyMFA)
router.post('/mfa/verify', AuthController.verifyMFA)
router.post('/refresh', AuthController.refresh)
router.post('/verify', AuthController.verify)
router.post('/resend-verification', AuthController.resendVerification)
router.get('/me', authenticate, AuthController.getMe)

// 2FA Routes
router.post('/2fa/setup', authenticate, AuthController.setup2FA)
router.post('/2fa/verify', authenticate, AuthController.verify2FA)
router.post('/2fa/disable', authenticate, AuthController.disable2FA)

// Profile Preview (Public)
router.get('/profile-preview/:identifier', AuthController.getProfilePreview)

// Account Recovery
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', AuthController.resetPassword)

export default router
