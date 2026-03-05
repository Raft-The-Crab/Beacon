export interface MusicMetadata {
    title: string;
    artist: string;
    thumbnail?: string;
    platform: 'spotify' | 'youtube' | 'unknown';
}

export async function fetchMusicMetadata(url: string): Promise<MusicMetadata | null> {
    try {
        let fetchUrl = '';
        let platform: 'spotify' | 'youtube' | 'unknown' = 'unknown';

        if (url.includes('spotify.com')) {
            fetchUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
            platform = 'spotify';
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            fetchUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            platform = 'youtube';
        } else {
            return null;
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) return null;

        const data = await response.json();

        return {
            title: data.title || 'Unknown Title',
            artist: data.author_name || 'Unknown Artist',
            thumbnail: data.thumbnail_url,
            platform
        };
    } catch (error) {
        console.error('Metadata fetch failed:', error);
        return null;
    }
}

export function parseYouTubeSeekLink(url: string): number | null {
    try {
        const urlObj = new URL(url);
        const t = urlObj.searchParams.get('t');
        if (t) {
            // Handle formats like "1m20s" or "80"
            if (t.includes('m') || t.includes('s')) {
                const match = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
                if (!match) return null;
                const h = parseInt(match[1] || '0', 10);
                const m = parseInt(match[2] || '0', 10);
                const s = parseInt(match[3] || '0', 10);
                return h * 3600 + m * 60 + s;
            }
            return parseInt(t, 10);
        }
        return null;
    } catch {
        return null;
    }
}
