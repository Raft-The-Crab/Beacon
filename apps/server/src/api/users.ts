/**
 * Users API — profile, settings, custom status, friends
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe, getUser, getMyGuilds, getMyFriends, deleteMe, updateE2EEKeys, getE2EEKeys } from '../controllers/user.controller';
import { cacheResponse } from '../middleware/performance';

const router = Router();

router.use(authenticate);

// Current user
router.get('/me', getMe);
router.patch('/me', updateMe);
router.delete('/me', deleteMe);
router.get('/me/guilds', cacheResponse(60), getMyGuilds);
router.get('/me/friends', cacheResponse(60), getMyFriends);
router.patch('/me/e2ee', updateE2EEKeys);

// Other users (public profile)
router.get('/:userId', cacheResponse(300), getUser);
router.get('/:userId/e2ee', cacheResponse(300), getE2EEKeys);

export default router;
