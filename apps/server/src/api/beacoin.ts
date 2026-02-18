import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'

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
        fromUserId,
        toUserId: toUser.id,
        amount,
        type: 'transfer',
        description: note || `Transfer to ${toUser.username}`,
      },
    })

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: 'transfer_out',
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

export default router
