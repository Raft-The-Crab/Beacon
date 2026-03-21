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

interface SuperReaction {
    emoji: string
    name: string
    animation: 'bounce' | 'explode' | 'spin' | 'shake' | 'float'
}

const STICKER_CATEGORIES = [
    { id: 'popular', label: 'Popular', icon: <Star size={16} /> },
    { id: 'love', label: 'Love', icon: <Heart size={16} /> },
    { id: 'hype', label: 'Hype', icon: <Flame size={16} /> },
    { id: 'fun', label: 'Fun', icon: <Laugh size={16} /> },
]

const STICKERS: Sticker[] = [
    { id: 's1', emoji: '🎉', name: 'Party', category: 'popular', animated: true },
    { id: 's2', emoji: '🔥', name: 'Fire', category: 'hype', animated: true },
    { id: 's3', emoji: '❤️', name: 'Heart', category: 'love' },
    { id: 's4', emoji: '💀', name: 'Skull', category: 'fun' },
    { id: 's5', emoji: '👑', name: 'Crown', category: 'popular' },
    { id: 's6', emoji: '⚡', name: 'Lightning', category: 'hype', animated: true },
    { id: 's7', emoji: '🚀', name: 'Rocket', category: 'hype', animated: true },
    { id: 's8', emoji: '💜', name: 'Purple Heart', category: 'love' },
    { id: 's9', emoji: '😂', name: 'LOL', category: 'fun' },
    { id: 's10', emoji: '👀', name: 'Eyes', category: 'popular' },
    { id: 's11', emoji: '✨', name: 'Sparkles', category: 'popular', animated: true },
    { id: 's12', emoji: '🙏', name: 'Pray', category: 'popular' },
    { id: 's13', emoji: '💕', name: 'Hearts', category: 'love', animated: true },
    { id: 's14', emoji: '🎮', name: 'Gaming', category: 'fun' },
    { id: 's15', emoji: '🌟', name: 'Star', category: 'hype' },
    { id: 's16', emoji: '👻', name: 'Ghost', category: 'fun' },
    { id: 's17', emoji: '💎', name: 'Diamond', category: 'popular', animated: true },
    { id: 's18', emoji: '🫡', name: 'Salute', category: 'fun' },
    { id: 's19', emoji: '💖', name: 'Sparkling Heart', category: 'love', animated: true },
    { id: 's20', emoji: '🏆', name: 'Trophy', category: 'hype' },
]

const SUPER_REACTIONS: SuperReaction[] = [
    { emoji: '🔥', name: 'Fire Burst', animation: 'explode' },
    { emoji: '❤️', name: 'Love Burst', animation: 'float' },
    { emoji: '🎉', name: 'Confetti', animation: 'explode' },
    { emoji: '⚡', name: 'Shock', animation: 'shake' },
    { emoji: '🚀', name: 'Launch', animation: 'bounce' },
    { emoji: '💎', name: 'Gem Spin', animation: 'spin' },
]

interface StickerPickerProps {
    isOpen: boolean
    onClose: () => void
    onStickerSelect: (emoji: string) => void
    onSuperReaction?: (emoji: string, animation: string) => void
}

export function StickerPicker({ isOpen, onClose, onStickerSelect, onSuperReaction }: StickerPickerProps) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('popular')
    const [activeTab, setActiveTab] = useState<'stickers' | 'super'>('stickers')

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
                    <button
                        className={`${styles.tab} ${activeTab === 'stickers' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('stickers')}
                    >
                        Stickers
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'super' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('super')}
                    >
                        ✨ Super Reactions
                    </button>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {activeTab === 'stickers' ? (
                <>
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
                </>
            ) : (
                <div className={styles.superGrid}>
                    <p className={styles.superDesc}>Super Reactions add flair to your reactions! ✨</p>
                    {SUPER_REACTIONS.map(sr => (
                        <button
                            key={sr.emoji}
                            className={styles.superBtn}
                            onClick={() => onSuperReaction?.(sr.emoji, sr.animation)}
                        >
                            <span className={`${styles.superEmoji} ${styles[`anim-${sr.animation}`]}`}>
                                {sr.emoji}
                            </span>
                            <span className={styles.superName}>{sr.name}</span>
                            <span className={styles.superAnimation}>{sr.animation}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
