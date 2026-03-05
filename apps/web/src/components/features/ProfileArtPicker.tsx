import { useState } from 'react'
import { Check, Lock, Coins, Sparkles, Crown, Palette } from 'lucide-react'
import { useProfileArtStore, ProfileArt } from '../../stores/useProfileArtStore'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import styles from '../../styles/modules/features/ProfileArtPicker.module.css'
import avatarStyles from '../../styles/modules/ui/Avatar.module.css'

const RARITY_COLORS: Record<string, string> = {
    common: '#8e9297',
    rare: '#5865f2',
    epic: '#7b2ff7',
    legendary: '#f0b232',
}

export function ProfileArtPicker() {
    const { arts, equippedFrame, equippedBanner, equipArt, unlockArt } = useProfileArtStore()
    const { balance } = useBeacoinStore()
    const [tab, setTab] = useState<'frame' | 'banner' | 'effect'>('frame')
    const [buying, setBuying] = useState<string | null>(null)

    const filteredArts = arts.filter(a => a.type === tab)

    const handleEquip = (art: ProfileArt) => {
        if (!art.unlocked) return
        equipArt(art.id, art.type)
    }

    const handleBuy = (art: ProfileArt) => {
        if (art.price > balance || buying) return
        setBuying(art.id)
        // Simulate purchase
        setTimeout(() => {
            unlockArt(art.id)
            equipArt(art.id, art.type)
            setBuying(null)
        }, 600)
    }

    const isEquipped = (art: ProfileArt) => {
        if (art.type === 'frame') return equippedFrame === art.id
        if (art.type === 'banner') return equippedBanner === art.id
        return false
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Palette size={18} />
                <h3>Profile Art</h3>
            </div>

            <div className={styles.tabs}>
                {(['frame', 'banner', 'effect'] as const).map(t => (
                    <button
                        key={t}
                        className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t === 'frame' ? 'Frames' : t === 'banner' ? 'Banners' : 'Effects'}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {filteredArts.map(art => (
                    <div
                        key={art.id}
                        className={`${styles.artCard} ${isEquipped(art) ? styles.equipped : ''} ${!art.unlocked ? styles.locked : ''}`}
                        onClick={() => art.unlocked ? handleEquip(art) : handleBuy(art)}
                    >
                        <div className={styles.preview} style={!art.imageUrl ? { background: art.preview } : undefined}>
                            {art.imageUrl && (
                                <img
                                    src={art.imageUrl}
                                    alt={art.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    className={art.animation && art.type === 'frame' ? avatarStyles[`anim-${art.animation}`] : ''}
                                />
                            )}
                            {!art.imageUrl && <div style={{ width: '100%', height: '100%', background: art.preview }} />}
                            {isEquipped(art) && (
                                <div className={styles.equippedBadge}>
                                    <Check size={14} />
                                </div>
                            )}
                            {!art.unlocked && (
                                <div className={styles.lockOverlay}>
                                    <Lock size={20} />
                                </div>
                            )}
                            {buying === art.id && (
                                <div className={styles.buyingOverlay}>
                                    <Sparkles size={20} className={styles.buyingSpin} />
                                </div>
                            )}
                        </div>
                        <div className={styles.artInfo}>
                            <span className={styles.artName}>{art.name}</span>
                            <span className={styles.artRarity} style={{ color: RARITY_COLORS[art.rarity] }}>
                                {art.rarity === 'legendary' && <Crown size={10} />}
                                {art.rarity.charAt(0).toUpperCase() + art.rarity.slice(1)}
                            </span>
                        </div>
                        {!art.unlocked && (
                            <div className={styles.priceTag}>
                                <Coins size={12} />
                                <span>{art.price}</span>
                            </div>
                        )}
                        {art.unlocked && art.price === 0 && (
                            <div className={styles.freeTag}>FREE</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
