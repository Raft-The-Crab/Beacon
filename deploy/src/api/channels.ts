/**
 * Channels API — text channels, voice channels, slowmode, pins, reactions
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
  updateChannel,
  deleteChannel,
  createChannelInvite,
  getChannelInvites,
} from '../controllers/channel.controller';

const router = Router();

// All routes require auth
router.use(authenticate);

// ─── Channel CRUD ─────────────────────────────────────────────
router.get('/:channelId', getChannel);
router.patch('/:channelId', updateChannel);
router.delete('/:channelId', deleteChannel);

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
router.post('/:channelId/typing', authenticate, async (req, res) => {
  const userId = (req as any).user?.id;
  const { channelId } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { getIO } = await import('../ws');
    const io = getIO();
    io.to(`channel:${channelId}`).emit('TYPING_START', {
      channelId,
      userId,
      timestamp: Date.now(),
    });
    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
});

export default router;
