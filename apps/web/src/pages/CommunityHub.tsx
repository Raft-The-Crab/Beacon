import { Users, Star, MessageSquare, PlusCircle, Globe } from 'lucide-react'
import { Button } from '../components/ui'
import { useTranslationStore } from '../stores/useTranslationStore'
import styles from '../styles/modules/pages/CommunityHub.module.css'

const FEATURED = [
    {
        name: 'Dev Lab',
        emoji: '🚀',
        gradient: 'linear-gradient(135deg, #FF6B6B, #FFEEAD)',
        desc: 'A collection of developers building the next big thing.',
        members: '1.2k',
        verified: true,
    },
    {
        name: "Gamer's Haven",
        emoji: '🎮',
        gradient: 'linear-gradient(135deg, #6BCB77, #4D96FF)',
        desc: 'For those who live and breathe esports.',
        members: '45k',
        verified: false,
    },
    {
        name: 'Lofi Lounge',
        emoji: '🎵',
        gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        desc: 'Chill beats, calm vibes, great conversations.',
        members: '12k',
        verified: true,
    },
    {
        name: 'Art Studio',
        emoji: '🎨',
        gradient: 'linear-gradient(135deg, #f7971e, #ffd200)',
        desc: 'Share and critique digital art from across the globe.',
        members: '8.4k',
        verified: false,
    },
]

export function CommunityHub() {
    const { t } = useTranslationStore()

    return (
        <div className={styles.container}>
            <header className={`${styles.hero} premium-hero-section`}>
                <div className="atmos-bg">
                    <div className="atmos-orb" style={{ top: '-10%', right: '-10%', background: 'var(--beacon-brand)', opacity: 0.15 }} />
                    <div className="atmos-orb" style={{ bottom: '-10%', left: '-10%', background: '#ef4444', opacity: 0.08, animationDelay: '-8s' }} />
                </div>
                <div className="premium-badge">
                    <Globe size={14} />
                    <span>{t('common.community_hub')}</span>
                </div>
                <h1 className="premium-hero-heading accent-text">{t('community.title')}</h1>
                <p className="premium-hero-subtitle">{t('community.subtitle')}</p>
            </header>

            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 80px' }} className="vista-transition">
                <h2 className="premium-glow-text" style={{ fontSize: 32, marginBottom: 8, marginTop: 0 }}>
                    {t('community.featured')}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 48, fontSize: 16 }}>
                    Handpicked servers that are thriving and welcoming.
                </p>

                <div className="premium-grid">
                    {FEATURED.map((community) => (
                        <div key={community.name} className="premium-glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: 120, background: community.gradient, flexShrink: 0, borderRadius: '32px 32px 0 0' }} />
                            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -48 }}>
                                    <div style={{
                                        width: 72, height: 72, borderRadius: "var(--radius-xl)",
                                        background: 'var(--bg-secondary)', border: '4px solid var(--bg-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 32, flexShrink: 0
                                    }}>
                                        {community.emoji}
                                    </div>
                                    {community.verified && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#f0b232', marginBottom: 4 }}>
                                            <Star size={14} fill="#f0b232" />
                                            <span>VERIFIED</span>
                                        </div>
                                    )}
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{community.name}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{community.desc}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
                                    <Users size={14} />
                                    <span>{community.members} members</span>
                                </div>
                                <Button variant="primary" style={{ width: '100%', height: 44, borderRadius: "var(--radius-md)", fontWeight: 800 }}>
                                    {t('community.join')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="premium-glass-card" style={{ marginTop: 80, padding: 64, textAlign: 'center', borderRadius: 40 }}>
                    <div className="atmos-bg">
                        <div className="atmos-orb" style={{ background: '#7b2ff7', opacity: 0.08, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    </div>
                    <MessageSquare size={56} style={{ color: 'var(--beacon-brand)', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(114, 137, 218, 0.4))' }} />
                    <h2 className="premium-glow-text" style={{ fontSize: 40, marginBottom: 16 }}>{t('community.cta')}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
                        {t('community.cta_desc')}
                    </p>
                    <Button variant="primary" size="lg" style={{ height: 56, paddingInline: 48, fontSize: 18, fontWeight: 800, borderRadius: "var(--radius-lg)" }}>
                        <PlusCircle size={20} />
                        {t('community.create_server')}
                    </Button>
                </div>
            </main>
        </div>
    )
}
