import { Router, Response } from 'express'
import { authenticate as requireAuth, AuthRequest } from '../middleware/auth'
import { prisma as db } from '../db'
import { PremiumTier, BeacoinTxType } from '@prisma/client'
import { applyPercentPromo, getCoinPromoAmount, normalizePromoCode, resolvePromoCode } from '../lib/promoCodes'

const router = Router()

function isDailyRewardReason(reason?: string | null) {
  return typeof reason === 'string' && reason.toLowerCase().startsWith('daily check-in reward')
}

function toUtcDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}

function calculateDailyClaimState(transactions: Array<{ createdAt: Date; reason: string }>) {
  const uniqueDates = Array.from(
    new Set(
      transactions
        .filter((entry) => isDailyRewardReason(entry.reason))
        .map((entry) => toUtcDateKey(entry.createdAt))
    )
  ).sort((left, right) => right.localeCompare(left))

  if (uniqueDates.length === 0) {
    return { streak: 0, lastDailyClaim: null as string | null }
  }

  let streak = 1
  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = new Date(`${uniqueDates[index - 1]}T00:00:00.000Z`)
    const current = new Date(`${uniqueDates[index]}T00:00:00.000Z`)
    const deltaDays = Math.round((previous.getTime() - current.getTime()) / 86400000)
    if (deltaDays !== 1) break
    streak += 1
  }

  return {
    streak,
    lastDailyClaim: `${uniqueDates[0]}T00:00:00.000Z`,
  }
}

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

    const dailyTransactions = await db.beacoinTransaction.findMany({
      where: {
        walletId: wallet.id,
        reason: { startsWith: 'Daily check-in reward' },
      },
      orderBy: { createdAt: 'desc' },
      take: 365,
      select: { createdAt: true, reason: true },
    })

    const dailyState = calculateDailyClaimState(dailyTransactions)

    const formatted = transactions.map((t) => ({
      id: t.id,
      type: t.fromUserId === userId ? (t.type === 'EARN' ? 'earn' : 'transfer_out') : 'transfer_in',
      amount: t.amount,
      description: t.reason || (t.fromUserId === userId ? `Sent to ${t.toUserId}` : `From ${t.fromUserId}`),
      timestamp: t.createdAt,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId,
    }))

    res.json({
      balance: wallet.balance,
      transactions: formatted,
      streak: dailyState.streak,
      lastDailyClaim: dailyState.lastDailyClaim,
    })
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

    const baseCost = tier === 'yearly' ? 10000 : 1250
    const promoResult = applyPercentPromo(baseCost, couponCode)
    const cost = promoResult.cost

    const wallet = await db.beacoinWallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < cost) {
      return res.status(400).json({ error: 'Insufficient Beacoins' })
    }

    // Check if user already has an active subscription
    const currentPremium = await db.userPremium.findUnique({ where: { userId } })
    const now = new Date()
    const activeSubscription = currentPremium?.expiresAt && currentPremium.expiresAt > now

    // Determine new expiration
    const startFrom = activeSubscription ? new Date(currentPremium.expiresAt) : new Date()
    const expiresAt = new Date(startFrom)
    expiresAt.setMonth(expiresAt.getMonth() + (tier === 'yearly' ? 12 : 1))

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
      appliedCoupon: promoResult.code,
      discountPercent: promoResult.discountPercent,
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

// POST /users/@me/beacoin/redeem — redeem a one-time Beacoin promo code
router.post('/users/@me/beacoin/redeem', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    const rawCode = req.body?.code
    const normalizedCode = normalizePromoCode(rawCode)
    if (!normalizedCode) {
      return res.status(400).json({ error: 'Promo code is required' })
    }

    const promo = resolvePromoCode(normalizedCode, 'redeem')
    if (!promo || (promo.benefit.kind !== 'coins' && promo.benefit.kind !== 'beacon_plus')) {
      return res.status(400).json({ error: 'Invalid or unsupported promo code' })
    }

    const wallet = await db.beacoinWallet.upsert({
      where: { userId },
      create: { userId, balance: 100, lifetime: 100 },
      update: {},
    })

    const existing = await db.beacoinTransaction.findFirst({
      where: {
        walletId: wallet.id,
        reason: `Redeemed promo code ${promo.code}`,
      },
      select: { id: true },
    })
    if (existing) {
      return res.status(409).json({ error: 'Promo code already redeemed' })
    }

    if (promo.benefit.kind === 'coins') {
      const coinPromo = getCoinPromoAmount(normalizedCode)
      if (!coinPromo.code || coinPromo.amount <= 0) {
        return res.status(400).json({ error: 'Invalid or unsupported promo code' })
      }

      await db.beacoinWallet.update({
        where: { userId },
        data: {
          balance: { increment: coinPromo.amount },
          lifetime: { increment: coinPromo.amount },
        },
      })

      const transaction = await db.beacoinTransaction.create({
        data: {
          walletId: wallet.id,
          type: BeacoinTxType.EARN,
          amount: coinPromo.amount,
          reason: `Redeemed promo code ${coinPromo.code}`,
          fromUserId: userId,
          toUserId: userId,
          meta: { code: coinPromo.code, kind: 'coins' },
        },
      })

      return res.json({
        success: true,
        code: coinPromo.code,
        amount: coinPromo.amount,
        reward: {
          kind: 'coins',
          amount: coinPromo.amount,
        },
        transaction: {
          id: transaction.id,
          type: 'earn',
          amount: transaction.amount,
          description: transaction.reason,
          timestamp: transaction.createdAt,
        },
      })
    }

    const months = Math.max(1, Math.min(12, Math.floor(promo.benefit.value)))
    const now = new Date()
    const currentPremium = await db.userPremium.findUnique({ where: { userId } })
    const effectiveStart = currentPremium?.expiresAt && currentPremium.expiresAt > now ? currentPremium.expiresAt : now
    const expiresAt = new Date(effectiveStart)
    expiresAt.setMonth(expiresAt.getMonth() + months)

    await db.user.update({
      where: { id: userId },
      data: {
        isBeaconPlus: true,
        beaconPlusSince: now,
      },
    })

    await db.userPremium.upsert({
      where: { userId },
      create: {
        userId,
        tier: PremiumTier.PREMIUM,
        expiresAt,
        purchasedWith: 0,
      },
      update: {
        tier: PremiumTier.PREMIUM,
        expiresAt,
      },
    })

    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: wallet.id,
        type: BeacoinTxType.EARN,
        amount: 0,
        reason: `Redeemed promo code ${promo.code}`,
        fromUserId: userId,
        toUserId: userId,
        meta: { code: promo.code, kind: 'beacon_plus', months, expiresAt: expiresAt.toISOString() },
      },
    })

    return res.json({
      success: true,
      code: promo.code,
      amount: 0,
      reward: {
        kind: 'beacon_plus',
        months,
        expiresAt,
      },
      transaction: {
        id: transaction.id,
        type: 'earn',
        amount: transaction.amount,
        description: transaction.reason,
        timestamp: transaction.createdAt,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/coupon/validate — validate promo code and return discount metadata
router.post('/users/@me/beacoin/coupon/validate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const code = normalizePromoCode(req.body?.code)
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' })
    }

    const promo = resolvePromoCode(code, 'coupon')
    if (!promo) {
      return res.status(400).json({ error: 'Invalid or expired promo code' })
    }

    res.json({
      success: true,
      code: promo.code,
      kind: promo.benefit.kind,
      value: promo.benefit.value,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/daily — claim daily reward
router.post('/users/@me/beacoin/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    const wallet = await db.beacoinWallet.upsert({
      where: { userId },
      create: { userId, balance: 100, lifetime: 100 },
      update: {},
    })

    const dailyTransactions = await db.beacoinTransaction.findMany({
      where: {
        walletId: wallet.id,
        reason: { startsWith: 'Daily check-in reward' },
      },
      orderBy: { createdAt: 'desc' },
      take: 365,
      select: { createdAt: true, reason: true },
    })

    const dailyState = calculateDailyClaimState(dailyTransactions)
    const todayKey = toUtcDateKey(new Date())
    if (dailyState.lastDailyClaim && toUtcDateKey(dailyState.lastDailyClaim) === todayKey) {
      return res.status(409).json({ error: 'Daily reward already claimed today' })
    }

    const mostRecentClaimKey = dailyState.lastDailyClaim ? toUtcDateKey(dailyState.lastDailyClaim) : null
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const isContinuingStreak = mostRecentClaimKey === toUtcDateKey(yesterday)
    const nextStreak = isContinuingStreak ? dailyState.streak + 1 : 1
    const streakBonus = nextStreak % 7 === 0 ? 25 : 0
    const amount = 50 + streakBonus
    const reason = streakBonus > 0 ? `Daily check-in reward + ${streakBonus} streak bonus` : 'Daily check-in reward'

    await db.beacoinWallet.update({
      where: { userId },
      data: { balance: { increment: amount }, lifetime: { increment: amount } },
    })

    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: wallet.id,
        type: BeacoinTxType.EARN,
        amount,
        reason,
        fromUserId: userId,
        toUserId: userId,
      },
    })

    res.json({ success: true, amount, streak: nextStreak, lastDailyClaim: transaction.createdAt, transaction })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/activity — claim activity milestone reward
router.post('/users/@me/beacoin/activity', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })

    const wallet = await db.beacoinWallet.upsert({
      where: { userId },
      create: { userId, balance: 100, lifetime: 100 },
      update: {},
    })

    const amount = 10

    await db.beacoinWallet.update({
      where: { userId },
      data: { balance: { increment: amount }, lifetime: { increment: amount } },
    })

    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: wallet.id,
        type: BeacoinTxType.EARN,
        amount,
        reason: 'Activity milestone reward',
        fromUserId: userId,
        toUserId: userId,
      },
    })

    res.json({ success: true, amount, transaction })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /users/@me/beacoin/invite — claim invite bonus
router.post('/users/@me/beacoin/invite', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const invitedUserId = req.body?.invitedUserId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    if (!db) return res.status(500).json({ error: 'Database not connected' })
    if (!invitedUserId) return res.status(400).json({ error: 'invitedUserId is required' })

    const wallet = await db.beacoinWallet.upsert({
      where: { userId },
      create: { userId, balance: 100, lifetime: 100 },
      update: {},
    })

    const amount = 25

    await db.beacoinWallet.update({
      where: { userId },
      data: { balance: { increment: amount }, lifetime: { increment: amount } },
    })

    const transaction = await db.beacoinTransaction.create({
      data: {
        walletId: wallet.id,
        type: BeacoinTxType.EARN,
        amount,
        reason: 'Invite bonus reward',
        fromUserId: invitedUserId,
        toUserId: userId,
      },
    })

    res.json({ success: true, amount, transaction })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
