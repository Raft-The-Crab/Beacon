import { Router, Response } from 'express'
import { authenticate as requireAuth, AuthRequest } from '../middleware/auth'
import { prisma as db } from '../db'
import { PremiumTier, BeacoinTxType } from '@prisma/client'

const router = Router()

// GET /users/@me/beacoin — get balance + transactions
router.get('/users/@me/beacoin', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    // Upsert wallet
    let wallet = await db.beacoinWallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await db.beacoinWallet.create({
        data: { userId, balance: 100 }, // 100 coins welcome bonus
      })
    }

    const transactions = await db.beacoinTransaction.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = transactions.map((t) => ({
      id: t.id,
      type: t.fromUserId === userId ? (t.type === 'EARN' ? 'earn' : 'transfer_out') : 'transfer_in',
      amount: t.amount,
      description: t.reason || (t.fromUserId === userId ? `Sent to ${t.toUserId}` : `From ${t.fromUserId}`),
      timestamp: t.createdAt,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId,
    }))

    res.json({ balance: wallet.balance, transactions: formatted })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/send — transfer coins
router.post('/users/@me/beacoin/send', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const fromUserId = req.user?.id
    if (!fromUserId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    const { toUserId, amount, note } = req.body

    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer parameters' })
    }

    const fromWallet = await db.beacoinWallet.findUnique({ where: { userId: fromUserId } })
    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    // Find recipient — by userId or username
    let toUser = await db.user.findUnique({ where: { id: toUserId } })
    if (!toUser) {
      toUser = await db.user.findFirst({ where: { username: toUserId } })
    }
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Upsert recipient wallet
    await db.beacoinWallet.upsert({
      where: { userId: toUser.id },
      create: { userId: toUser.id, balance: amount },
      update: { balance: { increment: amount } },
    })

    // Deduct from sender
    await db.beacoinWallet.update({
      where: { userId: fromUserId },
      data: { balance: { decrement: amount } },
    })

    // Create transaction record
    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: fromWallet.id,
        fromUserId,
        toUserId: toUser.id,
        amount,
        type: 'TRANSFER' as BeacoinTxType,
        reason: note || `Transfer to ${toUser.username}`,
      },
    })

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: 'TRANSFER_OUT',
        amount,
        description: transaction.reason,
        timestamp: transaction.createdAt,
        toUserId: toUser.id,
        toUsername: toUser.username,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/subscribe — purchase Beacon+ with Beacoins
router.post('/users/@me/beacoin/subscribe', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    const { tier, couponCode } = req.body

    if (!['monthly', 'yearly'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be monthly or yearly.' })
    }

    let cost = tier === 'yearly' ? 10000 : 1000

    if (couponCode && typeof couponCode === 'string') {
      let hash = 0
      for (let i = 0; i < couponCode.length; i++) {
        hash = Math.imul(31, hash) + couponCode.charCodeAt(i) | 0
      }
      const discount = Math.abs(hash) % 100
      cost = Math.floor(cost * (1 - discount / 100))
    }

    const wallet = await db.beacoinWallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < cost) {
      return res.status(400).json({ error: 'Insufficient Beacoins' })
    }

    // Deduct coins
    await db.beacoinWallet.update({
      where: { userId },
      data: { balance: { decrement: cost } },
    })

    // Record transaction
    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: wallet.id,
        fromUserId: userId,
        toUserId: userId,
        amount: cost,
        type: 'SPEND' as BeacoinTxType,
        reason: `Beacon+ ${tier} subscription`,
      },
    })

    // Update user to mark as Beacon+ subscriber
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + (tier === 'yearly' ? 12 : 1))

    await db.user.update({
      where: { id: userId },
      data: {
        isBeaconPlus: true,
        beaconPlusSince: new Date(),
      },
    })

    // Upsert UserPremium
    await db.userPremium.upsert({
      where: { userId },
      create: {
        userId,
        tier: PremiumTier.PREMIUM,
        expiresAt,
        purchasedWith: cost,
      },
      update: {
        tier: PremiumTier.PREMIUM,
        expiresAt,
        purchasedWith: cost,
      }
    })

    res.json({
      success: true,
      cost,
      expiresAt,
      transaction: {
        id: transaction.id,
        type: 'spend',
        amount: cost,
        description: transaction.reason,
        timestamp: transaction.createdAt,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
