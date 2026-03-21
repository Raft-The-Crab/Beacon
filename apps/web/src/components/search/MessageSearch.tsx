import { useState, useRef } from 'react'
import { Search, X, Hash, Calendar, User, ArrowUp, ArrowDown, Filter } from 'lucide-react'
import styles from '../../styles/modules/features/MessageSearch.module.css'

interface SearchResult {
  id: string
  content: string
  authorName: string
  authorAvatar?: string
  channelName: string
  timestamp: string
  matchSnippet: string
}

// Empty search results until API integration
const DEMO_RESULTS: SearchResult[] = []

interface MessageSearchProps {
  isOpen: boolean
  onClose: () => void
  onJumpToMessage?: (messageId: string) => void
}

export function MessageSearch({ isOpen, onClose, onJumpToMessage }: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'channel' | 'date'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const results = query.length > 0
    ? DEMO_RESULTS.filter(r =>
      String(r.content || '').toLowerCase().includes(query.toLowerCase()) ||
      String(r.authorName || '').toLowerCase().includes(query.toLowerCase()) ||
      String(r.channelName || '').toLowerCase().includes(query.toLowerCase())
    )
    : []

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onJumpToMessage?.(results[selectedIndex].id)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className={styles.searchPanel}>
      <div className={styles.searchHeader}>
        <h3 className={styles.searchTitle}>Search Messages</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.searchInputRow}>
        <Search size={16} className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search messages..."
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.filters}>
        {([
          { key: 'all' as const, label: 'All', icon: <Filter size={14} /> },
          { key: 'user' as const, label: 'From User', icon: <User size={14} /> },
          { key: 'channel' as const, label: 'In Channel', icon: <Hash size={14} /> },
          { key: 'date' as const, label: 'Date', icon: <Calendar size={14} /> },
        ]).map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${activeFilter === f.key ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      <div className={styles.results}>
        {results.length > 0 ? (
          <>
            <div className={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</div>
            {results.map((result, i) => (
              <button
                key={result.id}
                className={`${styles.resultItem} ${i === selectedIndex ? styles.selectedResult : ''}`}
                onClick={() => onJumpToMessage?.(result.id)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className={styles.resultChannel}>
                  <Hash size={13} />
                  {result.channelName}
                </div>
                <div className={styles.resultContent}>
                  <span className={styles.resultAuthor}>{result.authorName}</span>
                  <span className={styles.resultText} dangerouslySetInnerHTML={{ __html: result.matchSnippet }} />
                </div>
                <span className={styles.resultTime}>{result.timestamp}</span>
              </button>
            ))}
          </>
        ) : query.length > 0 ? (
          <div className={styles.noResults}>
            <Search size={36} />
            <p>No results for "<strong>{query}</strong>"</p>
            <span>Try different keywords or filters</span>
          </div>
        ) : (
          <div className={styles.searchTips}>
            <h4>Search Tips</h4>
            <div className={styles.tip}><code>from:</code> Search by user</div>
            <div className={styles.tip}><code>in:</code> Search in a channel</div>
            <div className={styles.tip}><code>before:</code> / <code>after:</code> Filter by date</div>
            <div className={styles.tip}><code>has:</code> link, image, embed, file</div>
            <div className={styles.shortcutHint}>
              <span><ArrowUp size={12} /> <ArrowDown size={12} /> to navigate</span>
              <span>Enter to jump</span>
              <span>Esc to close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
