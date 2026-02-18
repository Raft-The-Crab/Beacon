// Tenor GIF API Integration
// Get your API key from: https://tenor.com/developer/keyregistration

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || 'AIzaSyD8nJq0Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z' // Demo key
const TENOR_API_BASE = 'https://tenor.googleapis.com/v2'

export interface TenorGif {
  id: string
  title: string
  media_formats: {
    gif: { url: string; dims: [number, number]; size: number }
    tinygif: { url: string; dims: [number, number]; size: number }
    nanogif: { url: string; dims: [number, number]; size: number }
    mediumgif: { url: string; dims: [number, number]; size: number }
  }
  created: number
  content_description: string
  itemurl: string
  url: string
  tags: string[]
  hasaudio: boolean
}

export interface TenorSearchResponse {
  results: TenorGif[]
  next: string
}

export interface TenorTrendingResponse {
  results: TenorGif[]
  next: string
}

export interface TenorCategory {
  searchterm: string
  path: string
  image: string
  name: string
}

class TenorService {
  private clientKey = 'beacon-web-client'

  async searchGifs(query: string, limit = 20, pos?: string): Promise<TenorSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      key: TENOR_API_KEY,
      client_key: this.clientKey,
      limit: limit.toString(),
      media_filter: 'gif,tinygif',
      ...(pos && { pos }),
    })

    const response = await fetch(`${TENOR_API_BASE}/search?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to search GIFs: ${response.statusText}`)
    }
    return response.json()
  }

  async getTrending(limit = 20, pos?: string): Promise<TenorTrendingResponse> {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: this.clientKey,
      limit: limit.toString(),
      media_filter: 'gif,tinygif',
      ...(pos && { pos }),
    })

    const response = await fetch(`${TENOR_API_BASE}/featured?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to get trending GIFs: ${response.statusText}`)
    }
    return response.json()
  }

  async getCategories(): Promise<TenorCategory[]> {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: this.clientKey,
      type: 'featured',
    })

    const response = await fetch(`${TENOR_API_BASE}/categories?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to get categories: ${response.statusText}`)
    }
    const data = await response.json()
    return data.tags || []
  }

  async getGifById(id: string): Promise<TenorGif> {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: this.clientKey,
      ids: id,
      media_filter: 'gif,tinygif',
    })

    const response = await fetch(`${TENOR_API_BASE}/posts?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to get GIF: ${response.statusText}`)
    }
    const data = await response.json()
    return data.results[0]
  }

  // Track when a GIF is shared
  async registerShare(id: string): Promise<void> {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: this.clientKey,
      id,
    })

    await fetch(`${TENOR_API_BASE}/registershare?${params}`)
    // Don't throw on error as this is just analytics
  }

  getGifUrl(gif: TenorGif, quality: 'gif' | 'tinygif' | 'nanogif' | 'mediumgif' = 'mediumgif'): string {
    return gif.media_formats[quality]?.url || gif.url
  }
}

export const tenorService = new TenorService()
