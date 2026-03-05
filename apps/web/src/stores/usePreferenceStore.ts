/**
 * Beacon User Preferences Service — Pillar VII: Omni-Nexus
 * Centralized user preference management with accessibility, appearance, and behavior settings.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────

export interface UserPreferences {
    // Appearance
    theme: 'dark' | 'light' | 'oled' | 'singularity'
    fontSize: number                           // 12-20
    messageSpacing: 'compact' | 'cozy' | 'spacious'
    animationsEnabled: boolean
    reducedMotion: boolean
    saturation: number                         // 0-200%

    // Accessibility
    highContrast: boolean
    screenReaderMode: boolean
    dyslexicFont: boolean
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    linkUnderlines: boolean

    // Behavior
    sendOnEnter: boolean
    markAsReadOnScroll: boolean
    showTypingIndicator: boolean
    enableSoundEffects: boolean
    notificationVolume: number                  // 0-100
    compactSidebar: boolean
    startMinimized: boolean

    // Privacy
    showCurrentActivity: boolean
    allowDMsFromServers: boolean
    restrictedDMs: boolean  // Only friends can DM

    // Developer
    devTools: boolean
    verboseLogging: boolean
    experimentalFeatures: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'singularity',
    fontSize: 16,
    messageSpacing: 'cozy',
    animationsEnabled: true,
    reducedMotion: false,
    saturation: 100,
    highContrast: false,
    screenReaderMode: false,
    dyslexicFont: false,
    colorBlindMode: 'none',
    linkUnderlines: false,
    sendOnEnter: true,
    markAsReadOnScroll: true,
    showTypingIndicator: true,
    enableSoundEffects: true,
    notificationVolume: 70,
    compactSidebar: false,
    startMinimized: false,
    showCurrentActivity: true,
    allowDMsFromServers: true,
    restrictedDMs: false,
    devTools: false,
    verboseLogging: false,
    experimentalFeatures: false,
}

// ── Store ────────────────────────────────────────────────────────────

interface PreferenceStore extends UserPreferences {
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
    updateMultiple: (updates: Partial<UserPreferences>) => void
    resetAll: () => void
    resetCategory: (category: 'appearance' | 'accessibility' | 'behavior' | 'privacy' | 'developer') => void
}

export const usePreferenceStore = create<PreferenceStore>()(
    persist(
        (set) => ({
            ...DEFAULT_PREFERENCES,

            updatePreference: (key, value) => set({ [key]: value }),

            updateMultiple: (updates) => set(updates),

            resetAll: () => set(DEFAULT_PREFERENCES),

            resetCategory: (category) => {
                switch (category) {
                    case 'appearance':
                        set({
                            theme: DEFAULT_PREFERENCES.theme,
                            fontSize: DEFAULT_PREFERENCES.fontSize,
                            messageSpacing: DEFAULT_PREFERENCES.messageSpacing,
                            animationsEnabled: DEFAULT_PREFERENCES.animationsEnabled,
                            reducedMotion: DEFAULT_PREFERENCES.reducedMotion,
                            saturation: DEFAULT_PREFERENCES.saturation,
                        })
                        break
                    case 'accessibility':
                        set({
                            highContrast: DEFAULT_PREFERENCES.highContrast,
                            screenReaderMode: DEFAULT_PREFERENCES.screenReaderMode,
                            dyslexicFont: DEFAULT_PREFERENCES.dyslexicFont,
                            colorBlindMode: DEFAULT_PREFERENCES.colorBlindMode,
                            linkUnderlines: DEFAULT_PREFERENCES.linkUnderlines,
                        })
                        break
                    case 'behavior':
                        set({
                            sendOnEnter: DEFAULT_PREFERENCES.sendOnEnter,
                            markAsReadOnScroll: DEFAULT_PREFERENCES.markAsReadOnScroll,
                            showTypingIndicator: DEFAULT_PREFERENCES.showTypingIndicator,
                            enableSoundEffects: DEFAULT_PREFERENCES.enableSoundEffects,
                            notificationVolume: DEFAULT_PREFERENCES.notificationVolume,
                            compactSidebar: DEFAULT_PREFERENCES.compactSidebar,
                            startMinimized: DEFAULT_PREFERENCES.startMinimized,
                        })
                        break
                    case 'privacy':
                        set({
                            showCurrentActivity: DEFAULT_PREFERENCES.showCurrentActivity,
                            allowDMsFromServers: DEFAULT_PREFERENCES.allowDMsFromServers,
                            restrictedDMs: DEFAULT_PREFERENCES.restrictedDMs,
                        })
                        break
                    case 'developer':
                        set({
                            devTools: DEFAULT_PREFERENCES.devTools,
                            verboseLogging: DEFAULT_PREFERENCES.verboseLogging,
                            experimentalFeatures: DEFAULT_PREFERENCES.experimentalFeatures,
                        })
                        break
                }
            },
        }),
        { name: 'beacon-preferences' }
    )
)
