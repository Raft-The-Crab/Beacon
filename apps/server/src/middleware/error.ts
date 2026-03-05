import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'

/**
 * Global error handler for the Beacon API.
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // Log fatal errors
    if (!(err instanceof AppError) || err.statusCode === 500) {
        console.error(`[FATAL_ERROR] ${req.method} ${req.path}`, {
            message: err.message,
            stack: err.stack
        })
    }

    // Handle AppError instance
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                status: err.statusCode,
                timestamp: new Date().toISOString()
            }
        })
    }

    // Handle Prisma / Mongo common errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            success: false,
            error: { message: 'Database constraint violation', code: err.code }
        })
    }

    // Handle Validation errors (e.g. from models)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: { message: err.message }
        })
    }

    // Default fallback
    const statusCode = err.status || err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
            status: statusCode,
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
