import { Request, Response, NextFunction } from 'express'

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    metadata?: {
        timestamp: string
        requestId: string
        [key: string]: any
    }
}

export function responseWrapper(req: Request, res: Response, next: NextFunction) {
    console.log(`[responseWrapper] Incoming request: ${req.method} ${req.path}`)
    const originalJson = res.json

    res.json = function (data: any) {
        // If it's already a wrapped response, don't wrap again
        if (data && typeof data === 'object' && 'success' in data && ('data' in data || 'error' in data)) {
            return originalJson.call(this, data)
        }

        const wrappedResponse: ApiResponse = {
            success: res.statusCode < 400,
            metadata: {
                timestamp: new Date().toISOString(),
                requestId: (req as any).id || Math.random().toString(36).substring(7),
            }
        }

        if (res.statusCode >= 400) {
            wrappedResponse.error = data.error || data.message || 'An unknown error occurred'
            if (data.details) (wrappedResponse as any).details = data.details
        } else {
            // Recursively convert BigInt to string for JSON serialization
            wrappedResponse.data = JSON.parse(JSON.stringify(data, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ))
        }

        return originalJson.call(this, wrappedResponse)
    }

    next()
}
