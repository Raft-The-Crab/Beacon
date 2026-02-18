import { Helmet } from 'react-helmet-async'
import { Book, Code, Terminal, Cpu, ChevronRight } from 'lucide-react'
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
                <h1 className={`${styles.title} accent-text`}>The Beacon Protocol</h1>
                <p className={styles.subtitle}>
                    The definitive source of truth for the most advanced messaging infrastructure ever conceived.
                </p>
                <div className={styles.atmosGlow} />
            </header>

            <div className={styles.grid}>
                <DocLink
                    icon={<Book size={24} />}
                    title="The Core Mission"
                    description="Understanding the ideological foundation of Beacon and the truth about decentralized sovereign identity."
                    to="/docs/mission"
                    color="brand"
                />
                <DocLink
                    icon={<Terminal size={24} />}
                    title="Kernel Engineering"
                    description="Deep dive into the low-level architecture of the Beacon core and the C++ binary bridge."
                    to="/docs/sdk-tutorial"
                    color="green"
                />
                <DocLink
                    icon={<Code size={24} />}
                    title="Quantum Cryptography"
                    description="How Beacon implements post-quantum security models for truly private communication."
                    to="/docs/api-reference"
                    color="purple"
                />
                <DocLink
                    icon={<Cpu size={24} />}
                    title="Neural Gateway"
                    description="Connecting neural-link interfaces and high-frequence WebSocket event streams."
                    to="/docs/gateway-events"
                    color="orange"
                />
            </div>

            <section className={styles.section}>
                <h2>The Deep Truth</h2>
                <div className={styles.topicList}>
                    <Link to="/docs" className={`${styles.topicItem} glass-interactive`}>
                        <span>The Architecture of Absolute Sovereignty</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs" className={`${styles.topicItem} glass-interactive`}>
                        <span>Bypassing Modern Surveillance State Primitives</span>
                        <ChevronRight size={16} />
                    </Link>
                    <Link to="/docs" className={`${styles.topicItem} glass-interactive`}>
                        <span>The Singularity: AI-Integrated Communication Hubs</span>
                        <ChevronRight size={16} />
                    </Link>
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
