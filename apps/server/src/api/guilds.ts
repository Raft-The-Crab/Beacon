import { Router } from 'express'
import { GuildController } from '../controllers/guild.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Guild CRUD
router.post('/', authenticate, GuildController.createGuild)
router.get('/:id', authenticate, GuildController.getGuild)
router.patch('/:id', authenticate, GuildController.updateGuild)

// Roles
router.post('/:guildId/roles', authenticate, GuildController.createRole)
router.patch('/:guildId/roles/:roleId', authenticate, GuildController.updateRole)
router.delete('/:guildId/roles/:roleId', authenticate, GuildController.deleteRole)

// Invites
router.post('/:guildId/invites', authenticate, GuildController.createInvite)

export default router
