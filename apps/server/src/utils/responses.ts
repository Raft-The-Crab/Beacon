import { Response } from 'express'

/**
 * Standardized API Response structure for Beacon.
 */
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: {
        message: string
        code: string
        timestamp: string
    }
}

export const responses = {
    success: <T>(res: Response, data: T, status = 200) => {
        return res.status(status).json({
            success: true,
            data
        })
    },

    error: (res: Response, message: string, code = 'INTERNAL_ERROR', status = 500) => {
        return res.status(status).json({
            success: false,
            error: {
                message,
                code,
                timestamp: new Date().toISOString()
            }
        })
    }
}
