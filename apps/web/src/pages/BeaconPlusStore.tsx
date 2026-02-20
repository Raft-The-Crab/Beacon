import { useState } from 'react'
import { Crown, Coins, Sparkles, Shield, Zap } from 'lucide-react'
import { useBeacoinStore } from '../stores/useBeacoinStore'
import { useAuthStore } from '../stores/useAuthStore'
import { Button } from '../components/ui'
import styles from './BeaconPlusStore.module.css'

const PLANS = {
    monthly: { cost: 1000, label: 'mo' },
    yearly: { cost: 10000, label: 'yr' },
}

const FEATURES = [
    { icon: <Sparkles size={16} />, label: 'Animated Avatar & Profile Banner' },
    { icon: <Zap size={16} />, label: 'Custom Emojis Everywhere' },
    { icon: <Zap size={16} />, label: 'Larger File Uploads (500MB)' },
    { icon: <Shield size={16} />, label: 'HD Streaming & Screen Share' },
    { icon: <Crown size={16} />, label: 'Exclusive Beacon+ Badge' },
    { icon: <Coins size={16} />, label: 'Monthly Beacoin Bonus (100 coins)' },
]

export function BeaconPlusStore() {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
    const [purchasing, setPurchasing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { balance, purchaseSubscription } = useBeacoinStore()
    const { user } = useAuthStore()

    const cost = PLANS[selectedPlan].cost
    const canAfford = balance >= cost

    const handlePurchase = async () => {
        if (!user || !canAfford || purchasing) return
        setError('')
        setPurchasing(true)
        try {
            await purchaseSubscription(selectedPlan)
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message || 'Purchase failed. Please try again.')
        } finally {
            setPurchasing(false)
        }
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.successScreen}>
                    <Crown size={64} className={styles.successIcon} />
                    <h1>Welcome to Beacon+!</h1>
                    <p>Your subscription is now active. Enjoy all premium features.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <Crown size={16} />
                        <span>Beacon+</span>
                    </div>
                    <h1>Unlock the Full Power of Beacon</h1>
                    <p>Get exclusive features, enhanced limits, and support the development of the future of communication.</p>
                </div>
                <div className={styles.heroVisual}>
                    <Crown size={120} className={styles.heroIcon} />
                </div>
            </div>

            <div className={styles.plans}>
                <div className={styles.toggle}>
                    <button
                        className={`${styles.toggleBtn} ${selectedPlan === 'monthly' ? styles.active : ''}`}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${selectedPlan === 'yearly' ? styles.active : ''}`}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        Yearly <span className={styles.saveBadge}>Save 16%</span>
                    </button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Beacon+</h2>
                        <div className={styles.price}>
                            <Coins size={28} style={{ color: '#f0b232' }} />
                            <span className={styles.amount}>{cost.toLocaleString()}</span>
                            <span className={styles.period}>/ {PLANS[selectedPlan].label}</span>
                        </div>
                    </div>

                    <ul className={styles.features}>
                        {FEATURES.map((f) => (
                            <li key={f.label}>
                                <span className={styles.featureIcon}>{f.icon}</span>
                                <span>{f.label}</span>
                            </li>
                        ))}
                    </ul>

                    {error && <div className={styles.errorBanner}>{error}</div>}

                    <Button
                        variant="primary"
                        className={styles.subBtn}
                        onClick={handlePurchase}
                        disabled={purchasing || !canAfford}
                    >
                        {purchasing ? 'Processing...' : canAfford ? `Purchase with Beacoins` : 'Insufficient Beacoins'}
                    </Button>

                    <p className={styles.balanceHint}>
                        Your balance: <strong style={{ color: '#f0b232' }}>{balance?.toLocaleString()}</strong> Beacoins
                        {!canAfford && <span className={styles.shortfall}> (need {(cost - balance).toLocaleString()} more)</span>}
                    </p>
                </div>
            </div>
        </div>
    )
}
