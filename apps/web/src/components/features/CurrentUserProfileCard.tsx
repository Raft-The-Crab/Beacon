import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ArrowRightLeft, Music2, Circle, Moon, Minus, EyeOff, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { BeaconNotesModal } from '../modals/BeaconNotesModal'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/CurrentUserProfileCard.module.css'

interface CurrentUserProfileCardProps {
    children: React.ReactNode
}

export function CurrentUserProfileCard({ children }: CurrentUserProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showNotesModal, setShowNotesModal] = useState(false)
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)

    const STATUS_OPTIONS = [
        { value: 'online',    label: 'Online',    color: '#23a559', icon: <Circle size={10} fill="#23a559" stroke="none" /> },
        { value: 'idle',      label: 'Idle',      color: '#f0b232', icon: <Moon size={11} /> },
        { value: 'dnd',       label: 'Do Not Disturb', color: '#ed4245', icon: <Minus size={11} /> },
        { value: 'invisible', label: 'Invisible', color: '#747f8d', icon: <EyeOff size={11} /> },
    ] as const

    const handleSetStatus = async (status: string) => {
        setShowStatusMenu(false)
        setIsOpen(false)
        try {
            await apiClient.request('PATCH', '/users/@me', { status })
        } catch { /* ignore */ }
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        const popoverHeight = 170
        const popoverWidth = 220
        const viewportPadding = 12

        let top = rect.top - popoverHeight - 8
        if (top < viewportPadding || rect.top < 260) {
            top = Math.min(window.innerHeight - popoverHeight - viewportPadding, rect.bottom + 6)
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

    if (!user) return <>{children}</>

    return (
        <>
            <div ref={triggerRef} className={styles.triggerWrapper}>
                <button
                    type="button"
                    onClick={handleClick}
                    className={styles.triggerButton}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label="Open user profile menu"
                >
                    {children}
                </button>
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
                            <div className={styles.bodyCompact}>
                                <button className={styles.actionRow} onClick={() => { setIsOpen(false); setShowNotesModal(true); }}>
                                    <Music2 size={16} />
                                    <span>Beacon Notes</span>
                                </button>

                                <button className={styles.actionRow} onClick={() => setShowStatusMenu(s => !s)}>
                                    <Circle size={12} fill={(user?.status === 'dnd' ? '#ed4245' : user?.status === 'idle' ? '#f0b232' : user?.status === 'invisible' ? '#747f8d' : '#23a559')} stroke="none" />
                                    <span style={{ flex: 1 }}>Status</span>
                                    <ChevronRight size={13} style={{ opacity: 0.5, transform: showStatusMenu ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                <AnimatePresence>
                                    {showStatusMenu && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    className={`${styles.actionRow} ${styles.subRow}`}
                                                    onClick={() => handleSetStatus(opt.value)}
                                                    style={user?.status === opt.value ? { background: 'rgba(255,255,255,0.06)' } : {}}
                                                >
                                                    <span style={{ color: opt.color }}>{opt.icon}</span>
                                                    <span>{opt.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button className={styles.actionRow} onClick={() => { setIsOpen(false); logout() }}>
                                    <ArrowRightLeft size={16} />
                                    <span>Switch Account</span>
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
