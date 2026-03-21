import {
    Gamepad2, Music, Film, BookOpen, FlaskConical, Monitor,
    Palette, Users, Swords, Laugh, Code2, Trophy,
    Shirt, UtensilsCrossed, Plane, Briefcase, Coins,
    Landmark, Newspaper, Pin, ImagePlus
} from 'lucide-react'
import type { ServerTag as ServerTagType } from 'beacon-sdk'
import styles from '../../styles/modules/ui/ServerTags.module.css'

interface ServerTagProps {
    tag: ServerTagType
    onClick?: () => void
    selected?: boolean
    customIcon?: string  // URL to custom icon (requires level 3+)
}

const TAG_ICONS: Record<ServerTagType, any> = {
    gaming: Gamepad2,
    music: Music,
    entertainment: Film,
    education: BookOpen,
    science: FlaskConical,
    technology: Monitor,
    art: Palette,
    community: Users,
    anime: Swords,
    memes: Laugh,
    programming: Code2,
    sports: Trophy,
    fashion: Shirt,
    food: UtensilsCrossed,
    travel: Plane,
    business: Briefcase,
    finance: Coins,
    politics: Landmark,
    news: Newspaper,
    other: Pin,
}

export function ServerTag({ tag, onClick, selected, customIcon }: ServerTagProps) {
    const Icon = TAG_ICONS[tag] || Pin
    const label = tag.charAt(0).toUpperCase() + tag.slice(1)

    return (
        <span
            className={`${styles.tag} ${selected ? styles.selected : ''} ${onClick ? styles.clickable : ''}`}
            onClick={onClick}
        >
            {customIcon ? (
                <img src={customIcon} alt="" className={styles.customIcon} />
            ) : (
                <Icon size={16} className={styles.icon} />
            )}
            {label}
        </span>
    )
}

interface ServerTagsProps {
    tags: ServerTagType[]
    onTagClick?: (tag: ServerTagType) => void
    selectedTags?: ServerTagType[]
    max?: number
    customIcons?: Record<string, string>
    boostLevel?: number
    onAddCustom?: () => void
}

export function ServerTags({
    tags, onTagClick, selectedTags = [], max,
    customIcons = {}, boostLevel = 0, onAddCustom
}: ServerTagsProps) {
    const displayed = max ? tags.slice(0, max) : tags
    const remaining = max && tags.length > max ? tags.length - max : 0
    const canCustomize = boostLevel >= 3

    return (
        <div className={styles.tags}>
            {displayed.map((tag) => (
                <ServerTag
                    key={tag}
                    tag={tag}
                    onClick={onTagClick ? () => onTagClick(tag) : undefined}
                    selected={selectedTags.includes(tag)}
                    customIcon={customIcons[tag]}
                />
            ))}
            {remaining > 0 && <span className={styles.more}>+{remaining}</span>}
            {canCustomize && onAddCustom && (
                <button
                    className={styles.addCustomBtn}
                    onClick={onAddCustom}
                    title="Add custom tag icon (Level 3+)"
                >
                    <ImagePlus size={14} />
                </button>
            )}
        </div>
    )
}
