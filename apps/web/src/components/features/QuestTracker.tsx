import { useEffect, useState } from 'react'
import { Target, Coins, Clock, ChevronRight } from 'lucide-react'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import { useQuestStore } from '../../stores/useQuestStore'
import { useSFX } from '../../stores/useSFX'
import { Button } from '../ui'
import styles from '../../styles/modules/features/QuestTracker.module.css'

export function QuestTracker() {
    const balance = useBeacoinStore(state => state.balance)
    const fetchWallet = useBeacoinStore(state => state.fetchWallet)
    const quests = useQuestStore(state => state.quests)
    const fetchQuests = useQuestStore(state => state.fetchQuests)
    const claimReward = useQuestStore(state => state.claimReward)
    const { playSFX } = useSFX()
    const [claiming, setClaiming] = useState<string | null>(null)

    useEffect(() => {
        // Only fetch if quests is empty to prevent loops on 404
        if (quests.length === 0) {
            fetchQuests()
        }
    }, [fetchQuests, quests.length])

    const handleClaim = async (questId: string) => {
        setClaiming(questId)
        try {
            await claimReward(questId)
            playSFX('quest_complete')
            // Refresh wallet to show new balance
            await fetchWallet()
        } catch (err) {
            console.error(err)
        } finally {
            setClaiming(null)
        }
    }

    if (quests.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Target size={32} opacity={0.3} />
                <p>All quests completed! Check back tomorrow.</p>
            </div>
        )
    }

    return (
        <div className={styles.questContainer}>
            <div className={styles.header}>
                <div className={styles.titleWrap}>
                    <Target size={18} className={styles.headerIcon} />
                    <h3>Daily Quests</h3>
                </div>
                <div className={styles.balanceBadge}>
                    <Coins size={14} color="#f0b232" />
                    <span>{balance.toLocaleString()}</span>
                </div>
            </div>

            <div className={styles.questList}>
                {quests.filter(q => !q.claimed).map(uq => {
                    const quest = uq.quest
                    const pct = Math.min(100, Math.round((uq.progress / quest.total) * 100))

                    return (
                        <div key={uq.id} className={`${styles.questCard} ${uq.completed ? styles.completed : ''}`}>
                            <div className={styles.questTop}>
                                <div className={styles.questInfo}>
                                    <h4>{quest.title}</h4>
                                    <p>{quest.description}</p>
                                </div>
                                <div className={styles.rewardTag}>
                                    <Coins size={12} color="#f0b232" />
                                    <span>+{quest.reward}</span>
                                </div>
                            </div>

                            <div className={styles.progressBarWrapper}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.fill}
                                        style={{ width: `${pct}%`, background: uq.completed ? 'var(--status-online)' : 'var(--beacon-brand)' }}
                                    />
                                </div>
                                <span className={styles.progressText}>
                                    {uq.progress} / {quest.total}
                                </span>
                            </div>

                            <div className={styles.questFooter}>
                                <div className={styles.timeLeft}>
                                    <Clock size={12} />
                                    <span>Daily Reset</span>
                                </div>

                                {uq.completed ? (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleClaim(uq.questId)}
                                        disabled={claiming === uq.questId}
                                    >
                                        {claiming === uq.questId ? 'Claiming...' : 'Claim Reward'}
                                    </Button>
                                ) : (
                                    <div className={styles.inProgressTag}>In Progress</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <button className={styles.viewAllBtn}>
                View All Quests <ChevronRight size={14} />
            </button>
        </div>
    )
}
