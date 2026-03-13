import { prisma } from '../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { validateUsername } from '../middleware/validation'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me'

// Validation schemas
export const RegisterSchema = z.object({
  username: z.string().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(8)
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const BADGE_NORMALIZATION_MAP: Record<string, string> = {
  APP_OWNER: 'owner',
  owner: 'owner',
  SYSTEM_ADMIN: 'admin',
  admin: 'admin',
  PLATFORM_MODERATOR: 'moderator',
  moderator: 'moderator',
  BEACON_PLUS: 'beacon_plus',
  beacon_plus: 'beacon_plus',
  BOT: 'bot',
  bot: 'bot',
  EARLY_SUPPORTER: 'early_supporter',
  early_supporter: 'early_supporter',
  BUG_HUNTER: 'bug_hunter',
  bug_hunter: 'bug_hunter',
  SERVER_OWNER: 'server_owner',
  server_owner: 'server_owner',
  VERIFIED: 'verified',
  verified: 'verified',
}

export function normalizeUserBadges(badges: unknown, isBeaconPlus?: boolean): string[] {
  const normalized = new Set<string>()

  if (Array.isArray(badges)) {
    for (const badge of badges) {
      if (typeof badge !== 'string') continue
      const mapped = BADGE_NORMALIZATION_MAP[badge] || BADGE_NORMALIZATION_MAP[badge.toUpperCase()]
      if (mapped) {
        normalized.add(mapped)
      }
    }
  }

  if (isBeaconPlus) {
    normalized.add('beacon_plus')
  }

  return Array.from(normalized)
}

export class AuthService {
  static async register(data: z.infer<typeof RegisterSchema>) {
    if (!prisma) throw new Error('Database not available')

    const username = data.username.trim()
    const email = data.email.trim().toLowerCase()
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.error || 'Invalid username')
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { username: { equals: username, mode: 'insensitive' } }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email) {
        throw new Error('Email is already registered')
      }

      throw new Error('Username is already taken')
    }

    const roundsStr = process.env.BCRYPT_ROUNDS || '10';
    const parsedRounds = parseInt(roundsStr, 10);
    const rounds = isNaN(parsedRounds) ? 10 : parsedRounds;
    const hashedPassword = await bcrypt.hash(data.password, rounds)

    // Ensure unique discriminator
    let discriminator = Math.floor(1000 + Math.random() * 9000).toString()
    let isUnique = false
    while (!isUnique) {
      const exists = await prisma.user.findUnique({
        where: { username_discriminator: { username, discriminator } }
      })
      if (!exists) isUnique = true
      else discriminator = Math.floor(1000 + Math.random() * 9000).toString()
    }

    // Auto-ascend RaftTheCrab
    let badges: string[] = []
    let isBeaconPlus = false
    if (username.toLowerCase() === 'raftthecrab') {
      badges = ['SYSTEM_ADMIN', 'PLATFORM_MODERATOR', 'APP_OWNER', 'BUG_HUNTER', 'EARLY_SUPPORTER', 'BEACON_PLUS']
      isBeaconPlus = true
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: username,
        password: hashedPassword,
        discriminator,
        badges,
        isBeaconPlus,
        beaconPlusSince: isBeaconPlus ? new Date() : null,
        theme: 'auto',
        developerMode: username.toLowerCase() === 'raftthecrab'
      }
    })

    const accessToken = this.generateToken(user.id)
    const refreshToken = this.generateRefreshToken(user.id)

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    }
  }

  static async login(data: z.infer<typeof LoginSchema>) {
    if (!prisma) throw new Error('Database not available')

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    // Retroactive RaftTheCrab Ascension
    if (user.username === 'RaftTheCrab' && !user.badges.includes('SYSTEM_ADMIN')) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          badges: ['SYSTEM_ADMIN', 'PLATFORM_MODERATOR', 'APP_OWNER', 'BUG_HUNTER', 'EARLY_SUPPORTER', 'BEACON_PLUS'],
          isBeaconPlus: true,
          beaconPlusSince: new Date(),
          developerMode: true
        }
      })
      user.badges = ['SYSTEM_ADMIN', 'PLATFORM_MODERATOR', 'APP_OWNER', 'BUG_HUNTER', 'EARLY_SUPPORTER', 'BEACON_PLUS']
      user.isBeaconPlus = true
    }

    // Check for 2FA
    if ((user as any).twoFactorEnabled) {
      return {
        mfaRequired: true,
        userId: user.id
      }
    }

    const accessToken = this.generateToken(user.id)
    const refreshToken = this.generateRefreshToken(user.id)

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    }
  }

  static generateRefreshToken(userId: string) {
    return jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' })
  }

  static generateToken(userId: string) {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
  }

  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string }
    } catch (err) {
      return null
    }
  }

  static verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string, type: 'refresh' }
    } catch (err) {
      return null
    }
  }

  static sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...safeUser } = user
    return {
      ...safeUser,
      badges: normalizeUserBadges(safeUser.badges, safeUser.isBeaconPlus),
    }
  }

  static async verifyMFA(userId: string, token: string) {
    if (!prisma) throw new Error('Database not available')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !(user as any).twoFactorSecret) {
      throw new Error('2FA not enabled')
    }

    const { TwoFactorService } = await import('../services/twoFactor')
    const isValid = TwoFactorService.verifyToken((user as any).twoFactorSecret, token)

    if (!isValid) {
      throw new Error('Invalid 2FA token')
    }

    const accessToken = this.generateToken(user.id)
    const refreshToken = this.generateRefreshToken(user.id)

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken
    }
  }
}
