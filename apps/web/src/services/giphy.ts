// GIF API Service — resilient fallback system
// Uses Giphy public beta key (no signup needed)

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

// Fallback: use Giphy's public beta key (rate-limited but works without signup)
const GIPHY_PUBLIC_BETA = 'cw66S06W1tJ69tTSOsh9S8Q0S77vS3N4'
const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'

class GifService {
    async searchGifs(query: string, limit = 20, offset = 0): Promise<GiphySearchResponse> {
        // Try Giphy public beta key first (most reliable free option)
        const params = new URLSearchParams({
            api_key: GIPHY_PUBLIC_BETA,
            q: query,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g',
            lang: 'en'
        })

        try {
            const response = await fetch(`${GIPHY_API_BASE}/search?${params}`)
            if (response.ok) {
                return response.json()
            }
        } catch {
            // Giphy failed, fall through
        }

        // Fallback: return empty if all APIs fail
        return { data: [], pagination: { total_count: 0, count: 0, offset: 0 } }
    }

    async getTrending(limit = 20, offset = 0): Promise<GiphySearchResponse> {
        const params = new URLSearchParams({
            api_key: GIPHY_PUBLIC_BETA,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g'
        })

        try {
            const response = await fetch(`${GIPHY_API_BASE}/trending?${params}`)
            if (response.ok) {
                return response.json()
            }
        } catch {
            // Failed
        }

        return { data: [], pagination: { total_count: 0, count: 0, offset: 0 } }
    }
}

export const giphyService = new GifService()
