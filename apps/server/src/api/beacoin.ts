import { Router } from 'express'
import { authenticate as requireAuth } from '../middleware/auth'
import { prisma as db } from '../db'

const router = Router()

// GET /users/@me/beacoin — get balance + transactions
router.get('/users/@me/beacoin', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id

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

    const formatted = transactions.map((t: any) => ({
      id: t.id,
      type: t.fromUserId === userId ? (t.type === 'earn' ? 'earn' : 'transfer_out') : 'transfer_in',
      amount: t.amount,
      description: t.description || (t.fromUserId === userId ? `Sent to ${t.toUserId}` : `From ${t.fromUserId}`),
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
router.post('/users/@me/beacoin/send', requireAuth, async (req: any, res) => {
  try {
    const fromUserId = req.user.id
    const { toUserId, amount, note } = req.body

    if (!toUserId || !amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid transfer parameters' })
      return
    }

    const fromWallet = await db.beacoinWallet.findUnique({ where: { userId: fromUserId } })
    if (!fromWallet || fromWallet.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance' })
      return
    }

    // Find recipient — by userId or username
    let toUser = await db.user.findUnique({ where: { id: toUserId } })
    if (!toUser) {
      toUser = await db.user.findFirst({ where: { username: toUserId } })
    }
    if (!toUser) {
      res.status(404).json({ error: 'User not found' })
      return
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
        type: 'TRANSFER',
        description: note || `Transfer to ${toUser.username}`,
      } as any,
    }) as any

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        // @ts-ignore
        type: 'TRANSFER_OUT',
        amount,
        description: transaction.description,
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
router.post('/users/@me/beacoin/subscribe', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id
    const { tier } = req.body

    if (!['monthly', 'yearly'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier. Must be monthly or yearly.' })
      return
    }

    const cost = tier === 'yearly' ? 10000 : 1000

    const wallet = await db.beacoinWallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < cost) {
      res.status(400).json({ error: 'Insufficient Beacoins' })
      return
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
        type: 'SPEND',
        description: `Beacon+ ${tier} subscription`,
      } as any,
    }) as any

    // Update user to mark as Beacon+ subscriber (store tier + expiry in user metadata)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + (tier === 'yearly' ? 12 : 1))

    await db.user.update({
      where: { id: userId },
      data: {
        // @ts-ignore - beaconPlus fields added via schema migration
        beaconPlusTier: tier,
        beaconPlusExpiresAt: expiresAt,
      },
    }).catch(() => {
      // graceful fallback if schema not yet migrated
    })

    res.json({
      success: true,
      cost,
      expiresAt,
      transaction: {
        id: transaction.id,
        type: 'spend',
        amount: cost,
        description: transaction.description,
        timestamp: transaction.createdAt,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
