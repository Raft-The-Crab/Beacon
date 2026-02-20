import { prisma } from '../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

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

export class AuthService {
  static async register(data: z.infer<typeof RegisterSchema>) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const discriminator = Math.floor(1000 + Math.random() * 9000).toString()

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        discriminator,
        theme: 'auto',
        developerMode: false
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
    return safeUser
  }

  static async verifyMFA(userId: string, token: string) {
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
