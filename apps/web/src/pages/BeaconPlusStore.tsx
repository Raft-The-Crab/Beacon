import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Coins, Sparkles, Shield, Zap, ShoppingBag, Palette, Paintbrush, AlertCircle, X } from 'lucide-react'
import { useBeacoinStore } from '../stores/useBeacoinStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useShopStore } from '../stores/useShopStore'
import { useTranslationStore } from '../stores/useTranslationStore'
import { api } from '../lib/api'
import { Button } from '../components/ui'
import { CelebrationAnimation } from '../components/animations/CelebrationAnimation'
import { CrateAnimation } from '../components/animations/CrateAnimation'
import { GiftingModal } from '../components/modals/GiftingModal'
import styles from '../styles/modules/pages/BeaconPlusStore.module.css'

const PLANS = {
    monthly: { cost: 1500, label: 'mo' },
    yearly: { cost: 11500, label: 'yr' },
}

interface CosmeticWithDetails {
    id: string
    name: string
    price: number
    color?: string
    description?: string
    type?: 'avatar' | 'profile' | 'theme'
    accentColor?: string
}

function CosmeticLoadingSkeleton() {
    return (
        <div className={styles.cosmeticCard} style={{ pointerEvents: 'none', opacity: 0.6 }}>
            <div className={`${styles.cosmeticPreview} ${styles.skeleton}`} style={{ height: 180 }} />
            <div className={`${styles.cosmeticInfo}`} style={{ padding: 24 }}>
                <div className={`${styles.skeleton}`} style={{ height: 24, marginBottom: 12, width: '70%' }} />
                <div className={`${styles.skeleton}`} style={{ height: 16, marginBottom: 20, width: '40%' }} />
                <div className={`${styles.skeleton}`} style={{ height: 40, borderRadius: 'var(--radius-md)' }} />
            </div>
        </div>
    )
}

export function BeaconPlusStore({ onClose }: { onClose?: () => void }) {
    const { t } = useTranslationStore()
    const [activeTab, setActiveTab] = useState<'plus' | 'decorations' | 'effects' | 'themes'>('plus')
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
    const [purchasing, setPurchasing] = useState<string | false>(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [successType, setSuccessType] = useState<'plus' | 'cosmetic' | null>(null)
    const [successRewardLabel, setSuccessRewardLabel] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false)

    const { balance, isLoading: walletLoading, purchaseSubscription, fetchWallet } = useBeacoinStore()
    const { user } = useAuthStore()
    const { ownedCosmetics, marketplace, isLoading: shopLoading, error: shopError, purchaseCosmetic, equipCosmetic, fetchOwned, fetchMarketplace } = useShopStore()
    const [gifting, setGifting] = useState<any>(null)

    // Coupon State
    const [couponInput, setCouponInput] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)

    const tr = (key: string, fallback: string, variables?: Record<string, any>) => {
        const translated = t(key, variables)
        return translated === key ? fallback : translated
    }

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setDiscount(0)
            setCouponCode('')
            setError('')
            return
        }

        const code = couponInput.toUpperCase().trim()
        try {
            const { data } = await api.post('/users/@me/beacoin/coupon/validate', { code })
            if (data?.kind !== 'percent') {
                setDiscount(0)
                setCouponCode('')
                setError('This code can only be used in Redeem Code settings.')
                return
            }

            setError('')
            setDiscount(Number(data.value) || 0)
            setCouponCode(data.code || code)
        } catch (err: any) {
            setDiscount(0)
            setCouponCode('')
            setError(err?.response?.data?.error || 'Invalid or expired coupon code.')
        }
    }

    const getEffectivePrice = (price: number) => Math.floor(price * (1 - discount / 100))

    const FEATURES = [
        { icon: <Sparkles size={16} />, label: tr('marketplace.plus.features.animated', 'Animated Avatar & Profile Assets') },
        { icon: <Zap size={16} />, label: tr('marketplace.plus.features.emojis', 'Use All Server Emojis Everywhere') },
        { icon: <Zap size={16} />, label: tr('marketplace.plus.features.uploads', 'Larger File Uploads (500 MB)') },
        { icon: <Shield size={16} />, label: tr('marketplace.plus.features.streaming', 'HD Streaming & Screen Share (1080p)') },
        { icon: <Crown size={16} />, label: tr('marketplace.plus.features.badge', 'Exclusive Beacon+ Crown Badge') },
        { icon: <Coins size={16} />, label: tr('marketplace.plus.features.bonus', 'Quest Beacoin Bonus (+50% daily rewards)') },
        { icon: <Sparkles size={16} />, label: tr('marketplace.plus.features.gifs', 'Expanded GIPHY access (240 req/hour)') },
        { icon: <Palette size={16} />, label: tr('marketplace.plus.features.themes', 'Exclusive Profile Themes & Effects') },
        { icon: <Shield size={16} />, label: tr('marketplace.plus.features.priority', 'Priority Support & Early Access') },
    ]

    useEffect(() => {
        if (!user?.id) return
        void fetchWallet()
    }, [user?.id, fetchWallet])

    useEffect(() => {
        if (!user?.id) return

        if (!ownedCosmetics.length) {
            void fetchOwned()
        }
        if (!marketplace.decorations.length && !marketplace.effects.length) {
            void fetchMarketplace()
        }
    }, [
        user?.id,
        ownedCosmetics.length,
        marketplace.decorations.length,
        marketplace.effects.length,
        fetchOwned,
        fetchMarketplace,
    ])

    const cost = getEffectivePrice(PLANS[selectedPlan].cost)
    const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)
    const giftDiscountPercent = hasBeaconPlus ? 25 : 0
    const giftCost = Math.floor(cost * (1 - giftDiscountPercent / 100))
    const loadingStoreData = walletLoading || shopLoading
    const loadingPlusCheckout = walletLoading
    const canAfford = balance >= cost
    const canAffordGift = balance >= giftCost
    const effectiveError = error || shopError || ''

    const handlePurchasePlus = async () => {
        if (!user || purchasing) return
        if (!canAfford) {
            const needed = Math.max(0, cost - balance)
            setError(`You need ${needed.toLocaleString()} more Beacoins for this plan.`)
            return
        }
        // If already subscribed to monthly, block repurchasing the same plan
        if (hasBeaconPlus && selectedPlan === 'monthly') {
            setError('You already have an active Beacon+ Monthly subscription.')
            return
        }
        setShowPurchaseConfirm(true)
    }

    const confirmPurchasePlus = async () => {
        setShowPurchaseConfirm(false)
        if (!user || purchasing) return
        setError('')
        setPurchasing('plus')
        try {
            await purchaseSubscription(selectedPlan, couponCode || undefined)
            setSuccessType('plus')
            setSuccessRewardLabel(selectedPlan === 'yearly' ? 'Beacon+ Yearly' : 'Beacon+ Monthly')
            setSuccess(true)
        } catch (err: any) {
            setError(err?.message || 'Purchase failed. Please try again.')
        } finally {
            setPurchasing(false)
        }
    }

    const handleActionItem = async (item: CosmeticWithDetails) => {
        const isOwned = ownedCosmetics.some((c: any) => c.cosmeticId === item.id)
        if (isOwned) {
            try {
                const itemType = item.type as any
                const isEquipped = itemType === 'theme'
                    ? (user as any)?.profileThemeId === item.id
                    : itemType === 'avatar'
                    ? (user as any)?.avatarDecorationId === item.id
                    : (user as any)?.profileEffectId === item.id
                if (isEquipped) {
                    await equipCosmetic(null, itemType)
                } else {
                    await equipCosmetic(item.id, itemType)
                }
            } catch (err: any) {
                setError(err.message)
            }
            return
        }

        const effectiveItemPrice = getEffectivePrice(item.price)
        if (!user || purchasing) return
        if (balance < effectiveItemPrice) {
            const needed = effectiveItemPrice - balance
            setError(`You need ${needed.toLocaleString()} more Beacoins to unlock ${item.type === 'avatar' ? 'this decoration' : 'this effect'}.`)
            return
        }
        setError('')
        setPurchasing(item.id)
        try {
            await purchaseCosmetic(item.id, couponCode || undefined)
            setSuccessType('cosmetic')
            setSuccessRewardLabel(item.name)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to buy item.')
        } finally {
            setPurchasing(false)
        }
    }

    const currentItems = activeTab === 'decorations' ? marketplace.decorations : activeTab === 'effects' ? marketplace.effects : activeTab === 'themes' ? marketplace.themes : []
    const filteredItems = currentItems.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (success) {
        const isPlusSuccess = successType === 'plus'
        return (
            <div className={styles.container}>
                <AnimatePresence>
                    {isPlusSuccess && <CelebrationAnimation key="celebration" />}
                    {!isPlusSuccess && (
                        <CrateAnimation
                            key="crate-reveal"
                            isOpen
                            reward={{
                                icon: '🎁',
                                label: successRewardLabel || 'New reward unlocked',
                            }}
                        />
                    )}
                </AnimatePresence>
                <div className={styles.successScreen}>
                    <div className="atmos-bg">
                        <div className="atmos-orb" style={{ background: 'var(--beacon-brand)', opacity: 0.2 }} />
                    </div>
                    <div className={styles.successBadge}>
                        {isPlusSuccess ? <Crown size={80} className={styles.successIcon} /> : <Sparkles size={80} className={styles.successIcon} />}
                    </div>
                    <h1 className={styles.successTitle}>
                        {isPlusSuccess ? 'Beacon+ Activated!' : 'Purchase Successful!'}
                    </h1>
                    <p className={styles.successMessage}>
                        {isPlusSuccess
                            ? `Your ${selectedPlan === 'yearly' ? 'yearly' : 'monthly'} Beacon+ perks are now live.`
                            : 'Your premium features are now active. Head over to your profile to equip your cosmetics.'}
                    </p>
                    <Button variant="primary" size="lg" onClick={() => { setSuccess(false); setSuccessType(null) }}>
                        {tr('marketplace.return_to_shop', 'Return to Shop')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                {onClose && (
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close shop"
                    >
                        <X size={20} />
                    </button>
                )}
                <div className="atmos-bg">
                    <div className="atmos-orb" style={{ top: '-10%', right: '-10%', background: 'var(--beacon-brand)' }} />
                    <div className="atmos-orb" style={{ bottom: '-10%', left: '-10%', background: '#949cf7', animationDelay: '-12s' }} />
                </div>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <ShoppingBag size={14} />
                        <span>Beacon Marketplace</span>
                    </div>
                    <h1 className={styles.heroTitle}>{tr('marketplace.title', 'Shop till you drop.')}</h1>
                    <p className={styles.heroSubtitle}>{tr('marketplace.subtitle', 'Unlock the full power of Beacon and customize your profile.')}</p>
                    <div className={styles.balanceDisplay}>
                        <Coins size={22} />
                        <span>{balance.toLocaleString()} Beacoins</span>
                    </div>
                </div>
            </header>

            <div className={styles.controlsDock}>
                <div className={styles.tabsShell}>
                    <button type="button" className={`${styles.tabBtn} ${activeTab === 'plus' ? styles.activeTab : ''}`} onClick={() => setActiveTab('plus')}>
                        <Crown size={16} /> {tr('marketplace.tabs.plus', 'Beacon+')}
                    </button>
                    <button type="button" className={`${styles.tabBtn} ${activeTab === 'decorations' ? styles.activeTab : ''}`} onClick={() => setActiveTab('decorations')}>
                        <Paintbrush size={16} /> {tr('marketplace.tabs.decorations', 'Avatar Decorations')}
                    </button>
                    <button type="button" className={`${styles.tabBtn} ${activeTab === 'effects' ? styles.activeTab : ''}`} onClick={() => setActiveTab('effects')}>
                        <Palette size={16} /> {tr('marketplace.tabs.effects', 'Profile Effects')}
                    </button>
                    <button type="button" className={`${styles.tabBtn} ${activeTab === 'themes' ? styles.activeTab : ''}`} onClick={() => setActiveTab('themes')}>
                        <Paintbrush size={16} /> {tr('marketplace.tabs.themes', 'Profile Themes')}
                    </button>
                </div>

                <div className={styles.couponShell}>
                    <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className={styles.couponInput}
                    />
                    <Button variant={couponCode && discount > 0 ? "primary" : "secondary"} size="sm" onClick={handleApplyCoupon} style={{ borderRadius: "var(--radius-lg)", fontWeight: 800 }}>
                        {couponCode ? `${discount}% OFF` : 'Apply'}
                    </Button>
                </div>
            </div>

            <main className={styles.shopContent}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                    >
                {activeTab === 'plus' && (
                    <div className={styles.plansSection}>
                        <div className={styles.toggle}>
                            <button type="button" className={`${styles.toggleBtn} ${selectedPlan === 'monthly' ? styles.active : ''}`} onClick={() => setSelectedPlan('monthly')}>
                                {tr('marketplace.plus.monthly', 'Monthly')}
                            </button>
                            <button type="button" className={`${styles.toggleBtn} ${selectedPlan === 'yearly' ? styles.active : ''}`} onClick={() => setSelectedPlan('yearly')}>
                                {tr('marketplace.plus.yearly', 'Yearly')} <span className={styles.saveBadge}>{tr('marketplace.plus.save_badge', 'Save 16%')}</span>
                            </button>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Crown size={48} className={styles.cardIcon} />
                                <h2>Beacon+</h2>
                                <div className={styles.price}>
                                    <span className={styles.amount}>{cost.toLocaleString()}</span>
                                    <div className={styles.priceMeta}>
                                        <div className={styles.coinLabel}>
                                            <Coins size={16} />
                                            <span>BEACOINS</span>
                                        </div>
                                        <span className={styles.period}>/ {PLANS[selectedPlan].label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <ul className={styles.features}>
                                    {FEATURES.map((f: any) => (
                                        <li key={f.label}>
                                            <span className={styles.featureIcon}>{f.icon}</span>
                                            <span>{f.label}</span>
                                        </li>
                                    ))}
                                </ul>

                                {effectiveError && (
                                    <div className={styles.errorBanner}>
                                        <AlertCircle size={14} />
                                        {effectiveError}
                                    </div>
                                )}

                                <Button
                                    variant="primary"
                                    size="lg"
                                    className={styles.subBtn}
                                    onClick={handlePurchasePlus}
                                    disabled={!!purchasing || loadingPlusCheckout}
                                >
                                    {purchasing === 'plus'
                                        ? tr('marketplace.plus.processing', 'Processing...')
                                        : loadingPlusCheckout
                                            ? 'Loading store...'
                                            : canAfford
                                                ? tr('marketplace.plus.purchase', 'Purchase')
                                                : tr('marketplace.plus.insufficient', 'Insufficient Beacoins')}
                                </Button>

                                <div className={styles.plusGiftPanel}>
                                    <div className={styles.plusGiftMeta}>
                                        <span className={styles.plusGiftTitle}>Gift Beacon+ to a friend</span>
                                        <span className={styles.plusGiftPrice}>
                                            {giftCost.toLocaleString()} Beacoins
                                            {giftDiscountPercent > 0 && <em>({giftDiscountPercent}% owner discount)</em>}
                                        </span>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        className={styles.plusGiftBtn}
                                        onClick={() => setGifting({
                                            id: null,
                                            type: 'SUBSCRIPTION',
                                            tier: selectedPlan,
                                            name: `Beacon+ ${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}`,
                                            price: giftCost,
                                        })}
                                        disabled={!!purchasing || loadingPlusCheckout || !canAffordGift}
                                    >
                                        {canAffordGift ? 'Gift Beacon+' : `Need ${(giftCost - balance).toLocaleString()} more`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'decorations' || activeTab === 'effects' || activeTab === 'themes') && (
                    <div className={styles.cosmeticSection}>
                        <div className={styles.cosmeticControls}>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        {effectiveError && (
                            <div className={styles.errorBanner} style={{ marginBottom: 20 }}>
                                <AlertCircle size={14} />
                                {effectiveError}
                            </div>
                        )}

                        <div className={styles.cosmeticGrid}>
                            {shopLoading && Array.from({ length: 4 }).map((_, i) => <CosmeticLoadingSkeleton key={i} />)}
                            
                            {!shopLoading && filteredItems.length === 0 && (
                                <div className={styles.emptyState}>
                                    <Palette size={48} />
                                    <h3>No items found</h3>
                                    <p>Try a different search or check back later for new items.</p>
                                </div>
                            )}

                            {!shopLoading && filteredItems.map((item: CosmeticWithDetails) => {
                                const isOwned = ownedCosmetics.some((c: any) => c.cosmeticId === item.id)
                                const isEquipped = activeTab === 'themes' 
                                    ? (user as any)?.profileThemeId === item.id 
                                    : activeTab === 'decorations'
                                    ? (user as any)?.avatarDecorationId === item.id
                                    : (user as any)?.profileEffectId === item.id
                                const itemType = activeTab === 'themes' ? 'theme' : activeTab === 'decorations' ? 'avatar' : 'profile'
                                const accentColor = activeTab === 'themes' ? item.accentColor : item.color || (activeTab === 'decorations' ? '#5865f2' : '#7b2ff7')
                                const effectiveItemPrice = getEffectivePrice(item.price)

                                return (
                                    <div key={item.id} className={styles.cosmeticCard} style={{ '--accent': accentColor } as any}>
                                        <div className={styles.cosmeticPreview} style={{ background: activeTab === 'themes' ? `linear-gradient(135deg, rgba(10, 14, 24, 0.96), ${accentColor}22)` : activeTab === 'effects' ? `radial-gradient(circle at center, ${accentColor}20, transparent)` : 'transparent' }}>
                                            {activeTab === 'themes' ? (
                                                <div style={{ width: '100%', height: '100%', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>Theme Preview</div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.18)', background: `linear-gradient(135deg, ${accentColor}, rgba(255,255,255,0.12))`, boxShadow: `0 10px 24px ${accentColor}33` }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                                            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)' }} />
                                                            <div style={{ height: '10px', width: '60%', borderRadius: '999px', background: `${accentColor}80` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={activeTab === 'decorations' ? styles.previewAvatar : styles.previewProfile}>
                                                    <div className={activeTab === 'decorations' ? styles.animatedRing : styles.particleField} style={{ background: activeTab === 'effects' ? accentColor : 'transparent', borderColor: activeTab === 'decorations' ? accentColor : 'transparent', boxShadow: `0 0 20px ${accentColor}80` }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cosmeticInfo}>
                                            <h3>{item.name}</h3>
                                            {item.description && <p className={styles.cosmeticDesc}>{item.description}</p>}
                                            <div className={styles.cosmeticPrice}>
                                                {isOwned ? (
                                                    <span className={styles.owned}>
                                                        <Shield size={14} /> {tr('marketplace.cosmetics.owned', 'Owned')}
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Coins size={14} />
                                                        <span>{effectiveItemPrice.toLocaleString()}</span>
                                                        {discount > 0 && <span className={styles.originalPrice}>{item.price}</span>}
                                                    </>
                                                )}
                                            </div>
                                            <div className={styles.actions}>
                                                <Button
                                                    variant={isEquipped ? 'secondary' : 'primary'}
                                                    onClick={() => handleActionItem({ ...item, type: itemType as any })}
                                                    disabled={!!purchasing || loadingStoreData}
                                                    style={{ flex: 1 }}
                                                >
                                                    {purchasing === item.id ? '...' : isEquipped ? tr('marketplace.cosmetics.unequip', 'Unequip') : isOwned ? tr('marketplace.cosmetics.equip', 'Equip') : balance >= effectiveItemPrice ? tr('marketplace.cosmetics.unlock', 'Unlock') : tr('marketplace.cosmetics.too_poor', 'Too poor')}
                                                </Button>
                                                {activeTab !== 'themes' && (
                                                    <Button variant="secondary" onClick={() => setGifting({ ...item, type: 'COSMETIC' })}>
                                                        {tr('marketplace.cosmetics.gift', 'Gift')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                    </motion.div>
                </AnimatePresence>
            </main>
            {gifting && <GiftingModal item={gifting} onClose={() => setGifting(null)} />}

            {/* Purchase Confirmation Dialog */}
            {showPurchaseConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xl)', padding: '32px', maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <Crown size={48} style={{ color: 'var(--beacon-brand)', marginBottom: 16 }} />
                        <h2 style={{ margin: '0 0 8px', fontWeight: 700 }}>Confirm Purchase</h2>
                        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
                            You're about to purchase <strong>Beacon+ {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}</strong> for <strong>{cost.toLocaleString()} Beacoins</strong>. This will be deducted from your wallet immediately.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Button variant="ghost" onClick={() => setShowPurchaseConfirm(false)}>Cancel</Button>
                            <Button variant="primary" onClick={confirmPurchasePlus}>Confirm Purchase</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
