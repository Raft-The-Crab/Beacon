import { useState } from 'react'
import { Check, Crown, Lock, Palette, MessageSquare } from 'lucide-react'
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
            <div className={styles.header}>
                <Palette size={18} />
                <h3>Profile Art</h3>
            </div>

            <div className={styles.tabs}>
                {(['frame', 'chat'] as const).map(t => (
                    <button
                        key={t}
                        className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t === 'frame' ? 'Frames' : 'Chat Bubbles'}
                    </button>
                ))}
            </div>
            {user && (
                tab === 'frame' ? (
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
                ) : (
                    <div>
                        {!hasBeaconPlus && (
                            <div className={styles.plusOnlyHint}>
                                <Lock size={14} />
                                Chat bubbles are customizable for Beacon+ members only.
                            </div>
                        )}
                        <div className={styles.grid}>
                            {bubbleOptions.map((bubble) => (
                                <button
                                    type="button"
                                    key={bubble.id}
                                    className={`${styles.artCard} ${chatBubbleStyle === bubble.id ? styles.equipped : ''} ${!hasBeaconPlus ? styles.locked : ''}`}
                                    onClick={() => {
                                        if (!hasBeaconPlus) return
                                        setChatBubbleStyle(bubble.id)
                                    }}
                                    aria-disabled={!hasBeaconPlus}
                                >
                                    <div className={`${styles.preview} ${styles[`preview-${bubble.id}`]}`}>
                                        {chatBubbleStyle === bubble.id && (
                                            <div className={styles.equippedBadge}>
                                                <Check size={14} />
                                            </div>
                                        )}
                                        {!hasBeaconPlus && (
                                            <div className={styles.lockOverlay}>
                                                <Lock size={18} />
                                            </div>
                                        )}
                                        <MessageSquare size={26} style={{ color: 'rgba(255,255,255,0.86)' }} />
                                    </div>
                                    <div className={styles.artInfo}>
                                        <span className={styles.artName}>{bubble.label}</span>
                                        <span className={styles.artRarity}>{bubble.copy}</span>
                                    </div>
                                    <div className={styles.freeTag}>{hasBeaconPlus ? 'ACTIVE' : 'BEACON+'}</div>
                                </button>
                            ))}
                        </div>

                        <div className={styles.intensitySection}>
                            <span className={styles.intensityTitle}>Bubble Intensity</span>
                            <div className={styles.intensityRow}>
                                {intensityOptions.map((intensity) => (
                                    <button
                                        key={intensity}
                                        type="button"
                                        className={`${styles.intensityButton} ${chatBubbleIntensity === intensity ? styles.intensityButtonActive : ''}`}
                                        onClick={() => {
                                            if (!hasBeaconPlus) return
                                            setChatBubbleIntensity(intensity)
                                        }}
                                        disabled={!hasBeaconPlus}
                                    >
                                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.previewPanel}>
                            <div className={styles.previewPanelTitle}>Live Preview</div>
                            <div className={`${styles.previewBubble} ${styles[`preview-${chatBubbleStyle}`]} ${styles[`previewIntensity-${chatBubbleIntensity}`]}`}>
                                <div className={styles.previewAuthor}>{user.username}</div>
                                <div className={styles.previewText}>This is how your messages will look in chat.</div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    )
}
