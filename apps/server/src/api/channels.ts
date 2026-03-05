/**
 * Channels API — text channels, voice channels, slowmode, pins, reactions
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getMessages,
  createMessage,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  addReaction,
  removeReaction,
} from '../controllers/message.controller';
import {
  getChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  createChannelInvite,
  getChannelInvites,
} from '../controllers/channel.controller';
import { requirePermission } from '../middleware/permission';
import { Permissions } from '../utils/permissions';
import { redis } from '../services/redis';

const router = Router();

// All routes require auth
router.use(authenticate);

// ─── Channel CRUD ─────────────────────────────────────────────
router.post('/', requirePermission(Permissions.MANAGE_CHANNELS as any), createChannel);
router.get('/:channelId', getChannel);
router.patch('/:channelId', requirePermission(Permissions.MANAGE_CHANNELS as any), updateChannel);
router.delete('/:channelId', requirePermission(Permissions.MANAGE_CHANNELS as any), deleteChannel);

// ─── Invites ──────────────────────────────────────────────────
router.get('/:channelId/invites', getChannelInvites);
router.post('/:channelId/invites', createChannelInvite);

// ─── Messages ─────────────────────────────────────────────────
router.get('/:channelId/messages', getMessages);
router.post('/:channelId/messages', createMessage);
router.patch('/:channelId/messages/:messageId', editMessage);
router.delete('/:channelId/messages/:messageId', deleteMessage);

// ─── Pins ─────────────────────────────────────────────────────
router.get('/:channelId/pins', getPinnedMessages);
router.put('/:channelId/pins/:messageId', pinMessage);
router.delete('/:channelId/pins/:messageId', unpinMessage);

// ─── Reactions ────────────────────────────────────────────────
router.put('/:channelId/messages/:messageId/reactions/:emoji/@me', addReaction);
router.delete('/:channelId/messages/:messageId/reactions/:emoji/@me', removeReaction);
router.delete('/:channelId/messages/:messageId/reactions/:emoji/:userId', removeReaction);

// ─── Typing indicator ─────────────────────────────────────────
router.post('/:channelId/typing', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { channelId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await redis.publish('gateway:events', JSON.stringify({
      t: 'TYPING_START',
      d: {
        channelId,
        userId,
        timestamp: Date.now(),
      }
    }));
    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
});

export default router;
