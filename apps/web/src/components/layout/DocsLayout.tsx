import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import styles from './DocsLayout.module.css'

interface DocsLayoutProps {
    children: React.ReactNode
}

const DOCS_NAV = [
    {
        title: 'Introduction',
        items: [
            { label: 'What is Beacon?', path: '/docs' },
            { label: 'The Core Mission', path: '/docs/mission' },
            { label: 'Getting Started', path: '/docs/getting-started' },
        ],
    },
    {
        title: 'Developers',
        items: [
            { label: 'API Reference', path: '/docs/api-reference' },
            { label: 'Gateway Events', path: '/docs/gateway-events' },
        ],
    },
]

export function DocsLayout({ children }: DocsLayoutProps) {
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className={`${styles.container} radiance`}>
            {/* Top Navigation */}
            <nav className={`${styles.topNav} glass`}>
                <div className={styles.navContent}>
                    <Link to="/" className={styles.logo}>
                        <div className={styles.logoIcon}>B</div>
                        <span className="accent-text">Beacon Docs</span>
                    </Link>

                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input type="text" placeholder="Search documentation..." />
                        <kbd>⌘K</kbd>
                    </div>

                    <div className={styles.navLinks}>
                        <Link to="/app" className={styles.appLink}>Open App</Link>
                        <a href="https://github.com/beacon" target="_blank" rel="noreferrer" className={styles.githubLink}>GitHub</a>
                    </div>

                    <button className={styles.mobileToggle} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            <div className={styles.layout}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''} glass`}>
                    <nav className={styles.sideNav}>
                        {DOCS_NAV.map((section) => (
                            <div key={section.title} className={styles.navSection}>
                                <h3>{section.title}</h3>
                                <ul>
                                    {section.items.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`${location.pathname === item.path ? styles.active : ''} glass-interactive`}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                {item.label}
                                                {location.pathname === item.path && <ChevronRight size={14} />}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.content}>
                        {children}
                    </div>
                </main>

                {/* Table of Contents (Stripe Style) */}
                <aside className={styles.toc}>
                    <div className={styles.tocContent}>
                        <h4>On this page</h4>
                        <ul>
                            {/* In a real app, these would be generated from the content */}
                            <li><a href="#overview">Overview</a></li>
                            <li><a href="#setup">Getting Started</a></li>
                            <li><a href="#usage">Usage Examples</a></li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    )
}
