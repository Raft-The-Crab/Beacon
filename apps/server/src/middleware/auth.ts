import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth'

export interface AuthRequest extends Request {
  user?: { id: string }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const payload = AuthService.verifyToken(token)
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = payload
  next()
}
