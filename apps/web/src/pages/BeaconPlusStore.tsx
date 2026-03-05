import { useState, useEffect } from 'react'
import { Crown, Coins, Sparkles, Shield, Zap, ShoppingBag, Palette, Paintbrush } from 'lucide-react'
import { useBeacoinStore } from '../stores/useBeacoinStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useShopStore } from '../stores/useShopStore'
import { useTranslationStore } from '../stores/useTranslationStore'
import { Button } from '../components/ui'
import { GiftingModal } from '../components/modals/GiftingModal'
import styles from '../styles/modules/pages/BeaconPlusStore.module.css'

const PLANS = {
    monthly: { cost: 1000, label: 'mo' },
    yearly: { cost: 10000, label: 'yr' },
}

export function BeaconPlusStore() {
    const { t } = useTranslationStore()
    const [activeTab, setActiveTab] = useState<'plus' | 'decorations' | 'effects'>('plus')
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
    const [purchasing, setPurchasing] = useState<string | false>(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { balance, purchaseSubscription } = useBeacoinStore()
    const { user } = useAuthStore()
    const { ownedCosmetics, marketplace, purchaseCosmetic, equipCosmetic, fetchOwned, fetchMarketplace } = useShopStore()
    const [gifting, setGifting] = useState<any>(null)

    // Coupon State
    const [couponInput, setCouponInput] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)

    const handleApplyCoupon = () => {
        if (!couponInput.trim()) {
            setDiscount(0)
            setCouponCode('')
            return
        }
        const code = couponInput.toUpperCase()
        let hash = 0
        for (let i = 0; i < code.length; i++) {
            hash = Math.imul(31, hash) + code.charCodeAt(i) | 0
        }
        const sale = Math.abs(hash) % 100
        setDiscount(sale)
        setCouponCode(code)
    }

    const getEffectivePrice = (price: number) => Math.floor(price * (1 - discount / 100))

    const FEATURES = [
        { icon: <Sparkles size={16} />, label: t('marketplace.plus.features.animated') },
        { icon: <Zap size={16} />, label: t('marketplace.plus.features.emojis') },
        { icon: <Zap size={16} />, label: t('marketplace.plus.features.uploads') },
        { icon: <Shield size={16} />, label: t('marketplace.plus.features.streaming') },
        { icon: <Crown size={16} />, label: t('marketplace.plus.features.badge') },
        { icon: <Coins size={16} />, label: t('marketplace.plus.features.bonus') },
    ]

    useEffect(() => {
        if (user) {
            fetchOwned()
            fetchMarketplace()
        }
    }, [user, fetchOwned, fetchMarketplace])

    const cost = getEffectivePrice(PLANS[selectedPlan].cost)
    const canAfford = balance >= cost

    const handlePurchasePlus = async () => {
        if (!user || !canAfford || purchasing) return
        setError('')
        setPurchasing('plus')
        try {
            await purchaseSubscription(selectedPlan, couponCode || undefined)
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message || 'Purchase failed. Please try again.')
        } finally {
            setPurchasing(false)
        }
    }

    const handleActionItem = async (item: { id: string, price: number, type: string }) => {
        const isOwned = ownedCosmetics.some(c => c.cosmeticId === item.id)
        if (isOwned) {
            try {
                const isEquipped = (user as any)?.avatarDecorationId === item.id || (user as any)?.profileEffectId === item.id
                if (isEquipped) {
                    await equipCosmetic(null, item.type as any)
                } else {
                    await equipCosmetic(item.id, item.type as any)
                }
            } catch (err: any) {
                setError(err.message)
            }
            return
        }

        const effectiveItemPrice = getEffectivePrice(item.price)
        if (!user || balance < effectiveItemPrice || purchasing) return
        setError('')
        setPurchasing(item.id)
        try {
            await purchaseCosmetic(item.id, couponCode || undefined)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to buy item.')
        } finally {
            setPurchasing(false)
        }
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={`${styles.successScreen} premium-hero-section`}>
                    <div className="atmos-bg">
                        <div className="atmos-orb" style={{ background: 'var(--beacon-brand)', opacity: 0.2 }} />
                    </div>
                    <Sparkles size={80} className={`${styles.successIcon} premium-gradient-text`} style={{ filter: 'drop-shadow(0 0 30px var(--beacon-brand))' }} />
                    <h1 className="premium-hero-heading" style={{ fontSize: 56 }}>{t('marketplace.success_title')}</h1>
                    <p className="premium-hero-subtitle">{t('marketplace.success_desc')}</p>
                    <Button variant="primary" size="lg" onClick={() => setSuccess(false)}>{t('marketplace.return_to_shop')}</Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={`${styles.hero} premium-hero-section`}>
                <div className="atmos-bg">
                    <div className="atmos-orb" style={{ top: '-10%', right: '-10%', background: 'var(--beacon-brand)' }} />
                    <div className="atmos-orb" style={{ bottom: '-10%', left: '-10%', background: '#949cf7', animationDelay: '-12s' }} />
                </div>
                <div className={styles.heroContent}>
                    <div className="premium-badge">
                        <ShoppingBag size={14} />
                        <span>Beacon Marketplace</span>
                    </div>
                    <h1 className="premium-hero-heading accent-text">{t('marketplace.title')}</h1>
                    <p className="premium-hero-subtitle">{t('marketplace.subtitle')}</p>
                    <div className={`${styles.balanceDisplay} premium-glass-card`} style={{ padding: '12px 24px', borderRadius: 99, display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                        <Coins size={22} color="#f0b232" style={{ filter: 'drop-shadow(0 0 10px rgba(240, 178, 50, 0.4))' }} />
                        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.05em' }}>
                            {t('marketplace.beacoin_balance', { count: balance.toLocaleString() })}
                        </span>
                    </div>
                </div>
            </header>

            <div style={{ marginTop: -28, position: 'relative', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div className="premium-glass-card" style={{ padding: 6, borderRadius: 20, display: 'inline-flex', gap: 4 }}>
                    <button className={`${styles.tabBtn} ${activeTab === 'plus' ? styles.activeTab : ''}`} onClick={() => setActiveTab('plus')}>
                        <Crown size={16} /> {t('marketplace.tabs.plus')}
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'decorations' ? styles.activeTab : ''}`} onClick={() => setActiveTab('decorations')}>
                        <Paintbrush size={16} /> {t('marketplace.tabs.decorations')}
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'effects' ? styles.activeTab : ''}`} onClick={() => setActiveTab('effects')}>
                        <Palette size={16} /> {t('marketplace.tabs.effects')}
                    </button>
                </div>

                <div className="premium-glass-card" style={{ padding: '4px 6px', borderRadius: 20, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px 16px', outline: 'none', width: 220, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Button variant={couponCode && discount > 0 ? "primary" : "secondary"} size="sm" onClick={handleApplyCoupon} style={{ borderRadius: 16, fontWeight: 800 }}>
                        {couponCode ? `${discount}% OFF` : 'Apply'}
                    </Button>
                </div>
            </div>

            <main className={`${styles.shopContent} vista-transition`}>
                {activeTab === 'plus' && (
                    <div className={styles.plans}>
                        <div className={`${styles.toggle} premium-glass-card`} style={{ borderRadius: 99, padding: 4 }}>
                            <button className={`${styles.toggleBtn} ${selectedPlan === 'monthly' ? styles.active : ''}`} onClick={() => setSelectedPlan('monthly')}>
                                {t('marketplace.plus.monthly')}
                            </button>
                            <button className={`${styles.toggleBtn} ${selectedPlan === 'yearly' ? styles.active : ''}`} onClick={() => setSelectedPlan('yearly')}>
                                {t('marketplace.plus.yearly')} <span className={styles.saveBadge}>{t('marketplace.plus.save_badge')}</span>
                            </button>
                        </div>

                        <div className={`${styles.card} premium-glass-card shimmer`} style={{ maxWidth: 500, margin: '0 auto' }}>
                            <div className={styles.cardHeader} style={{ background: 'linear-gradient(135deg, rgba(114, 137, 218, 0.1), transparent)', padding: '48px 40px' }}>
                                <Crown size={48} className="premium-gradient-text" style={{ marginBottom: 24 }} />
                                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Beacon+</h2>
                                <div className={styles.price}>
                                    <span style={{ fontSize: 44, fontWeight: 900, color: '#fff' }}>{cost.toLocaleString()}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Coins size={16} style={{ color: '#f0b232' }} />
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#f0b232' }}>BEACOINS</span>
                                        </div>
                                        <span className={styles.period} style={{ fontSize: 16 }}>/ {PLANS[selectedPlan].label}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0 40px 40px' }}>
                                <ul className={styles.features} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 32 }}>
                                    {FEATURES.map((f) => (
                                        <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <span className={styles.featureIcon} style={{ background: 'rgba(114, 137, 218, 0.15)', padding: 8, borderRadius: 10, color: 'var(--beacon-brand)' }}>{f.icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: 15 }}>{f.label}</span>
                                        </li>
                                    ))}
                                </ul>

                                {error && <div className={styles.errorBanner}>{error}</div>}

                                <Button
                                    variant="primary"
                                    size="lg"
                                    className={styles.subBtn}
                                    style={{ width: '100%', height: 56, fontSize: 18, fontWeight: 800, borderRadius: 16 }}
                                    onClick={handlePurchasePlus}
                                    disabled={!!purchasing || !canAfford}
                                >
                                    {purchasing === 'plus' ? t('marketplace.plus.processing') : canAfford ? t('marketplace.plus.purchase') : t('marketplace.plus.insufficient')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'decorations' || activeTab === 'effects') && (
                    <div className={`${styles.cosmeticGrid} premium-grid`}>
                        {(activeTab === 'decorations' ? marketplace.decorations : marketplace.effects).map(item => {
                            const isOwned = ownedCosmetics.some(c => c.cosmeticId === item.id)
                            const isEquipped = (user as any)?.[activeTab === 'decorations' ? 'avatarDecorationId' : 'profileEffectId'] === item.id
                            const accentColor = item.color || (activeTab === 'decorations' ? '#5865f2' : '#7b2ff7')

                            return (
                                <div key={item.id} className={`${styles.cosmeticCard} premium-glass-card`} style={{ '--accent': accentColor } as any}>
                                    <div className={styles.cosmeticPreview} style={{ background: activeTab === 'effects' ? `radial-gradient(circle at center, ${accentColor}20, transparent)` : 'transparent', height: 180 }}>
                                        <div className={activeTab === 'decorations' ? styles.previewAvatar : styles.previewProfile}>
                                            <div className={activeTab === 'decorations' ? styles.animatedRing : styles.particleField} style={{ background: activeTab === 'effects' ? accentColor : 'transparent', borderColor: activeTab === 'decorations' ? accentColor : 'transparent', boxShadow: `0 0 20px ${accentColor}80` }} />
                                        </div>
                                    </div>
                                    <div className={styles.cosmeticInfo} style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{item.name}</h3>
                                        <div className={styles.cosmeticPrice} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 14, fontWeight: 700 }}>
                                            {isOwned ? (
                                                <span style={{ color: '#43b581', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Shield size={14} fill="currentColor" /> {t('marketplace.cosmetics.owned')}
                                                </span>
                                            ) : (
                                                <>
                                                    <Coins size={14} color="#f0b232" />
                                                    <span style={{ color: '#f0b232' }}>{getEffectivePrice(item.price).toLocaleString()}</span>
                                                    {discount > 0 && <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{item.price}</span>}
                                                </>
                                            )}
                                        </div>
                                        <div className={styles.actions} style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                                            <Button
                                                variant={isEquipped ? 'secondary' : 'primary'}
                                                style={{ flex: 1, height: 40, fontWeight: 700 }}
                                                onClick={() => handleActionItem({ ...item, type: activeTab === 'decorations' ? 'avatar' : 'profile' })}
                                                disabled={!!purchasing || (!isOwned && balance < getEffectivePrice(item.price))}
                                            >
                                                {purchasing === item.id ? '...' : isEquipped ? t('marketplace.cosmetics.unequip') : isOwned ? t('marketplace.cosmetics.equip') : balance >= getEffectivePrice(item.price) ? t('marketplace.cosmetics.unlock') : t('marketplace.cosmetics.too_poor')}
                                            </Button>
                                            <Button variant="secondary" style={{ width: 64, height: 40 }} onClick={() => setGifting({ ...item, type: 'COSMETIC' })}>
                                                {t('marketplace.cosmetics.gift')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
            {gifting && <GiftingModal item={gifting} onClose={() => setGifting(null)} />}
        </div>
    )
}
