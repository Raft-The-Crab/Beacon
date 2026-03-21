import { useState } from 'react'
import { Zap, Shield, Sparkles, Coins, X, ChevronRight } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import { useToast } from '../ui'
import styles from '../../styles/modules/features/ServerBoosting.module.css'
import { motion } from 'framer-motion'

interface ServerBoostingProps {
    onClose: () => void
}

const LEVELS = [
    { level: 1, boosts: 2, perk: 'Custom Emoji Slots', icon: <Sparkles size={16} /> },
    { level: 3, boosts: 14, perk: 'Animated Server Icon', icon: <Sparkles size={16} /> },
    { level: 7, boosts: 80, perk: 'Premium Server Banner', icon: <Shield size={16} /> },
    { level: 11, boosts: 180, perk: 'Vanity URL (Beacon.chat/*)', icon: <Zap size={16} />, highlight: true },
    { level: 15, boosts: 250, perk: 'Ultimate 500MB Uploads', icon: <Zap size={16} />, highlight: true },
]

const LEVEL_MARKERS = [2, 14, 80, 180, 250]

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

    const progressWidth = Math.min(((currentServer.boostCount || 0) / 250) * 100, 100)

    return (
        <motion.div 
            className={styles.container}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <div className={styles.header}>
                <div className={styles.guildInfo}>
                    {currentServer.icon ? (
                        <motion.img 
                            src={currentServer.icon} 
                            alt={currentServer.name} 
                            className={styles.guildIcon} 
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring" }}
                        />
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
                    <motion.div 
                        className={styles.progressBar} 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressWidth}%` }}
                        transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
                    />
                    {LEVEL_MARKERS.map(m => (
                        <div
                            key={m}
                            className={`${styles.marker} ${(currentServer.boostCount || 0) >= m ? styles.markerActive : ''}`}
                            style={{ left: `${(m / 250) * 100}%` }}
                        >
                            <span>{m}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.perksList}>
                {LEVELS.map((l, index) => (
                    <motion.div 
                        key={l.level} 
                        className={`${styles.perkItem} ${(currentServer.boostLevel || 0) >= l.level ? styles.perkUnlocked : ''} ${l.highlight ? styles.perkHighlight : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, type: "spring" }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className={styles.perkIcon}>{l.icon}</div>
                        <div className={styles.perkInfo}>
                            <div className={styles.perkName}>{l.perk}</div>
                            <div className={styles.perkLevel}>Level {l.level}</div>
                        </div>
                        {(currentServer.boostLevel || 0) >= l.level ? (
                            <motion.div 
                                className={styles.unlockedBadge}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.3 + (0.1 * index) }}
                            >
                                Unlocked
                            </motion.div>
                        ) : (
                            <ChevronRight size={16} className={styles.chevron} />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.balanceInfo}>
                    Your Balance: <span>🪙 {balance.toLocaleString()}</span>
                </div>
                <motion.button
                    className={styles.boostBtn}
                    onClick={handleBoost}
                    disabled={loading || balance < 1000}
                    whileHover={balance >= 1000 && !loading ? { scale: 1.05, boxShadow: "0 0 15px rgba(255,100,100,0.5)" } : {}}
                    whileTap={balance >= 1000 && !loading ? { scale: 0.95 } : {}}
                >
                    {loading ? "Applying Boost..." : `Boost Server (🪙 1,000)`}
                </motion.button>
            </div>
        </motion.div>
    )
}
