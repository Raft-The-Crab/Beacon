import { useState } from 'react'
import { Copy, Check, Link, Clock, Users, RefreshCw, X } from 'lucide-react'
import { Select } from '../ui'
import styles from '../../styles/modules/modals/ServerInviteModal.module.css'

interface ServerInviteModalProps {
    serverName: string
    serverId: string
    isOpen: boolean
    onClose: () => void
}

const EXPIRY_OPTIONS = [
    { label: '30 minutes', value: '30m' },
    { label: '1 hour', value: '1h' },
    { label: '6 hours', value: '6h' },
    { label: '12 hours', value: '12h' },
    { label: '1 day', value: '1d' },
    { label: '7 days', value: '7d' },
    { label: 'Never', value: 'never' },
]

const MAX_USES_OPTIONS = [
    { label: 'No limit', value: 0 },
    { label: '1 use', value: 1 },
    { label: '5 uses', value: 5 },
    { label: '10 uses', value: 10 },
    { label: '25 uses', value: 25 },
    { label: '50 uses', value: 50 },
    { label: '100 uses', value: 100 },
]

function generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
}

export function ServerInviteModal({ serverName, isOpen, onClose }: ServerInviteModalProps) {
    const [inviteCode, setInviteCode] = useState(generateInviteCode())
    const [copied, setCopied] = useState(false)
    const [expiry, setExpiry] = useState('7d')
    const [maxUses, setMaxUses] = useState(0)
    const [showAdvanced, setShowAdvanced] = useState(false)

    if (!isOpen) return null

    const inviteLink = `${window.location.origin}/invite/${inviteCode}`

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRegenerate = () => {
        setInviteCode(generateInviteCode())
        setCopied(false)
    }

    return (
        <div className={`app-modal-overlay ${styles.overlay}`} onClick={onClose}>
            <div className={`app-modal-shell ${styles.modal}`} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Invite friends to <strong>{serverName}</strong></h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    <label className={styles.label}>
                        <Link size={14} />
                        INVITE LINK
                    </label>
                    <div className={styles.linkRow}>
                        <input
                            type="text"
                            readOnly
                            value={inviteLink}
                            className={styles.linkInput}
                        />
                        <button
                            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                        </button>
                    </div>

                    <button className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
                        Edit invite link settings
                    </button>

                    {showAdvanced && (
                        <div className={styles.advanced}>
                            <div className={styles.settingRow}>
                                <label className={styles.settingLabel}>
                                    <Clock size={14} />
                                    Expire after
                                </label>
                                <Select
                                    className={styles.select}
                                    value={expiry}
                                    onChange={e => setExpiry(e.target.value)}
                                >
                                    {EXPIRY_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className={styles.settingRow}>
                                <label className={styles.settingLabel}>
                                    <Users size={14} />
                                    Max uses
                                </label>
                                <Select
                                    className={styles.select}
                                    value={maxUses}
                                    onChange={e => setMaxUses(Number(e.target.value))}
                                >
                                    {MAX_USES_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <button className={styles.regenerateBtn} onClick={handleRegenerate}>
                                <RefreshCw size={14} />
                                Generate a new link
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
