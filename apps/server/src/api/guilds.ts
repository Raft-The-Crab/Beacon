import { Router } from 'express'
import { GuildController } from '../controllers/guild.controller'
import { authenticate } from '../middleware/auth'
import { cacheResponse } from '../middleware/performance'

const router = Router()

// Guild CRUD
router.post('/', authenticate, GuildController.createGuild)
router.get('/:id', authenticate, cacheResponse(60), GuildController.getGuild)
router.patch('/:id', authenticate, GuildController.updateGuild)

// Roles
router.post('/:guildId/roles', authenticate, GuildController.createRole)
router.patch('/:guildId/roles/:roleId', authenticate, GuildController.updateRole)
router.delete('/:guildId/roles/:roleId', authenticate, GuildController.deleteRole)

// Invites
router.post('/:guildId/invites', authenticate, GuildController.createInvite)

// Boosting & Vanity
router.post('/:id/boost', authenticate, GuildController.boostGuild)
router.post('/:id/vanity', authenticate, GuildController.updateVanityUrl)

export default router
