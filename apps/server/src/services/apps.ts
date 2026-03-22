import { prisma } from '../db'
import crypto from 'crypto'
import { logger } from './logger'

export class AppsService {
    private static generateBotToken(): string {
        return `beacon/bot_${crypto.randomBytes(32).toString('hex')}`;
    }

    private static toReadableError(error: any): Error {
        const code = error?.code;
        if (code === 'P2021') {
            return new Error('Application tables are missing in the current database. Run prisma db push or migrations.');
        }
        if (code === 'P2002') {
            return new Error('An application or bot with these values already exists.');
        }
        return error instanceof Error ? error : new Error('Unknown application service error');
    }

    static async getUserApps(ownerId: string) {
        try {
            return await (prisma.application as any).findMany({
                where: { ownerId },
                include: { bot: true }
            })
        } catch (error: any) {
            // Fallback for bootstrap if DB isn't synced yet
            logger.warn('AppsService.getUserApps failed, likely DB sync issue: ' + error.message)
            return []
        }
    }

    static async createApp(ownerId: string, name: string, description?: string) {
        try {
            return await (prisma.application as any).create({
                data: {
                    name,
                    description,
                    ownerId
                },
                include: { bot: true }
            })
        } catch (error) {
            throw AppsService.toReadableError(error)
        }
    }

    static async getApp(id: string) {
        return (prisma.application as any).findUnique({
            where: { id },
            include: { bot: true }
        })
    }

    static async createBot(applicationId: string) {
        const token = AppsService.generateBotToken()

        try {
            const app = await prisma.application.findUnique({
                where: { id: applicationId },
                include: { bot: true }
            })
            if (!app) throw new Error('Application not found')

            // If bot already exists, just regenerate token
            if (app.bot) {
                return prisma.bot.update({
                    where: { applicationId },
                    data: { token }
                })
            }

            // Generate discriminator
            let discriminator = Math.floor(1000 + Math.random() * 9000).toString()
            let isUnique = false
            while (!isUnique) {
                const exists = await prisma.user.findUnique({
                    where: { username_discriminator: { username: app.name.slice(0, 32), discriminator } }
                })
                if (!exists) isUnique = true
                else discriminator = Math.floor(1000 + Math.random() * 9000).toString()
            }

            // Create the backing user for the bot
            const botUser = await prisma.user.create({
                data: {
                    email: `bot_${app.id}@beacon-bot.internal`,
                    username: app.name.slice(0, 32),
                    displayName: app.name,
                    password: crypto.randomBytes(16).toString('hex'),
                    discriminator,
                    bot: true,
                    avatar: app.icon
                }
            })

            return prisma.bot.create({
                data: {
                    applicationId,
                    token,
                    userId: botUser.id
                }
            });
        } catch (error) {
            throw AppsService.toReadableError(error)
        }
    }

    static async deleteBot(applicationId: string) {
        const bot = await prisma.bot.findUnique({
            where: { applicationId }
        })
        if (!bot) throw new Error('Bot not found')

        // Clean up backing user and bot record
        return await prisma.$transaction([
            prisma.bot.delete({ where: { applicationId } }),
            prisma.user.delete({ where: { id: bot.userId } })
        ])
    }

    static async regenerateBotToken(applicationId: string) {
        const token = AppsService.generateBotToken()
        return await prisma.bot.update({
            where: { applicationId },
            data: { token }
        })
    }

    static async updateBot(applicationId: string, data: { name?: string; avatar?: string }) {
        const bot = await prisma.bot.findUnique({
            where: { applicationId }
        })
        if (!bot) throw new Error('Bot not found')

        // Update the backing user details
        return await prisma.user.update({
            where: { id: bot.userId },
            data: {
                username: data.name ? data.name.slice(0, 32) : undefined,
                displayName: data.name,
                avatar: data.avatar
            }
        })
    }

    static async deleteApp(id: string, userId: string) {
        const app = await prisma.application.findUnique({
            where: { id },
            include: { bot: true }
        })
        if (!app) throw new Error('Application not found')
        if (app.ownerId !== userId) throw new Error('Unauthorized')

        // Clean up bot + application
        return await prisma.$transaction(async (tx) => {
            if (app.bot) {
                await tx.bot.delete({ where: { applicationId: id } })
                await tx.user.delete({ where: { id: app.bot.userId } })
            }
            return await tx.application.delete({ where: { id } })
        })
    }

    static async addBotToGuild(botUserId: string, guildId: string) {
        // 1. Check if bot exists
        const botUser = await prisma.user.findUnique({ where: { id: botUserId, bot: true } });
        if (!botUser) throw new Error('Bot not found');

        // 2. Check if guild exists
        const guild = await prisma.guild.findUnique({ where: { id: guildId } });
        if (!guild) throw new Error('Guild not found');

        // 3. Check if already a member
        const existing = await prisma.guildMember.findUnique({
            where: { userId_guildId: { userId: botUserId, guildId } }
        });
        if (existing) return existing;

        // 4. Create membership
        return await prisma.guildMember.create({
            data: {
                guildId,
                userId: botUserId,
                nickname: botUser.displayName
            }
        });
    }
}
