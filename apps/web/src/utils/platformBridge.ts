/**
 * Beacon Platform Bridge (Titan IV Feature)
 * Unifies Desktop (Tauri), Mobile (Capacitor), and Web environments.
 */

declare global {
    interface Window {
        __TAURI__?: any;
        Capacitor?: any;
    }
}

export const PlatformBridge = {
    isTauri: () => !!window.__TAURI__,
    isCapacitor: () => !!window.Capacitor,
    isNative: () => !!(window.__TAURI__ || window.Capacitor),

    /**
     * Native Notification routing
     */
    sendNotification: async (title: string, options: { body?: string; icon?: string } = {}) => {
        if (PlatformBridge.isTauri()) {
            const { sendNotification } = await import('@tauri-apps/api/notification');
            sendNotification({ title, body: options.body });
        } else if (PlatformBridge.isCapacitor()) {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body: options.body || '',
                    id: Date.now(),
                    extra: options
                }]
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: options.body, icon: options.icon });
        }
    },

    /**
     * Set App Launcher Badge (Mobile/Desktop)
     */
    setAppBadge: async (count: number) => {
        if (PlatformBridge.isCapacitor()) {
            const { Badge } = await import('@capawesome/capacitor-badge');
            if (count > 0) await Badge.set({ count });
            else await Badge.clear();
        }
        // Web Badge API (Experimental)
        if ('setAppBadge' in navigator) {
            if (count > 0) (navigator as any).setAppBadge(count);
            else (navigator as any).clearAppBadge();
        }
    },

    /**
     * Haptic feedback for mobile
     */
    hapticFeedback: async (style: 'light' | 'medium' | 'heavy' = 'light') => {
        if (PlatformBridge.isCapacitor()) {
            try {
                const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
                const impact = style === 'heavy' ? ImpactStyle.Heavy : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
                await Haptics.impact({ style: impact });
            } catch (e) {
                console.warn('Haptics failed', e);
            }
        }
    },

    /**
     * Open external links securely
     */
    openExternal: async (url: string) => {
        if (PlatformBridge.isTauri()) {
            const { open } = await import('@tauri-apps/api/shell');
            await open(url);
        } else if (PlatformBridge.isCapacitor()) {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }
};
