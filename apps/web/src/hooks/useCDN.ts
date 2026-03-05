import { useMemo } from 'react';

/**
 * Beacon Global CDN Hook (Titan III Feature)
 * Automatically accelerates asset delivery using Beacon's distributed edge.
 */
export function useCDN(url: string | undefined): string | undefined {
    const CDN_ENABLED = true;
    const CDN_PREFIX = 'https://cdn.beacon.qzz.io';

    const acceleratedUrl = useMemo(() => {
        if (!url || !CDN_ENABLED) return url;

        // Don't prefix if already an absolute CDN URL or data URL
        if (url.startsWith('http') || url.startsWith('data:')) {
            // Speed up images that are on our main storage but not yet CDN prefixed
            if (url.includes('storage.googleapis.com/beacon-assets')) {
                return url.replace('storage.googleapis.com', 'cdn.beacon.qzz.io');
            }
            return url;
        }

        // Prefix relative local paths (e.g., /avatars/user.png)
        return `${CDN_PREFIX}${url.startsWith('/') ? '' : '/'}${url}`;
    }, [url, CDN_ENABLED, CDN_PREFIX]);

    return acceleratedUrl;
}
