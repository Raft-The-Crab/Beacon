import { useState } from 'react'
import { Check, Crown, Lock, Palette } from 'lucide-react'
import { useProfileArtStore, ProfileArt } from '../../stores/useProfileArtStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore, type ChatBubbleStyle, type ChatBubbleIntensity } from '../../stores/useUIStore'
import styles from '../../styles/modules/features/ProfileArtPicker.module.css'
import avatarStyles from '../../styles/modules/ui/Avatar.module.css'

const RARITY_COLORS: Record<string, string> = {
    common: '#8e9297',
    rare: '#5865f2',
    epic: '#7b2ff7',
    legendary: '#f0b232',
}

export function ProfileArtPicker() {
    const { arts, equippedFrame, equipArt } = useProfileArtStore()
    const { user } = useAuthStore()
    const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)
    const chatBubbleStyle = useUIStore((state) => state.chatBubbleStyle)
    const chatBubbleIntensity = useUIStore((state) => state.chatBubbleIntensity)
    const setChatBubbleStyle = useUIStore((state) => state.setChatBubbleStyle)
    const setChatBubbleIntensity = useUIStore((state) => state.setChatBubbleIntensity)
    const [tab, setTab] = useState<'frame' | 'chat'>('frame')

    const filteredArts = arts.filter(a => a.type === 'frame')
    const bubbleOptions: { id: ChatBubbleStyle; label: string; copy: string }[] = [
        { id: 'reef', label: 'Reef', copy: 'Playful ocean-card gradient with bright highlights.' },
        { id: 'jelly', label: 'Jelly', copy: 'Soft candy glow with a gelatin shimmer.' },
        { id: 'comic', label: 'Comic', copy: 'Punchy cartoon card with halftone energy.' },
        { id: 'aurora', label: 'Aurora', copy: 'Clean premium glow with subtle color drift.' },
        { id: 'prism', label: 'Prism', copy: 'Iridescent mixed-spectrum glass finish.' },
        { id: 'carbon', label: 'Carbon', copy: 'Dark, dense tech panel with a crisp edge.' },
    ]
    const intensityOptions: ChatBubbleIntensity[] = ['low', 'medium', 'high']

    const handleEquip = (art: ProfileArt) => {
        equipArt(art.id, art.type)
    }

    const isEquipped = (art: ProfileArt) => {
        return equippedFrame === art.id
    }

    return (
        <div className={styles.container}>

            {/* Tabs removed to disable chat bubbles for now */}
            {user && (
                <div className={styles.grid}>
                    {filteredArts.map(art => (
                        <button
                            type="button"
                            key={art.id}
                            className={`${styles.artCard} ${isEquipped(art) ? styles.equipped : ''}`}
                            onClick={() => handleEquip(art)}
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
                            </div>
                            <div className={styles.artInfo}>
                                <span className={styles.artName}>{art.name}</span>
                                <span className={styles.artRarity} style={{ color: RARITY_COLORS[art.rarity] }}>
                                    {art.rarity === 'epic' && <Crown size={10} />}
                                    {art.rarity.charAt(0).toUpperCase() + art.rarity.slice(1)}
                                </span>
                            </div>
                            <div className={styles.freeTag}>FREE</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
