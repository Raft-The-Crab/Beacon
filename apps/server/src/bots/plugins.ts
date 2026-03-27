import { prisma } from '../db';
import { logger } from '../services/logger';
import { BaseBot, BotPlugin, BotContext } from './bots.js';
import { musicService } from '../services/music.service';
import { Permissions } from '../utils/permissions';
import { AuditLogAction } from '../services/auditLog';

export class MusicPlugin implements BotPlugin {
    id = 'music';
    name = 'Music Player';

    async onCommand(ctx: BotContext) {
        if (ctx.commandName === 'play') {
            const query = ctx.options?.[0]?.value as string;

            await ctx.respond({
                content: `🔍 **Searching Beacon Music...** \n*Query: ${query}*`,
            });

            const metadata = await musicService.fetchMetadata(query);

            if (metadata) {
                await ctx.respond({
                    content: `🎵 **Now Playing:** [${metadata.title}](${metadata.url})\n**Artist:** ${metadata.artist}\n**Duration:** ${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}\n${metadata.thumbnail ? `![thumbnail](${metadata.thumbnail})` : ''}`,
                });
            } else {
                await ctx.respond({
                    content: `❌ Could not find any results for **${query}**.`,
                });
            }
            return true;
        }
        return false;
    }

    async onMessage(ctx: BotContext) {
        const content = ctx.content || '';
        const isMusicLink = content.includes('spotify.com') || content.includes('youtube.com') || content.includes('youtu.be');

        if (isMusicLink) {
            const metadata = await musicService.fetchMetadata(content);
            if (metadata) {
                await ctx.respond({
                    content: `🎶 **Music Detected:** [${metadata.title}](${metadata.url}) by *${metadata.artist}*\n*Type \`/play\` to listen in a voice channel!*`,
                });
            }
        }
    }
}

export class ModerationPlugin implements BotPlugin {
    id = 'moderation';
    name = 'Auto-Mod Elite';

    onEnable(bot: BaseBot) {
        // Register moderation commands
        bot.registerCommand({
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

                try {
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
                } catch (err) {
                    logger.error('[ModerationPlugin] Warn failed:', err);
                    return { content: '❌ Failed to issue warning.' };
                }
            }
        });

        bot.registerCommand({
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

                try {
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
                } catch (err) {
                    return { content: '❌ Failed to timeout user. Are they in the server?' };
                }
            }
        });

        bot.registerCommand({
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

                try {
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
                } catch (err) {
                    return { content: '❌ Failed to kick user. They might not be in the server.' };
                }
            }
        });

        bot.registerCommand({
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

                try {
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
                } catch (err) {
                    return { content: '❌ Failed to ban user.' };
                }
            }
        });

        bot.registerCommand({
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
                
                try {
                    await prisma.guildMember.update({
                        where: { userId_guildId: { userId: targetId, guildId } },
                        data: { mute: true }
                    });

                    return {
                        content: `🔇 <@${targetId}> has been muted by <@${ctx.userId}>.`,
                    };
                } catch (err) {
                    return { content: '❌ Failed to mute user.' };
                }
            }
        });

        bot.registerCommand({
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

                try {
                    await prisma.guildMember.update({
                        where: { userId_guildId: { userId: targetId, guildId } },
                        data: { mute: false }
                    });

                    return {
                        content: `🔊 <@${targetId}> has been unmuted by <@${ctx.userId}>.`,
                    };
                } catch (err) {
                    return { content: '❌ Failed to unmute user.' };
                }
            }
        });
    }

    async onMessage(ctx: BotContext) {
        const content = ctx.content?.toLowerCase() || '';
        const forbidden = ['badword1', 'badword2']; // Example

        for (const word of forbidden) {
            if (content.includes(word)) {
                await ctx.respond({
                    content: `⚠️ **Moderation:** User <@${ctx.userId}> used forbidden language. Message flagged for review.`,
                });
                break;
            }
        }
    }

    async onCommand(_ctx: BotContext) {
        return false;
    }
}
