// GIF API Service
// Enforces free-tier limits client-side to avoid exhausting API quota.

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

const GIPHY_CONFIGURED_KEY =
    import.meta.env.VITE_GIPHY_API_KEY ||
    ''
const GIPHY_API_BASE = 'https://api.giphy.com/v1/gifs'
const GIPHY_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const GIPHY_RATE_LIMIT_FREE = 100
const GIPHY_RATE_LIMIT_BEACON_PLUS = 240
const GIPHY_LIMIT_STORAGE_KEY = 'beacon_giphy_rate_limit_v2'

export type GiphyUsageTier = 'free' | 'beacon_plus'

interface RateLimitState {
    startedAt: number
    count: number
    tier: GiphyUsageTier
}

interface GiphyRequestOptions {
    tier?: GiphyUsageTier
}

class GifService {
    private getRateLimitState(tier: GiphyUsageTier): RateLimitState {
        if (typeof window === 'undefined') {
            return { startedAt: Date.now(), count: 0, tier }
        }

        try {
            const raw = window.localStorage.getItem(GIPHY_LIMIT_STORAGE_KEY)
            if (!raw) return { startedAt: Date.now(), count: 0, tier }

            const parsed = JSON.parse(raw) as RateLimitState
            if (!parsed?.startedAt || typeof parsed.count !== 'number') {
                return { startedAt: Date.now(), count: 0, tier }
            }

            const expired = Date.now() - parsed.startedAt >= GIPHY_RATE_LIMIT_WINDOW_MS
            const tierChanged = parsed.tier !== tier
            if (expired || tierChanged) {
                return { startedAt: Date.now(), count: 0, tier }
            }

            return parsed
        } catch {
            return { startedAt: Date.now(), count: 0, tier }
        }
    }

    private setRateLimitState(state: RateLimitState) {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.setItem(GIPHY_LIMIT_STORAGE_KEY, JSON.stringify(state))
        } catch {
            // Ignore storage failures and keep runtime behavior working.
        }
    }

    private getHourlyLimitForTier(tier: GiphyUsageTier) {
        return tier === 'beacon_plus' ? GIPHY_RATE_LIMIT_BEACON_PLUS : GIPHY_RATE_LIMIT_FREE
    }

    private consumeRateLimitOrThrow(tier: GiphyUsageTier) {
        const state = this.getRateLimitState(tier)
        const maxRequests = this.getHourlyLimitForTier(tier)

        if (state.count >= maxRequests) {
            const minutesLeft = Math.max(
                1,
                Math.ceil((GIPHY_RATE_LIMIT_WINDOW_MS - (Date.now() - state.startedAt)) / 60000)
            )
            throw new Error(`GIPHY hourly limit reached (${maxRequests}/hour for ${tier === 'beacon_plus' ? 'Beacon+' : 'Free'}). Try again in ~${minutesLeft} min.`)
        }

        this.setRateLimitState({
            startedAt: state.startedAt,
            count: state.count + 1,
            tier,
        })
    }

    private async request(path: 'search' | 'trending', params: URLSearchParams, tier: GiphyUsageTier): Promise<GiphySearchResponse> {
        this.consumeRateLimitOrThrow(tier)

        const response = await fetch(`${GIPHY_API_BASE}/${path}?${params}`)
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('GIPHY returned 429 (rate limited). Please wait and try again.')
            }
            throw new Error(`GIPHY request failed (${response.status})`)
        }

        return response.json()
    }

    async searchGifs(query: string, limit = 20, offset = 0, options: GiphyRequestOptions = {}): Promise<GiphySearchResponse> {
        const tier = options.tier || 'free'
        const params = new URLSearchParams({
            api_key: GIPHY_CONFIGURED_KEY,
            q: query,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g',
            lang: 'en'
        })

        return this.request('search', params, tier)
    }

    async getTrending(limit = 20, offset = 0, options: GiphyRequestOptions = {}): Promise<GiphySearchResponse> {
        const tier = options.tier || 'free'
        const params = new URLSearchParams({
            api_key: GIPHY_CONFIGURED_KEY,
            limit: limit.toString(),
            offset: offset.toString(),
            rating: 'g'
        })

        return this.request('trending', params, tier)
    }
}

export const giphyService = new GifService()
