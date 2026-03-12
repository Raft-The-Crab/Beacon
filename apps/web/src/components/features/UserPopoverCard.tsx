import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { BadgeCheck, MessageSquare, Shield, UserPlus } from 'lucide-react'
import { Avatar } from '../ui'
import { UserBadges } from '../ui/UserBadges'
import type { UserBadge } from '@beacon/types'
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
        const popoverHeight = 340
        const popoverWidth = 300
        const viewportPadding = 12

        let top = rect.bottom + 8
        if (top + popoverHeight > window.innerHeight - viewportPadding) {
            top = rect.top - popoverHeight - 8
        }
        if (top < viewportPadding) {
            top = viewportPadding
        }

        const left = Math.min(
            Math.max(rect.left, viewportPadding),
            window.innerWidth - popoverWidth - viewportPadding,
        )

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
    const hasAdmin = (badges || []).includes('admin')
    const hasVerified = (badges || []).includes('verified')

    return (
        <>
            <div ref={triggerRef} onClick={handleClick} style={{ cursor: 'pointer', display: 'inline' }}>
                {children}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={popoverRef}
                            className="z-50 w-72 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 text-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                            style={{ top: position.top, left: position.left }}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${bannerColor}, color-mix(in srgb, ${bannerColor} 45%, #0b1220))` }} />

                            <div className="-mt-7 px-4">
                                <Avatar src={avatar} alt={username} size="lg" status={status} username={username} avatarDecorationId={avatarDecorationId} />
                            </div>

                            <div className="space-y-3 p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[17px] font-bold tracking-tight text-zinc-50">{username}</span>
                                    {hasVerified && <BadgeCheck size={15} className="text-emerald-400" />}
                                    {hasAdmin && <Shield size={15} className="text-red-400" />}
                                    {isBot && <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200">BOT</span>}
                                    <UserBadges badges={badges} isBot={isBot} size="sm" />
                                </div>

                                {customStatus && (
                                    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-300">{customStatus}</div>
                                )}

                                <div className="h-px bg-white/10" />

                                {bio && (
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{t('user_profile.about_me', { defaultValue: 'ABOUT ME' })}</div>
                                        <div className="text-sm leading-relaxed text-zinc-300">{bio}</div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{t('user_profile.member_since', { defaultValue: 'MEMBER SINCE' })}</div>
                                    <div className="text-sm text-zinc-300">{memberSince}</div>
                                </div>

                                {roles.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{t('user_profile.roles', { defaultValue: 'ROLES' })}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {roles.map((role, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200">
                                                    <span className="h-2 w-2 rounded-full" style={{ background: role.color }} />
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="h-px bg-white/10" />

                                <div className="flex items-center gap-2">
                                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-zinc-200 transition hover:border-white/30 hover:bg-white/10" onClick={onMessage} title={t('user_profile.message', { defaultValue: 'Message' })}>
                                        <MessageSquare size={16} />
                                    </button>
                                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-zinc-200 transition hover:border-white/30 hover:bg-white/10" onClick={onAddFriend} title={t('user_profile.add_friend', { defaultValue: 'Add Friend' })}>
                                        <UserPlus size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}
