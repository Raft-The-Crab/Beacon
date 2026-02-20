import { Request, Response, NextFunction } from 'express'
import { logger } from '../services/logger'

/**
 * Middleware to track request duration and log performance metrics.
 */
export function requestTimer(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime()

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start)
        const duration = (seconds * 1000 + nanoseconds / 1000000).toFixed(2)

        const status = res.statusCode
        const color = status >= 500 ? 'red' : status >= 400 ? 'yellow' : 'green'

        logger.info(`${req.method} ${req.path} - ${status} (${duration}ms)`)
    })

    next()
}
