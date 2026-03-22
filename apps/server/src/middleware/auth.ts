import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth'
import { prisma } from '../db'

export interface AuthRequest extends Request<any, any, any, any> {
  user?: { id: string }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const cookieToken = req.cookies?.token
  const token = (authHeader && authHeader.split(' ')[1]) || cookieToken

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const payload = AuthService.verifyToken(token) as { id: string } | null

  // Support for Bot Tokens
  if (!payload && token.startsWith('beacon/bot_')) {
    if (prisma) {
      const bot = await prisma.bot.findUnique({
        where: { token },
        select: { userId: true }
      });
      if (bot) {
        req.user = { id: bot.userId }
        return next()
      }
    }
    return res.status(401).json({ error: 'Invalid bot token' })
  }

  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    // CRITICAL: Verify user exists in DB to prevent orphaned tokens causing "Guest" state
    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true }
      });

      if (!user) {
        console.log(`[AUTH] Rejecting 401: User ${payload.id} no longer exists in DB.`);
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
    }

    req.user = payload
    next()
  } catch (err: any) {
    console.error(`[AUTH] Database query failed in middleware for user ${payload.id}: ${err.stack || err.message}`);
    res.status(503).json({ error: 'Authentication service unavailable. Please try again soon.' });
  }
}
