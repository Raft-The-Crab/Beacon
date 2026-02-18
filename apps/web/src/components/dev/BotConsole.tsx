import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, Copy, Check } from 'lucide-react'
import { botsApi, Bot } from '../../api/bots'
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
            setBots(data)
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

    const handleRegenerateToken = async (botId: string) => {
        if (!confirm('Are you sure? The old token will stop working immediately.')) return
        try {
            const { token } = await botsApi.regenerateToken(botId)
            setLastToken(token)
        } catch (err) {
            console.error('Failed to regenerate token', err)
        }
    }

    const handleDeleteBot = async (botId: string) => {
        if (!confirm('Delete this bot? This cannot be undone.')) return
        try {
            await botsApi.delete(botId)
            setBots(bots.filter(b => b.id !== botId))
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
                <h3>Bots</h3>
                <button className={styles.createBtn} onClick={() => setCreating(true)}>
                    <Plus size={16} /> New Bot
                </button>
            </div>

            {lastToken && (
                <div className={styles.tokenAlert}>
                    <div className={styles.tokenTitle}>New Bot Token</div>
                    <div className={styles.tokenValue}>
                        {lastToken}
                        <button onClick={copyToken} className={styles.copyBtn}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                    <div className={styles.tokenWarning}>
                        Save this token now! It will not be shown again.
                    </div>
                </div>
            )}

            {creating && (
                <div className={styles.createForm}>
                    <input
                        type="text"
                        placeholder="Bot Name"
                        value={newBotName}
                        onChange={e => setNewBotName(e.target.value)}
                        className={styles.input}
                    />
                    <div className={styles.formActions}>
                        <button className={styles.cancelBtn} onClick={() => setCreating(false)}>Cancel</button>
                        <button className={styles.confirmBtn} onClick={handleCreateBot}>Create</button>
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
                            <button
                                className={styles.actionBtn}
                                onClick={() => handleRegenerateToken(bot.id)}
                                title="Regenerate Token"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.danger}`}
                                onClick={() => handleDeleteBot(bot.id)}
                                title="Delete Bot"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && bots.length === 0 && !creating && (
                    <div className={styles.empty}>No bots created yet.</div>
                )}
            </div>
        </div>
    )
}
