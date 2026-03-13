import { Helmet } from 'react-helmet-async'
import { Book, Code, Cpu, ChevronRight, Zap, Globe, Shield, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DocsLayout } from '../../components/layout/DocsLayout'
import { useTranslationStore } from '../../stores/useTranslationStore'
import styles from '../../styles/modules/pages/DocsHome.module.css'

export function DocsHome() {
    const { t } = useTranslationStore()

    return (
        <DocsLayout>
            <Helmet>
                <title>{t('docs.title')} - Beacon Developers</title>
            </Helmet>

            <header className={`${styles.header} premium-hero-section`}>
                <div className="premium-badge">
                    <Rocket size={14} />
                    <span>v2.0 Developer Preview</span>
                </div>
                <h1 className="premium-hero-heading accent-text">{t('docs.title')}</h1>
                <p className="premium-hero-subtitle">
                    {t('docs.subtitle')}
                </p>
            </header>

            <div className={`${styles.grid} premium-grid`}>
                <DocLink
                    icon={<Rocket size={20} />}
                    title={t('docs.categories.getting_started')}
                    description="Set up your first bot in under 5 minutes. Initial setup and environment guides."
                    to="/docs/getting-started"
                    color="brand"
                />
                <DocLink
                    icon={<Code size={20} />}
                    title={t('docs.categories.api_reference')}
                    description="Full technical reference for REST endpoints — users, guilds, channels, and more."
                    to="/docs/api-reference"
                    color="purple"
                />
                <DocLink
                    icon={<Zap size={20} />}
                    title={t('docs.categories.gateway')}
                    description="Connect via WebSocket to receive real-time events like messages and reactions."
                    to="/docs/gateway-events"
                    color="orange"
                />
                <DocLink
                    icon={<Book size={20} />}
                    title={t('docs.categories.sdk')}
                    description="Master the official @beacon/sdk package — slash commands, buttons, and managers."
                    to="/docs/sdk-tutorial"
                    color="green"
                />
                <DocLink
                    icon={<Cpu size={20} />}
                    title={t('docs.categories.bot_commands')}
                    description="Built-in Beacon Bot commands, rich embeds, action buttons, and AI features."
                    to="/docs/bot-commands"
                    color="red"
                />
            </div>

            <section className={styles.section} style={{ marginTop: 80 }}>
                <h2 className="premium-glow-text" style={{ fontSize: 32, marginBottom: 32 }}>{t('docs.popular_topics')}</h2>
                <div className={styles.topicList}>
                    <Link to="/docs/getting-started" className={`${styles.topicItem} glass-interactive`}>
                        <span>{t('docs.topics.create_app')}</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/api-reference" className={`${styles.topicItem} glass-interactive`}>
                        <span>{t('docs.topics.rest_api')}</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/gateway-events" className={`${styles.topicItem} glass-interactive`}>
                        <span>{t('docs.topics.websocket')}</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/sdk-tutorial" className={`${styles.topicItem} glass-interactive`}>
                        <span>{t('docs.topics.sdk_guide')}</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/bot-commands" className={`${styles.topicItem} glass-interactive`}>
                        <span>{t('docs.topics.bot_features')}</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </section>

            <section className={styles.section} style={{ marginTop: 80 }}>
                <h2 className="premium-glow-text" style={{ fontSize: 32, marginBottom: 32 }}>{t('docs.build_section.title')}</h2>
                <div className={styles.grid}>
                    <div className={`${styles.buildCard} premium-glass-card`}>
                        <div style={{ padding: 32 }}>
                            <Globe size={24} style={{ color: 'var(--beacon-brand)', marginBottom: 16 }} />
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{t('docs.build_section.bots')}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {t('docs.build_section.bots_desc')}
                            </p>
                        </div>
                    </div>
                    <div className={`${styles.buildCard} premium-glass-card`}>
                        <div style={{ padding: 32 }}>
                            <Shield size={24} style={{ color: '#23A559', marginBottom: 16 }} />
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{t('docs.build_section.oauth')}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {t('docs.build_section.oauth_desc')}
                            </p>
                        </div>
                    </div>
                    <div className={`${styles.buildCard} premium-glass-card`}>
                        <div style={{ padding: 32 }}>
                            <Cpu size={24} style={{ color: '#F8484E', marginBottom: 16 }} />
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{t('docs.build_section.webhooks')}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {t('docs.build_section.webhooks_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </DocsLayout>
    )
}

interface DocLinkProps {
    icon: React.ReactNode
    title: string
    description: string
    to: string
    color: string
}

function DocLink({ icon, title, description, to, color }: DocLinkProps) {
    return (
        <Link to={to} className={`${styles.card} premium-glass-card ${styles[color]}`}>
            <div className={styles.cardIcon} style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: "var(--radius-lg)" }}>{icon}</div>
            <div className={styles.cardContent}>
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>{description}</p>
            </div>
            <div style={{ position: 'absolute', bottom: 24, right: 24, opacity: 0.3 }}>
                <ChevronRight size={20} />
            </div>
        </Link>
    )
}
