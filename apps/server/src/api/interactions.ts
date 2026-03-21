import { Router } from 'express';
import { InteractionController } from '../controllers/interaction.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Endpoint for bot interactions (Slash commands, buttons, modals, autocomplete)
router.post('/', authenticate, InteractionController.handleInteraction);
router.get('/commands', authenticate, InteractionController.getCommands);

// SDK callback endpoint — bots respond to interactions here
// This is analogous to Discord's POST /interactions/:id/:token/callback
router.post('/:id/:token/callback', InteractionController.handleInteractionCallback);

export default router;
