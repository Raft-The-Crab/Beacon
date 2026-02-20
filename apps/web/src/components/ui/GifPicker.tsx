import { useState, useEffect, useRef } from 'react'
import { Search, Loader } from 'lucide-react'
import { giphyService, type GiphyGif } from '../../services/giphy'
import { Input } from './Input'
import styles from './GifPicker.module.css'

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className={styles.container} ref={pickerRef}>
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
}
