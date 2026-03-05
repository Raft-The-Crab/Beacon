import { Request, Response } from 'express'
import { ModerationReportModel } from '../db'
import { prisma } from '../db'

export class ModerationController {
    /**
     * List all moderation reports (Admin only)
     */
    static async listReports(req: Request, res: Response) {
        try {
            const userId = req.user?.id
            if (!userId) return res.status(401).json({ error: 'Unauthorized' })

            // Role-based admin check: user must have 'ADMIN' or 'MODERATOR' badge, or be in developer mode
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { badges: true, developerMode: true }
            })
            if (!user) return res.status(403).json({ error: 'Forbidden' })

            const badges = (user.badges as string[]) || []
            const isAdmin = badges.includes('ADMIN') || badges.includes('MODERATOR') || badges.includes('STAFF')
            if (!isAdmin && !user.developerMode) {
                return res.status(403).json({ error: 'Insufficient permissions. Admin or Moderator role required.' })
            }

            const { status } = req.query
            const filter = status ? { status } : {}

            const reports = await ModerationReportModel.find(filter).sort({ createdAt: -1 }).limit(100)
            res.json(reports)
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reports' })
        }
    }

    /**
     * Resolve a report
     */
    static async resolveReport(req: Request, res: Response) {
        try {
            const { reportId } = req.params
            const { status, actionTaken } = req.body

            const report = await ModerationReportModel.findOneAndUpdate(
                { id: reportId },
                { status, action_taken: actionTaken },
                { new: true }
            )

            if (!report) return res.status(404).json({ error: 'Report not found' })
            res.json(report)
        } catch (error) {
            res.status(500).json({ error: 'Failed to resolve report' })
        }
    }

    /**
     * Create an Automod Rule
     */
    static async createRule(req: Request, res: Response) {
        try {
            const { guildId, name, eventType, triggerType, actions, triggerMetadata, enabled } = req.body;
            const userId = req.user?.id;

            // Validate admin/mod perms to create rule
            // Simplified for now: just mock the DB creation if the prisma table `AutomodRule` doesn't exist
            // Assuming we are storing this as a JSON field in Guild or have a dedicated Prisma model

            // Mock Response for UI wiring until Prisma schema is strictly available
            const mockRule = {
                id: Math.random().toString(36).substring(7),
                guildId,
                name,
                eventType,
                triggerType,
                actions,
                triggerMetadata,
                enabled,
                creatorId: userId
            };

            res.status(201).json(mockRule);
        } catch (error) {
            console.error('[CREATE_RULE_ERROR]', error);
            res.status(500).json({ error: 'Failed to create automod rule' });
        }
    }
}
