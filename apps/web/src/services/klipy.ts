// KLIPY GIF API Service — used exclusively for Beacon+ subscribers
// 100 API calls/minute limit (per KLIPY free tier)
// https://klipy.co/developers

export interface KlipyGif {
    id: string
    title: string
    images: {
        fixed_height:       { url: string; width: string; height: string }
        fixed_height_small: { url: string; width: string; height: string }
        original:           { url: string; width: string; height: string }
    }
}

export interface KlipySearchResponse {
    data:       KlipyGif[]
    pagination: { total_count: number; count: number; offset: number }
}

const KLIPY_PROXY_BASE = '/api/gifs/klipy'
// KLIPY allows 100 calls / minute for the beta API key
const KLIPY_RATE_LIMIT_WINDOW_MS = 60 * 1000           // 1 minute
const KLIPY_RATE_LIMIT_PER_MIN   = 95                  // leave 5 calls headroom
const KLIPY_LIMIT_STORAGE_KEY    = 'beacon_klipy_rate_limit_v1'

interface KlipyRateLimitState {
    startedAt: number
    count:     number
}

// ─── Raw KLIPY shape → canonical KlipyGif ──────────────────────────────────
function normalizeKlipyItem(item: any): KlipyGif | null {
    if (!item?.id) return null

    // KLIPY returns renditions nested under `gif` → `renditions`
    const rend = item?.gif?.renditions ?? item?.renditions ?? {}

    const extract = (key: string) => ({
        url:    rend?.[key]?.url   ?? '',
        width:  String(rend?.[key]?.width  ?? '0'),
        height: String(rend?.[key]?.height ?? '0'),
    })

    return {
        id:    String(item.id),
        title: item.title ?? item.slug ?? '',
        images: {
            fixed_height:       extract('downsized'),
            fixed_height_small: extract('preview'),
            original:           extract('source'),
        },
    }
}

class KlipyService {
    private getState(): KlipyRateLimitState {
        if (typeof window === 'undefined') return { startedAt: Date.now(), count: 0 }
        try {
            const raw = window.localStorage.getItem(KLIPY_LIMIT_STORAGE_KEY)
            if (!raw) return { startedAt: Date.now(), count: 0 }
            const parsed = JSON.parse(raw) as KlipyRateLimitState
            if (!parsed?.startedAt || typeof parsed.count !== 'number') {
                return { startedAt: Date.now(), count: 0 }
            }
            const expired = Date.now() - parsed.startedAt >= KLIPY_RATE_LIMIT_WINDOW_MS
            return expired ? { startedAt: Date.now(), count: 0 } : parsed
        } catch {
            return { startedAt: Date.now(), count: 0 }
        }
    }

    private setState(state: KlipyRateLimitState) {
        if (typeof window === 'undefined') return
        try { window.localStorage.setItem(KLIPY_LIMIT_STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    }

    private consumeOrThrow() {
        const state = this.getState()
        if (state.count >= KLIPY_RATE_LIMIT_PER_MIN) {
            const secondsLeft = Math.max(1, Math.ceil((KLIPY_RATE_LIMIT_WINDOW_MS - (Date.now() - state.startedAt)) / 1000))
            throw new Error(`KLIPY rate limit reached (${KLIPY_RATE_LIMIT_PER_MIN}/min for Beacon+). Try again in ${secondsLeft}s.`)
        }
        this.setState({ startedAt: state.startedAt, count: state.count + 1 })
    }

    private async request(path: string, params: URLSearchParams): Promise<KlipySearchResponse> {
        this.consumeOrThrow()

        const response = await fetch(`${KLIPY_PROXY_BASE}/${path}?${params.toString()}`, {
            credentials: 'include',
        })
        if (!response.ok) {
            if (response.status === 429) throw new Error('KLIPY rate limited (429). Wait a moment.')
            if (response.status === 401) throw new Error('Please sign in again to use KLIPY.')
            throw new Error(`KLIPY request failed (${response.status})`)
        }

        const json = await response.json()

        // Normalise various shapes KLIPY may return
        const rawList: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
        const data = rawList.map(normalizeKlipyItem).filter(Boolean) as KlipyGif[]

        return {
            data,
            pagination: {
                total_count: json?.pagination?.total_count ?? data.length,
                count:       data.length,
                offset:      Number(params.get('offset') ?? 0),
            },
        }
    }

    async searchGifs(query: string, limit = 20, offset = 0): Promise<KlipySearchResponse> {
        const params = new URLSearchParams({
            q:      query,
            limit:  String(limit),
            offset: String(offset),
            rating: 'g',
        })
        return this.request('search', params)
    }

    async getTrending(limit = 20, offset = 0): Promise<KlipySearchResponse> {
        const params = new URLSearchParams({
            limit:  String(limit),
            offset: String(offset),
            rating: 'g',
        })
        return this.request('trending', params)
    }

    isConfigured(): boolean {
        return true
    }
}

export const klipyService = new KlipyService()
