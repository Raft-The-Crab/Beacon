import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, Copy, Check, Shield, Zap } from 'lucide-react'
import { botsApi, Bot } from '../../api/bots'
import { Button } from '../ui/Button'
import styles from './BotConsole.module.css'

export function BotConsole({ applicationId }: { applicationId: string }) {
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newBotName, setNewBotName] = useState('')
    const [lastToken, setLastToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        loadBots()
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
        } catch (err) {
            console.error('Failed to regenerate token', err)
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield size={20} style={{ color: 'var(--beacon-brand)' }} />
                    <h3>Bot Configuration</h3>
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
                        <code>{lastToken}</code>
                        <button onClick={copyToken} className={styles.copyBtn}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
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
        </div>
    )
}
