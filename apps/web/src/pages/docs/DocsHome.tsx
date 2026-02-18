import { Helmet } from 'react-helmet-async'
import { Book, Code, Terminal, Cpu, ChevronRight, Zap, Globe, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './DocsHome.module.css'

export function DocsHome() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Documentation - Beacon Developers</title>
            </Helmet>

            <header className={styles.header}>
                <h1 className={`${styles.title} accent-text`}>Beacon Developer Docs</h1>
                <p className={styles.subtitle}>
                    Everything you need to build bots, integrations, and apps on Beacon. We've kept it simple.
                </p>
                <div className={styles.atmosGlow} />
            </header>

            <div className={styles.grid}>
                <DocLink
                    icon={<Terminal size={24} />}
                    title="Getting Started"
                    description="Set up your first bot in under 5 minutes. Install the SDK, get your token, and say hello."
                    to="/docs/getting-started"
                    color="brand"
                />
                <DocLink
                    icon={<Code size={24} />}
                    title="API Reference"
                    description="Full reference for every REST endpoint — users, guilds, channels, messages, and more."
                    to="/docs/api-reference"
                    color="purple"
                />
                <DocLink
                    icon={<Zap size={24} />}
                    title="Gateway & Events"
                    description="Connect via WebSocket to receive real-time events like messages, reactions, and member updates."
                    to="/docs/gateway-events"
                    color="orange"
                />
                <DocLink
                    icon={<Book size={24} />}
                    title="SDK Tutorial"
                    description="Step-by-step guide to building bots with the official Beacon SDK — commands, buttons, and more."
                    to="/docs/sdk-tutorial"
                    color="green"
                />
            </div>

            <section className={styles.section}>
                <h2>Popular Topics</h2>
                <div className={styles.topicList}>
                    <Link to="/docs/getting-started" className={`${styles.topicItem} glass-interactive`}>
                        <span>How to create your first application</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/api-reference" className={`${styles.topicItem} glass-interactive`}>
                        <span>Sending and receiving messages via the REST API</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/gateway-events" className={`${styles.topicItem} glass-interactive`}>
                        <span>Subscribing to Gateway events with WebSockets</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs/sdk-tutorial" className={`${styles.topicItem} glass-interactive`}>
                        <span>Using slash commands and interactive components</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </section>

            <section className={styles.section}>
                <h2>What can you build?</h2>
                <div className={styles.grid} style={{ marginTop: 0 }}>
                    <div className="glass-card" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)' }}>
                        <Globe size={20} style={{ color: 'var(--beacon-brand)', marginBottom: 10 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Bots &amp; Automations</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Auto-moderation, welcome messages, custom commands, polls, music — if you can think it, you can build it.
                        </p>
                    </div>
                    <div className="glass-card" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)' }}>
                        <Shield size={20} style={{ color: 'var(--status-online)', marginBottom: 10 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>OAuth2 Integrations</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Let users log in to your website with their Beacon account, or pull their guild list to power your dashboard.
                        </p>
                    </div>
                    <div className="glass-card" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)' }}>
                        <Cpu size={20} style={{ color: 'var(--status-idle)', marginBottom: 10 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Webhooks</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Push notifications from GitHub, Stripe, or any external service directly into a Beacon channel — no bot required.
                        </p>
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
        <Link to={to} className={`${styles.card} ${styles[color]} glass-card`}>
            <div className={styles.cardIcon}>{icon}</div>
            <div className={styles.cardContent}>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </Link>
    )
}
