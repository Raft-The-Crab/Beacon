import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const sendGift = async (req: AuthRequest, res: Response) => {
    const { recipientId, cosmeticId, type, message } = req.body;
    const senderId = req.user?.id;

    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
    if (!recipientId || !type) return res.status(400).json({ error: 'Missing parameters' });

    try {
        if (!prisma) throw new Error('Database not connected');

        await prisma.$transaction(async (tx) => {
            // 1. Get sender balance
            const sender = await tx.user.findUnique({ where: { id: senderId } });
            if (!sender) throw new Error('Sender not found');

            let price = 0;
            if (type === 'COSMETIC' && cosmeticId) {
                // Fetch cosmetic price
                const effect = await tx.profileEffect.findUnique({ where: { id: cosmeticId } });
                const decoration = await tx.avatarDecoration.findUnique({ where: { id: cosmeticId } });
                price = (effect?.price || decoration?.price) || 0;
            } else if (type === 'SUBSCRIPTION') {
                price = 999; // Default Beacon+ price
            }

            if (sender.beacoins < price) throw new Error('Insufficient Beacoins');

            // 2. Deduct balance
            await tx.user.update({
                where: { id: senderId },
                data: { beacoins: { decrement: price } }
            });

            // 3. Create gift record
            await tx.gift.create({
                data: {
                    senderId,
                    recipientId,
                    cosmeticId,
                    type,
                    message,
                    claimed: false
                }
            });

            // 4. If cosmetic, add to recipient inventory immediately (Simple version)
            if (type === 'COSMETIC' && cosmeticId) {
                const cosmeticType = (await tx.profileEffect.findUnique({ where: { id: cosmeticId } })) ? 'effect' : 'decoration';
                await tx.ownedCosmetic.create({
                    data: {
                        userId: recipientId,
                        cosmeticId,
                        type: cosmeticType
                    }
                });
            } else if (type === 'SUBSCRIPTION') {
                await tx.user.update({
                    where: { id: recipientId },
                    data: { isBeaconPlus: true, beaconPlusSince: new Date() }
                });
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMyGifts = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!prisma) return res.status(500).json({ error: 'Database not connected' });

    try {
        const gifts = await prisma.gift.findMany({
            where: {
                OR: [{ senderId: userId }, { recipientId: userId }]
            },
            include: {
                sender: { select: { username: true, discriminator: true, avatar: true } },
                recipient: { select: { username: true, discriminator: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(gifts);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
