import React from 'react'
import { ServerList } from './ServerList'
import { useUIStore } from '../../stores/useUIStore'
import styles from '../../styles/modules/layout/WorkspaceLayout.module.css'

interface WorkspaceLayoutProps {
    sidebar?: React.ReactNode
    children: React.ReactNode
    rightPanel?: React.ReactNode
    showServerRail?: boolean
}

export function WorkspaceLayout({
    sidebar,
    children,
    rightPanel,
    showServerRail = false,
}: WorkspaceLayoutProps) {
    const { showMobileSidebar, setShowMobileSidebar } = useUIStore()

    return (
        <div className={styles.container}>
            {showServerRail && (
                <div className={styles.serverRailWrapper}>
                    <ServerList />
                </div>
            )}

            {/* Mobile Drawer Backdrop */}
            {showMobileSidebar && (
                <div
                    className={styles.mobileBackdrop}
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}

            <div className={`${styles.leftNav} ${showMobileSidebar ? styles.mobileOpen : ''}`}>
                <div className={styles.drawerContent}>
                    <div className={styles.sidebarWrapper}>
                        {sidebar}
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                {children}
            </div>

            {rightPanel && (
                <div className={styles.rightPanel}>
                    {rightPanel}
                </div>
            )}
        </div>
    )
}
