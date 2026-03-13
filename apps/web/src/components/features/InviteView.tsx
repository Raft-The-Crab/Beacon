import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, Share2, Shield, Zap, Globe } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useToast } from '../ui'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/InviteView.module.css'

export function InviteView() {
    const { currentServer } = useServerStore()
    const { show } = useToast()
    const [copied, setCopied] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [inviteCode, setInviteCode] = useState<string>('')

    useEffect(() => {
        let mounted = true

        const bootstrapInvite = async () => {
            if (!currentServer?.id) return

            try {
                const existing = await apiClient.getInvites(currentServer.id)
                if (!mounted || !existing.success) return

                const firstActive = (Array.isArray(existing.data) ? existing.data : []).find((inv: any) => {
                    if (!inv?.code) return false
                    if (!inv.expiresAt) return true
                    return new Date(inv.expiresAt).getTime() > Date.now()
                })

                if (firstActive?.code) {
                    setInviteCode(firstActive.code)
                    return
                }
            } catch {
                // Fall through to create flow.
            }

            setIsGenerating(true)
            try {
                const created = await apiClient.createInvite(currentServer.id)
                if (mounted && created.success && created.data?.code) {
                    setInviteCode(created.data.code)
                }
            } finally {
                if (mounted) setIsGenerating(false)
            }
        }

        void bootstrapInvite()

        return () => {
            mounted = false
        }
    }, [currentServer?.id])

    const inviteLink = useMemo(() => {
        if (!inviteCode) return ''
        return `https://beacon.qzz.io/invite/${inviteCode}`
    }, [inviteCode])

    const handleCopy = () => {
        if (!inviteLink) return
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        show("Invite link copied!", "success")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRegenerate = async () => {
        if (!currentServer?.id) return
        setIsGenerating(true)
        try {
            const created = await apiClient.createInvite(currentServer.id)
            if (created.success && created.data?.code) {
                setInviteCode(created.data.code)
                show('New invite link generated', 'success')
            } else {
                show('Could not generate invite link', 'error')
            }
        } catch {
            show('Could not generate invite link', 'error')
        } finally {
            setIsGenerating(false)
        }
    }

    if (!currentServer) return null

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <Share2 size={24} className={styles.titleIcon} />
                    <h1>Invite friends to {currentServer.name}</h1>
                </div>
                <p>Send an invite link to a friend to give them access to this server.</p>
            </div>

            <div className={styles.inviteBox}>
                <div className={styles.label}>Server Invite Link</div>
                <div className={styles.inputWrapper}>
                    <input
                        readOnly
                        value={inviteLink || 'Generating invite...'}
                        className={styles.input}
                    />
                    <button
                        className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                        onClick={handleCopy}
                        disabled={!inviteLink || isGenerating}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
                <div className={styles.hint}>
                    Invite links expire in 7 days. {inviteCode ? 'Use Regenerate if you need a fresh code.' : ''}
                </div>
                <button className={styles.copyBtn} onClick={handleRegenerate} disabled={isGenerating} style={{ marginTop: 10 }}>
                    <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
                </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.premiumSection}>
                <div className={styles.premiumHeader}>
                    <Zap size={18} className={styles.zapIcon} />
                    <span>Premium Invites</span>
                </div>
                {(currentServer.boostLevel || 0) >= 10 ? (
                    <div className={styles.vanityActive}>
                        <div className={styles.vanityIcon}><Globe size={20} /></div>
                        <div className={styles.vanityInfo}>
                            <div className={styles.vanityLabel}>Vanity URL Active</div>
                            <div className={styles.vanityValue}>{currentServer.vanityUrl}</div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.vanityLocked}>
                        <div className={styles.lockedIcon}><Shield size={20} /></div>
                        <div className={styles.lockedInfo}>
                            <div className={styles.lockedLabel}>Custom Vanity URL</div>
                            <div className={styles.lockedHint}>Unlock at Level 10 Server Boost</div>
                        </div>
                        <div className={styles.progressBadge}>Level {currentServer.boostLevel || 0}/10</div>
                    </div>
                )}
            </div>
        </div>
    )
}
