/**
 * Users API — profile, settings, custom status, friends
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe, getUser, getMyGuilds, getMyFriends, deleteMe, updateE2EEKeys, getE2EEKeys } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

// Current user
router.get('/me', getMe);
router.patch('/me', updateMe);
router.delete('/me', deleteMe);
router.get('/me/guilds', getMyGuilds);
router.get('/me/friends', getMyFriends);
router.patch('/me/e2ee', updateE2EEKeys);

// Other users (public profile)
router.get('/:userId', getUser);
router.get('/:userId/e2ee', getE2EEKeys);

export default router;
