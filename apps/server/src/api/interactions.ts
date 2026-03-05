import { Router } from 'express';
import { InteractionController } from '../controllers/interaction.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Endpoint for bot interactions (Slash commands, buttons, etc)
router.post('/', authenticate, InteractionController.handleInteraction);
router.get('/commands', authenticate, InteractionController.getCommands);

export default router;
