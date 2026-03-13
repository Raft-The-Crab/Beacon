import { Response } from 'express'
import { prisma as db } from '../db'
import { AuthRequest } from '../middleware/auth'
import { BeacoinTxType } from '@prisma/client'

export const getQuests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        if (!db) return res.status(500).json({ error: 'Database not connected' })

        // Validate user actually exists in DB
        const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
        if (!userExists) {
            return res.json([])
        }

        let userQuests = await db.userQuest.findMany({
            where: { userId },
            include: { quest: true }
        })

        if (userQuests.length === 0) {
            const allQuests = await db.quest.findMany({ take: 3 })
            if (allQuests.length > 0) {
                await db.userQuest.createMany({
                    data: allQuests.map(q => ({
                        userId,
                        questId: q.id,
                        progress: 0,
                        completed: false,
                        claimed: false
                    }))
                })
                userQuests = await db.userQuest.findMany({
                    where: { userId },
                    include: { quest: true }
                })
            }
        }

        res.json(userQuests)
    } catch (err) {
        console.error('[QuestController] getQuests error:', err)
        res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) })
    }
}

export const claimReward = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        const { questId } = req.body

        const uq = await db.userQuest.findUnique({
            where: { userId_questId: { userId, questId } },
            include: { quest: true }
        })

        if (!uq) return res.status(404).json({ error: 'Quest not found' })
        if (!uq.completed) return res.status(400).json({ error: 'Quest not completed' })
        if (uq.claimed) return res.status(400).json({ error: 'Reward already claimed' })

        const wallet = await db.beacoinWallet.findUnique({ where: { userId } })
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

        // Beacon+ users earn base reward plus a 50% bonus.
        const userRecord = await db.user.findUnique({ where: { id: userId }, select: { isBeaconPlus: true } })
        const bonusRate = userRecord?.isBeaconPlus ? 0.5 : 0
        const finalReward = Math.floor(uq.quest.reward * (1 + bonusRate))

        await db.$transaction([
            db.userQuest.update({
                where: { id: uq.id },
                data: { claimed: true }
            }),
            db.beacoinWallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: finalReward } }
            }),
            db.beacoinTransaction.create({
                data: {
                    walletId: wallet.id,
                    fromUserId: userId,
                    type: BeacoinTxType.EARN,
                    amount: finalReward,
                    reason: `Quest reward: ${uq.quest.title}${userRecord?.isBeaconPlus ? ' (+50% Beacon+ bonus)' : ''}`
                }
            })
        ])

        res.json({ success: true, reward: finalReward, baseReward: uq.quest.reward, bonusRate, totalMultiplier: 1 + bonusRate })
    } catch (err) {
        console.error('[QuestController] claimReward error:', err)
        res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) })
    }
}

export const updateProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!db) return res.status(500).json({ error: 'Database not connected' });
        const { type, amount = 1 } = req.body

        const userQuests = await db.userQuest.findMany({
            where: { userId, completed: false, quest: { type } },
            include: { quest: true }
        })

        const updates = userQuests.map(uq => {
            const newProgress = Math.min(uq.quest.total, uq.progress + amount)
            const completed = newProgress >= uq.quest.total
            return db.userQuest.update({
                where: { id: uq.id },
                data: { progress: newProgress, completed }
            })
        })

        await db.$transaction(updates)
        res.json({ success: true, updated: updates.length })
    } catch (err) {
        console.error('[QuestController] updateProgress error:', err)
        res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) })
    }
}
