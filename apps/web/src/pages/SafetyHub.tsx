import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui'
import styles from '../styles/modules/pages/SafetyHub.module.css'

export function SafetyHub() {
    return (
        <div className={`app-page-shell ${styles.container}`}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.safetyBadge}>
                        <Shield size={16} />
                        <span>Safety Center</span>
                    </div>
                    <h1>Safe space, universal peace.</h1>
                    <p>Your security is our highest priority. Manage your safety settings, review reports, and learn how to stay secure on Beacon.</p>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ color: 'var(--status-online)' }}>
                        <Lock size={32} />
                    </div>
                    <h3>Account Security</h3>
                    <p>Manage 2FA, session devices, and account credentials.</p>
                    <Button variant="secondary" size="sm">Manage</Button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ color: 'var(--beacon-brand)' }}>
                        <Eye size={32} />
                    </div>
                    <h3>Privacy Settings</h3>
                    <p>Control who can see your profile and send you messages.</p>
                    <Button variant="secondary" size="sm">Configure</Button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ color: 'var(--danger)' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3>Report History</h3>
                    <p>View the status of reports you've submitted or received.</p>
                    <Button variant="secondary" size="sm">View Log</Button>
                </div>
            </div>

            <div className={styles.transparencySection}>
                <h2>Transparency & Trust</h2>
                <p>We believe in an open community. Our safety guidelines are designed to protect everyone while maintaining freedom of speech.</p>
                <div className={styles.links}>
                    <a href="/safety">Community Guidelines</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                </div>
            </div>
        </div>
    )
}
