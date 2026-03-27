import { SlashCommand } from './bots.js';
import { prisma } from '../db';
import { Permissions } from '../utils/permissions';
import { AuditLogAction } from '../services/auditLog';
import { logger } from '../services/logger';

export const SystemCommands: SlashCommand[] = [
    {
        name: 'warn',
        description: 'Warn a user in the server',
        guildOnly: true,
        requiredPermissions: [Permissions.MANAGE_SERVER],
        options: [
            { name: 'user', description: 'User to warn', type: 'user', required: true },
            { name: 'reason', description: 'Reason for warning', type: 'string' }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;
            const reason = args.reason || 'No reason provided';

            await (prisma as any).auditLog.create({
                data: {
                    guildId,
                    userId: ctx.userId,
                    action: AuditLogAction.MEMBER_WARN,
                    targetId,
                    reason,
                }
            });

            return {
                content: `🔨 <@${ctx.userId}> has warned <@${targetId}> for: *${reason}*`,
            };
        }
    },
    {
        name: 'timeout',
        description: 'Timeout a member',
        guildOnly: true,
        requiredPermissions: [Permissions.MANAGE_SERVER],
        options: [
            { name: 'user', description: 'User to timeout', type: 'user', required: true },
            { name: 'duration', description: 'Duration in minutes', type: 'integer', required: true },
            { name: 'reason', description: 'Reason for timeout', type: 'string' }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;
            const durationMinutes = Number(args.duration);
            const reason = args.reason || 'No reason provided';
            
            const until = new Date(Date.now() + durationMinutes * 60 * 1000);

            await prisma.guildMember.update({
                where: { userId_guildId: { userId: targetId, guildId } },
                data: { communicationDisabledUntil: until }
            });

            await (prisma as any).auditLog.create({
                data: {
                    guildId,
                    userId: ctx.userId,
                    action: AuditLogAction.MEMBER_TIMEOUT,
                    targetId,
                    reason: `${reason} (${durationMinutes}m)`,
                }
            });

            return {
                content: `⏳ <@${targetId}> has been timed out for ${durationMinutes} minutes by <@${ctx.userId}>.\nReason: *${reason}*`,
            };
        }
    },
    {
        name: 'kick',
        description: 'Kick a member from the server',
        guildOnly: true,
        requiredPermissions: [Permissions.KICK_MEMBERS],
        options: [
            { name: 'user', description: 'User to kick', type: 'user', required: true },
            { name: 'reason', description: 'Reason for kick', type: 'string' }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;
            const reason = args.reason || 'No reason provided';

            await prisma.guildMember.delete({
                where: { userId_guildId: { userId: targetId, guildId } }
            });

            await (prisma as any).auditLog.create({
                data: {
                    guildId,
                    userId: ctx.userId,
                    action: AuditLogAction.MEMBER_KICK,
                    targetId,
                    reason,
                }
            });

            return {
                content: `👞 <@${targetId}> has been kicked by <@${ctx.userId}>.\nReason: *${reason}*`,
            };
        }
    },
    {
        name: 'ban',
        description: 'Ban a member from the server',
        guildOnly: true,
        requiredPermissions: [Permissions.BAN_MEMBERS],
        options: [
            { name: 'user', description: 'User to ban', type: 'user', required: true },
            { name: 'reason', description: 'Reason for ban', type: 'string' }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;
            const reason = args.reason || 'No reason provided';

            await prisma.$transaction([
                prisma.guildBan.create({
                    data: { guildId, userId: targetId, reason, moderatorId: ctx.userId }
                }),
                prisma.guildMember.deleteMany({
                    where: { userId: targetId, guildId }
                })
            ]);

            await (prisma as any).auditLog.create({
                data: {
                    guildId,
                    userId: ctx.userId,
                    action: AuditLogAction.MEMBER_BAN,
                    targetId,
                    reason,
                }
            });

            return {
                content: `🚫 <@${targetId}> has been permanently banned by <@${ctx.userId}>.\nReason: *${reason}*`,
            };
        }
    },
    {
        name: 'mute',
        description: 'Mute a member (server-wide)',
        guildOnly: true,
        requiredPermissions: [Permissions.MANAGE_SERVER],
        options: [
            { name: 'user', description: 'User to mute', type: 'user', required: true },
            { name: 'reason', description: 'Reason for mute', type: 'string' }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;
            
            await prisma.guildMember.update({
                where: { userId_guildId: { userId: targetId, guildId } },
                data: { mute: true }
            });

            return {
                content: `🔇 <@${targetId}> has been muted by <@${ctx.userId}>.`,
            };
        }
    },
    {
        name: 'unmute',
        description: 'Unmute a member',
        guildOnly: true,
        requiredPermissions: [Permissions.MANAGE_SERVER],
        options: [
            { name: 'user', description: 'User to unmute', type: 'user', required: true }
        ],
        handler: async (args, ctx) => {
            const guildId = ctx.guildId!;
            const targetId = args.user;

            await prisma.guildMember.update({
                where: { userId_guildId: { userId: targetId, guildId } },
                data: { mute: false }
            });

            return {
                content: `🔊 <@${targetId}> has been unmuted by <@${ctx.userId}>.`,
            };
        }
    }
];
