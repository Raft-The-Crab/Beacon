import { Router } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

const KLIPY_API_BASE = 'https://g.klipy.co/api/v1'

function sanitizeLimit(value: unknown, fallback = 20, max = 50): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return String(fallback)
  return String(Math.min(max, Math.floor(n)))
}

function sanitizeOffset(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '0'
  return String(Math.floor(n))
}

async function forwardKlipy(path: string, query: URLSearchParams) {
  const apiKey = process.env.KLIPY_API_KEY || process.env.VITE_KLIPY_API_KEY || ''
  if (!apiKey) {
    throw new Error('KLIPY_API_KEY is not configured on the server')
  }

  query.set('api_key', apiKey)
  const response = await fetch(`${KLIPY_API_BASE}/${path}?${query.toString()}`)

  const text = await response.text()
  let body: any = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { error: 'Invalid JSON response from KLIPY' }
  }

  return { ok: response.ok, status: response.status, body }
}

router.get('/klipy/trending', authenticate, async (req, res) => {
  try {
    const query = new URLSearchParams({
      limit: sanitizeLimit(req.query.limit),
      offset: sanitizeOffset(req.query.offset),
      rating: String(req.query.rating || 'g'),
    })

    const result = await forwardKlipy('gifs/trending', query)
    if (!result.ok) {
      return res.status(result.status).json({ error: result.body?.error || 'KLIPY request failed' })
    }

    return res.json(result.body)
  } catch (error) {
    console.error('KLIPY trending proxy failed:', error)
    return res.status(503).json({ error: error instanceof Error ? error.message : 'KLIPY service unavailable' })
  }
})

router.get('/klipy/search', authenticate, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter: q' })
    }

    const query = new URLSearchParams({
      q,
      limit: sanitizeLimit(req.query.limit),
      offset: sanitizeOffset(req.query.offset),
      rating: String(req.query.rating || 'g'),
    })

    const result = await forwardKlipy('gifs/search', query)
    if (!result.ok) {
      return res.status(result.status).json({ error: result.body?.error || 'KLIPY request failed' })
    }

    return res.json(result.body)
  } catch (error) {
    console.error('KLIPY search proxy failed:', error)
    return res.status(503).json({ error: error instanceof Error ? error.message : 'KLIPY service unavailable' })
  }
})

export default router
