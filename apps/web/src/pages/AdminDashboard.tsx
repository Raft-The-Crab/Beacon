import { useMemo } from 'react'
import {
    Shield, Lock, Activity, FileSearch,
    Radar, RefreshCw, CheckCircle
} from 'lucide-react'
import { Button, Card } from '../components/ui'
import { useAuthStore } from '../stores/useAuthStore'
import styles from '../styles/modules/pages/AdminDashboard.module.css'

export function AdminDashboard() {
    const user = useAuthStore((state) => state.user)
    const hasAccess = useMemo(() => {
        const badges = new Set((user?.badges || []).map((badge) => String(badge).toLowerCase()))
        return Boolean(user && (user.developerMode || badges.has('admin') || badges.has('owner')))
    }, [user])

    if (!hasAccess) {
        return (
            <div className={styles.container}>
                <Card className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3>Restricted Area</h3>
                        <Lock size={16} />
                    </div>
                    <div style={{ display: 'grid', gap: 16, color: 'var(--text-secondary)' }}>
                        <p>This dashboard is limited to verified platform administrators.</p>
                        <p>Required access: platform admin, owner, or developer mode on an authorized account.</p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield size={24} className={styles.titleIcon} />
                    <div>
                        <h1>Platform Command Center</h1>
                        <p>Restricted operational workspace for live moderation and incident response.</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={() => { }} className={styles.refreshBtn}>
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                    <div className={styles.serverBadge}>
                        <div className={styles.statusDot} />
                        SYSTEM ONLINE
                    </div>
                </div>
            </header>

            <div className={styles.grid}>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(88, 101, 242, 0.1)', color: '#5865f2' }}>
                        <Activity size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Operational Access</span>
                        <span className={styles.statValue}>Verified</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>Granted</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(35, 165, 89, 0.1)', color: '#23a559' }}>
                        <Radar size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Live Telemetry</span>
                        <span className={styles.statValue}>Protected</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>Ready</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(240, 178, 50, 0.1)', color: '#f0b232' }}>
                        <FileSearch size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Audit Scope</span>
                        <span className={styles.statValue}>Platform</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#f0b232' }}>Sensitive</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b2' }}>
                        <Shield size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Exposure</span>
                        <span className={styles.statValue}>Internal Only</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>Locked</div>
                </Card>
            </div>

            <div className={styles.mainGrid}>
                <Card className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3>Access Discipline</h3>
                        <Shield size={16} />
                    </div>
                    <div className={styles.metrics}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricHeader}>
                                <span>Route Guard</span>
                                <span>Enabled</span>
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricHeader}>
                                <span>Telemetry Policy</span>
                                <span>No demos</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.servicesGrid}>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>Platform admin badge required</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>Developer mode allowed for trusted operators</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>Unauthorized users are blocked before render</span>
                        </div>
                    </div>
                </Card>

                <Card className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3>Operational Notes</h3>
                        <FileSearch size={16} />
                    </div>
                    <div style={{ display: 'grid', gap: 14, color: 'var(--text-secondary)' }}>
                        <p>This screen no longer exposes fabricated usage counts or fake moderation events.</p>
                        <p>Connect audited platform telemetry before showing request totals, message volumes, or incident history.</p>
                        <p>Until then, this dashboard acts as a restricted control surface rather than a demo analytics board.</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
