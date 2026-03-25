import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../../stores/useUIStore'
import { Button, Switch } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

interface AdvancedTabProps {
    onClose: () => void
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({ onClose }) => {
    const { developerMode, setDeveloperMode } = useUIStore()
    const navigate = useNavigate()

    return (
        <div className={styles.tabContent}>
            <div className={styles.settingItem}>
                <div>
                    <h3>Developer Mode</h3>
                    <p className={styles.muted}>Enable developer features including bot management</p>
                </div>
                <Switch checked={developerMode} onChange={setDeveloperMode} />
            </div>
            {developerMode && (
                <div className={styles.devInfo}>
                    <p>✓ Developer Mode Enabled</p>
                    <Button onClick={() => { navigate('/developer'); onClose(); }}>Open Developer Portal</Button>
                </div>
            )}
        </div>
    )
}
