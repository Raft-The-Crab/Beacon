import { useState } from 'react'
import { Zap, Shield, Sparkles, Coins, X, ChevronRight } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import { useToast } from '../ui'
import styles from '../../styles/modules/features/ServerBoosting.module.css'

interface ServerBoostingProps {
    onClose: () => void
}

const LEVELS = [
    { level: 3, perk: 'Animated Server Icon', icon: <Sparkles size={16} /> },
    { level: 7, perk: 'Premium Server Banners', icon: <Shield size={16} /> },
    { level: 10, perk: 'Vanity URL (Beacon-*.inv)', icon: <Zap size={16} />, highlight: true },
]

const LEVEL_MARKERS = [3, 7, 10]

export function ServerBoosting({ onClose }: ServerBoostingProps) {
    const { currentServer, boostGuild } = useServerStore()
    const { balance, fetchWallet } = useBeacoinStore()
    const { show } = useToast()
    const [loading, setLoading] = useState(false)

    if (!currentServer) return null

    const handleBoost = async () => {
        if (balance < 1000) {
            show("You need 1,000 Beacoins to boost!", "error")
            return
        }

        setLoading(true)
        try {
            await boostGuild(currentServer.id)
            await fetchWallet()
            show("Boost applied successfully!", "success")
        } catch (err: any) {
            show(err?.response?.data?.error || "Failed to boost", "error")
        } finally {
            // Small delay for animation feel
            setTimeout(() => setLoading(false), 800)
        }
    }

    const progressWidth = Math.min(((currentServer.boostCount || 0) / 10) * 100, 100)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.guildInfo}>
                    {currentServer.icon ? (
                        <img src={currentServer.icon} alt={currentServer.name} className={styles.guildIcon} />
                    ) : (
                        <div className={styles.guildIconPlaceholder}>{currentServer.name[0]}</div>
                    )}
                    <div>
                        <h1>Boost {currentServer.name}</h1>
                        <p>Level {currentServer.boostLevel || 0} Server</p>
                    </div>
                </div>
                <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Zap size={24} className={styles.zapIcon} />
                    <div className={styles.statValue}>{currentServer.boostCount || 0}</div>
                    <div className={styles.statLabel}>Total Boosts</div>
                </div>
                <div className={styles.statCard}>
                    <Coins size={24} className={styles.coinIcon} />
                    <div className={styles.statValue}>1,000</div>
                    <div className={styles.statLabel}>Cost per Boost</div>
                </div>
            </div>

            <div className={styles.progressSection}>
                <div className={styles.progressBarWrapper}>
                    <div className={styles.progressBar} style={{ width: `${progressWidth}%` }} />
                    {LEVEL_MARKERS.map(m => (
                        <div
                            key={m}
                            className={`${styles.marker} ${(currentServer.boostCount || 0) >= m ? styles.markerActive : ''}`}
                            style={{ left: `${m * 10}%` }}
                        >
                            <span>{m}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.perksList}>
                {LEVELS.map((l) => (
                    <div key={l.level} className={`${styles.perkItem} ${(currentServer.boostLevel || 0) >= l.level ? styles.perkUnlocked : ''} ${l.highlight ? styles.perkHighlight : ''}`}>
                        <div className={styles.perkIcon}>{l.icon}</div>
                        <div className={styles.perkInfo}>
                            <div className={styles.perkName}>{l.perk}</div>
                            <div className={styles.perkLevel}>Level {l.level}</div>
                        </div>
                        {(currentServer.boostLevel || 0) >= l.level ? (
                            <div className={styles.unlockedBadge}>Unlocked</div>
                        ) : (
                            <ChevronRight size={16} className={styles.chevron} />
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.balanceInfo}>
                    Your Balance: <span>🪙 {balance.toLocaleString()}</span>
                </div>
                <button
                    className={styles.boostBtn}
                    onClick={handleBoost}
                    disabled={loading || balance < 1000}
                >
                    {loading ? "Applying Boost..." : `Boost Server (🪙 1,000)`}
                </button>
            </div>
        </div>
    )
}
