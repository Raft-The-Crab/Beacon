import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ArrowRightLeft, Music2, Circle, Moon, Minus, EyeOff, ChevronRight, Sparkles, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { BeaconNotesModal } from '../modals/BeaconNotesModal'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/CurrentUserProfileCard.module.css'

interface CurrentUserProfileCardProps {
    children: React.ReactNode
}

interface StoredAccount {
    userId: string
    username: string
    displayName: string
    discriminator: string
    avatar?: string | null
    token: string
    lastUsedAt: number
}

const STORED_ACCOUNTS_KEY = 'beacon:accounts'

function readStoredAccounts(): StoredAccount[] {
    try {
        const raw = localStorage.getItem(STORED_ACCOUNTS_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((entry: any) => (
            entry
            && typeof entry.userId === 'string'
            && typeof entry.username === 'string'
            && typeof entry.token === 'string'
        ))
    } catch {
        return []
    }
}

function writeStoredAccounts(accounts: StoredAccount[]) {
    try {
        localStorage.setItem(STORED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 6)))
    } catch {
        // ignore storage write errors
    }
}

export function CurrentUserProfileCard({ children }: CurrentUserProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showNotesModal, setShowNotesModal] = useState(false)
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [showAccountMenu, setShowAccountMenu] = useState(false)
    const [savedAccounts, setSavedAccounts] = useState<StoredAccount[]>([])
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const setUser = useAuthStore(state => state.setUser)
    const setShowUserSettings = useUIStore(state => state.setShowUserSettings)

    const STATUS_OPTIONS = [
        { value: 'online',    label: 'Online',    color: '#23a559', icon: <Circle size={10} fill="#23a559" stroke="none" /> },
        { value: 'idle',      label: 'Idle',      color: '#f0b232', icon: <Moon size={11} /> },
        { value: 'dnd',       label: 'Do Not Disturb', color: '#ed4245', icon: <Minus size={11} /> },
        { value: 'invisible', label: 'Invisible', color: '#747f8d', icon: <EyeOff size={11} /> },
    ] as const

    const displayName = (user as any)?.displayName?.trim() || user?.username || 'You'
    const username = user?.username || 'user'

    const saveCurrentAccount = () => {
        const token = apiClient.getAccessToken() || localStorage.getItem('token') || localStorage.getItem('beacon_token') || ''
        if (!token || !user?.id || !user?.username) return
        const existing = readStoredAccounts().filter(acc => acc.userId !== user.id)
        const next: StoredAccount = {
            userId: user.id,
            username: user.username,
            displayName,
            discriminator: user.discriminator || '0000',
            avatar: user.avatar || null,
            token,
            lastUsedAt: Date.now(),
        }
        const merged = [next, ...existing].sort((a, b) => b.lastUsedAt - a.lastUsedAt)
        writeStoredAccounts(merged)
        setSavedAccounts(merged)
    }

    const refreshSavedAccounts = () => {
        setSavedAccounts(readStoredAccounts().sort((a, b) => b.lastUsedAt - a.lastUsedAt))
    }

    const openSettingsTab = (tab: 'profile' | 'profileArt') => {
        try {
            localStorage.setItem('beacon:settings_initial_tab', tab)
        } catch {
            // ignore storage errors
        }
        setIsOpen(false)
        setShowStatusMenu(false)
        setShowAccountMenu(false)
        setShowUserSettings(true)
    }

    const handleSetStatus = async (status: string) => {
        setShowStatusMenu(false)
        setShowAccountMenu(false)
        setIsOpen(false)
        try {
            const res = await apiClient.updateUser({ status })
            if (res.success && res.data) {
                setUser(res.data)
            } else if (user) {
                // Keep UX responsive even if API shape varies.
                setUser({ ...user, status } as any)
            }
            if (typeof window !== 'undefined' && user?.id) {
                window.dispatchEvent(new CustomEvent('beacon:user-status-updated', {
                    detail: { userId: user.id, status },
                }))
            }
        } catch { /* ignore */ }
    }

    const handleSwitchToAccount = (account: StoredAccount) => {
        try {
            localStorage.setItem('token', account.token)
            localStorage.setItem('beacon_token', account.token)
            localStorage.setItem('accessToken', account.token)

            const rest = readStoredAccounts().filter(entry => entry.userId !== account.userId)
            writeStoredAccounts([{ ...account, lastUsedAt: Date.now() }, ...rest])
        } catch {
            // ignore storage errors
        }
        setIsOpen(false)
        setShowStatusMenu(false)
        setShowAccountMenu(false)
        window.location.href = '/channels/@me'
    }

    const handleAddAccount = async () => {
        saveCurrentAccount()
        setIsOpen(false)
        setShowStatusMenu(false)
        setShowAccountMenu(false)
        try {
            await apiClient.logout()
        } catch {
            // ignore logout errors
        }
        logout()
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        const popoverHeight = showStatusMenu || showAccountMenu ? 470 : 360
        const popoverWidth = 280
        const viewportPadding = 12

        let top = rect.top - popoverHeight - 8
        if (top < viewportPadding || rect.top < 260) {
            top = Math.min(window.innerHeight - popoverHeight - viewportPadding, rect.bottom + 6)
        }

        if (!Number.isFinite(top)) {
            top = Math.max(viewportPadding, window.innerHeight - popoverHeight - 64)
        }

        let left = rect.left
        if (left + popoverWidth > window.innerWidth - viewportPadding) {
            left = window.innerWidth - popoverWidth - viewportPadding
        }
        if (left < viewportPadding) {
            left = viewportPadding
        }

        setPosition({ top, left })
        setShowStatusMenu(false)
        setShowAccountMenu(false)
        if (!isOpen) {
            saveCurrentAccount()
            refreshSavedAccounts()
        }
        setIsOpen(prev => !prev)
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
                            className={styles.popover}
                            style={{ top: position.top, left: position.left }}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        >
                            <div className={styles.bodyCompact}>
                                <div className={styles.menuHeader}>
                                    <div className={styles.menuTitle}>{displayName}</div>
                                    <div className={styles.menuSubtitle}>@{username}</div>
                                </div>

                                <div className={styles.quickActions}>
                                    <button className={styles.quickActionBtn} onClick={() => openSettingsTab('profileArt')}>
                                        <Sparkles size={14} />
                                        <span>Customize Profile</span>
                                    </button>
                                    <button className={styles.quickActionBtn} onClick={() => setShowStatusMenu(s => !s)}>
                                        <Circle size={10} fill={(user?.status === 'dnd' ? '#ed4245' : user?.status === 'idle' ? '#f0b232' : user?.status === 'invisible' ? '#747f8d' : '#23a559')} stroke="none" />
                                        <span>Set Status</span>
                                    </button>
                                </div>

                                <div className={styles.divider} />

                                <button className={styles.actionRow} onClick={() => openSettingsTab('profile')}>
                                    <Sparkles size={16} />
                                    <span>Edit Profile Basics</span>
                                </button>

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

                                <button className={styles.actionRow} onClick={() => setShowAccountMenu(s => !s)}>
                                    <ArrowRightLeft size={16} />
                                    <span style={{ flex: 1 }}>Switch Account</span>
                                    <ChevronRight size={13} style={{ opacity: 0.5, transform: showAccountMenu ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                <AnimatePresence>
                                    {showAccountMenu && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            {savedAccounts.map(acc => {
                                                const isCurrent = acc.userId === user?.id
                                                return (
                                                    <button
                                                        key={acc.userId}
                                                        className={`${styles.actionRow} ${styles.subRow} ${styles.accountRow}`}
                                                        onClick={() => handleSwitchToAccount(acc)}
                                                        disabled={isCurrent}
                                                        style={isCurrent ? { opacity: 0.7, cursor: 'default' } : undefined}
                                                    >
                                                        <span className={styles.accountMeta}>
                                                            <span className={styles.accountName}>{acc.displayName}</span>
                                                            <span className={styles.accountHandle}>@{acc.username}#{acc.discriminator}</span>
                                                        </span>
                                                        {isCurrent && <span className={styles.accountCurrentTag}>Current</span>}
                                                    </button>
                                                )
                                            })}

                                            <button className={`${styles.actionRow} ${styles.subRow}`} onClick={handleAddAccount}>
                                                <Plus size={14} />
                                                <span>Add Account</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
