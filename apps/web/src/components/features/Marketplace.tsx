/**
 * Marketplace — Pillar V: Beacoin Economy
 * A premium glassmorphic shop for profile arts, frames, and server boosts.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Star, Sparkles, Crown, Palette, Zap } from 'lucide-react'
import styles from '../../styles/modules/features/Marketplace.module.css'

interface ShopItem {
    id: string
    name: string
    description: string
    price: number
    type: 'frame' | 'theme' | 'effect' | 'badge' | 'boost'
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    preview: string
    owned?: boolean
}

// Mock items — will be replaced with API data
const MOCK_ITEMS: ShopItem[] = [
    { id: '1', name: 'Neon Circuit Frame', description: 'A glowing cyberpunk avatar frame.', price: 500, type: 'frame', rarity: 'epic', preview: '🔮' },
    { id: '2', name: 'Cosmic Dust Theme', description: 'Deep space particle background.', price: 800, type: 'theme', rarity: 'legendary', preview: '🌌' },
    { id: '3', name: 'Chromatic Blur Effect', description: 'Rainbow blur on your profile card.', price: 300, type: 'effect', rarity: 'rare', preview: '🌈' },
    { id: '4', name: 'Early Adopter Badge', description: 'Exclusive first-wave badge.', price: 150, type: 'badge', rarity: 'common', preview: '🏅' },
    { id: '5', name: 'Quantum Shift Frame', description: 'Phase-shifting holographic frame.', price: 1200, type: 'frame', rarity: 'legendary', preview: '💎' },
    { id: '6', name: 'Server Nitro Boost', description: 'Boost a server for 30 days.', price: 1000, type: 'boost', rarity: 'epic', preview: '⚡' },
    { id: '7', name: 'Void Walker Theme', description: 'Dark matter void aesthetic.', price: 600, type: 'theme', rarity: 'epic', preview: '🕳️' },
    { id: '8', name: 'Prism Refraction', description: 'Light-bending profile effect.', price: 450, type: 'effect', rarity: 'rare', preview: '💠' },
]

const RARITY_COLORS: Record<string, string> = {
    common: '#8e8e93',
    rare: 'var(--beacon-brand)',
    epic: '#9b59b6',
    legendary: '#f1c40f',
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    frame: <Palette size={14} />,
    theme: <Sparkles size={14} />,
    effect: <Star size={14} />,
    badge: <Crown size={14} />,
    boost: <Zap size={14} />,
}

interface MarketplaceProps {
    userBalance?: number
    onPurchase?: (itemId: string) => void
}

export function Marketplace({ userBalance = 0, onPurchase }: MarketplaceProps) {
    const [items, setItems] = useState<ShopItem[]>(MOCK_ITEMS)
    const [filter, setFilter] = useState<string>('all')
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
    const [purchasing, setPurchasing] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [couponApplied, setCouponApplied] = useState(false)

    const filteredItems = filter === 'all'
        ? items
        : items.filter(i => i.type === filter)

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            setDiscount(0)
            setCouponApplied(false)
            return
        }
        // Pseudo-random deterministic discount 0-99 based on code hash
        let hash = 0
        for (let i = 0; i < couponCode.length; i++) {
            hash = Math.imul(31, hash) + couponCode.charCodeAt(i) | 0
        }
        const sale = Math.abs(hash) % 100
        setDiscount(sale)
        setCouponApplied(true)
    }

    const getEffectivePrice = (price: number) => {
        return Math.floor(price * (1 - discount / 100))
    }

    const handlePurchase = async (item: ShopItem) => {
        if (purchasing) return
        setPurchasing(true)
        // Simulate purchase delay
        await new Promise(r => setTimeout(r, 1200))
        onPurchase?.(item.id)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i))
        setPurchasing(false)
        setSelectedItem(null)
    }

    const filters = ['all', 'frame', 'theme', 'effect', 'badge', 'boost']

    return (
        <div className={styles.marketplace}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <ShoppingBag size={24} />
                    <h2>Marketplace</h2>
                </div>
                <div className={styles.balance}>
                    <Sparkles size={16} />
                    <span>{userBalance.toLocaleString()} Beacoins</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                {filters.map(f => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className={styles.grid}>
                <AnimatePresence>
                    {filteredItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedItem(item)}
                            style={{ '--rarity-color': RARITY_COLORS[item.rarity] } as React.CSSProperties}
                        >
                            <div className={styles.cardPreview}>
                                <span className={styles.previewEmoji}>{item.preview}</span>
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardMeta}>
                                    {TYPE_ICONS[item.type]}
                                    <span className={styles.rarityBadge} style={{ color: RARITY_COLORS[item.rarity] }}>
                                        {item.rarity}
                                    </span>
                                </div>
                                <h3 className={styles.cardName}>{item.name}</h3>
                                <div className={styles.cardPrice}>
                                    <Sparkles size={12} />
                                    <span>{item.price}</span>
                                </div>
                                {item.owned && <span className={styles.ownedBadge}>Owned</span>}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setSelectedItem(null)
                            setCouponCode('')
                            setDiscount(0)
                            setCouponApplied(false)
                        }}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={styles.modalPreview}>
                                <span style={{ fontSize: 64 }}>{selectedItem.preview}</span>
                            </div>
                            <h2>{selectedItem.name}</h2>
                            <p className={styles.modalDesc}>{selectedItem.description}</p>
                            <div className={styles.modalMeta}>
                                <span className={styles.rarityBadge} style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                                    {selectedItem.rarity.toUpperCase()}
                                </span>
                                <span className={styles.modalPrice}>
                                    <Sparkles size={16} />
                                    {discount > 0 ? (
                                        <>
                                            <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 6 }}>{selectedItem.price}</span>
                                            {getEffectivePrice(selectedItem.price)} Beacoins (-{discount}%)
                                        </>
                                    ) : (
                                        <>{selectedItem.price} Beacoins</>
                                    )}
                                </span>
                            </div>

                            {!selectedItem.owned && (
                                <div className={styles.couponArea}>
                                    <input
                                        type="text"
                                        placeholder="Have a coupon code?"
                                        className={styles.couponInput}
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase())
                                            setCouponApplied(false)
                                            setDiscount(0)
                                        }}
                                    />
                                    <button
                                        className={couponApplied ? styles.couponApplyBtnActive : styles.couponApplyBtn}
                                        onClick={handleApplyCoupon}
                                    >
                                        {couponApplied ? 'Applied' : 'Apply'}
                                    </button>
                                </div>
                            )}

                            {selectedItem.owned ? (
                                <button className={styles.ownedBtn} disabled>Already Owned</button>
                            ) : (
                                <button
                                    className={styles.purchaseBtn}
                                    onClick={() => handlePurchase(selectedItem)}
                                    disabled={purchasing || userBalance < getEffectivePrice(selectedItem.price)}
                                >
                                    {purchasing ? 'Purchasing...' : userBalance < getEffectivePrice(selectedItem.price) ? 'Insufficient Beacoins' : 'Purchase'}
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
