import { useState } from 'react'
import { Copy, Check, Share2, Shield, Zap, Globe } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useToast } from '../ui'
import styles from '../../styles/modules/features/InviteView.module.css'

export function InviteView() {
    const { currentServer } = useServerStore()
    const { show } = useToast()
    const [copied, setCopied] = useState(false)

    if (!currentServer) return null

    // Generate the invite link
    // If vanityUrl exists, use it. Otherwise use inviteCode + .inv
    const inviteCode = currentServer.vanityUrl || `Beacon-${currentServer.id.substring(0, 8)}.inv`
    const inviteLink = `https://beacon.app/invite/${inviteCode}`

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        show("Invite link copied!", "success")
        setTimeout(() => setCopied(false), 2000)
    }

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
                        value={inviteLink}
                        className={styles.input}
                    />
                    <button
                        className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
                <div className={styles.hint}>
                    Your invite link expires in 7 days.
                </div>
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
