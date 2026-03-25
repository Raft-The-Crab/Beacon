import React, { useState } from 'react'
import { useBeacoinStore } from '../../../stores/useBeacoinStore'
import { useToast, Button, Input } from '../../ui'
import { api } from '../../../lib/api'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

type RedeemReward =
    | { kind: 'coins'; amount: number; code: string }
    | { kind: 'beacon_plus'; months: number; code: string; expiresAt?: string }

export const RedeemTab: React.FC = () => {
    const { fetchWallet } = useBeacoinStore()
    const toast = useToast()
    const [redeemCode, setRedeemCode] = useState('')
    const [redeeming, setRedeeming] = useState(false)
    const [redeemReward, setRedeemReward] = useState<RedeemReward | null>(null)
    const [redeemRevealState, setRedeemRevealState] = useState<'idle' | 'opening' | 'opened'>('idle')

    const handleRedeem = async () => {
        try {
            setRedeeming(true)
            setRedeemRevealState('opening')
            setRedeemReward(null)
            const { data } = await api.post('/users/@me/beacoin/redeem', { code: redeemCode.trim() })
            await fetchWallet()
            setRedeemCode('')

            const nextReward: RedeemReward = data?.reward?.kind === 'beacon_plus'
                ? {
                    kind: 'beacon_plus',
                    code: data.code,
                    months: Number(data?.reward?.months || 1),
                    expiresAt: data?.reward?.expiresAt,
                }
                : {
                    kind: 'coins',
                    code: data.code,
                    amount: Number(data?.amount || data?.reward?.amount || 0),
                }

            window.setTimeout(() => {
                setRedeemReward(nextReward)
                setRedeemRevealState('opened')
            }, 850)

            if (nextReward.kind === 'beacon_plus') {
                toast.success(`Redeemed ${nextReward.code} (Beacon+ for ${nextReward.months} month${nextReward.months === 1 ? '' : 's'})`)
            } else {
                toast.success(`Redeemed ${nextReward.code} (+${nextReward.amount} Beacoins)`)
            }
        } catch (err: any) {
            setRedeemRevealState('idle')
            const message = err?.response?.data?.error || 'Invalid or already redeemed code'
            toast.error(message)
        } finally {
            setRedeeming(false)
        }
    }

    return (
        <div className={styles.tabContent}>
            <p className={styles.muted} style={{ marginBottom: 16 }}>
                Redeem codes unlock rewards instantly.
            </p>

            <div className={styles.redeemCard}>
                <Input
                    label="Redeem Code"
                    value={redeemCode}
                    onChange={(e: any) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (example: STARTER500)"
                />
                <div className={styles.formActions}>
                    <Button
                        variant="primary"
                        loading={redeeming}
                        disabled={!redeemCode.trim()}
                        onClick={handleRedeem}
                    >
                        Redeem Code
                    </Button>
                </div>
            </div>

            {(redeemRevealState !== 'idle' || redeemReward) && (
                <div className={`${styles.redeemReveal} ${redeemRevealState === 'opening' ? styles.redeemRevealOpening : ''} ${redeemRevealState === 'opened' ? styles.redeemRevealOpened : ''}`}>
                    <div className={styles.redeemCrate} aria-hidden>
                        <div className={styles.redeemCrateLid} />
                        <div className={styles.redeemCrateBody} />
                        <div className={styles.redeemGlow} />
                    </div>
                    <div className={styles.redeemRewardText}>
                        {redeemRevealState === 'opening' && <span>Opening reward crate...</span>}
                        {redeemRevealState === 'opened' && redeemReward?.kind === 'coins' && (
                            <span>+{redeemReward.amount} Beacoins from <strong>{redeemReward.code}</strong></span>
                        )}
                        {redeemRevealState === 'opened' && redeemReward?.kind === 'beacon_plus' && (
                            <span>
                                Beacon+ unlocked for {redeemReward.months} month{redeemReward.months === 1 ? '' : 's'} via <strong>{redeemReward.code}</strong>
                                {redeemReward.expiresAt ? ` (expires ${new Date(redeemReward.expiresAt).toLocaleDateString()})` : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
