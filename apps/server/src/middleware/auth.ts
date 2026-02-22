import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth'

export interface AuthRequest extends Request<any, any, any, any> {
  user?: { id: string }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const payload = AuthService.verifyToken(token)

  if (!payload) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  req.user = payload
  next()
}
