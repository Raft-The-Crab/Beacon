/**
 * Beacon Keyboard Shortcuts Engine — Pillar VII: Omni-Nexus
 * Global hotkey manager with customizable keybinds, conflict detection, and scope awareness.
 */

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────

export interface KeyBinding {
    id: string
    label: string
    category: 'Navigation' | 'Chat' | 'Voice' | 'Media' | 'System'
    keys: string[]           // e.g. ['Ctrl', 'K'] or ['Alt', 'Shift', 'N']
    action: string           // action identifier
    enabled: boolean
    scope: 'global' | 'chat' | 'voice' | 'modal'
}

// ── Default Keybindings ──────────────────────────────────────────────

const DEFAULT_KEYBINDINGS: KeyBinding[] = [
    // Navigation
    { id: 'nav_quick_switcher', label: 'Quick Switcher', category: 'Navigation', keys: ['Ctrl', 'K'], action: 'OPEN_QUICK_SWITCHER', enabled: true, scope: 'global' },
    { id: 'nav_search', label: 'Search', category: 'Navigation', keys: ['Ctrl', 'F'], action: 'OPEN_SEARCH', enabled: true, scope: 'global' },
    { id: 'nav_prev_server', label: 'Previous Server', category: 'Navigation', keys: ['Ctrl', 'Alt', 'ArrowUp'], action: 'PREV_SERVER', enabled: true, scope: 'global' },
    { id: 'nav_next_server', label: 'Next Server', category: 'Navigation', keys: ['Ctrl', 'Alt', 'ArrowDown'], action: 'NEXT_SERVER', enabled: true, scope: 'global' },
    { id: 'nav_prev_channel', label: 'Previous Channel', category: 'Navigation', keys: ['Alt', 'ArrowUp'], action: 'PREV_CHANNEL', enabled: true, scope: 'global' },
    { id: 'nav_next_channel', label: 'Next Channel', category: 'Navigation', keys: ['Alt', 'ArrowDown'], action: 'NEXT_CHANNEL', enabled: true, scope: 'global' },
    { id: 'nav_home', label: 'Go Home', category: 'Navigation', keys: ['Ctrl', 'Shift', 'H'], action: 'GO_HOME', enabled: true, scope: 'global' },
    { id: 'nav_dm', label: 'Open DMs', category: 'Navigation', keys: ['Ctrl', 'Shift', 'D'], action: 'OPEN_DMS', enabled: true, scope: 'global' },

    // Chat
    { id: 'chat_focus', label: 'Focus Chat Input', category: 'Chat', keys: ['Ctrl', 'L'], action: 'FOCUS_CHAT', enabled: true, scope: 'chat' },
    { id: 'chat_edit_last', label: 'Edit Last Message', category: 'Chat', keys: ['ArrowUp'], action: 'EDIT_LAST_MESSAGE', enabled: true, scope: 'chat' },
    { id: 'chat_upload', label: 'Upload File', category: 'Chat', keys: ['Ctrl', 'U'], action: 'UPLOAD_FILE', enabled: true, scope: 'chat' },
    { id: 'chat_emoji', label: 'Open Emoji Picker', category: 'Chat', keys: ['Ctrl', 'E'], action: 'OPEN_EMOJI_PICKER', enabled: true, scope: 'chat' },
    { id: 'chat_reply', label: 'Reply to Last', category: 'Chat', keys: ['Ctrl', 'Shift', 'R'], action: 'REPLY_LAST', enabled: true, scope: 'chat' },

    // Voice
    { id: 'voice_mute', label: 'Toggle Mute', category: 'Voice', keys: ['Ctrl', 'Shift', 'M'], action: 'TOGGLE_MUTE', enabled: true, scope: 'voice' },
    { id: 'voice_deafen', label: 'Toggle Deafen', category: 'Voice', keys: ['Ctrl', 'Shift', 'D'], action: 'TOGGLE_DEAFEN', enabled: true, scope: 'voice' },
    { id: 'voice_disconnect', label: 'Disconnect Voice', category: 'Voice', keys: ['Ctrl', 'Shift', 'X'], action: 'DISCONNECT_VOICE', enabled: true, scope: 'global' },

    // Media
    { id: 'media_screen_share', label: 'Screen Share', category: 'Media', keys: ['Ctrl', 'Shift', 'S'], action: 'SCREEN_SHARE', enabled: true, scope: 'voice' },
    { id: 'media_camera', label: 'Toggle Camera', category: 'Media', keys: ['Ctrl', 'Shift', 'V'], action: 'TOGGLE_CAMERA', enabled: true, scope: 'voice' },

    // System
    { id: 'sys_settings', label: 'User Settings', category: 'System', keys: ['Ctrl', ','], action: 'OPEN_SETTINGS', enabled: true, scope: 'global' },
    { id: 'sys_shortcuts', label: 'Show Shortcuts', category: 'System', keys: ['Ctrl', '/'], action: 'SHOW_SHORTCUTS', enabled: true, scope: 'global' },
    { id: 'sys_focus_mode', label: 'Focus Mode', category: 'System', keys: ['Ctrl', 'Shift', 'F'], action: 'TOGGLE_FOCUS_MODE', enabled: true, scope: 'global' },
    { id: 'sys_perf', label: 'Performance Overlay', category: 'System', keys: ['Ctrl', 'Shift', 'P'], action: 'TOGGLE_PERF_OVERLAY', enabled: true, scope: 'global' },
]

// ── Store ────────────────────────────────────────────────────────────

interface ShortcutStore {
    keybindings: KeyBinding[]
    focusMode: boolean
    perfOverlay: boolean
    setKeybinding: (id: string, keys: string[]) => void
    toggleBinding: (id: string) => void
    resetDefaults: () => void
    toggleFocusMode: () => void
    togglePerfOverlay: () => void
}

export const useShortcutStore = create<ShortcutStore>()(
    persist(
        (set) => ({
            keybindings: DEFAULT_KEYBINDINGS,
            focusMode: false,
            perfOverlay: false,
            setKeybinding: (id, keys) =>
                set((state) => ({
                    keybindings: state.keybindings.map((kb) =>
                        kb.id === id ? { ...kb, keys } : kb
                    ),
                })),
            toggleBinding: (id) =>
                set((state) => ({
                    keybindings: state.keybindings.map((kb) =>
                        kb.id === id ? { ...kb, enabled: !kb.enabled } : kb
                    ),
                })),
            resetDefaults: () => set({ keybindings: DEFAULT_KEYBINDINGS }),
            toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
            togglePerfOverlay: () => set((s) => ({ perfOverlay: !s.perfOverlay })),
        }),
        { name: 'beacon-shortcuts' }
    )
)

// ── Hook: useKeyboardShortcuts ───────────────────────────────────────

type ShortcutHandler = (action: string) => void

export function useKeyboardShortcuts(handler: ShortcutHandler, scope: KeyBinding['scope'] = 'global') {
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Don't trigger in input/textarea unless scope allows it
            const target = e.target as HTMLElement
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
            if (isInput && scope === 'global') return

            const { keybindings } = useShortcutStore.getState()
            const pressed = new Set<string>()
            if (e.ctrlKey || e.metaKey) pressed.add('Ctrl')
            if (e.shiftKey) pressed.add('Shift')
            if (e.altKey) pressed.add('Alt')
            if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
                pressed.add(e.key.length === 1 ? e.key.toUpperCase() : e.key)
            }

            for (const kb of keybindings) {
                if (!kb.enabled) continue
                if (kb.scope !== scope && kb.scope !== 'global') continue

                const kbKeys = new Set(kb.keys.map(k => k.length === 1 ? k.toUpperCase() : k))
                if (kbKeys.size !== pressed.size) continue

                let match = true
                for (const k of kbKeys) {
                    if (!pressed.has(k)) { match = false; break }
                }

                if (match) {
                    e.preventDefault()
                    e.stopPropagation()
                    handlerRef.current(kb.action)
                    return
                }
            }
        }

        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
    }, [scope])
}
