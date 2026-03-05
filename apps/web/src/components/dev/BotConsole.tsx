import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, Copy, Check, Shield, Zap, Terminal, ExternalLink, AlertTriangle, Info } from 'lucide-react'
import { botsApi, Bot } from '../../api/bots'
import { Button } from '../ui/Button'
import styles from '../../styles/modules/dev/BotConsole.module.css'

export function BotConsole({ applicationId }: { applicationId: string }) {
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newBotName, setNewBotName] = useState('')
    const [lastToken, setLastToken] = useState<string | null>(null)
    const [showToken, setShowToken] = useState(false)
    const [copied, setCopied] = useState(false)
    const [logs, setLogs] = useState<{ time: string; level: string; message: string }[]>([])

    useEffect(() => {
        loadBots()
        // Initialize with default logs
        setLogs([
            { time: new Date().toLocaleTimeString(), level: 'info', message: 'Gateway initialized (Target: gateway.beacon.qzz.io)' },
            { time: new Date().toLocaleTimeString(), level: 'info', message: 'Ready to receive payload' },
            { time: new Date().toLocaleTimeString(), level: 'info', message: 'Listening for real-time events...' }
        ])
    }, [applicationId])

    const loadBots = async () => {
        try {
            const data = await botsApi.list(applicationId)
            setBots(data || [])
        } catch (err) {
            console.error('Failed to load bots', err)
            setBots([])
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
        } catch (err) {
            console.error('Failed to create bot', err)
        }
    }

    const handleRegenerateToken = async () => {
        if (!confirm('Are you sure? The old token will stop working immediately.')) return
        try {
            const { token } = await botsApi.regenerateToken(applicationId)
            setLastToken(token)
            setShowToken(true)
        } catch (err: any) {
            console.error('Failed to regenerate token', err)
            alert(err.message || 'Failed to regenerate token')
        }
    }

    const handleDeleteBot = async () => {
        if (!confirm('Delete this bot? This cannot be undone.')) return
        try {
            await botsApi.delete(applicationId)
            setBots([])
        } catch (err) {
            console.error('Failed to delete bot', err)
        }
    }

    const copyToken = () => {
        if (lastToken) {
            navigator.clipboard.writeText(lastToken)
            setCopied(true)
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
                        <div style={{ display: 'flex', gap: 8 }}>
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
                        <div className={styles.emptyIcon}>🤖</div>
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
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={clearLogs} style={{ fontSize: 10, opacity: 0.5, border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>CLEAR</button>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ea043' }} title="WebSocket Connected" />
                        </div>
                    </div>
                    <div className={styles.terminalBody}>
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
