import React, { useState } from 'react'
import { useQuestStore } from '../../../stores/useQuestStore'
import { useBeacoinStore } from '../../../stores/useBeacoinStore'
import { useToast, Button } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const TasksTab: React.FC = () => {
    const { quests, isLoading: questsLoading, claimReward } = useQuestStore()
    const { fetchWallet } = useBeacoinStore()
    const toast = useToast()
    const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)

    return (
        <div className={styles.tabContent}>
            <p className={styles.muted} style={{ marginBottom: 16 }}>
                Complete quests to earn Beacoins and unlock cosmetics faster.
            </p>

            {questsLoading && (
                <div className={styles.questCard}>
                    <p className={styles.muted}>Loading tasks...</p>
                </div>
            )}

            {!questsLoading && quests.length === 0 && (
                <div className={styles.questCard}>
                    <h3>No active tasks</h3>
                    <p className={styles.muted}>New quests will appear soon.</p>
                </div>
            )}

            {!questsLoading && quests.map((questItem) => {
                const progress = Math.min(100, Math.round((questItem.progress / Math.max(1, questItem.quest.total)) * 100))
                const canClaim = questItem.completed && !questItem.claimed
                return (
                    <div className={styles.questCard} key={questItem.id}>
                        <div className={styles.questHeader}>
                            <h3>{questItem.quest.title}</h3>
                            <span className={styles.questReward}>+{questItem.quest.reward} Beacoins</span>
                        </div>
                        <p className={styles.muted}>{questItem.quest.description}</p>
                        <div className={styles.questProgressRow}>
                            <span className={styles.muted}>{questItem.progress}/{questItem.quest.total}</span>
                            <span className={styles.muted}>{progress}%</span>
                        </div>
                        <div className={styles.questProgressTrack}>
                            <div className={styles.questProgressFill} style={{ width: `${progress}%` }} />
                        </div>
                        <div className={styles.questActions}>
                            <Button
                                variant={canClaim ? 'primary' : 'secondary'}
                                size="sm"
                                disabled={!canClaim || claimingQuestId === questItem.questId}
                                loading={claimingQuestId === questItem.questId}
                                onClick={async () => {
                                    try {
                                        setClaimingQuestId(questItem.questId)
                                        await claimReward(questItem.questId)
                                        await fetchWallet()
                                        toast.success('Task reward claimed')
                                    } catch {
                                        toast.error('Could not claim task reward')
                                    } finally {
                                        setClaimingQuestId(null)
                                    }
                                }}
                            >
                                {questItem.claimed ? 'Claimed' : canClaim ? 'Claim Reward' : 'In Progress'}
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
