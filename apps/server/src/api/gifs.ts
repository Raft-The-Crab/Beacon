import { Router } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'

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

function normalizeFromGiphy(raw: any) {
  const items = Array.isArray(raw?.data) ? raw.data : []
  const data = items.map((item: any) => ({
    id: String(item?.id || ''),
    title: item?.title || item?.slug || '',
    images: {
      fixed_height: {
        url: item?.images?.fixed_height?.url || item?.images?.downsized?.url || '',
        width: String(item?.images?.fixed_height?.width || item?.images?.downsized?.width || '0'),
        height: String(item?.images?.fixed_height?.height || item?.images?.downsized?.height || '0'),
      },
      fixed_height_small: {
        url: item?.images?.fixed_height_small?.url || item?.images?.preview_gif?.url || item?.images?.preview?.url || '',
        width: String(item?.images?.fixed_height_small?.width || item?.images?.preview_gif?.width || item?.images?.preview?.width || '0'),
        height: String(item?.images?.fixed_height_small?.height || item?.images?.preview_gif?.height || item?.images?.preview?.height || '0'),
      },
      original: {
        url: item?.images?.original?.url || item?.images?.downsized_large?.url || '',
        width: String(item?.images?.original?.width || item?.images?.downsized_large?.width || '0'),
        height: String(item?.images?.original?.height || item?.images?.downsized_large?.height || '0'),
      },
    },
  })).filter((item: any) => item.id && item.images.original.url)

  return {
    data,
    pagination: {
      total_count: Number(raw?.pagination?.total_count || data.length),
      count: Number(raw?.pagination?.count || data.length),
      offset: Number(raw?.pagination?.offset || 0),
    },
  }
}

async function forwardGiphy(path: 'trending' | 'search', query: URLSearchParams) {
  const apiKey = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'
  const giphyQuery = new URLSearchParams({
    api_key: apiKey,
    limit: sanitizeLimit(query.get('limit')),
    offset: sanitizeOffset(query.get('offset')),
    rating: String(query.get('rating') || 'g'),
  })

  if (path === 'search') {
    giphyQuery.set('q', String(query.get('q') || ''))
    giphyQuery.set('lang', 'en')
  }

  const response = await fetch(`${GIPHY_API_BASE}/${path}?${giphyQuery.toString()}`)
  const text = await response.text()

  let body: any = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { error: 'Invalid JSON response from GIPHY' }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: { error: body?.message || body?.error || 'GIPHY request failed' },
    }
  }

  return {
    ok: true,
    status: 200,
    body: normalizeFromGiphy(body),
  }
}

async function handleGiphyRequest(path: 'trending' | 'search', req: any, res: any) {
  try {
    const q = String(req.query.q || '').trim()
    if (path === 'search' && !q) {
      return res.status(400).json({ error: 'Missing query parameter: q' })
    }

    const query = new URLSearchParams({
      ...(path === 'search' ? { q } : {}),
      limit: sanitizeLimit(req.query.limit),
      offset: sanitizeOffset(req.query.offset),
      rating: String(req.query.rating || 'g'),
    })

    const result = await forwardGiphy(path, query)
    if (!result.ok) {
      const failureBody = result.body as { error?: string }
      return res.status(result.status).json({ error: failureBody.error || 'GIPHY request failed' })
    }

    return res.json(result.body)
  } catch (error) {
    console.error(`GIPHY ${path} proxy failed:`, error)
    return res.status(503).json({ error: error instanceof Error ? error.message : 'GIPHY service unavailable' })
  }
}

router.get('/trending', authenticate, async (req, res) => handleGiphyRequest('trending', req, res))
router.get('/search', authenticate, async (req, res) => handleGiphyRequest('search', req, res))

export default router
