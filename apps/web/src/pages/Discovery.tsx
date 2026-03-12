import React, { useState, useEffect } from 'react'
import { Search, Compass, Shield } from 'lucide-react'
import { Button } from '../components/ui'
import { useServerStore } from '../stores/useServerStore'
import { useToast } from '../components/ui'
import { useTranslationStore } from '../stores/useTranslationStore'
import { apiClient } from '../services/apiClient'
import styles from '../styles/modules/pages/Discovery.module.css'

interface DiscoverableGuild {
    id: string
    name: string
    icon?: string
    banner?: string
    description?: string
    memberCount: number
    onlineCount: number
    verified: boolean
    tags: string[]
}

export function Discovery() {
    const { t } = useTranslationStore()
    const [guilds, setGuilds] = useState<DiscoverableGuild[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const { joinGuild } = useServerStore()
    const toast = useToast()

    useEffect(() => {
        fetchDiscovery()
    }, [])

    const fetchDiscovery = async () => {
        setLoading(true)
        try {
            const res = await apiClient.request('GET', '/guilds/discovery')
            if (res.success) {
                setGuilds(res.data)
            }
        } catch (error) {
            console.error('Failed to fetch discovery', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async (guildId: string, guildName: string) => {
        try {
            await joinGuild(guildId)
            toast.success(`${t('discovery.join_success')} ${guildName}!`)
        } catch (error) {
            toast.error(t('discovery.join_error'))
        }
    }

    const filteredGuilds = guilds.filter((g: any) => {
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesCategory = activeCategory === 'All' || g.tags.includes(activeCategory)
        return matchesSearch && matchesCategory
    })

    const categories = ['All', 'Gaming', 'Music', 'Education', 'Science & Tech', 'Art']

    return (
        <div className={styles.container}>
            <header className={`${styles.hero} premium-hero-section`}>
                <div className="atmos-bg">
                    <div className="atmos-orb" style={{ top: '-10%', left: '-10%', background: 'var(--beacon-brand)', opacity: 0.15 }} />
                    <div className="atmos-orb" style={{ bottom: '-10%', right: '-10%', background: '#949cf7', opacity: 0.1, animationDelay: '-12s' }} />
                </div>
                <div className={styles.heroContent}>
                    <div className="premium-badge">
                        <Compass size={14} />
                        <span>{t('common.discovery')}</span>
                    </div>
                    <h1 className="premium-hero-heading">{t('discovery.title')}</h1>
                    <p>{t('discovery.subtitle')}</p>

                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder={t('discovery.search_placeholder')}
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            </header>
            <main className={`${styles.content} vista-transition`} style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 80px' }}>
                <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, marginTop: -32 }}>
                    <div className={styles.tabs} style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: "var(--radius-lg)", border: '1px solid rgba(255,255,255,0.05)' }}>
                        {categories.map((cat: string) => (
                            <button
                                key={cat}
                                className={`${styles.tabBtn} ${activeCategory === cat ? styles.activeTab : ''}`}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: "var(--radius-md)",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    background: activeCategory === cat ? 'var(--beacon-brand)' : 'transparent',
                                    color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.6)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="premium-grid">
                        {[1, 2, 3, 4, 5, 6].map((i: number) => (
                            <div key={i} className="premium-glass-card shimmer" style={{ height: 320, borderRadius: "var(--radius-xl)" }} />
                        ))}
                    </div>
                ) : filteredGuilds.length === 0 ? (
                    <div className={styles.noResults} style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Compass size={80} style={{ opacity: 0.1, marginBottom: 24 }} />
                        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('discovery.no_results', { query: searchQuery })}</h2>
                        <Button variant="secondary" onClick={() => setSearchQuery('')} style={{ marginTop: 24 }}>
                            {t('discovery.clear_search')}
                        </Button>
                    </div>
                ) : (
                    <div className="premium-grid">
                        {filteredGuilds.map((guild: any) => (
                            <div key={guild.id} className="premium-glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                    className={styles.cardBanner}
                                    style={{
                                        height: 120,
                                        position: 'relative',
                                        background: guild.banner ? `url(${guild.banner}) center/cover` : 'linear-gradient(135deg, var(--beacon-brand), #4d5ef0)'
                                    }}
                                >
                                    {guild.verified && (
                                        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', padding: 6, borderRadius: "var(--radius-sm)" }}>
                                            <Shield size={16} fill="var(--beacon-brand)" color="white" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                        <div style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: "var(--radius-xl)",
                                            background: 'var(--bg-secondary)',
                                            border: '4px solid var(--bg-primary)',
                                            marginTop: -48,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 24,
                                            fontWeight: 900,
                                            overflow: 'hidden'
                                        }}>
                                            {guild.icon ? <img src={guild.icon} alt={guild.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : guild.name[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{guild.name}</h3>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {guild.tags.slice(0, 2).map((tag: string) => (
                                                    <span key={tag} style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>
                                        {guild.description || 'Welcome to our premium Beacon community! Join us for epic discussions and exclusive events.'}
                                    </p>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#23a559' }} />
                                            <span style={{ color: 'var(--text-secondary)' }}>{t('discovery.online', { count: guild.onlineCount.toLocaleString() })}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                                            <span style={{ color: 'var(--text-secondary)' }}>{t('discovery.members', { count: guild.memberCount.toLocaleString() })}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        style={{ width: '100%', height: 44, borderRadius: "var(--radius-md)", fontWeight: 800 }}
                                        onClick={() => handleJoin(guild.id, guild.name)}
                                    >
                                        {t('discovery.join_server')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
