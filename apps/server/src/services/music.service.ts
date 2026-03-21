import axios from 'axios';
import { logger } from './logger';

export interface MusicMetadata {
    title: string;
    artist: string;
    duration: number; // in seconds
    thumbnail: string;
    url: string;
    source: 'youtube' | 'spotify' | 'soundcloud' | 'other';
}

export class MusicService {
    /**
     * Searches for music or fetches metadata from a URL.
     * Fetches real metadata via oEmbed where available.
     */
    async fetchMetadata(query: string): Promise<MusicMetadata | null> {
        logger.info(`[MUSIC_SERVICE] Fetching metadata for: ${query}`);

        try {
            if (query.includes('youtube.com/') || query.includes('youtu.be/')) {
                const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(query)}&format=json`);
                const data = response.data;
                return {
                    title: data.title || "YouTube Track",
                    artist: data.author_name || "YouTube Creator",
                    duration: 0, // oEmbed doesn't always provide duration
                    thumbnail: data.thumbnail_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17",
                    url: query,
                    source: 'youtube'
                };
            }

            if (query.includes('spotify.com/')) {
                const response = await axios.get(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`);
                const data = response.data;
                return {
                    title: data.title || "Spotify Track",
                    artist: data.author_name || "Spotify Artist",
                    duration: 0,
                    thumbnail: data.thumbnail_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17",
                    url: query,
                    source: 'spotify'
                };
            }

            // Fallback for non-URL queries or other sources
            return {
                title: query,
                artist: "Beacon Music",
                duration: 0,
                thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17",
                url: query,
                source: 'other'
            };
        } catch (error) {
            logger.error(`[MUSIC_SERVICE] Failed to fetch metadata: ${error}`);
            return null;
        }
    }

    /**
     * Extracts a video ID from a YouTube URL.
     */
    extractYoutubeId(url: string): string | null {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/);
        return match ? match[1] : null;
    }
}

export const musicService = new MusicService();
