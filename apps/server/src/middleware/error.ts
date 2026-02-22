import { Request, Response, NextFunction } from 'express'

/**
 * Global error handler for the Beacon API.
 * Ensures consistent error responses and logs issues for backend tracking.
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.status || err.statusCode || 500
    const message = err.message || 'An unexpected error occurred'

    // Log the error for backend tracking
    console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode}: ${message}`)
    if (statusCode === 500) {
        console.error(err.stack)
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }
    })
}

/**
 * Not Found handler.
 */
export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString()
        }
    })
}
