/**
 * Audit Log Viewer — Pillar IV: Enhanced Audit Log
 * Searchable, filterable audit log with timeline visualization.
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Search, Filter, ChevronDown,
    Settings, Shield, Hash, UserMinus, UserPlus, MessageSquare,
    Trash2, Edit3, Zap
} from 'lucide-react'
import styles from '../../styles/modules/admin/AuditLogViewer.module.css'

interface AuditEntry {
    id: string
    action: string
    userId: string
    username: string
    avatar?: string
    target?: string
    details?: Record<string, any>
    createdAt: string
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    GUILD_UPDATE: <Settings size={14} />,
    ROLE_CREATE: <Shield size={14} />,
    ROLE_UPDATE: <Edit3 size={14} />,
    ROLE_DELETE: <Trash2 size={14} />,
    CHANNEL_CREATE: <Hash size={14} />,
    CHANNEL_UPDATE: <Edit3 size={14} />,
    CHANNEL_DELETE: <Trash2 size={14} />,
    MEMBER_KICK: <UserMinus size={14} />,
    MEMBER_BAN: <UserMinus size={14} />,
    MEMBER_JOIN: <UserPlus size={14} />,
    MESSAGE_DELETE: <MessageSquare size={14} />,
    WEBHOOK_CREATE: <Zap size={14} />,
}

const ACTION_LABELS: Record<string, string> = {
    GUILD_UPDATE: 'Server Updated',
    ROLE_CREATE: 'Role Created',
    ROLE_UPDATE: 'Role Updated',
    ROLE_DELETE: 'Role Deleted',
    CHANNEL_CREATE: 'Channel Created',
    CHANNEL_UPDATE: 'Channel Updated',
    CHANNEL_DELETE: 'Channel Deleted',
    MEMBER_KICK: 'Member Kicked',
    MEMBER_BAN: 'Member Banned',
    MEMBER_JOIN: 'Member Joined',
    MESSAGE_DELETE: 'Message Deleted',
    WEBHOOK_CREATE: 'Webhook Created',
}

interface AuditLogViewerProps {
    entries: AuditEntry[]
    loading?: boolean
    onFilter?: (filters: { actorId?: string; action?: string; before?: string; after?: string }) => void
}

export function AuditLogViewer({ entries }: AuditLogViewerProps) {
    const [search, setSearch] = useState('')
    const [actionFilter, setActionFilter] = useState<string>('all')
    const [showFilters, setShowFilters] = useState(false)

    const filtered = useMemo(() => {
        let result = entries
        if (search) {
            const lower = search.toLowerCase()
            result = result.filter(e =>
                e.username.toLowerCase().includes(lower) ||
                e.action.toLowerCase().includes(lower) ||
                e.target?.toLowerCase().includes(lower)
            )
        }
        if (actionFilter !== 'all') {
            result = result.filter(e => e.action === actionFilter)
        }
        return result
    }, [entries, search, actionFilter])

    const uniqueActions = useMemo(() => [...new Set(entries.map(e => e.action))], [entries])

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    return (
        <div className={styles.viewer}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FileText size={20} />
                    <h3>Audit Log</h3>
                    <span className={styles.badge}>{entries.length} entries</span>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={14} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user, action, or target..."
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={14} />
                    Filters
                    <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        className={styles.filterPanel}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div className={styles.filterGroup}>
                            <label>Action Type</label>
                            <div className={styles.filterChips}>
                                <button
                                    className={`${styles.chip} ${actionFilter === 'all' ? styles.active : ''}`}
                                    onClick={() => setActionFilter('all')}
                                >
                                    All
                                </button>
                                {uniqueActions.map(action => (
                                    <button
                                        key={action}
                                        className={`${styles.chip} ${actionFilter === action ? styles.active : ''}`}
                                        onClick={() => setActionFilter(action)}
                                    >
                                        {ACTION_ICONS[action]} {ACTION_LABELS[action] || action}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Timeline */}
            <div className={styles.timeline}>
                <AnimatePresence>
                    {filtered.map((entry, i) => (
                        <motion.div
                            key={entry.id}
                            className={styles.entry}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: i * 0.02 }}
                        >
                            <div className={styles.entryIcon}>
                                {ACTION_ICONS[entry.action] || <Settings size={14} />}
                            </div>
                            <div className={styles.entryContent}>
                                <div className={styles.entryMain}>
                                    <span className={styles.entryUser}>{entry.username}</span>
                                    <span className={styles.entryAction}>{ACTION_LABELS[entry.action] || entry.action}</span>
                                    {entry.target && <span className={styles.entryTarget}>{entry.target}</span>}
                                </div>
                                <span className={styles.entryTime}>{formatTime(entry.createdAt)}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className={styles.empty}>
                        <FileText size={40} strokeWidth={1} />
                        <p>{search || actionFilter !== 'all' ? 'No matching entries' : 'No audit log entries yet'}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
