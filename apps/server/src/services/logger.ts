/**
 * Enhanced Logger for Beacon Backend
 */

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
}

const SANITIZE_PATTERNS = [
    /https?:\/\/[^\s]+railway\.app[^\s]*/gi,
    /https?:\/\/[^\s]+qzz\.io[^\s]*/gi,
    /https?:\/\/[^\s]+pages\.dev[^\s]*/gi,
    /asia-southeast1-eqsg3a/g,
    /railway-(api|service|env)/gi,
    /mongo_uri=[^\s]*/gi,
    /redis_url=[^\s]*/gi,
    /api_key=[^\s]*/gi,
];

function sanitize(msg: string): string {
    if (typeof msg !== 'string') return msg;
    let sanitized = msg;
    for (const pattern of SANITIZE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}

function formatMsg(level: string, color: string, msg: string, reqId?: string) {
    const timestamp = new Date().toISOString();
    const idTag = reqId ? `${colors.dim}[${reqId}]${colors.reset} ` : '';
    const sanitizedMsg = sanitize(msg);
    return `${colors.dim}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset} ${idTag}${sanitizedMsg}`;
}

export const logger = {
    info: (msg: string, reqId?: string, ...args: any[]) => {
        console.log(formatMsg('INFO', colors.cyan, msg, reqId), ...args);
    },
    success: (msg: string, reqId?: string, ...args: any[]) => {
        console.log(formatMsg('SUCCESS', colors.green, msg, reqId), ...args);
    },
    warn: (msg: string, reqId?: string, ...args: any[]) => {
        console.warn(formatMsg('WARN', colors.yellow, msg, reqId), ...args);
    },
    error: (msg: string, reqId?: string, ...args: any[]) => {
        console.error(formatMsg('ERROR', colors.red, msg, reqId), ...args);
    },
    debug: (msg: string, reqId?: string, ...args: any[]) => {
        if (process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
            console.log(formatMsg('DEBUG', colors.dim, msg, reqId), ...args);
        }
    },
    gateway: (msg: string, reqId?: string, ...args: any[]) => {
        console.log(formatMsg('GATEWAY', colors.blue, msg, reqId), ...args);
    }
}
