import { Router } from 'express';
import { videoModerationService } from '../services/videoModeration.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/check', authenticate, async (req: any, res: any) => {
    const { videoUrl } = req.body;
    const userId = req.user.id;

    if (!videoUrl) {
        return res.status(400).json({ error: 'videoUrl is required' });
    }

    try {
        // Start moderation asynchronously
        videoModerationService.moderateVideoUrl(videoUrl, userId)
            .then((result: any) => {
                console.log(`[VideoModerationAPI] Async result for ${videoUrl}:`, result.action);
            })
            .catch((err: any) => {
                console.error(`[VideoModerationAPI] Async error for ${videoUrl}:`, err);
            });

        return res.json({ message: 'Video moderation started', status: 'processing' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to start video moderation' });
    }
});

export default router;
