import { Router, Response } from 'express';
import { ActivityService } from '../services/activity.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /activities
 * @desc    Update current user activities (Spotify, Gaming)
 * @access  Private
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { activities } = req.body;

    if (!Array.isArray(activities)) {
        return res.status(400).json({ error: 'Activities must be an array' });
    }

    await ActivityService.updateActivities(userId, activities);
    res.json({ success: true });
});

/**
 * @route   POST /activities/batch
 * @desc    Get activities for a list of users
 * @access  Private
 */
router.post('/batch', authenticate, async (req: AuthRequest, res: Response) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: 'UserIds must be an array' });
    }

    const activities = await ActivityService.getBatchActivities(userIds);
    res.json(activities);
});

export default router;
