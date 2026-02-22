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

export const logger = {
    info: (msg: string, ...args: any[]) => {
        console.log(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.cyan}[INFO]${colors.reset} ${msg}`, ...args)
    },
    success: (msg: string, ...args: any[]) => {
        console.log(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.green}[SUCCESS]${colors.reset} ${msg}`, ...args)
    },
    warn: (msg: string, ...args: any[]) => {
        console.warn(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${msg}`, ...args)
    },
    error: (msg: string, ...args: any[]) => {
        console.error(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${msg}`, ...args)
    },
    gateway: (msg: string, ...args: any[]) => {
        console.log(`${colors.dim}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.blue}[GATEWAY]${colors.reset} ${msg}`, ...args)
    }
}
