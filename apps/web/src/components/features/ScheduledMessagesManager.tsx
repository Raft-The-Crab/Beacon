/**
 * Scheduled Messages Manager — Pillar VII UI
 * UI for creating, viewing, and cancelling scheduled messages.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Plus, Trash2, Send, Calendar, X, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import styles from '../../styles/modules/features/ScheduledMessages.module.css'

interface ScheduledMessage {
    id: string
    content: string
    channelName?: string
    scheduledAt: Date | string
    status: 'pending' | 'sent' | 'failed' | 'cancelled'
}

interface ScheduledMessagesManagerProps {
    messages: ScheduledMessage[]
    onSchedule: (content: string, scheduledAt: Date) => void
    onCancel: (messageId: string) => void
}

const STATUS_CONFIG = {
    pending: { icon: <Clock size={14} />, color: '#faa61a', label: 'Pending' },
    sent: { icon: <CheckCircle size={14} />, color: '#3ba55d', label: 'Sent' },
    failed: { icon: <AlertCircle size={14} />, color: '#ed4245', label: 'Failed' },
    cancelled: { icon: <XCircle size={14} />, color: '#8e8e93', label: 'Cancelled' },
}

export function ScheduledMessagesManager({ messages, onSchedule, onCancel }: ScheduledMessagesManagerProps) {
    const [creating, setCreating] = useState(false)
    const [content, setContent] = useState('')
    const [dateStr, setDateStr] = useState('')
    const [timeStr, setTimeStr] = useState('')

    const handleCreate = () => {
        if (!content.trim() || !dateStr || !timeStr) return
        const scheduledAt = new Date(`${dateStr}T${timeStr}`)
        if (scheduledAt <= new Date()) return
        onSchedule(content, scheduledAt)
        setCreating(false)
        setContent('')
        setDateStr('')
        setTimeStr('')
    }

    const formatDate = (d: Date | string) => {
        const date = new Date(d)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    return (
        <div className={styles.manager}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Clock size={20} />
                    <h3>Scheduled Messages</h3>
                    <span className={styles.badge}>{messages.filter(m => m.status === 'pending').length} pending</span>
                </div>
                <button className={styles.createBtn} onClick={() => setCreating(true)}>
                    <Plus size={14} /> Schedule
                </button>
            </div>

            <div className={styles.messageList}>
                <AnimatePresence>
                    {messages.map((msg) => {
                        const config = STATUS_CONFIG[msg.status]
                        return (
                            <motion.div
                                key={msg.id}
                                className={styles.messageCard}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                layout
                            >
                                <div className={styles.messageContent}>
                                    <p>{msg.content}</p>
                                    <div className={styles.messageMeta}>
                                        <Calendar size={12} />
                                        <span>{formatDate(msg.scheduledAt)}</span>
                                        {msg.channelName && (
                                            <>
                                                <span className={styles.dot}>·</span>
                                                <span>#{msg.channelName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.messageActions}>
                                    <span className={styles.statusBadge} style={{ color: config.color, borderColor: `${config.color}40` }}>
                                        {config.icon} {config.label}
                                    </span>
                                    {msg.status === 'pending' && (
                                        <button className={styles.cancelBtn} onClick={() => onCancel(msg.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {messages.length === 0 && (
                    <div className={styles.empty}>
                        <Clock size={48} strokeWidth={1} />
                        <h4>No Scheduled Messages</h4>
                        <p>Schedule messages to be sent at a specific time.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {creating && (
                    <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className={styles.modalHeader}>
                                <h3>Schedule a Message</h3>
                                <button onClick={() => setCreating(false)}><X size={16} /></button>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Type your message..."
                                    className={styles.textarea}
                                    rows={4}
                                />
                            </div>

                            <div className={styles.dateRow}>
                                <div className={styles.formGroup}>
                                    <label>Date</label>
                                    <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Time</label>
                                    <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.secondaryBtn} onClick={() => setCreating(false)}>Cancel</button>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={handleCreate}
                                    disabled={!content.trim() || !dateStr || !timeStr}
                                >
                                    <Send size={14} /> Schedule
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
