import { useState, useEffect } from 'react'
import { Coins, Gift, Flame, MessageCircle, UserPlus, Check, Lock } from 'lucide-react'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import styles from '../../styles/modules/features/BeacoinRewards.module.css'

export function BeacoinRewards() {
    const {
        balance, streak, dailyRewards, messageCount, lastDailyClaim,
        claimDaily, fetchWallet
    } = useBeacoinStore()
    const [claimed, setClaimed] = useState(false)

    useEffect(() => { fetchWallet() }, [])

    const canClaimToday = !lastDailyClaim ||
        new Date(lastDailyClaim).toDateString() !== new Date().toDateString()

    const handleClaim = async () => {
        if (!canClaimToday || claimed) return
        await claimDaily()
        setClaimed(true)
    }

    return (
        <div className={styles.container}>
            {/* Balance Header */}
            <div className={styles.balanceCard}>
                <div className={styles.balanceInfo}>
                    <Coins size={24} className={styles.coinIcon} />
                    <div>
                        <div className={styles.balanceAmount}>{balance.toLocaleString()}</div>
                        <div className={styles.balanceLabel}>Beacoins</div>
                    </div>
                </div>
                <div className={styles.streak}>
                    <Flame size={16} />
                    <span>{streak} day streak</span>
                </div>
            </div>

            {/* Daily Check-in */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <Gift size={16} />
                    Daily Check-in
                </h3>
                <div className={styles.dailyGrid}>
                    {dailyRewards.map((reward) => (
                        <div
                            key={reward.day}
                            className={`${styles.dayCard} ${reward.claimed ? styles.dayClaimed : ''} ${reward.bonus ? styles.dayBonus : ''}`}
                        >
                            <span className={styles.dayLabel}>Day {reward.day}</span>
                            <div className={styles.dayReward}>
                                <Coins size={14} />
                                <span>{reward.amount}</span>
                            </div>
                            {reward.claimed && <Check size={14} className={styles.dayCheck} />}
                            {reward.bonus && !reward.claimed && <Flame size={12} className={styles.bonusIcon} />}
                        </div>
                    ))}
                </div>
                <button
                    className={`${styles.claimBtn} ${!canClaimToday || claimed ? styles.claimBtnDisabled : ''}`}
                    onClick={handleClaim}
                    disabled={!canClaimToday || claimed}
                >
                    {claimed ? (
                        <><Check size={16} /> Claimed Today!</>
                    ) : canClaimToday ? (
                        <><Gift size={16} /> Claim Daily Reward</>
                    ) : (
                        <><Lock size={16} /> Come Back Tomorrow</>
                    )}
                </button>
            </div>

            {/* Activity Rewards */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <MessageCircle size={16} />
                    Activity Rewards
                </h3>
                <div className={styles.progressCard}>
                    <div className={styles.progressInfo}>
                        <span>Messages sent: <strong>{messageCount}/50</strong></span>
                        <span className={styles.progressReward}>
                            <Coins size={12} /> +10
                        </span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min((messageCount / 50) * 100, 100)}%` }}
                        />
                    </div>
                    <p className={styles.progressHint}>
                        Send messages to earn Beacoins! Resets after each milestone.
                    </p>
                </div>
            </div>

            {/* Invite Bonus */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <UserPlus size={16} />
                    Invite Friends
                </h3>
                <div className={styles.inviteCard}>
                    <p>Earn <strong>25 Beacoins</strong> for every friend who joins Beacon!</p>
                    <button className={styles.inviteBtn}>
                        <UserPlus size={16} />
                        Copy Invite Link
                    </button>
                </div>
            </div>
        </div>
    )
}
