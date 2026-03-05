/**
 * AutoMod Rules Panel — Pillar IV UI
 * Visual management interface for configuring AutoMod Pro rules.
 * Accessible from Server Settings > AutoMod tab.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, Plus, Trash2, ToggleLeft, ToggleRight,
    AlertTriangle, Hash, AtSign, Link, Type, ChevronDown, ChevronRight, Save, X
} from 'lucide-react'
import styles from '../../styles/modules/admin/AutoModPanel.module.css'

type TriggerType = 'keyword' | 'regex' | 'mention_spam' | 'link' | 'caps_lock'
type ActionType = 'delete_message' | 'warn_user' | 'mute_user' | 'kick_user' | 'log_only'

interface AutoModRule {
    id: string
    name: string
    enabled: boolean
    triggerType: TriggerType
    triggerPatterns: string[]
    exemptRoles: string[]
    exemptChannels: string[]
    actions: { type: ActionType; duration?: number; customMessage?: string }[]
}

const TRIGGER_ICONS: Record<TriggerType, React.ReactNode> = {
    keyword: <Type size={14} />,
    regex: <Hash size={14} />,
    mention_spam: <AtSign size={14} />,
    link: <Link size={14} />,
    caps_lock: <AlertTriangle size={14} />,
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
    keyword: 'Keyword Filter',
    regex: 'Regex Pattern',
    mention_spam: 'Mention Spam',
    link: 'Link Blocker',
    caps_lock: 'Caps Lock Guard',
}

const ACTION_LABELS: Record<ActionType, string> = {
    delete_message: 'Delete Message',
    warn_user: 'Warn User',
    mute_user: 'Mute User',
    kick_user: 'Kick User',
    log_only: 'Log Only',
}

interface AutoModPanelProps {
    guildId: string
    rules: AutoModRule[]
    onCreateRule: (rule: Omit<AutoModRule, 'id'>) => void
    onUpdateRule: (ruleId: string, updates: Partial<AutoModRule>) => void
    onDeleteRule: (ruleId: string) => void
}

export function AutoModPanel({ rules, onCreateRule, onUpdateRule, onDeleteRule }: AutoModPanelProps) {
    const [creating, setCreating] = useState(false)
    const [expandedRule, setExpandedRule] = useState<string | null>(null)

    // New rule form state
    const [newName, setNewName] = useState('')
    const [newTrigger, setNewTrigger] = useState<TriggerType>('keyword')
    const [newPatterns, setNewPatterns] = useState('')
    const [newActions, setNewActions] = useState<ActionType[]>(['delete_message'])

    const handleCreate = () => {
        if (!newName.trim()) return
        onCreateRule({
            name: newName,
            enabled: true,
            triggerType: newTrigger,
            triggerPatterns: newPatterns.split('\n').filter(p => p.trim()),
            exemptRoles: [],
            exemptChannels: [],
            actions: newActions.map(type => ({ type })),
        })
        setCreating(false)
        setNewName('')
        setNewPatterns('')
        setNewActions(['delete_message'])
    }

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Shield size={20} />
                    <h3>AutoMod Pro</h3>
                    <span className={styles.badge}>{rules.length} rules</span>
                </div>
                <button className={styles.createBtn} onClick={() => setCreating(true)}>
                    <Plus size={14} /> New Rule
                </button>
            </div>

            {/* Rules List */}
            <div className={styles.rulesList}>
                <AnimatePresence>
                    {rules.map((rule) => (
                        <motion.div
                            key={rule.id}
                            className={styles.ruleCard}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            layout
                        >
                            <div className={styles.ruleHeader} onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}>
                                <div className={styles.ruleInfo}>
                                    {TRIGGER_ICONS[rule.triggerType]}
                                    <span className={styles.ruleName}>{rule.name}</span>
                                    <span className={styles.ruleType}>{TRIGGER_LABELS[rule.triggerType]}</span>
                                </div>
                                <div className={styles.ruleActions}>
                                    <button
                                        className={`${styles.toggleBtn} ${rule.enabled ? styles.on : styles.off}`}
                                        onClick={(e) => { e.stopPropagation(); onUpdateRule(rule.id, { enabled: !rule.enabled }) }}
                                    >
                                        {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDeleteRule(rule.id) }}>
                                        <Trash2 size={14} />
                                    </button>
                                    {expandedRule === rule.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {expandedRule === rule.id && (
                                    <motion.div
                                        className={styles.ruleDetail}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Patterns</span>
                                            <div className={styles.patternList}>
                                                {rule.triggerPatterns.map((p, i) => (
                                                    <span key={i} className={styles.patternChip}>{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Actions</span>
                                            <div className={styles.actionList}>
                                                {rule.actions.map((a, i) => (
                                                    <span key={i} className={styles.actionChip}>{ACTION_LABELS[a.type]}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Exempt Roles</span>
                                            <span className={styles.exempt}>{rule.exemptRoles.length || 'None'}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {rules.length === 0 && !creating && (
                <div className={styles.empty}>
                    <Shield size={48} strokeWidth={1} />
                    <h4>No Rules Yet</h4>
                    <p>Configure AutoMod rules to automatically moderate your server.</p>
                    <button className={styles.createBtn} onClick={() => setCreating(true)}>
                        <Plus size={14} /> Create First Rule
                    </button>
                </div>
            )}

            {/* Create Rule Modal */}
            <AnimatePresence>
                {creating && (
                    <motion.div
                        className={styles.createOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={styles.createModal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className={styles.modalHeader}>
                                <h3>New AutoMod Rule</h3>
                                <button onClick={() => setCreating(false)}><X size={16} /></button>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Rule Name</label>
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Block Slurs"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Trigger Type</label>
                                <div className={styles.triggerGrid}>
                                    {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                                        <button
                                            key={t}
                                            className={`${styles.triggerOption} ${newTrigger === t ? styles.selected : ''}`}
                                            onClick={() => setNewTrigger(t)}
                                        >
                                            {TRIGGER_ICONS[t]}
                                            <span>{TRIGGER_LABELS[t]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Patterns (one per line)</label>
                                <textarea
                                    value={newPatterns}
                                    onChange={(e) => setNewPatterns(e.target.value)}
                                    placeholder={newTrigger === 'mention_spam' ? '5' : 'bad word\nanother bad word'}
                                    className={styles.textarea}
                                    rows={4}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Actions</label>
                                <div className={styles.actionGrid}>
                                    {(Object.keys(ACTION_LABELS) as ActionType[]).map(a => (
                                        <button
                                            key={a}
                                            className={`${styles.actionOption} ${newActions.includes(a) ? styles.selected : ''}`}
                                            onClick={() => {
                                                setNewActions(prev =>
                                                    prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
                                                )
                                            }}
                                        >
                                            {ACTION_LABELS[a]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.cancelBtn} onClick={() => setCreating(false)}>Cancel</button>
                                <button className={styles.saveBtn} onClick={handleCreate} disabled={!newName.trim()}>
                                    <Save size={14} /> Create Rule
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
