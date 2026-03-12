import { useState } from 'react'
import { Search, Rocket, Code, Laptop, Shield, Zap, Bot, Music, Cpu, Palette, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui'
import { useTranslationStore } from '../stores/useTranslationStore'
import styles from '../styles/modules/pages/AppDirectory.module.css'

const APPS = [
    { name: 'Beacon Bot', icon: <Bot size={28} />, category: 'Official', desc: 'The official Beacon bot with moderation, welcomes, and slash commands.', gradient: 'linear-gradient(135deg, #5865f2, #4752c4)', official: true },
    { name: 'AutoMod Pro', icon: <Shield size={28} />, category: 'Security', desc: 'Advanced auto-moderation powered by AI to keep your server clean.', gradient: 'linear-gradient(135deg, #23a559, #1a7a42)', official: false },
    { name: 'MusicMaster', icon: <Music size={28} />, category: 'Productivity', desc: 'High-quality music streaming with queue management and DJ controls.', gradient: 'linear-gradient(135deg, #f0b232, #e05c00)', official: false },
    { name: 'CodeRunner', icon: <Code size={28} />, category: 'Developer', desc: 'Execute code snippets in 30+ languages directly from chat messages.', gradient: 'linear-gradient(135deg, #949cf7, #5865f2)', official: false },
    { name: 'PollMaster', icon: <Zap size={28} />, category: 'Productivity', desc: 'Create beautiful polls, surveys, and votes with real-time results.', gradient: 'linear-gradient(135deg, #ff6b6b, #ee0979)', official: false },
    { name: 'AvatarFX', icon: <Palette size={28} />, category: 'Social', desc: 'Apply stunning visual effects and filters to your server profiles.', gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)', official: false },
]

const CATEGORIES = ['All', 'Official', 'Security', 'Productivity', 'Developer', 'Social']

export function AppDirectory() {
    const { t } = useTranslationStore()
    const [activeCategory, setActiveCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')

    const filtered = APPS.filter((app: any) => {
        const matchesCat = activeCategory === 'All' || app.category === activeCategory
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.desc.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCat && matchesSearch
    })

    return (
        <div className={styles.container}>
            <header className={`${styles.hero} premium-hero-section`}>
                <div className="atmos-bg">
                    <div className="atmos-orb" style={{ top: '-10%', right: '-10%', background: '#7c3aed', opacity: 0.15 }} />
                    <div className="atmos-orb" style={{ bottom: '-10%', left: '-10%', background: 'var(--beacon-brand)', opacity: 0.1, animationDelay: '-8s' }} />
                </div>
                <div className="premium-badge">
                    <Cpu size={14} />
                    <span>{t('common.app_directory')}</span>
                </div>
                <h1 className="premium-hero-heading accent-text">{t('app_directory.title')}</h1>
                <p className="premium-hero-subtitle">{t('app_directory.subtitle')}</p>

                <div className="premium-glass-card" style={{ borderRadius: "var(--radius-xl)", padding: '10px 24px', maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Search size={20} style={{ opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder={t('app_directory.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, width: '100%', outline: 'none', padding: '10px 0' }}
                    />
                </div>
            </header>

            <main className="vista-transition" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 80px' }}>
                {/* Category Filter */}
                <div style={{ marginTop: -28, marginBottom: 48, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div className="premium-glass-card" style={{ padding: 6, borderRadius: "var(--radius-xl)", display: 'inline-flex', gap: 4 }}>
                        {CATEGORIES.map((cat: string) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: "var(--radius-md)",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: activeCategory === cat ? 'var(--beacon-brand)' : 'transparent',
                                    color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.6)',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {t(`app_directory.categories.${cat.toLowerCase().replace(' ', '_')}`) || cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Apps Grid */}
                <div className="premium-grid">
                    {filtered.map((app: any) => (
                        <div key={app.name} className="premium-glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: 100, background: app.gradient, borderRadius: '32px 32px 0 0', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
                                <div style={{ width: 64, height: 64, borderRadius: "var(--radius-xl)", background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: -32, border: '3px solid rgba(255,255,255,0.2)' }}>
                                    {app.icon}
                                </div>
                                {app.official && (
                                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: "var(--radius-sm)", display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                                        <CheckCircle size={12} fill="var(--beacon-brand)" color="white" />
                                        {t('app_directory.items.official')}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: 24, paddingTop: 44, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{app.name}</h3>
                                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>{app.category}</span>
                                </div>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{app.desc}</p>
                                <Button
                                    variant="primary"
                                    style={{ width: '100%', height: 44, borderRadius: "var(--radius-md)", fontWeight: 800, marginTop: 8 }}
                                >
                                    {t('app_directory.items.add_to_server')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coming Soon Banner */}
                <div className="premium-glass-card" style={{ marginTop: 80, padding: 64, textAlign: 'center', borderRadius: 40 }}>
                    <div className="atmos-bg">
                        <div className="atmos-orb" style={{ background: '#7c3aed', opacity: 0.08, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    </div>
                    <Rocket size={56} style={{ color: 'var(--beacon-brand)', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(114, 137, 218, 0.4))' }} />
                    <h2 className="premium-glow-text" style={{ fontSize: 40, marginBottom: 16 }}>Sovereign App Curation</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
                        We are hand-picking the highest quality plugins to ensure the Beacon experience remains premium and secure.
                    </p>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 40 }}>
                        <div className="premium-glass-card" style={{ padding: '20px 32px', borderRadius: "var(--radius-xl)", display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Code size={24} style={{ color: 'var(--beacon-brand)' }} />
                            <span style={{ fontWeight: 800 }}>Verified SDK</span>
                        </div>
                        <div className="premium-glass-card" style={{ padding: '20px 32px', borderRadius: "var(--radius-xl)", display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Laptop size={24} style={{ color: 'var(--beacon-brand)' }} />
                            <span style={{ fontWeight: 800 }}>Native Performance</span>
                        </div>
                    </div>
                    <Button variant="primary" size="lg" style={{ height: 56, paddingInline: 48, fontSize: 18, fontWeight: 800, borderRadius: "var(--radius-lg)" }}>
                        Join Developer Preview
                    </Button>
                </div>
            </main>
        </div>
    )
}
