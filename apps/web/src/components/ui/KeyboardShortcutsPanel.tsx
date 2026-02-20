import { useEffect } from 'react'
import { X, Command } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import styles from './KeyboardShortcutsPanel.module.css'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Open Quick Switcher', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show Keyboard Shortcuts', category: 'Navigation' },
  { keys: ['Alt', '↑'], description: 'Jump to previous unread channel', category: 'Navigation' },
  { keys: ['Alt', '↓'], description: 'Jump to next unread channel', category: 'Navigation' },
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Toggle member list', category: 'Navigation' },

  // Messaging
  { keys: ['Enter'], description: 'Send message', category: 'Messaging' },
  { keys: ['Shift', 'Enter'], description: 'New line', category: 'Messaging' },
  { keys: ['↑'], description: 'Edit last message', category: 'Messaging' },
  { keys: ['/'], description: 'Open slash command picker', category: 'Messaging' },
  { keys: ['Esc'], description: 'Cancel reply / close picker', category: 'Messaging' },

  // Formatting
  { keys: ['Ctrl', 'B'], description: 'Bold', category: 'Formatting' },
  { keys: ['Ctrl', 'I'], description: 'Italic', category: 'Formatting' },
  { keys: ['Ctrl', 'U'], description: 'Underline', category: 'Formatting' },
  { keys: ['Ctrl', 'Shift', 'X'], description: 'Strikethrough', category: 'Formatting' },

  // App
  { keys: ['Ctrl', ','], description: 'Open Settings', category: 'App' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle DND', category: 'App' },
  { keys: ['Ctrl', 'Shift', 'H'], description: 'Open Help', category: 'App' },
  { keys: ['Escape'], description: 'Close current modal', category: 'App' },

  // Voice
  { keys: ['Ctrl', 'Shift', 'M'], description: 'Toggle microphone mute', category: 'Voice' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle deafen', category: 'Voice' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Push-to-talk (hold)', category: 'Voice' },
]

const CATEGORIES = ['Navigation', 'Messaging', 'Formatting', 'App', 'Voice']

export function KeyboardShortcutsPanel() {
  const { showKeyboardShortcuts, setShowKeyboardShortcuts } = useUIStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setShowKeyboardShortcuts(!showKeyboardShortcuts)
      }
      if (e.key === 'Escape' && showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showKeyboardShortcuts, setShowKeyboardShortcuts])

  if (!showKeyboardShortcuts) return null

  const grouped: Record<string, Shortcut[]> = {}
  for (const cat of CATEGORIES) {
    grouped[cat] = SHORTCUTS.filter(s => s.category === cat)
  }

  return (
    <div className={styles.overlay} onClick={() => setShowKeyboardShortcuts(false)}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Command size={20} className={styles.headerIcon} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className={styles.closeBtn} onClick={() => setShowKeyboardShortcuts(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {CATEGORIES.map(cat => (
            <div key={cat} className={styles.category}>
              <h3 className={styles.categoryTitle}>{cat}</h3>
              <div className={styles.shortcuts}>
                {grouped[cat].map((shortcut, i) => (
                  <div key={i} className={styles.shortcutRow}>
                    <span className={styles.shortcutDesc}>{shortcut.description}</span>
                    <div className={styles.keys}>
                      {shortcut.keys.map((key, j) => (
                        <span key={j} className={styles.key}>{key}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          Press <span className={styles.key}>Ctrl+/</span> to toggle this panel
        </div>
      </div>
    </div>
  )
}
