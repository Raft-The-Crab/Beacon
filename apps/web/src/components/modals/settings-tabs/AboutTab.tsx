import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Code, Book } from 'lucide-react'
import { Button } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

interface AboutTabProps {
    onClose: () => void
}

export const AboutTab: React.FC<AboutTabProps> = ({ onClose }) => {
    const navigate = useNavigate()

    return (
        <div className={styles.tabContent}>
            <div className={styles.aboutSection}>
                <h3>Beacon</h3>
                <p className={styles.version}>Version 3.0.8</p>
                <p className={styles.description}>
                    Beacon is a free, cross-platform real-time communication platform built as a Discord alternative.
                </p>

                <div className={styles.links}>
                    <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/beacon/beacon', '_blank')}>
                        <Code size={16} /> GitHub
                    </Button>
                    <Button variant="secondary" size="sm" className={styles.utilityButton} onClick={() => { navigate('/docs'); onClose(); }}>
                        <Book size={16} /> Documentation
                    </Button>
                </div>

                <div className={styles.legalLinks}>
                    <button onClick={() => { navigate('/terms'); onClose(); }}>Terms of Service</button>
                    <div className={styles.dot} />
                    <button onClick={() => { navigate('/privacy'); onClose(); }}>Privacy Policy</button>
                </div>
            </div>
        </div>
    )
}
