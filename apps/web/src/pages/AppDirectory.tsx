import { useEffect, useMemo, useState } from 'react'
import { Search, Bot, Cpu, PlusCircle } from 'lucide-react'
import { Button } from '../components/ui'
import { useTranslationStore } from '../stores/useTranslationStore'
import { apiClient } from '../services/apiClient'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/modules/pages/AppDirectory.module.css'
import shellStyles from '../styles/modules/pages/DiscoveryShell.module.css'

interface ApplicationItem {
    id: string
    name: string
    description?: string | null
    bot?: { id: string } | null
}

export function AppDirectory() {
    const { t } = useTranslationStore()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [apps, setApps] = useState<ApplicationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadApps = async () => {
            setLoading(true)
            setError(null)

            const response = await apiClient.request('GET', '/applications')
            if (!response.success) {
                setError(response.error || 'Failed to load applications')
                setLoading(false)
                return
            }

            setApps(Array.isArray(response.data) ? response.data : [])
            setLoading(false)
        }

        void loadApps()
    }, [])

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return apps
        return apps.filter((app) =>
            String(app.name || '').toLowerCase().includes(q) || (app.description || '').toLowerCase().includes(q)
        )
    }, [apps, searchQuery])

    return (
        <div className={shellStyles.pageShell}>
            <div className={shellStyles.modalFrame} style={{ height: 'min(84vh, 100%)', overflow: 'auto' }}>
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
                <div style={{ marginTop: -10, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Real applications from your account. Build and manage bots in Developer Portal.</p>
                    <Button variant="primary" onClick={() => navigate('/developer')}>
                        <PlusCircle size={16} />
                        Open Developer Portal
                    </Button>
                </div>

                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '36px 0' }}>Loading applications...</div>
                ) : error ? (
                    <div className="premium-glass-card" style={{ padding: 24, borderRadius: "var(--radius-xl)", color: 'var(--text-secondary)' }}>
                        {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="premium-glass-card" style={{ padding: 32, borderRadius: "var(--radius-xl)", textAlign: 'center' }}>
                        <Bot size={40} style={{ opacity: 0.35, marginBottom: 12 }} />
                        <h3 style={{ marginBottom: 8 }}>No applications yet</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Create your first application to start building bots and integrations.</p>
                        <Button variant="primary" onClick={() => navigate('/developer')}>Create Application</Button>
                    </div>
                ) : (
                    <div className="premium-grid">
                        {filtered.map((app) => (
                            <div key={app.id} className="premium-glass-card" style={{ padding: 22, borderRadius: "var(--radius-xl)", display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(88,101,242,0.18)', border: '1px solid rgba(88,101,242,0.3)' }}>
                                        <Cpu size={20} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{app.name}</h3>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.bot ? 'Bot linked' : 'No bot linked'}</div>
                                    </div>
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{app.description || 'No description provided.'}</p>
                                <Button variant="secondary" onClick={() => navigate('/developer')}>
                                    Manage
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
        </div>
        </div>
    )
}
