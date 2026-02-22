import { useNavigate, useLocation } from 'react-router-dom'
import {
    Book,
    FileText,
    Zap,
    Code,
    Cpu,
    Rocket,
    CheckCircle2,
    Search as SearchIcon
} from 'lucide-react'
import { WorkspaceLayout } from './WorkspaceLayout'
import styles from './DocsLayout.module.css'

interface DocsLayoutProps {
    children: React.ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { label: 'Overview', icon: <Book size={18} />, path: '/docs' },
        { label: 'Getting Started', icon: <Rocket size={18} />, path: '/docs/getting-started' },
        { label: 'Mission', icon: <CheckCircle2 size={18} />, path: '/docs/mission' },
        { label: 'Gateway Events', icon: <Zap size={18} />, path: '/docs/gateway-events' },
        { label: 'SDK Tutorial', icon: <Code size={18} />, path: '/docs/sdk-tutorial' },
        { label: 'API Reference', icon: <FileText size={18} />, path: '/docs/api-reference' },
    ]

    const sidebar = (
        <div className={styles.docsNav}>
            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <SearchIcon className={styles.searchIcon} size={16} />
                    <input type="text" placeholder="Search documentation..." className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.navSection}>
                <div className={styles.navHeader}>DOCUMENTATION</div>
                <div className={styles.navList}>
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.navSection}>
                <div className={styles.navHeader}>RESOURCES</div>
                <div className={styles.navList}>
                    <button className={styles.navItem} onClick={() => window.open('https://github.com/Raft-The-Crab/Beacon', '_blank')}>
                        <span className={styles.navIcon}><Code size={18} /></span>
                        <span>GitHub Repository</span>
                    </button>
                    <button className={styles.navItem} onClick={() => navigate('/developer')}>
                        <span className={styles.navIcon}><Cpu size={18} /></span>
                        <span>Developer Portal</span>
                    </button>
                </div>
            </div>
        </div>
    )

    const toc = (
        <div className={styles.tocContainer}>
            <div className={styles.tocHeader}>ON THIS PAGE</div>
            <div className={styles.tocList}>
                <div className={styles.tocItem}>Overview</div>
                <div className={styles.tocItem}>Key Features</div>
                <div className={styles.tocItem}>Implementation</div>
                <div className={styles.tocItem}>Next Steps</div>
            </div>
        </div>
    )

    return (
        <WorkspaceLayout sidebar={sidebar} rightPanel={toc}>
            <div className={`${styles.contentWrapper} mesh-gradient`}>
                <div className={styles.atmosGlow} />
                <div className={styles.orb} style={{ top: '15%', right: '5%' }} />
                <div className={styles.orb} style={{ bottom: '15%', left: '5%', animationDelay: '-12s' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                </div>
            </div>
        </WorkspaceLayout>
    )
}
