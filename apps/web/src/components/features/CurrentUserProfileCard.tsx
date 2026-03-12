import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Edit2, Copy, Users, LogOut, Music2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { apiClient } from '../../services/apiClient'
import { BeaconNotesModal } from '../modals/BeaconNotesModal'
import styles from '../../styles/modules/features/CurrentUserProfileCard.module.css'

interface CurrentUserProfileCardProps {
    children: React.ReactNode
}

export function CurrentUserProfileCard({ children }: CurrentUserProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showNotesModal, setShowNotesModal] = useState(false)
    const [profileNote, setProfileNote] = useState<any>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const setShowUserSettings = useUIStore(state => state.setShowUserSettings)
    const updateStatus = useAuthStore(state => state.updateProfile)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        const popoverHeight = 420
        const popoverWidth = 330
        const viewportPadding = 12

        let top = rect.top - popoverHeight - 12
        if (top < viewportPadding) {
            top = Math.min(window.innerHeight - popoverHeight - viewportPadding, rect.bottom + 8)
        }

        let left = rect.left
        if (left + popoverWidth > window.innerWidth - viewportPadding) {
            left = window.innerWidth - popoverWidth - viewportPadding
        }
        if (left < viewportPadding) {
            left = viewportPadding
        }

        setPosition({ top, left })
        setIsOpen(!isOpen)
    }

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

    useEffect(() => {
        if (!isOpen) return
        apiClient.request('GET', '/notes/profile/me').then((res) => {
            if (res.success && res.data?.note) {
                setProfileNote(res.data.note)
            }
        }).catch(() => {
            setProfileNote(null)
        })
    }, [isOpen, showNotesModal])

    if (!user) return <>{children}</>

    const copyUserId = () => {
        navigator.clipboard.writeText(user.id)
        setIsOpen(false)
    }

    const handleStatusChange = async (newStatus: 'online' | 'idle' | 'dnd' | 'invisible') => {
        try {
            await updateStatus({ status: newStatus } as any)
            await apiClient.request('PATCH', '/users/me', { status: newStatus })
        } catch (e) {
            console.error('Failed to save status', e)
        }
        setIsOpen(false)
    }

    return (
        <>
            <div ref={triggerRef} onClick={handleClick} className={styles.triggerWrapper}>
                {children}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={popoverRef}
                            className={`${styles.popover} glass`}
                            style={{ top: position.top, left: position.left }}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        >
                            <div className={styles.banner} style={{ background: '#5865f2' }} />

                            <div className={styles.avatarSection}>
                                <Avatar src={user.avatar ?? undefined} alt={user.username} size="xl" status={user.status as any} username={user.username} />
                            </div>

                            <div className={styles.body}>
                                <div className={styles.nameRow}>
                                    <span className={styles.username}>{user.username}</span>
                                    <span className={styles.discriminator}>#{user.discriminator || '0000'}</span>
                                </div>

                                {profileNote && (profileNote.text || profileNote.musicMetadata?.title) && (
                                    <div className={styles.noteBubble}>
                                        <span className={styles.noteEmoji}>{profileNote.emoji || '✨'}</span>
                                        <div className={styles.noteTextWrap}>
                                            {profileNote.text && <div className={styles.noteText}>{profileNote.text}</div>}
                                            {profileNote.musicMetadata?.title && (
                                                <div className={styles.noteMusic}>Listening to {profileNote.musicMetadata.title}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.divider} />

                                <button className={styles.actionRow} onClick={() => { setIsOpen(false); setShowUserSettings(true); }}>
                                    <Edit2 size={16} />
                                    <span>Edit Profile</span>
                                </button>

                                <button className={styles.actionRow} onClick={() => { setIsOpen(false); setShowNotesModal(true); }}>
                                    <Music2 size={16} />
                                    <span>Edit Beacon Note</span>
                                </button>

                                <div className={styles.divider} />

                                {/* Status Selector */}
                                <div className={styles.statusSection}>
                                    <button className={styles.statusBtn} onClick={() => handleStatusChange('online')}>
                                        <div className={`${styles.statusDot} ${styles.online}`} /> Online
                                    </button>
                                    <button className={styles.statusBtn} onClick={() => handleStatusChange('idle')}>
                                        <div className={`${styles.statusDot} ${styles.idle}`} /> Idle
                                    </button>
                                    <button className={styles.statusBtn} onClick={() => handleStatusChange('dnd')}>
                                        <div className={`${styles.statusDot} ${styles.dnd}`} /> Do Not Disturb
                                    </button>
                                    <button className={styles.statusBtn} onClick={() => handleStatusChange('invisible')}>
                                        <div className={`${styles.statusDot} ${styles.invisible}`} /> Invisible
                                    </button>
                                </div>

                                <div className={styles.divider} />

                                <button className={styles.actionRow} onClick={() => { setIsOpen(false); setShowUserSettings(true); }}>
                                    <Users size={16} />
                                    <span>Account Settings</span>
                                </button>

                                <button className={styles.actionRow} onClick={copyUserId}>
                                    <Copy size={16} />
                                    <span>Copy User ID</span>
                                </button>

                                <div className={styles.divider} />

                                <button className={`${styles.actionRow} ${styles.danger}`} onClick={() => { setIsOpen(false); logout(); }}>
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <BeaconNotesModal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
            />
        </>
    )
}
