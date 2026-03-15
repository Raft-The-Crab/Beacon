import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to attach a unique request ID to every incoming request.
 */
export function requestId(req: any, res: Response, next: NextFunction) {
    const id = req.headers['x-request-id'] || uuidv4();
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
}
