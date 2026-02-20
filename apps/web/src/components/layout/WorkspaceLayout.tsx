import React from 'react'
import { ServerList } from './ServerList'
import styles from './WorkspaceLayout.module.css'

interface WorkspaceLayoutProps {
    sidebar?: React.ReactNode
    children: React.ReactNode
    rightPanel?: React.ReactNode
}

export function WorkspaceLayout({
    sidebar,
    children,
    rightPanel
}: WorkspaceLayoutProps) {
    return (
        <div className={styles.container}>
            <ServerList />
            <div className={`${styles.leftNav} vista-transition`}>
                {sidebar}
            </div>
            <div className={`${styles.mainContent} vista-transition`} style={{ animationDelay: '0.1s' }}>
                {children}
            </div>
            {rightPanel && (
                <div className={`${styles.rightPanel} vista-transition`} style={{ animationDelay: '0.2s' }}>
                    {rightPanel}
                </div>
            )}
        </div>
    )
}
