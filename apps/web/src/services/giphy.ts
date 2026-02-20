// Giphy GIF API Integration
// Get your API key from: https://developers.giphy.com/dashboard/

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'cw66S06W1tJ69tTSOsh9S8Q0S77vS3N4' // Public Beta Key
const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'

export interface GiphyGif {
    id: string
    title: string
    images: {
        fixed_height: { url: string; width: string; height: string; size: string }
        fixed_height_small: { url: string; width: string; height: string; size: string }
        original: { url: string; width: string; height: string; size: string }
    }
}

export interface GiphySearchResponse {
    data: GiphyGif[]
    pagination: { total_count: number; count: number; offset: number }
}

class GiphyService {
    async searchGifs(query: string, limit = 20, offset = 0): Promise<GiphySearchResponse> {
        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: query,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g',
            lang: 'en'
        })

        const response = await fetch(`${GIPHY_API_BASE}/search?${params}`)
        if (!response.ok) {
            throw new Error(`GIPHY search failed: ${response.statusText}`)
        }
        return response.json()
    }

    async getTrending(limit = 20, offset = 0): Promise<GiphySearchResponse> {
        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g'
        })

        const response = await fetch(`${GIPHY_API_BASE}/trending?${params}`)
        if (!response.ok) {
            throw new Error(`GIPHY trending failed: ${response.statusText}`)
        }
        return response.json()
    }
}

export const giphyService = new GiphyService()
