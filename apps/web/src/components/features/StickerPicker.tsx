import { useState } from 'react'
import { X, Search, Star, Heart, Flame, Laugh } from 'lucide-react'
import styles from '../../styles/modules/features/StickerPicker.module.css'

interface Sticker {
    id: string
    emoji: string
    name: string
    category: string
    animated?: boolean
}


const STICKER_CATEGORIES = [
    { id: 'popular', label: 'Popular', icon: <Star size={16} /> },
    { id: 'love', label: 'Love', icon: <Heart size={16} /> },
    { id: 'hype', label: 'Hype', icon: <Flame size={16} /> },
    { id: 'fun', label: 'Fun', icon: <Laugh size={16} /> },
]

const STICKERS: Sticker[] = []


interface StickerPickerProps {
    isOpen: boolean
    onClose: () => void
    onStickerSelect: (emoji: string) => void
    onSuperReaction?: (emoji: string) => void
}

export function StickerPicker({ isOpen, onClose, onStickerSelect, onSuperReaction }: StickerPickerProps) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('popular')

    if (!isOpen) return null

    const filteredStickers = STICKERS.filter(s => {
        const matchesSearch = !search || String(s.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesCategory = activeCategory === 'popular' ? true : s.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className={styles.picker}>
            <div className={styles.header}>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${styles.activeTab}`}>
                        Stickers
                    </button>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            <div className={styles.searchRow}>
                <Search size={14} />
                <input
                    className={styles.searchInput}
                    placeholder="Search stickers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className={styles.categories}>
                {STICKER_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`${styles.catBtn} ${activeCategory === cat.id ? styles.activeCat : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                        title={cat.label}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {filteredStickers.map(sticker => (
                    <button
                        key={sticker.id}
                        className={`${styles.stickerBtn} ${sticker.animated ? styles.animated : ''}`}
                        onClick={() => onStickerSelect(sticker.emoji)}
                        title={sticker.name}
                    >
                        <span className={styles.stickerEmoji}>{sticker.emoji}</span>
                        {sticker.animated && <span className={styles.animatedBadge}>A</span>}
                    </button>
                ))}
            </div>
        </div>
    )
}
