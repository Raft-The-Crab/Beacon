import React, { useState, useEffect } from 'react'
import { Search, Users, TrendingUp, Compass, ArrowRight, Gamepad2, Music, Code, Palette, BookOpen, Globe } from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/ServerDiscovery.module.css'

export interface DiscoverableServer {
    id: string
    name: string
    icon: string
    banner?: string
    description: string
    memberCount: number
    onlineCount: number
    category: string
    tags: string[]
    featured?: boolean
    verified?: boolean
}

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <Compass size={18} /> },
    { id: 'gaming', label: 'Gaming', icon: <Gamepad2 size={18} /> },
    { id: 'music', label: 'Music', icon: <Music size={18} /> },
    { id: 'education', label: 'Education', icon: <BookOpen size={18} /> },
    { id: 'science', label: 'Science & Tech', icon: <Code size={18} /> },
    { id: 'art', label: 'Art & Design', icon: <Palette size={18} /> },
    { id: 'international', label: 'International', icon: <Globe size={18} /> },
]

function formatCount(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
}

export function ServerDiscovery({ onJoin }: { onJoin?: (guildId: string) => void }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [servers, setServers] = useState<DiscoverableServer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchServers = async () => {
            setLoading(true)
            try {
                const res = await apiClient.request('GET', `/guilds/discovery?category=${activeCategory}&query=${searchQuery}`)
                if (res.success) {
                    setServers(res.data)
                }
            } catch (err) {
                console.error('Failed to fetch discovery', err)
            } finally {
                setLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchServers, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, activeCategory])

    const featuredServers = servers.filter((s: DiscoverableServer) => s.featured)

    return (
        <div className={styles.discovery}>
            {/* Hero */}
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>Find your community on Beacon</h1>
                <p className={styles.heroSubtitle}>From gaming to music, art to tech — there's a place for you.</p>
                <div className={styles.searchBar}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Explore communities..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Featured banner carousel */}
            {!searchQuery && activeCategory === 'all' && (
                <div className={styles.featured}>
                    <h2 className={styles.sectionTitle}>
                        <TrendingUp size={20} />
                        Featured Communities
                    </h2>
                    <div className={styles.featuredGrid}>
                        {featuredServers.map((server: DiscoverableServer) => (
                            <div key={server.id} className={styles.featuredCard} style={{ background: server.banner }}>
                                <div className={styles.featuredOverlay}>
                                    <span className={styles.featuredIcon}>{server.icon}</span>
                                    <h3 className={styles.featuredName}>{server.name}</h3>
                                    <p className={styles.featuredDesc}>{server.description}</p>
                                    <div className={styles.featuredStats}>
                                        <span><span className={styles.onlineDot} /> {formatCount(server.onlineCount)} Online</span>
                                        <span><Users size={14} /> {formatCount(server.memberCount)} Members</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category tabs */}
            <div className={styles.categories}>
                {CATEGORIES.map((cat: any) => (
                    <button
                        key={cat.id}
                        className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.activeCategory : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Server grid */}
            <div className={styles.serverGrid}>
                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>Loading communities...</div>
                ) : servers.map((server: DiscoverableServer) => (
                    <div key={server.id} className={styles.serverCard}>
                        <div className={styles.serverBanner} style={{ background: server.banner || 'var(--bg-hover)' }}>
                            <span className={styles.serverEmoji}>{server.icon || '🚀'}</span>
                            {server.verified && <span className={styles.verifiedBadge}>✓</span>}
                        </div>
                        <div className={styles.serverInfo}>
                            <h3 className={styles.serverName}>{server.name}</h3>
                            <p className={styles.serverDesc}>{server.description || 'No description provided.'}</p>
                            <div className={styles.serverTags}>
                                {server.tags.map((tag: string) => (
                                    <span key={tag} className={styles.tag}>#{tag}</span>
                                ))}
                            </div>
                            <div className={styles.serverFooter}>
                                <div className={styles.serverStats}>
                                    <span><span className={styles.onlineDot} /> {formatCount(server.onlineCount)}</span>
                                    <span><Users size={13} /> {formatCount(server.memberCount)}</span>
                                </div>
                                <button className={styles.joinBtn} onClick={() => onJoin?.(server.id)}>
                                    Join <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && servers.length === 0 && (
                <div className={styles.empty}>
                    <Compass size={48} />
                    <h3>No communities found</h3>
                    <p>Try adjusting your search or browse a different category.</p>
                </div>
            )}
        </div>
    )
}
