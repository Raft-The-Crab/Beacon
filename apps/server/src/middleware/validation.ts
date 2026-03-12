import { Request, Response, NextFunction } from 'express'

/**
 * Input Validation Middleware
 * Prevents XSS, SQL injection, and malformed requests
 */

// Maximum string lengths to prevent memory attacks
const MAX_USERNAME_LENGTH = 32
const MAX_MESSAGE_LENGTH = 4000
const MAX_MESSAGE_EDIT_LENGTH = 4000
const MAX_GUILD_NAME_LENGTH = 100
const MAX_CHANNEL_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_ROLE_NAME_LENGTH = 100
const MAX_WEBHOOK_NAME_LENGTH = 80
const MAX_STRING_LENGTH = 500

// Regex patterns for validation
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/
const SNOWFLAKE_PATTERN = /^\d{15,}$/
const URL_PATTERN = /^https?:\/\/.{1,2000}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEX_COLOR_PATTERN = /^#?[0-9A-Fa-f]{6}$/
const NUMERIC_PATTERN = /^\d+$/

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: false, error: 'Username is required' }
  if (typeof username !== 'string') return { valid: false, error: 'Username must be a string' }
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' }
  if (username.length > MAX_USERNAME_LENGTH) return { valid: false, error: `Username cannot exceed ${MAX_USERNAME_LENGTH} characters` }
  if (!USERNAME_PATTERN.test(username)) return { valid: false, error: 'Username contains invalid characters' }
  return { valid: true }
}

/**
 * Validate message content
 */
export function validateMessage(content: string): { valid: boolean; error?: string } {
  if (typeof content !== 'string') return { valid: false, error: 'Message must be a string' }
  if (content.length === 0) return { valid: false, error: 'Message cannot be empty' }
  if (content.length > MAX_MESSAGE_LENGTH) return { valid: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` }
  return { valid: true }
}

/**
 * Validate snowflake ID (Discord-like ID)
 */
export function validateSnowflake(id: string, fieldName = 'ID'): { valid: boolean; error?: string } {
  if (!id) return { valid: false, error: `${fieldName} is required` }
  if (typeof id !== 'string') return { valid: false, error: `${fieldName} must be a string` }
  if (!SNOWFLAKE_PATTERN.test(id)) return { valid: false, error: `${fieldName} format is invalid` }
  return { valid: true }
}

/**
 * Validate email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email is required' }
  if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' }
  if (email.length > 254) return { valid: false, error: 'Email is too long' }
  if (!EMAIL_PATTERN.test(email)) return { valid: false, error: 'Email format is invalid' }
  return { valid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required' }
  if (typeof password !== 'string') return { valid: false, error: 'Password must be a string' }
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' }
  if (password.length > 256) return { valid: false, error: 'Password is too long' }
  
  // Check for complexity
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  
  if (!hasUppercase || !hasLowercase || !hasNumbers) {
    return { valid: false, error: 'Password must contain uppercase, lowercase, and numbers' }
  }
  
  return { valid: true }
}

/**
 * Validate guild/channel name
 */
export function validateGuildName(name: string, fieldName = 'Name'): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: `${fieldName} is required` }
  if (typeof name !== 'string') return { valid: false, error: `${fieldName} must be a string` }
  if (name.length < 1) return { valid: false, error: `${fieldName} cannot be empty` }
  if (name.length > MAX_GUILD_NAME_LENGTH) return { valid: false, error: `${fieldName} cannot exceed ${MAX_GUILD_NAME_LENGTH} characters` }
  return { valid: true }
}

/**
 * Validate channel name (alphanumeric + hyphens only)
 */
export function validateChannelName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Channel name is required' }
  if (typeof name !== 'string') return { valid: false, error: 'Channel name must be a string' }
  if (name.length < 1) return { valid: false, error: 'Channel name cannot be empty' }
  if (name.length > MAX_CHANNEL_NAME_LENGTH) return { valid: false, error: `Channel name cannot exceed ${MAX_CHANNEL_NAME_LENGTH} characters` }
  if (!/^[a-z0-9\-_]{1,100}$/.test(name)) return { valid: false, error: 'Channel name must contain only lowercase letters, numbers, hyphens, and underscores' }
  return { valid: true }
}

/**
 * Validate hex color
 */
export function validateColor(color: string): { valid: boolean; error?: string } {
  if (!color) return { valid: false, error: 'Color is required' }
  if (typeof color !== 'string') return { valid: false, error: 'Color must be a string' }
  if (!HEX_COLOR_PATTERN.test(color)) return { valid: false, error: 'Color must be a valid hex color (#RRGGBB)' }
  return { valid: true }
}

/**
 * Validate URL
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url) return { valid: false, error: 'URL is required' }
  if (typeof url !== 'string') return { valid: false, error: 'URL must be a string' }
  if (!URL_PATTERN.test(url)) return { valid: false, error: 'Invalid URL format' }
  return { valid: true }
}

/**
 * Middleware to validate request body size
 */
export function validateBodySize(maxSizeKB = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)
    const maxSizeBytes = maxSizeKB * 1024
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({ 
        error: `Request body exceeds ${maxSizeKB}KB limit` 
      })
    }
    
    next()
  }
}

/**
 * Middleware to validate required fields
 */
export function requireFields(...fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field])
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`
      })
    }
    next()
  }
}

/**
 * Sanitize string input (remove leading/trailing whitespace)
 */
export function sanitizeString(str: string): string {
  return String(str).trim()
}

/**
 * Validate object is not null/undefined
 */
export function validateExists(obj: any, fieldName = 'Object'): { valid: boolean; error?: string } {
  if (!obj) return { valid: false, error: `${fieldName} is required` }
  return { valid: true }
}

/**
 * Validate numeric ID
 */
export function validateNumericId(id: string, fieldName = 'ID'): { valid: boolean; error?: string } {
  if (!id) return { valid: false, error: `${fieldName} is required` }
  if (typeof id !== 'string') return { valid: false, error: `${fieldName} must be a string` }
  if (!NUMERIC_PATTERN.test(id)) return { valid: false, error: `${fieldName} must be numeric` }
  return { valid: true }
}
