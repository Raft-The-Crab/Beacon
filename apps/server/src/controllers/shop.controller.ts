import { Response } from 'express'
import { prisma } from '../db'
import { AuthRequest } from '../middleware/auth'
import { BeacoinTxType } from '@prisma/client'

export const purchaseCosmetic = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!prisma) return res.status(500).json({ error: 'Database not connected' });
        const { cosmeticId, couponCode } = req.body

        // Fetch item from DB
        const effect = await prisma.profileEffect.findUnique({ where: { id: cosmeticId } })
        const decoration = await prisma.avatarDecoration.findUnique({ where: { id: cosmeticId } })

        if (!effect && !decoration) return res.status(404).json({ error: 'Item not found in shop' })

        let price = (effect?.price || decoration?.price) || 0
        const type = effect ? 'profile' : 'avatar'

        if (couponCode && typeof couponCode === 'string') {
            let hash = 0
            for (let i = 0; i < couponCode.length; i++) {
                hash = Math.imul(31, hash) + couponCode.charCodeAt(i) | 0
            }
            const discount = Math.abs(hash) % 100
            price = Math.floor(price * (1 - discount / 100))
        }

        // Check ownership
        const existing = await prisma.ownedCosmetic.findUnique({
            where: { userId_cosmeticId: { userId, cosmeticId } }
        })
        if (existing) return res.status(400).json({ error: 'You already own this item' })

        // Transaction: check balance, deduct, add cosmetic
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } })
            if (!user) throw new Error('User not found')
            if (user.beacoins < price) throw new Error('Insufficient Beacoins')

            await tx.user.update({
                where: { id: userId },
                data: { beacoins: { decrement: price } }
            })

            const cosmetic = await tx.ownedCosmetic.create({
                data: {
                    userId,
                    cosmeticId,
                    type
                }
            })

            // Optional: Log transaction
            const wallet = await tx.beacoinWallet.findUnique({ where: { userId } })
            await tx.beacoinTransaction.create({
                data: {
                    walletId: wallet?.id || '',
                    fromUserId: userId,
                    type: BeacoinTxType.SPEND,
                    amount: -price,
                    reason: `Purchased cosmetic ${cosmeticId}`
                }
            })

            return cosmetic
        })

        res.json({ success: true, cosmetic: result })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}

export const equipCosmetic = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!prisma) return res.status(500).json({ error: 'Database not connected' });
        const { cosmeticId, type } = req.body // type = 'avatar' | 'profile' | null (to unequip)

        if (!cosmeticId && type) {
            // unequip
            const data = type === 'avatar' ? { avatarDecorationId: null } : { profileEffectId: null }
            await prisma.user.update({ where: { id: userId }, data })
            return res.json({ success: true, message: 'Unequipped' })
        }

        // verify ownership
        const owned = await prisma.ownedCosmetic.findUnique({
            where: { userId_cosmeticId: { userId, cosmeticId } }
        })
        if (!owned) return res.status(403).json({ error: 'You do not own this cosmetic' })

        // Equip
        const data = owned.type === 'avatar' ? { avatarDecorationId: cosmeticId } : { profileEffectId: cosmeticId }
        await prisma.user.update({ where: { id: userId }, data })

        res.json({ success: true, message: 'Equipped successfully', data })
    } catch (err: any) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

export const getMyCosmetics = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!prisma) return res.status(500).json({ error: 'Database not connected' });
        const cosmetics = await prisma.ownedCosmetic.findMany({
            where: { userId },
            orderBy: { purchasedAt: 'desc' }
        })
        res.json(cosmetics)
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}

export const getMarketplace = async (req: AuthRequest, res: Response) => {
    try {
        if (!prisma) return res.status(500).json({ error: 'Database not connected' });
        const effects = await prisma.profileEffect.findMany()
        const decorations = await prisma.avatarDecoration.findMany()
        res.json({ effects, decorations })
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' })
    }
}
