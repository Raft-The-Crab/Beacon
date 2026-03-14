import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, Copy, Check, Shield, Zap, Terminal, ExternalLink, AlertTriangle, Info, Bot as BotIcon } from 'lucide-react'
import { botsApi, Bot as BotModel } from '../../api/bots'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { apiClient } from '../../services/apiClient'
import { WEB_SDK_ENDPOINTS } from '../../lib/beaconSdk'
import styles from '../../styles/modules/dev/BotConsole.module.css'

export function BotConsole({ applicationId }: { applicationId: string }) {
    const { show: showToast } = useToast()
    const [bots, setBots] = useState<BotModel[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newBotName, setNewBotName] = useState('')
    const [lastToken, setLastToken] = useState<string | null>(null)
    const [showToken, setShowToken] = useState(false)
    const [copied, setCopied] = useState(false)
    const [logs, setLogs] = useState<{ time: string; level: string; message: string }[]>([])
    const [apiHealthy, setApiHealthy] = useState<boolean | null>(null)
    const [aiHealthy, setAiHealthy] = useState<boolean | null>(null)
    const [botErrorCount, setBotErrorCount] = useState<number | null>(null)
    const [botUptimeSec, setBotUptimeSec] = useState<number | null>(null)

    const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
        setLogs(prev => {
            const next = [...prev, { time: new Date().toLocaleTimeString(), level, message }]
            return next.slice(-80)
        })
    }

    const checkApiHealth = async () => {
        const root = WEB_SDK_ENDPOINTS.apiUrl.replace(/\/?api\/?$/i, '')
        try {
            const res = await fetch(`${root}/health`, { method: 'GET', credentials: 'include' })
            const json = await res.json().catch(() => ({}))
            const healthy = Boolean(res.ok && json?.status === 'healthy')
            setApiHealthy(healthy)
            addLog(healthy ? 'info' : 'warn', healthy ? 'API health check passed' : 'API health check degraded')
        } catch {
            setApiHealthy(false)
            addLog('error', 'API health check failed')
        }
    }

    const checkAiHealth = async () => {
        try {
            const res = await apiClient.request('GET', '/ai/status')
            const healthy = Boolean(res.success && res.data?.modelStatus === 'reachable')
            setAiHealthy(healthy)
            addLog(healthy ? 'info' : 'warn', healthy ? 'AI moderation pipeline online' : 'AI moderation pipeline unavailable')
        } catch {
            setAiHealthy(false)
            addLog('error', 'AI sanity check request failed')
        }
    }

    const loadBotMetrics = async (botId?: string) => {
        if (!botId) {
            setBotErrorCount(null)
            setBotUptimeSec(null)
            return
        }
        try {
            const res = await apiClient.request('GET', `/analytics/bot/${botId}`)
            if (!res.success || !res.data?.metrics) {
                setBotErrorCount(null)
                setBotUptimeSec(null)
                return
            }
            setBotErrorCount(Number(res.data.metrics.errorCount ?? 0))
            setBotUptimeSec(Number(res.data.metrics.uptimeSeconds ?? 0))
        } catch {
            setBotErrorCount(null)
            setBotUptimeSec(null)
        }
    }

    useEffect(() => {
        void loadBots()
        void checkApiHealth()
        void checkAiHealth()
        setLogs([{ time: new Date().toLocaleTimeString(), level: 'info', message: 'Infrastructure monitor ready.' }])

        const interval = setInterval(() => {
            void checkApiHealth()
            void checkAiHealth()
        }, 45000)

        return () => clearInterval(interval)
    }, [applicationId])

    const loadBots = async () => {
        try {
            const data = await botsApi.list(applicationId)
            setBots(data || [])
            if (data?.length) {
                void loadBotMetrics(data[0].id)
            } else {
                void loadBotMetrics(undefined)
            }
        } catch (err) {
            console.error('Failed to load bots', err)
            setBots([])
            addLog('error', 'Failed to load bots')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateBot = async () => {
        if (!newBotName.trim()) return
        try {
            const bot = await botsApi.create({ name: newBotName, applicationId })
            setBots([...bots, bot])
            setLastToken(bot.token || null)
            setCreating(false)
            setNewBotName('')
            showToast('Bot created successfully', 'success')
            addLog('info', `Bot created: ${bot.name}`)
            void loadBotMetrics(bot.id)
        } catch (err) {
            console.error('Failed to create bot', err)
            showToast((err as Error)?.message || 'Failed to create bot', 'error')
            addLog('error', 'Bot creation failed')
        }
    }

    const handleRegenerateToken = async () => {
        if (!confirm('Are you sure? The old token will stop working immediately.')) return
        try {
            const { token } = await botsApi.regenerateToken(applicationId)
            setLastToken(token)
            setShowToken(true)
            showToast('Token regenerated', 'success')
            addLog('warn', 'Bot token regenerated')
        } catch (err: any) {
            console.error('Failed to regenerate token', err)
            showToast(err.message || 'Failed to regenerate token', 'error')
            addLog('error', 'Token regeneration failed')
        }
    }

    const handleDeleteBot = async () => {
        if (!confirm('Delete this bot? This cannot be undone.')) return
        try {
            await botsApi.delete(applicationId)
            setBots([])
            setBotErrorCount(null)
            setBotUptimeSec(null)
            showToast('Bot deleted', 'success')
            addLog('warn', 'Bot deleted')
        } catch (err) {
            console.error('Failed to delete bot', err)
            showToast((err as Error)?.message || 'Failed to delete bot', 'error')
            addLog('error', 'Bot deletion failed')
        }
    }

    const copyToken = () => {
        if (lastToken) {
            navigator.clipboard.writeText(lastToken)
            setCopied(true)
            showToast('Token copied to clipboard', 'success')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const clearLogs = () => setLogs([])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield size={20} style={{ color: 'var(--beacon-brand)' }} />
                    <h3>Infrastructure Console</h3>
                </div>
                <div className={styles.headerBadges}>
                    <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: apiHealthy === false ? 'rgba(242,63,67,0.15)' : 'rgba(46,160,67,0.15)', color: apiHealthy === false ? '#f23f43' : '#2ea043' }}>
                        API {apiHealthy === false ? 'Offline' : 'Online'}
                    </span>
                    <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: aiHealthy === false ? 'rgba(242,63,67,0.15)' : 'rgba(46,160,67,0.15)', color: aiHealthy === false ? '#f23f43' : '#2ea043' }}>
                        AI {aiHealthy === false ? 'Degraded' : 'Connected'}
                    </span>
                </div>
                {!creating && bots.length === 0 && (
                    <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                        <Plus size={16} /> New Bot
                    </Button>
                )}
            </div>

            {lastToken && (
                <div className={styles.tokenAlert}>
                    <div className={styles.tokenTitle}>
                        <Zap size={14} /> New Bot Token
                    </div>
                    <div className={styles.tokenValue}>
                        <code>{showToken ? lastToken : '••••••••••••••••••••••••••••••••'}</code>
                        <div className={styles.tokenActions}>
                            <button onClick={() => setShowToken(!showToken)} className={styles.copyBtn}>
                                {showToken ? <RefreshCw size={14} /> : <Zap size={14} />}
                            </button>
                            <button onClick={copyToken} className={styles.copyBtn}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.tokenWarning}>
                        Save this token now! It will not be shown again for security reasons.
                    </div>
                </div>
            )}

            {creating && (
                <div className={styles.createForm}>
                    <input
                        type="text"
                        placeholder="Define your bot's name..."
                        value={newBotName}
                        onChange={e => setNewBotName(e.target.value)}
                        className={styles.input}
                        autoFocus
                    />
                    <div className={styles.formActions}>
                        <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleCreateBot}>Create Bot</Button>
                    </div>
                </div>
            )}

            <div className={styles.list}>
                {bots.map(bot => (
                    <div key={bot.id} className={styles.botRow}>
                        <div className={styles.botInfo}>
                            <div className={styles.botAvatar}>
                                {bot.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className={styles.botName}>{bot.name}</div>
                                <div className={styles.botId}>ID: {bot.id}</div>
                            </div>
                        </div>
                        <div className={styles.botActions}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleRegenerateToken}
                                title="Regenerate Token"
                            >
                                <RefreshCw size={14} /> Token
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDeleteBot}
                                className={styles.danger}
                                title="Delete Bot"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </div>
                ))}

                {!loading && bots.length === 0 && !creating && (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><BotIcon size={28} /></div>
                        <p>No active bots found for this application.</p>
                        <Button variant="secondary" size="sm" style={{ marginTop: 16 }} onClick={() => setCreating(true)}>
                            Initialize Bot
                        </Button>
                    </div>
                )}
            </div>

            {bots.length > 0 && (
                <div className={styles.terminalWrapper}>
                    <div className={styles.terminalHeader}>
                        <div className={styles.terminalTitle}>
                            <Terminal size={14} /> Live Logs
                        </div>
                        <div className={styles.terminalActions}>
                            <button onClick={() => { void checkApiHealth(); void checkAiHealth(); }} style={{ fontSize: 10, opacity: 0.75, border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>REFRESH</button>
                            <button onClick={clearLogs} style={{ fontSize: 10, opacity: 0.5, border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>CLEAR</button>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: apiHealthy === false ? '#f23f43' : '#2ea043' }} title="Backend Health" />
                        </div>
                    </div>
                    <div className={styles.terminalBody}>
                        {(botErrorCount !== null || botUptimeSec !== null) && (
                            <div className={styles.logEntry}>
                                <span className={styles.logTime}>[metrics]</span>
                                <span className={`${styles.logLevel} ${styles.info}`}>info</span>
                                <span>botErrors={botErrorCount ?? 0}, botUptime={botUptimeSec ?? 0}s</span>
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={styles.logEntry}>
                                <span className={styles.logTime}>[{log.time}]</span>
                                <span className={`${styles.logLevel} ${styles[log.level]}`}>{log.level}</span>
                                <span>{log.message}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <div className={styles.emptyLogs}>Awaiting gateway activity...</div>}
                    </div>
                </div>
            )}

            <div className={styles.resourcesSection}>
                <h4 style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>RESOURCES</h4>
                <a href="/docs/sdk-tutorial" target="_blank" className={styles.resourceLink}>
                    <Info size={16} />
                    <span>Handling Gateway Errors & Rate Limits</span>
                    <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </a>
                <a href="/docs/api-reference" target="_blank" className={styles.resourceLink}>
                    <AlertTriangle size={16} style={{ color: '#d29922' }} />
                    <span>Rate Limit Policy & Headers</span>
                    <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </a>
            </div>
        </div>
    )
}
