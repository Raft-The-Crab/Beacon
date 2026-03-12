import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Loader } from 'lucide-react'
import { giphyService, type GiphyGif } from '../../services/giphy'
import { Input } from './Input'
import styles from '../../styles/modules/ui/GifPicker.module.css'

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
  anchorElement?: HTMLElement | null
}

export function GifPicker({ onSelect, onClose, anchorElement }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    loadTrending()

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [onClose])

  useEffect(() => {
    if (searchQuery.trim()) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = setTimeout(() => {
        searchGifs(searchQuery)
      }, 500)
    } else {
      loadTrending()
    }
  }, [searchQuery])

  useEffect(() => {
    if (!anchorElement) {
      setPortalPosition(null)
      return
    }

    const updatePosition = () => {
      if (!pickerRef.current) return
      const anchorRect = anchorElement.getBoundingClientRect()
      const pickerRect = pickerRef.current.getBoundingClientRect()
      const viewportPadding = 8
      const gap = 8

      let left = anchorRect.right - pickerRect.width
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - pickerRect.width - viewportPadding))

      let top = anchorRect.top - pickerRect.height - gap
      if (top < viewportPadding) {
        top = Math.min(anchorRect.bottom + gap, window.innerHeight - pickerRect.height - viewportPadding)
      }

      setPortalPosition({ top, left })
    }

    const raf = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorElement])

  const loadTrending = async () => {
    setLoading(true)
    try {
      const response = await giphyService.getTrending(30)
      setGifs(response.data)
    } catch (error) {
      console.error('Failed to load trending GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    setLoading(true)
    try {
      const response = await giphyService.searchGifs(query, 30)
      setGifs(response.data)
    } catch (error) {
      console.error('Failed to search GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedGif(gif)
    onSelect(gif.images.original.url)
  }

  const pickerContent = (
    <div
      className={styles.container}
      ref={pickerRef}
      style={
        portalPosition
          ? {
              position: 'fixed',
              top: portalPosition.top,
              left: portalPosition.left,
              right: 'auto',
              bottom: 'auto',
              marginBottom: 0,
            }
          : undefined
      }
    >
      <div className={styles.header}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            type="text"
            placeholder="Search GIPHY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <Loader className={styles.spinner} size={32} />
            <p>Loading GIFs...</p>
          </div>
        ) : (
          <div className={styles.gifGrid}>
            {gifs.map((gif) => (
              <button
                key={gif.id}
                className={`${styles.gifItem} ${selectedGif?.id === gif.id ? styles.selected : ''}`}
                onClick={() => handleGifSelect(gif)}
                title={gif.title}
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {!loading && gifs.length === 0 && (
          <div className={styles.empty}>
            <p>No GIFs found</p>
            <p className={styles.emptyHint}>Try a different search term</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <img
          src="https://giphy.com/static/img/powered_by_giphy_light.png"
          alt="Powered by GIPHY"
          className={styles.tenorLogo}
        />
      </div>
    </div>
  )

  if (anchorElement && typeof document !== 'undefined') {
    return createPortal(pickerContent, document.body)
  }

  return pickerContent
}
