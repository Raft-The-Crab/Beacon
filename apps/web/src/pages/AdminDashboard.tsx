import { useState } from 'react'
import {
    Activity, Users, Shield, Server,
    AlertTriangle, CheckCircle, BarChart3,
    MessageSquare, RefreshCw
} from 'lucide-react'
import { Button, Card } from '../components/ui'
import styles from '../styles/modules/pages/AdminDashboard.module.css'

interface SystemStats {
    totalUsers: number
    activeToday: number
    totalMessages: number
    serverStatus: 'online' | 'degraded' | 'offline'
    latency: number
    cpuUsage: number
    ramUsage: number
}

interface ModerationLog {
    id: string
    action: string
    target: string
    moderator: string
    timestamp: string
    reason?: string
}

export function AdminDashboard() {
    const [stats] = useState<SystemStats>({
        totalUsers: 24502,
        activeToday: 1842,
        totalMessages: 1204592,
        serverStatus: 'online',
        latency: 42,
        cpuUsage: 12,
        ramUsage: 45
    })
    const [logs] = useState<ModerationLog[]>([
        { id: '1', action: 'BAN', target: 'SpamBot_99', moderator: 'Admin_Master', timestamp: new Date().toISOString(), reason: 'Spamming advertisement' },
        { id: '2', action: 'WARN', target: 'PlayerOne', moderator: 'Guardian_Bot', timestamp: new Date().toISOString(), reason: 'Inappropriate language' },
        { id: '3', action: 'UNBAN', target: 'MisunderstoodUser', moderator: 'Admin_Master', timestamp: new Date().toISOString() },
    ])

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield size={24} className={styles.titleIcon} />
                    <div>
                        <h1>Platform Command Center</h1>
                        <p>Global oversight and moderation engine</p>
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
                {/* Stats row */}
                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(88, 101, 242, 0.1)', color: '#5865f2' }}>
                        <Users size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Users</span>
                        <span className={styles.statValue}>{stats.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>+12%</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(35, 165, 89, 0.1)', color: '#23a559' }}>
                        <Activity size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Active Now</span>
                        <span className={styles.statValue}>{stats.activeToday.toLocaleString()}</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>+5.2%</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(240, 178, 50, 0.1)', color: '#f0b232' }}>
                        <MessageSquare size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Daily Messages</span>
                        <span className={styles.statValue}>{stats.totalMessages.toLocaleString()}</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#f23f43' }}>-2%</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b2' }}>
                        <Server size={20} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>API Latency</span>
                        <span className={styles.statValue}>{stats.latency}ms</span>
                    </div>
                    <div className={styles.statTrend} style={{ color: '#23a559' }}>Good</div>
                </Card>
            </div>

            <div className={styles.mainGrid}>
                {/* Infrastructure Panel */}
                <Card className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3>Infrastructure Health</h3>
                        <BarChart3 size={16} />
                    </div>
                    <div className={styles.metrics}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricHeader}>
                                <span>CPU Load</span>
                                <span>{stats.cpuUsage}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${stats.cpuUsage}%`, background: stats.cpuUsage > 80 ? '#f23f43' : '#23a559' }} />
                            </div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricHeader}>
                                <span>Memory Usage</span>
                                <span>{stats.ramUsage}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${stats.ramUsage}%`, background: stats.ramUsage > 80 ? '#f23f43' : '#f0b232' }} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.servicesGrid}>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>Gateway_WS_01</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>API_Rest_Core</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <CheckCircle size={14} color="#23a559" />
                            <span>Media_RTC_Prox</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <AlertTriangle size={14} color="#f0b232" />
                            <span>Cache_Redis_Cluster</span>
                        </div>
                    </div>
                </Card>

                {/* Moderation Logs */}
                <Card className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3>Recent Moderation</h3>
                        <Shield size={16} />
                    </div>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>By</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <span className={`${styles.actionBadge} ${styles[log.action.toLowerCase()]}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.target}</td>
                                        <td>{log.moderator}</td>
                                        <td className={styles.timeCell}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
