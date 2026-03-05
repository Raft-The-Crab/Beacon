import { Router } from 'express'
import { GuildController } from '../controllers/guild.controller'
import { authenticate } from '../middleware/auth'
import { cacheResponse } from '../middleware/performance'
import { requirePermission } from '../middleware/permission'
import { Permissions } from '../utils/permissions'

const router = Router()

// Guild CRUD
router.post('/', authenticate, GuildController.createGuild)
router.get('/me', authenticate, GuildController.getMemberGuilds)
router.get('/discovery', authenticate, cacheResponse(60), GuildController.discoverGuilds)
router.get('/:id', authenticate, cacheResponse(60), GuildController.getGuild)
router.patch('/:id', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.updateGuild)

// Roles
router.post('/:guildId/roles', authenticate, requirePermission(Permissions.MANAGE_ROLES), GuildController.createRole)
router.put('/:guildId/roles/reorder', authenticate, requirePermission(Permissions.MANAGE_ROLES), GuildController.batchReorderRoles)
router.patch('/:guildId/roles/:roleId', authenticate, requirePermission(Permissions.MANAGE_ROLES), GuildController.updateRole)
router.delete('/:guildId/roles/:roleId', authenticate, requirePermission(Permissions.MANAGE_ROLES), GuildController.deleteRole)

// Invites
router.get('/:id/invites', authenticate, GuildController.getInvites)
router.post('/:guildId/invites', authenticate, GuildController.createInvite)
router.delete('/:guildId/invites/:inviteCode', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.deleteInvite)

// Boosting & Vanity
router.post('/:id/boost', authenticate, GuildController.boostGuild)
router.post('/:id/vanity', authenticate, GuildController.updateVanityUrl)

// Sounds
router.post('/:guildId/sounds', authenticate, GuildController.createSound)
router.get('/:guildId/sounds', authenticate, GuildController.getSounds)
router.delete('/:guildId/sounds/:soundId', authenticate, GuildController.deleteSound)

// Members & Moderation
router.get('/:guildId/members', authenticate, GuildController.getMembers)
router.patch('/:guildId/members/:userId', authenticate, GuildController.updateMember)
router.delete('/:guildId/members/:userId/kick', authenticate, requirePermission(Permissions.KICK_MEMBERS), GuildController.kickMember)
router.post('/:guildId/members/:userId/ban', authenticate, requirePermission(Permissions.BAN_MEMBERS), GuildController.banMember)
router.get('/:id/bans', authenticate, requirePermission(Permissions.BAN_MEMBERS), GuildController.getBans)
router.delete('/:id/bans/:userId', authenticate, requirePermission(Permissions.BAN_MEMBERS), GuildController.unbanMember)

// Audit Logs
router.get('/:guildId/audit-logs', authenticate, GuildController.getAuditLogs)

// Webhooks
router.get('/:guildId/webhooks', authenticate, GuildController.getWebhooks)
router.post('/:guildId/webhooks', authenticate, GuildController.createWebhook)
router.patch('/:guildId/webhooks/:webhookId', authenticate, GuildController.updateWebhook)
router.delete('/:guildId/webhooks/:webhookId', authenticate, GuildController.deleteWebhook)

// Emojis
router.get('/:guildId/emojis', authenticate, GuildController.getEmojis)
router.post('/:guildId/emojis', authenticate, GuildController.createEmoji)
router.delete('/:guildId/emojis/:emojiId', authenticate, GuildController.deleteEmoji)

// AutoMod Pro — Pillar IV: The Council
router.get('/:guildId/automod', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.getAutoModRules)
router.post('/:guildId/automod', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.createAutoModRule)
router.patch('/:guildId/automod/:ruleId', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.updateAutoModRule)
router.delete('/:guildId/automod/:ruleId', authenticate, requirePermission(Permissions.MANAGE_SERVER), GuildController.deleteAutoModRule)

export default router

