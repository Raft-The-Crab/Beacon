/**
 * Focus Mode Overlay — Pillar VII: Omni-Nexus
 * When active, dims and blurs non-focused areas to reduce visual noise.
 * Toggle with Ctrl+Shift+F or from useShortcutStore.
 */

import { useShortcutStore } from '../../hooks/useKeyboardShortcuts'
import styles from '../../styles/modules/ui/FocusMode.module.css'

export function FocusMode() {
    const { focusMode } = useShortcutStore()

    if (!focusMode) return null

    return (
        <>
            {/* Top dim overlay */}
            <div className={`${styles.dimOverlay} ${styles.top}`} />
            {/* Left dim overlay (sidebar area) */}
            <div className={`${styles.dimOverlay} ${styles.left}`} />
            {/* Right dim overlay (member list area) */}
            <div className={`${styles.dimOverlay} ${styles.right}`} />
            {/* Focus indicator */}
            <div className={styles.indicator}>
                <span className={styles.dot} />
                <span>Focus Mode</span>
            </div>
        </>
    )
}
