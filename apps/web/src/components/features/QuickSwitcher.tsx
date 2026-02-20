import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, Volume2, Users, MessageSquare, Server, X, Clock, ArrowRight } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useDMStore } from '../../stores/useDMStore'
import styles from './QuickSwitcher.module.css'

interface SearchResult {
  id: string
  type: 'channel' | 'server' | 'dm' | 'user'
  label: string
  sublabel?: string
  icon?: React.ReactNode
  action: () => void
}

interface QuickSwitcherProps {
  onClose: () => void
}

const RECENT_KEY = 'beacon_quick_switcher_recent'
const MAX_RECENT = 8

function getRecent(): SearchResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

function saveRecent(item: Omit<SearchResult, 'icon' | 'action'>) {
  try {
    const existing = getRecent().filter(r => r.id !== item.id)
    const updated = [item, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {}
}

export function QuickSwitcher({ onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const servers = useServerStore(state => state.servers || [])
  const currentServer = useServerStore(state => state.currentServer)
  const user = useAuthStore(state => state.user)
  const dms = useDMStore(state => state.conversations || [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const buildResults = useCallback((q: string): SearchResult[] => {
    const lower = q.toLowerCase().trim()
    const results: SearchResult[] = []

    if (!lower) {
      // Show recent + current server channels
      const recentRaw = getRecent()
      for (const r of recentRaw) {
        results.push({
          ...r,
          icon: r.type === 'channel' ? <Hash size={16} /> : r.type === 'server' ? <Server size={16} /> : <Users size={16} />,
          action: () => {
            if (r.type === 'channel' && currentServer) navigate(`/channels/${currentServer.id}/${r.id}`)
            else if (r.type === 'server') navigate(`/channels/${r.id}`)
            else if (r.type === 'dm') navigate(`/dms/${r.id}`)
            onClose()
          }
        })
        if (results.length >= 5) break
      }

      // Also show first few channels of current server
      if (currentServer?.channels) {
        for (const ch of (currentServer.channels as any[]).slice(0, 5)) {
          if (!results.find(r => r.id === ch.id)) {
            results.push({
              id: ch.id,
              type: 'channel',
              label: `#${ch.name}`,
              sublabel: currentServer.name,
              icon: <Hash size={16} />,
              action: () => { navigate(`/channels/${currentServer.id}/${ch.id}`); onClose() }
            })
          }
        }
      }
      return results
    }

    // Search servers
    for (const server of (servers as any[])) {
      if (server.name?.toLowerCase().includes(lower)) {
        results.push({
          id: server.id,
          type: 'server',
          label: server.name,
          sublabel: `${server.members?.length || 0} members`,
          icon: <Server size={16} />,
          action: () => {
            navigate(`/channels/${server.id}`)
            saveRecent({ id: server.id, type: 'server', label: server.name })
            onClose()
          }
        })
      }
    }

    // Search channels in current server
    if (currentServer?.channels) {
      for (const ch of (currentServer.channels as any[])) {
        if (ch.name?.toLowerCase().includes(lower)) {
          const isVoice = ch.type === 2 || String(ch.type).toLowerCase() === 'voice'
          results.push({
            id: ch.id,
            type: 'channel',
            label: `#${ch.name}`,
            sublabel: currentServer.name,
            icon: isVoice ? <Volume2 size={16} /> : <Hash size={16} />,
            action: () => {
              navigate(`/channels/${currentServer.id}/${ch.id}`)
              saveRecent({ id: ch.id, type: 'channel', label: `#${ch.name}`, sublabel: currentServer.name })
              onClose()
            }
          })
        }
      }
    }

    // Search channels across all servers
    for (const server of (servers as any[])) {
      if (server.id === currentServer?.id) continue
      for (const ch of (server.channels || [])) {
        if ((ch as any).name?.toLowerCase().includes(lower)) {
          results.push({
            id: (ch as any).id,
            type: 'channel',
            label: `#${(ch as any).name}`,
            sublabel: server.name,
            icon: <Hash size={16} />,
            action: () => {
              navigate(`/channels/${server.id}/${(ch as any).id}`)
              saveRecent({ id: (ch as any).id, type: 'channel', label: `#${(ch as any).name}`, sublabel: server.name })
              onClose()
            }
          })
        }
      }
    }

    // Search DMs
    for (const dm of (dms as any[])) {
      const name = dm.username || dm.name || ''
      if (name.toLowerCase().includes(lower)) {
        results.push({
          id: dm.id,
          type: 'dm',
          label: name,
          sublabel: 'Direct Message',
          icon: <MessageSquare size={16} />,
          action: () => {
            navigate(`/dms/${dm.id}`)
            saveRecent({ id: dm.id, type: 'dm', label: name, sublabel: 'Direct Message' })
            onClose()
          }
        })
      }
    }

    return results.slice(0, 12)
  }, [servers, currentServer, dms, navigate, onClose])

  useEffect(() => {
    const r = buildResults(query)
    setResults(r)
    setSelected(0)
  }, [query, buildResults])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selected]) results[selected].action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const typeLabel = (type: string) => {
    if (type === 'channel') return 'CHANNEL'
    if (type === 'server') return 'SERVER'
    if (type === 'dm') return 'DM'
    if (type === 'user') return 'USER'
    return type.toUpperCase()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.switcher} onClick={e => e.stopPropagation()}>
        <div className={styles.inputWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Jump to a channel, server, or DM..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          <kbd className={styles.escKey}>ESC</kbd>
        </div>

        {results.length > 0 ? (
          <div className={styles.results}>
            {!query && <div className={styles.sectionLabel}><Clock size={12} /> RECENT & SUGGESTED</div>}
            {query && <div className={styles.sectionLabel}><Search size={12} /> RESULTS FOR "{query.toUpperCase()}"</div>}
            {results.map((r, i) => (
              <button
                key={r.id}
                className={`${styles.result} ${i === selected ? styles.resultSelected : ''}`}
                onClick={r.action}
                onMouseEnter={() => setSelected(i)}
              >
                <span className={styles.resultIcon}>{r.icon}</span>
                <span className={styles.resultContent}>
                  <span className={styles.resultLabel}>{r.label}</span>
                  {r.sublabel && <span className={styles.resultSublabel}>{r.sublabel}</span>}
                </span>
                <span className={styles.resultType}>{typeLabel(r.type)}</span>
                <ArrowRight size={14} className={styles.resultArrow} />
              </button>
            ))}
          </div>
        ) : query ? (
          <div className={styles.empty}>
            <Search size={32} />
            <p>No results for "<strong>{query}</strong>"</p>
            <span>Try searching for a channel, server, or username</span>
          </div>
        ) : null}

        <div className={styles.footer}>
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
