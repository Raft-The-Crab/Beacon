import { useState, useEffect } from 'react'
import { Volume2, Plus, Trash2, Play, Music } from 'lucide-react'
import { Button, Input, Card } from '../ui'
import { useToast } from '../ui'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/SoundManager.module.css'

interface Sound {
    id: string
    name: string
    url: string
    emoji?: string
    creatorId: string
}

interface SoundManagerProps {
    guildId: string
}

export function SoundManager({ guildId }: SoundManagerProps) {
    const [sounds, setSounds] = useState<Sound[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [newEmoji, setNewEmoji] = useState('')
    const toast = useToast()

    useEffect(() => {
        fetchSounds()
    }, [guildId])

    const fetchSounds = async () => {
        setLoading(true)
        try {
            // Use the existing apiClient method
            const res = await apiClient.request('GET', `/guilds/${guildId}/sounds`)
            if (res.success) {
                setSounds(res.data)
            }
        } catch (error) {
            console.error('Failed to fetch sounds', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSound = async () => {
        if (!newName.trim() || !newUrl.trim()) return
        try {
            const res = await apiClient.request('POST', `/guilds/${guildId}/sounds`, {
                name: newName,
                url: newUrl,
                emoji: newEmoji || undefined
            })
            if (res.success) {
                setSounds(prev => [...prev, res.data])
                setNewName('')
                setNewUrl('')
                setNewEmoji('')
                setShowAdd(false)
                toast.success('Sound added to soundboard')
            } else {
                toast.error(res.error || 'Failed to add sound')
            }
        } catch (error) {
            toast.error('Failed to add sound')
        }
    }

    const handleDeleteSound = async (soundId: string) => {
        try {
            const res = await apiClient.request('DELETE', `/guilds/${guildId}/sounds/${soundId}`)
            if (res.success) {
                setSounds(prev => prev.filter(s => s.id !== soundId))
                toast.success('Sound removed')
            }
        } catch (error) {
            toast.error('Failed to remove sound')
        }
    }

    const playPreview = (url: string) => {
        const audio = new Audio(url)
        audio.play().catch(() => toast.error('Failed to play preview'))
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h3 className={styles.title}>Soundboard</h3>
                    <p className={styles.subtitle}>Manage custom sounds for your server. Members can use these in voice channels.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
                    <Plus size={16} />
                    Add Sound
                </Button>
            </div>

            {showAdd && (
                <Card className={styles.addCard}>
                    <div className={styles.addForm}>
                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <Input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Airhorn"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Sound URL</label>
                            <Input
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="https://example.com/sound.mp3"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Emoji (Optional)</label>
                            <Input
                                value={newEmoji}
                                onChange={e => setNewEmoji(e.target.value)}
                                placeholder="📢"
                            />
                        </div>
                        <div className={styles.addActions}>
                            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={handleAddSound}>Add Sound</Button>
                        </div>
                    </div>
                </Card>
            )}

            {loading ? (
                <div className={styles.loading}>Loading sounds...</div>
            ) : sounds.length === 0 ? (
                <div className={styles.empty}>
                    <Volume2 size={48} className={styles.emptyIcon} />
                    <p>This server has no custom sounds yet.</p>
                    <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
                        Upload your first sound
                    </Button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {sounds.map(sound => (
                        <div key={sound.id} className={styles.soundItem}>
                            <div className={styles.soundPreview}>
                                <span className={styles.soundEmoji}>{sound.emoji || '🔊'}</span>
                                <button className={styles.playBtn} onClick={() => playPreview(sound.url)}>
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </div>
                            <div className={styles.soundInfo}>
                                <span className={styles.soundName}>{sound.name}</span>
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteSound(sound.id)}
                                title="Delete Sound"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.slotsInfo}>
                    <Music size={16} />
                    <span>{sounds.length} / 8 Soundboard Slots</span>
                </div>
                <p className={styles.hint}>Boost your server to unlock more soundboard slots!</p>
            </div>
        </div>
    )
}
