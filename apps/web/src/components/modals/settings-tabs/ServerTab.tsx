import React from 'react'
import { Settings } from 'lucide-react'
import { useServerStore } from '../../../stores/useServerStore'
import { useUIStore } from '../../../stores/useUIStore'
import { Button } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const ServerTab: React.FC = () => {
    const { currentServer } = useServerStore()

    if (!currentServer) {
        return (
            <div className={styles.tabContent}>
                <div className={styles.noServer}>
                    <Settings size={48} className={styles.serverIcon} />
                    <h3>No Server Selected</h3>
                    <p>Please select a server to manage its settings</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.serverInfo}>
                <div className={styles.serverHeader}>
                    <div className={styles.serverIconContainer}>
                        <Settings size={32} />
                    </div>
                    <div>
                        <h3>{currentServer.name}</h3>
                        <p className={styles.serverId}>Level 1 Server • {currentServer.id}</p>
                    </div>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => {
                            useUIStore.getState().setShowServerSettings(true)
                            useUIStore.getState().setShowUserSettings(false)
                        }}
                    >
                        Manage Server
                    </Button>
                </div>
            </div>

            <div className={styles.section}>
                <h4>Server Details</h4>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Owner</span>
                    <span className={styles.detailValue}>{currentServer.ownerId || 'Unknown'}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>{new Date(currentServer.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Member Count</span>
                    <span className={styles.detailValue}>{currentServer.memberCount || 0}</span>
                </div>
            </div>
        </div>
    )
}
