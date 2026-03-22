import { prisma } from '../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { validateUsername } from '../middleware/validation'
import { logger } from './logger'
import { NotificationService } from './notification'

const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret-key-change-me').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')

// Validation schemas
export const RegisterSchema = z.object({
  username: z.string().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(8)
})

export const LoginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string()
})

const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8)
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

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

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
        developerMode: username.toLowerCase() === 'raftthecrab',
        isVerified: false,
        verificationCode,
        verificationExpires
      }
    })

    await NotificationService.sendVerificationCode(email, verificationCode)

    return {
      user: this.sanitizeUser(user),
      verificationRequired: true
    }
  }

  static async login(data: z.infer<typeof LoginSchema>) {
    if (!prisma) throw new Error('Database not available')

    const identifier = data.identifier.trim()
    let user;

    // Handle username#discriminator format
    if (identifier.includes('#')) {
      const [username, discriminator] = identifier.split('#');
      logger.info(`[AUTH] Attempting login with discriminator: ${username}#${discriminator}`);
      user = await prisma.user.findUnique({
        where: { 
          username_discriminator: { 
            username: username.trim(), 
            discriminator: discriminator.trim() 
          } 
        }
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } }
          ]
        }
      });
    }

    if (!user) {
      logger.warn(`[AUTH] Login failed: User not found for identifier "${identifier}"`);
      throw new Error('Invalid credentials');
    }

    // Guard: password-less accounts (Google login) cannot use credential login
    if (!user.password) {
      throw new Error('This account uses social login. Please sign in with Google.')
    }

    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    if (!user.isVerified) {
      return {
        verificationRequired: true,
        email: user.email
      }
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

    return {
      user: this.sanitizeUser(user),
      ...this.generateTokenPair(user.id)
    }
  }

  static generateRefreshToken(userId: string) {
    return jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' })
  }

  static generateToken(userId: string, fingerprintHash?: string) {
    const payload: any = { id: userId };
    if (fingerprintHash) payload.fph = fingerprintHash;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  }

  /** Generate both access and refresh tokens in one call */
  static generateTokenPair(userId: string, fingerprintHash?: string) {
    return {
      accessToken: this.generateToken(userId, fingerprintHash),
      refreshToken: this.generateRefreshToken(userId)
    }
  }

  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string, fph?: string }
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
      hasPassword: !!password,
      theme: safeUser.theme || 'dark', // Prevent frontend crashes on null theme
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

    return {
      user: this.sanitizeUser(user),
      ...this.generateTokenPair(user.id)
    }
  }

  static async forgotPassword(email: string) {
    if (!prisma) throw new Error('Database not available')

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      // Don't leak user existence in production, but for testing we return success
      return { success: true }
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    })

    await NotificationService.sendPasswordReset(email, token)
    logger.info(`Password reset requested for ${email}. Token: ${token}`)

    return { 
      success: true, 
      token, // Return token directly for local testing as per user's "non-production" context
      message: 'If an account exists with this email, a reset token has been generated.' 
    }
  }

  static async resetPassword(data: z.infer<typeof ResetPasswordSchema>) {
    if (!prisma) throw new Error('Database not available')

    const user = await (prisma.user as any).findFirst({
      where: {
        passwordResetToken: data.token,
        passwordResetExpires: { gt: new Date() }
      }
    })

    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
    const hashedPassword = await bcrypt.hash(data.newPassword, isNaN(rounds) ? 10 : rounds)

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })

    return { success: true, message: 'Password has been reset successfully' }
  }

  static async verifyEmail(email: string, code: string) {
    if (!prisma) throw new Error('Database not available')

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        verificationCode: code,
        verificationExpires: { gt: new Date() }
      }
    })

    if (!user) {
      throw new Error('Invalid or expired verification code')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
      }
    })

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...this.generateTokenPair(user.id)
    }
  }

  static async resendVerification(email: string) {
    if (!prisma) throw new Error('Database not available')

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) throw new Error('User not found')
    if (user.isVerified) throw new Error('Account already verified')

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpires
      }
    })

    await NotificationService.sendVerificationCode(user.email, verificationCode)
    return { success: true, message: 'Verification code resent' }
  }
}
