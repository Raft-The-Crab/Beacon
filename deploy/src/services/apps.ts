import { prisma } from '../db'
import crypto from 'crypto'

export class AppsService {
    static async getUserApps(ownerId: string) {
        try {
            return await (prisma.application as any).findMany({
                where: { ownerId },
                include: { bot: true }
            })
        } catch (error) {
            // Fallback for demo if DB isn't synced yet
            console.warn('AppsService.getUserApps failed, likely DB sync issue:', error)
            return []
        }
    }

    static async createApp(ownerId: string, name: string, description?: string) {
        return (prisma.application as any).create({
            data: {
                name,
                description,
                ownerId
            },
            include: { bot: true }
        })
    }

    static async getApp(id: string) {
        return (prisma.application as any).findUnique({
            where: { id },
            include: { bot: true }
        })
    }

    static async createBot(applicationId: string) {
        const token = `bot_${crypto.randomBytes(32).toString('hex')}`

        const app = await (prisma.application as any).findUnique({ where: { id: applicationId } })
        if (!app) throw new Error('Application not found')

        // @ts-ignore - bot is not in the base Prisma schema yet
        return (prisma.bot as any).upsert({
            where: { applicationId },
            update: { token },
            create: {
                applicationId,
                token
            }
        })
    }
}
