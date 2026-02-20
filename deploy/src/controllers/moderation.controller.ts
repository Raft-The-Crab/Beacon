import { Request, Response } from 'express'
import { ModerationReportModel } from '../db'
import { prisma } from '../db'

export class ModerationController {
    /**
     * List all moderation reports (Admin only)
     */
    static async listReports(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id
            // Check if user is global admin (basic check for now)
            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user || user.email !== 'admin@beacon.app') {
                // return res.status(403).json({ error: 'Admin only' })
                // For now, let's allow access for testing if developerMode is on
                if (!user?.developerMode) return res.status(403).json({ error: 'Admin only' })
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
}
