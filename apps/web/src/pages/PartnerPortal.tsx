import { BarChart3, Users, CheckCircle, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui'
import styles from '../styles/modules/pages/PartnerPortal.module.css'

export function PartnerPortal() {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.partnerBadge}>
                        <CheckCircle size={16} />
                        <span>Verified Partner</span>
                    </div>
                    <h1>Scale your community to the stars.</h1>
                    <p>The Partner Portal gives you elite tools to manage global growth, track engagement metrics, and access exclusive partner benefits.</p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <Users size={24} color="var(--beacon-brand)" />
                    <div className={styles.statValue}>12.4k</div>
                    <div className={styles.statLabel}>Total Members</div>
                </div>
                <div className={styles.statCard}>
                    <BarChart3 size={24} color="var(--status-online)" />
                    <div className={styles.statValue}>+85%</div>
                    <div className={styles.statLabel}>Growth (30d)</div>
                </div>
                <div className={styles.statCard}>
                    <ShieldCheck size={24} color="var(--warning)" />
                    <div className={styles.statValue}>Level 3</div>
                    <div className={styles.statLabel}>Verification Tier</div>
                </div>
            </div>

            <div className={styles.features}>
                <h2>Partner Benefits</h2>
                <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                        <h3>Custom Discovery Assets</h3>
                        <p>Upload high-resolution banners and animated icons for the Discovery page.</p>
                    </div>
                    <div className={styles.featureItem}>
                        <h3>Priority Support</h3>
                        <p>Access our team of community experts for scaling advice and technical help.</p>
                    </div>
                    <div className={styles.featureItem}>
                        <h3>Global Spotlight</h3>
                        <p>Your server will be prioritized in the "Global Spotlight" section of Discovery.</p>
                    </div>
                </div>
                <Button variant="primary" className={styles.applyBtn}>Upgrade Partnership</Button>
            </div>
        </div>
    )
}
