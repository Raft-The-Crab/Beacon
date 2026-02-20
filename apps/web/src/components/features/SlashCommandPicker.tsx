import { useEffect, useRef, useState, useCallback } from 'react'
import { Zap, Music, Hash, Image, Poll, Calendar, Smile, Clock, Gift, Mic } from 'lucide-react'
import styles from './SlashCommandPicker.module.css'

export interface SlashCommand {
  name: string
  description: string
  usage?: string
  category: 'chat' | 'media' | 'fun' | 'utility' | 'poll' | 'bot'
  icon: React.ReactNode
  onSelect?: (command: SlashCommand) => void
}

const BUILT_IN_COMMANDS: SlashCommand[] = [
  // Chat
  { name: 'me', description: 'Perform an action (italic text)', usage: '/me <action>', category: 'chat', icon: <Smile size={16} /> },
  { name: 'spoiler', description: 'Mark text as a spoiler', usage: '/spoiler <text>', category: 'chat', icon: <Hash size={16} /> },
  { name: 'shrug', description: 'Append ¯\\_(ツ)_/¯ to message', category: 'chat', icon: <Smile size={16} /> },
  { name: 'tableflip', description: '(╯°□°）╯︵ ┻━┻', category: 'chat', icon: <Smile size={16} /> },
  { name: 'unflip', description: '┬─┬ ノ( ゜-゜ノ)', category: 'chat', icon: <Smile size={16} /> },
  // Media
  { name: 'gif', description: 'Search and send a GIF', usage: '/gif <search>', category: 'media', icon: <Image size={16} /> },
  { name: 'image', description: 'Upload an image', category: 'media', icon: <Image size={16} /> },
  // Poll
  { name: 'poll', description: 'Create a poll', usage: '/poll <question> | <option1> | <option2>', category: 'poll', icon: <Poll size={16} /> },
  // Utility
  { name: 'reminder', description: 'Set a reminder', usage: '/reminder <time> <message>', category: 'utility', icon: <Clock size={16} /> },
  { name: 'event', description: 'Create a server event', usage: '/event <name> <date>', category: 'utility', icon: <Calendar size={16} /> },
  { name: 'schedule', description: 'Schedule a message', usage: '/schedule <time> <message>', category: 'utility', icon: <Clock size={16} /> },
  // Fun
  { name: 'roll', description: 'Roll a dice', usage: '/roll <sides>', category: 'fun', icon: <Gift size={16} /> },
  { name: 'flip', description: 'Flip a coin', category: 'fun', icon: <Gift size={16} /> },
  { name: 'rps', description: 'Rock, paper, scissors', category: 'fun', icon: <Gift size={16} /> },
  // Bot integrations
  { name: 'play', description: 'Play music in voice channel', usage: '/play <song or URL>', category: 'bot', icon: <Music size={16} /> },
  { name: 'record', description: 'Start voice channel recording', category: 'bot', icon: <Mic size={16} /> },
]

const CATEGORY_LABELS: Record<string, string> = {
  chat: 'CHAT',
  media: 'MEDIA',
  poll: 'POLLS',
  utility: 'UTILITY',
  fun: 'FUN',
  bot: 'BOT',
}

const CATEGORY_COLORS: Record<string, string> = {
  chat: 'var(--beacon-brand)',
  media: '#7289da',
  poll: '#43b581',
  utility: '#faa61a',
  fun: '#f04747',
  bot: '#9b59b6',
}

interface SlashCommandPickerProps {
  query: string
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
  extraCommands?: SlashCommand[]
}

export function SlashCommandPicker({
  query,
  onSelect,
  onClose,
  anchorRef,
  extraCommands = [],
}: SlashCommandPickerProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const allCommands = [...BUILT_IN_COMMANDS, ...extraCommands]

  const filtered = query.trim()
    ? allCommands.filter(
        c =>
          c.name.toLowerCase().startsWith(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands

  // Group by category
  const grouped: Record<string, SlashCommand[]> = {}
  for (const cmd of filtered) {
    if (!grouped[cmd.category]) grouped[cmd.category] = []
    grouped[cmd.category].push(cmd)
  }

  // Flat index for keyboard nav
  const flat = filtered

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (flat[selectedIdx]) {
          onSelect(flat[selectedIdx])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [flat, selectedIdx, onSelect, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRef, onClose])

  if (filtered.length === 0) {
    return (
      <div className={styles.picker}>
        <div className={styles.empty}>
          <Zap size={20} />
          <span>No commands match <strong>/{query}</strong></span>
        </div>
      </div>
    )
  }

  let flatIdx = 0

  return (
    <div className={styles.picker} ref={listRef}>
      <div className={styles.header}>
        <Zap size={13} className={styles.headerIcon} />
        <span>SLASH COMMANDS</span>
      </div>
      <div className={styles.list}>
        {Object.entries(grouped).map(([cat, cmds]) => (
          <div key={cat} className={styles.group}>
            <div
              className={styles.groupLabel}
              style={{ color: CATEGORY_COLORS[cat] }}
            >
              {CATEGORY_LABELS[cat] || cat.toUpperCase()}
            </div>
            {cmds.map(cmd => {
              const idx = flatIdx++
              return (
                <div
                  key={cmd.name}
                  data-idx={idx}
                  className={`${styles.item} ${idx === selectedIdx ? styles.selected : ''}`}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelect(cmd)
                  }}
                >
                  <span className={styles.itemIcon}>{cmd.icon}</span>
                  <div className={styles.itemContent}>
                    <span className={styles.itemName}>/{cmd.name}</span>
                    <span className={styles.itemDesc}>{cmd.description}</span>
                  </div>
                  {cmd.usage && (
                    <span className={styles.itemUsage}>{cmd.usage}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <span><kbd>↑↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Select</span>
        <span><kbd>Tab</kbd> Complete</span>
        <span><kbd>Esc</kbd> Dismiss</span>
      </div>
    </div>
  )
}

export { BUILT_IN_COMMANDS }
