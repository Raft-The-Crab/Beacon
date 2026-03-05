import { useState, useEffect, useRef } from 'react'
import { Music, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button, Modal, Input } from '../ui'
import { api } from '../../lib/api'
import styles from '../../styles/modules/features/ServerSoundboard.module.css'

interface Sound {
    id: string
    name: string
    url: string
    emoji: string | null
    guildId: string
    creatorId: string
}

export function ServerSoundboard({ guildId }: { guildId: string }) {
    const [sounds, setSounds] = useState<Sound[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showUpload, setShowUpload] = useState(false)

    const [newName, setNewName] = useState('')
    const [newEmoji, setNewEmoji] = useState('🎵')
    const [file, setFile] = useState<File | null>(null)

    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({})

    const fetchSounds = async () => {
        try {
            setLoading(true)
            const { data } = await api.get(`/guilds/${guildId}/sounds`)
            setSounds(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (guildId) fetchSounds()
    }, [guildId])

    const handleUpload = async () => {
        if (!file || !newName) return
        setUploading(true)
        try {
            // 1. Upload file to media API
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const fileUrl = uploadRes.data.url

            // 2. Create sound entry
            await api.post(`/guilds/${guildId}/sounds`, {
                name: newName,
                url: fileUrl,
                emoji: newEmoji
            })

            await fetchSounds()
            setShowUpload(false)
            setNewName('')
            setFile(null)
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (soundId: string) => {
        try {
            await api.delete(`/guilds/${guildId}/sounds/${soundId}`)
            setSounds(s => s.filter(x => x.id !== soundId))
        } catch (err) {
            console.error(err)
        }
    }

    const playSound = (sound: Sound) => {
        // In a real app we would send WebRTC data channel event here
        // For now we just play locally
        let audio = audioRefs.current[sound.id]
        if (!audio) {
            audio = new Audio(sound.url)
            audio.volume = 0.5
            audioRefs.current[sound.id] = audio
        }
        audio.currentTime = 0
        audio.play()
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleWrap}>
                    <Music size={16} />
                    <span>Server Soundboard</span>
                </div>
                <Button size="sm" onClick={() => setShowUpload(true)}>
                    <Plus size={14} /> Add Sound
                </Button>
            </div>

            <div className={styles.soundGrid}>
                {loading ? (
                    <div className={styles.empty}>
                        <Loader2 className={styles.spin} />
                    </div>
                ) : sounds.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No sounds uploaded yet.</p>
                    </div>
                ) : (
                    sounds.map(sound => (
                        <div key={sound.id} className={styles.soundCard} onClick={() => playSound(sound)}>
                            <div className={styles.soundEmoji}>{sound.emoji || '🎵'}</div>
                            <div className={styles.soundName}>{sound.name}</div>
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => { e.stopPropagation(); handleDelete(sound.id); }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} size="sm" title="Upload Sound">
                <div className={styles.uploadModal}>
                    <Input
                        label="Sound Name"
                        value={newName}
                        onChange={e => setNewName(e.currentTarget.value)}
                        placeholder="e.g. Bruh, Vine Boom"
                    />
                    <Input
                        label="Emoji (Optional)"
                        value={newEmoji}
                        onChange={e => setNewEmoji(e.currentTarget.value)}
                        placeholder="😎"
                    />
                    <div className={styles.fileInput}>
                        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className={styles.actions}>
                        <Button variant="secondary" onClick={() => setShowUpload(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={uploading || !file || !newName}
                        >
                            {uploading ? 'Uploading...' : 'Save Sound'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
