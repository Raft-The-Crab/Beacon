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

// Sanitize message content (allow markdown but escape HTML)
export function sanitizeMessage(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  // Limit length
  const maxLength = 4000
  let sanitized = content.slice(0, maxLength)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Escape HTML but preserve markdown
  sanitized = sanitizeHTML(sanitized)
  
  return sanitized.trim()
}

// Sanitize user input fields
export function sanitizeUserInput(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== 'string') return ''
  
  return sanitizeHTML(input.slice(0, maxLength).trim())
}

// Middleware to sanitize request body
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
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
