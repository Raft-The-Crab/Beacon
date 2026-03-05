import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, UserPlus, MoreHorizontal } from 'lucide-react'
import { Avatar } from '../ui'
import { UserBadges } from '../ui/UserBadges'
import type { UserBadge } from '@beacon/types'
import styles from '../../styles/modules/features/UserPopoverCard.module.css'
import { useTranslationStore } from '../../stores/useTranslationStore'

interface UserPopoverCardProps {
    username: string
    avatar?: string
    status?: 'online' | 'idle' | 'dnd' | 'offline'
    customStatus?: string
    bio?: string
    badges?: UserBadge[]
    isBot?: boolean
    joinedAt?: string
    roles?: { name: string; color: string }[]
    bannerColor?: string
    avatarDecorationId?: string | null
    profileEffectId?: string | null
    children: React.ReactNode  // The trigger element
    onMessage?: () => void
    onAddFriend?: () => void
}

export function UserPopoverCard({
    username,
    avatar,
    status = 'online',
    customStatus,
    bio,
    badges,
    isBot,
    joinedAt,
    roles = [],
    bannerColor = '#5865f2',
    avatarDecorationId,
    profileEffectId,
    children,
    onMessage,
    onAddFriend,
}: UserPopoverCardProps) {
    const { t } = useTranslationStore()
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const popoverHeight = 340

        let top = rect.bottom + 8
        let left = rect.left

        // Flip up if too close to bottom
        if (top + popoverHeight > viewportHeight - 20) {
            top = rect.top - popoverHeight - 8
        }

        // Prevent overflow right
        if (left + 320 > window.innerWidth) {
            left = window.innerWidth - 330
        }

        setPosition({ top, left })
        setIsOpen(!isOpen)
    }

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return
        const handleOutside = (e: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [isOpen])

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen])

    const dateStr = joinedAt ? new Date(joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 1, 2024'
    const memberSince = t('user_profile.joined_at', { date: dateStr, defaultValue: `Member since ${dateStr}` })

    // Profile Effect parsing (MOCK DATA mapped to CSS vars as a demo)
    const getEffectColor = (id?: string | null) => {
        if (id === 'eff_1') return '#ff73fa'
        if (id === 'eff_2') return '#43b581'
        if (id === 'eff_3') return '#7b2ff7'
        return null
    }
    const effectColor = getEffectColor(profileEffectId)

    return (
        <>
            <div ref={triggerRef} onClick={handleClick} style={{ cursor: 'pointer', display: 'inline' }}>
                {children}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={popoverRef}
                        className={`${styles.popover} glass`}
                        style={{ top: position.top, left: position.left }}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {/* Profile Effect Particle Overlay */}
                        {effectColor && (
                            <div className={styles.profileEffectContainer} style={{ background: `radial-gradient(circle at top center, ${effectColor}15, transparent)` }}>
                                <div className={styles.particleField} style={{ '--effect-color': effectColor } as any} />
                            </div>
                        )}

                        {/* Banner */}
                        <div className={styles.banner} style={{ background: bannerColor }} />

                        {/* Avatar */}
                        <div className={styles.avatarSection}>
                            <Avatar src={avatar} alt={username} size="lg" status={status} username={username} avatarDecorationId={avatarDecorationId} />
                        </div>

                        {/* Info */}
                        <div className={styles.body}>
                            <div className={styles.nameRow}>
                                <span className={styles.username}>{username}</span>
                                {isBot && <span className={styles.botTag}>BOT</span>}
                                <UserBadges badges={badges} isBot={isBot} size="sm" />
                            </div>

                            {customStatus && (
                                <div className={styles.customStatus}>{customStatus}</div>
                            )}

                            <div className={styles.divider} />

                            {bio && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>{t('user_profile.about_me', { defaultValue: 'ABOUT ME' })}</div>
                                    <div className={styles.sectionContent}>{bio}</div>
                                </div>
                            )}

                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>{t('user_profile.member_since', { defaultValue: 'MEMBER SINCE' })}</div>
                                <div className={styles.sectionContent}>{memberSince}</div>
                            </div>

                            {roles.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>{t('user_profile.roles', { defaultValue: 'ROLES' })}</div>
                                    <div className={styles.roles}>
                                        {roles.map((role, i) => (
                                            <span key={i} className={styles.roleBadge}>
                                                <span className={styles.roleDot} style={{ background: role.color }} />
                                                {role.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.divider} />

                            {/* Actions */}
                            <div className={styles.actions}>
                                <button className={styles.actionBtn} onClick={onMessage} title={t('user_profile.message', { defaultValue: 'Message' })}>
                                    <MessageSquare size={16} />
                                </button>
                                <button className={styles.actionBtn} onClick={onAddFriend} title={t('user_profile.add_friend', { defaultValue: 'Add Friend' })}>
                                    <UserPlus size={16} />
                                </button>
                                <button className={styles.actionBtn} title={t('user_profile.more', { defaultValue: 'More' })}>
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
