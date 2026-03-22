/**
 * Users API — profile, settings, custom status, friends
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe, getUser, getMyGuilds, getMyFriends, deleteMe, updateE2EEKeys, getE2EEKeys, updateEmail, updatePassword, enable2FA, verify2FA, getMutuals, blockUser, unblockUser, getBlockedUsers } from '../controllers/user.controller';
import { cacheResponse } from '../middleware/performance';

const router = Router();

router.use(authenticate);

// Current user
router.get('/me', getMe);
router.patch('/me', updateMe);
router.delete('/me', deleteMe);
router.get('/me/guilds', cacheResponse(60), getMyGuilds);
router.get('/me/friends', getMyFriends);
router.patch('/me/e2ee', updateE2EEKeys);

// Security
router.post('/me/email', updateEmail);
router.post('/me/password', updatePassword);
router.post('/me/2fa/enable', enable2FA);
router.post('/me/2fa/verify', verify2FA);

// Other users (public profile)
router.get('/:userId', cacheResponse(300), getUser);
router.get('/:userId/e2ee', cacheResponse(300), getE2EEKeys);
router.get('/:userId/mutuals', getMutuals);

// Blocking
router.get('/me/blocked', getBlockedUsers);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);

export default router;
