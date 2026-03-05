import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Low Bandwidth Mode — Performance & Data Optimization
 * 
 * When enabled, the app:
 * - Disables heavy CSS animations (mesh gradients)
 * - Disables Aura VFX animations (no CSS background orbs)
 * - Limits polling frequency
 * - Disables heavy backdrop-filter glass effects
 * - Hides video thumbnails and large media previews
 */
interface LowBandwidthState {
    enabled: boolean
    toggle: () => void
    setEnabled: (value: boolean) => void
}

export const useLowBandwidthStore = create<LowBandwidthState>()(
    persist(
        (set) => ({
            enabled: false,
            toggle: () =>
                set((state) => {
                    const next = !state.enabled
                    applyLowBandwidthMode(next)
                    return { enabled: next }
                }),
            setEnabled: (value: boolean) => {
                set({ enabled: value })
                applyLowBandwidthMode(value)
            },
        }),
        {
            name: 'beacon:low-bandwidth',
            onRehydrateStorage: () => (state) => {
                if (!state) return
                applyLowBandwidthMode(state.enabled)
            },
        }
    )
)

function applyLowBandwidthMode(enabled: boolean) {
    const root = document.documentElement
    if (enabled) {
        root.setAttribute('data-low-bandwidth', 'true')
        root.style.setProperty('--glass-blur', '0px')
        root.style.setProperty('--backdrop-blur', '0px')
        root.classList.add('low-bandwidth')
    } else {
        root.removeAttribute('data-low-bandwidth')
        root.style.removeProperty('--glass-blur')
        root.style.removeProperty('--backdrop-blur')
        root.classList.remove('low-bandwidth')
    }
}
