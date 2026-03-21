import { Request, Response, NextFunction } from 'express'

// HTML entity encoding to prevent XSS
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// v3: Zero-width character stripping (used for invisible text spam)
const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF\u2060\u180E]/g

/**
 * v3: Sanitize message content — escape HTML, strip zero-width spam chars, enforce length.
 */
export function sanitizeMessage(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  const maxLength = 4000
  let sanitized = content.slice(0, maxLength)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // v3: Strip zero-width invisible characters (spam/exploit vector)
  sanitized = sanitized.replace(ZERO_WIDTH_REGEX, '')
  
  // Escape HTML but preserve markdown
  sanitized = sanitizeHTML(sanitized)
  
  return sanitized.trim()
}

// Sanitize user input fields
export function sanitizeUserInput(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== 'string') return ''
  
  return sanitizeHTML(input.slice(0, maxLength).trim())
}

/**
 * v3: Strip prototype pollution keys from an object recursively.
 * Removes __proto__, constructor, prototype keys to prevent prototype pollution attacks.
 */
function stripDangerousKeys(obj: any): void {
  if (!obj || typeof obj !== 'object') return
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  
  for (const key of Object.keys(obj)) {
    if (dangerousKeys.includes(key)) {
      delete obj[key]
      continue
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      stripDangerousKeys(obj[key])
    }
  }
}

// Middleware to sanitize request body
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    stripDangerousKeys(req.body)
    sanitizeObject(req.body)
  }
  next()
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeUserInput(obj[key], 10000)
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key])
    }
  }
}

// Validate and sanitize channel/guild names
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') return ''
  
  return name
    .slice(0, 100)
    .replace(/[^\w\s-]/g, '')
    .trim()
}

// SQL injection prevention (for raw queries)
export function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''")
}

/**
 * v3: Validate and sanitize a URL string.
 * Returns the URL if valid (http/https only), or empty string if malicious/invalid.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  
  try {
    const parsed = new URL(url.trim())
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    // Block localhost/private IPs in production (SSRF prevention)
    const hostname = parsed.hostname.toLowerCase()
    if (
      process.env.NODE_ENV === 'production' &&
      (hostname === 'localhost' ||
       hostname === '127.0.0.1' ||
       hostname === '0.0.0.0' ||
       hostname.startsWith('192.168.') ||
       hostname.startsWith('10.') ||
       hostname.startsWith('172.'))
    ) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}
