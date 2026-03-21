import { useNavigate, useLocation } from 'react-router-dom'
import {
    Book,
    FileText,
    Zap,
    Code,
    Cpu,
    Rocket,
    Search as SearchIcon,
    Github,
    Terminal,
    Shield
} from 'lucide-react'
import { WorkspaceLayout } from './WorkspaceLayout'
import { useTranslationStore } from '../../stores/useTranslationStore'
import styles from '../../styles/modules/layout/DocsLayout.module.css'

interface DocsLayoutProps {
    children: React.ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslationStore()

    const navItems = [
        { label: t('docs.categories.getting_started'), icon: <Rocket size={18} />, path: '/docs/getting-started' },
        { label: t('common.introduction'), icon: <Book size={18} />, path: '/docs' },
        { label: t('docs.categories.api_reference'), icon: <FileText size={18} />, path: '/docs/api-reference' },
        { label: t('docs.categories.gateway'), icon: <Zap size={18} />, path: '/docs/gateway-events' },
        { label: t('docs.categories.sdk'), icon: <Code size={18} />, path: '/docs/sdk-tutorial' },
        { label: t('docs.categories.bot_commands'), icon: <Cpu size={18} />, path: '/docs/bot-commands' },
    ]

    const sidebar = (
        <div className={styles.docsNav}>
            <div className={styles.searchContainer}>
                <div className={`${styles.searchWrapper} premium-glass-card`} style={{ borderRadius: "var(--radius-md)" }}>
                    <SearchIcon className={styles.searchIcon} size={16} />
                    <input type="text" placeholder={t('docs.search_placeholder')} className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.navSection}>
                <div className={styles.navHeader}>{t('common.documentation')}</div>
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
                <div className={styles.navHeader}>LEGAL</div>
                <div className={styles.navList}>
                    <button className={styles.navItem} onClick={() => navigate('/terms')}>
                        <span className={styles.navIcon}><FileText size={18} /></span>
                        <span>Terms of Service</span>
                    </button>
                    <button className={styles.navItem} onClick={() => navigate('/privacy')}>
                        <span className={styles.navIcon}><Shield size={18} /></span>
                        <span>Privacy Policy</span>
                    </button>
                    <button className={styles.navItem} onClick={() => navigate('/license')}>
                        <span className={styles.navIcon}><Book size={18} /></span>
                        <span>Licensing</span>
                    </button>
                </div>
            </div>

            <div className={styles.navSection}>
                <div className={styles.navHeader}>RESOURCES</div>
                <div className={styles.navList}>
                    <button className={styles.navItem} onClick={() => window.open('https://github.com/Raft-The-Crab/Beacon', '_blank')}>
                        <span className={styles.navIcon}><Github size={18} /></span>
                        <span>GitHub Repository</span>
                    </button>
                    <button className={styles.navItem} onClick={() => navigate('/developer')}>
                        <span className={styles.navIcon}><Terminal size={18} /></span>
                        <span>Developer Portal</span>
                    </button>
                </div>
            </div>
        </div>
    )

    const toc = (
        <div className={styles.tocContainer}>
            <div className={styles.tocHeader}>{t('docs.on_this_page')}</div>
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
            <div className={styles.contentWrapper}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                </div>
            </div>
        </WorkspaceLayout>
    )
}
