import { useState, useEffect } from 'react'
import { Music, Smile, Loader2 } from 'lucide-react'
import { Modal, Input, Button, EmojiPicker } from '../ui'
import { apiClient } from '../../services/apiClient'
import { MusicScrubber } from '../ui/MusicScrubber'
import { fetchMusicMetadata, type MusicMetadata } from '../../services/musicMetadata'
import styles from '../../styles/modules/modals/BeaconNotesModal.module.css'

interface BeaconNotesModalProps {
    isOpen: boolean
    onClose: () => void
}

export function BeaconNotesModal({ isOpen, onClose }: BeaconNotesModalProps) {
    const [text, setText] = useState('')
    const [emoji, setEmoji] = useState('✨')
    const [musicUrl, setMusicUrl] = useState('')
    const [metadata, setMetadata] = useState<MusicMetadata | null>(null)
    const [clipDuration, setClipDuration] = useState<15 | 30>(15)
    const [clipStart, setClipStart] = useState(0)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    const [isSaving, setIsSaving] = useState(false)
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        const load = async () => {
            const res = await apiClient.request('GET', '/notes/profile/me')
            if (res.success && res.data?.note) {
                const note = res.data.note
                setText(note.text || '')
                setEmoji(note.emoji || '✨')
                setMusicUrl(note.musicUrl || '')
                if (note.musicMetadata) {
                    setMetadata(note.musicMetadata)
                    setClipDuration(note.musicMetadata.duration === 30 ? 30 : 15)
                    setClipStart(Number(note.musicMetadata.start || 0))
                } else {
                    setMetadata(null)
                }
            }
        }

        load().catch(console.error)
    }, [isOpen])

    // Auto-fetch metadata when URL changes
    useEffect(() => {
        const fetchMeta = async () => {
            if (!musicUrl || (!musicUrl.includes('spotify') && !musicUrl.includes('youtube') && !musicUrl.includes('youtu.be'))) {
                setMetadata(null);
                return;
            }
            setIsLoadingMetadata(true);
            const meta = await fetchMusicMetadata(musicUrl);
            setMetadata(meta);
            setIsLoadingMetadata(false);
        };
        const timer = setTimeout(fetchMeta, 500);
        return () => clearTimeout(timer);
    }, [musicUrl]);

    const handleEmojiSelect = (e: any) => {
        setEmoji(e.native || e)
        setIsEmojiPickerOpen(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await apiClient.request('PUT', '/notes/profile/me', {
                text,
                emoji,
                musicUrl: musicUrl || null,
                musicMetadata: metadata ? {
                    url: musicUrl,
                    start: clipStart,
                    duration: clipDuration,
                    title: metadata.title,
                    artist: metadata.artist,
                    thumbnail: metadata.thumbnail,
                    platform: metadata.platform,
                } : null,
            })
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    const handleClear = () => {
        setText('')
        setEmoji('✨')
        setMusicUrl('')
        setMetadata(null)
    }

    const embedSrc = (() => {
        if (!musicUrl) return null
        if (musicUrl.includes('youtube.com') || musicUrl.includes('youtu.be')) {
            try {
                const url = new URL(musicUrl)
                const id = url.hostname.includes('youtu.be')
                    ? url.pathname.replace('/', '')
                    : (url.searchParams.get('v') || '')
                if (!id) return null
                return `https://www.youtube.com/embed/${id}?start=${Math.max(0, clipStart)}`
            } catch {
                return null
            }
        }
        if (musicUrl.includes('spotify.com/track/')) {
            const parts = musicUrl.split('/track/')
            const id = parts[1]?.split('?')[0]
            if (!id) return null
            return `https://open.spotify.com/embed/track/${id}`
        }
        return null
    })()

    const canAudioPreview = /\.(mp3|wav|ogg|m4a|aac)$/i.test(musicUrl)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Beacon Notes" size="md">
            <div className={styles.container}>
                <p className={styles.description}>
                    Share a note and optional music preview on your profile.
                </p>

                {/* Status Input */}
                <div className={styles.section}>
                    <label className={styles.label}>Profile Note</label>
                    <div className={styles.statusInputArea}>
                        <button
                            className={styles.emojiBtn}
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        >
                            <span style={{ fontSize: 20 }}>{emoji}</span>
                            <Smile size={14} className={styles.miniSmile} />
                        </button>
                        <Input
                            placeholder="Share a quick note..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className={styles.textField}
                        />
                        {isEmojiPickerOpen && (
                            <div className={styles.emojiPickerPopup}>
                                <EmojiPicker
                                    onSelect={handleEmojiSelect}
                                    onClose={() => setIsEmojiPickerOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Music Support */}
                <div className={styles.section}>
                    <div className={styles.musicHeader}>
                        <label className={styles.label}>Music Status (Pro)</label>
                        {isLoadingMetadata && <Loader2 size={14} className="animate-spin" />}
                    </div>
                    <Input
                        icon={<Music size={16} />}
                        placeholder="Paste a Spotify/YouTube link"
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                    />

                    {metadata && (
                        <div className={`${styles.musicPreview} animate-fadeIn`}>
                            <img src={metadata.thumbnail} alt="" className={styles.musicThumb} />
                            <div className={styles.musicInfo}>
                                <span className={styles.musicTitle}>{metadata.title}</span>
                                <span className={styles.musicArtist}>{metadata.artist}</span>
                            </div>
                        </div>
                    )}

                    {canAudioPreview && (
                        <audio className={styles.audioPreview} controls src={musicUrl} />
                    )}

                    {!canAudioPreview && embedSrc && (
                        <div className={styles.embedWrap}>
                            <iframe
                                title="Music preview"
                                src={embedSrc}
                                className={styles.embedFrame}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {metadata && (
                        <div className={`${styles.scrubberSection} animate-fadeIn`}>
                            <div className={styles.scrubberHeader}>
                                <span className={styles.label}>Select Clip Start</span>
                                <div className={styles.durationToggles}>
                                    <button
                                        className={`${styles.toggleBtn} ${clipDuration === 15 ? styles.activeToggle : ''}`}
                                        onClick={() => setClipDuration(15)}
                                    >15s</button>
                                    <button
                                        className={`${styles.toggleBtn} ${clipDuration === 30 ? styles.activeToggle : ''}`}
                                        onClick={() => setClipDuration(30)}
                                    >30s</button>
                                </div>
                            </div>
                            <MusicScrubber
                                durationLimit={clipDuration}
                                onSeek={setClipStart}
                                initialOffset={clipStart}
                            />
                        </div>
                    )}
                    <p className={styles.hint}>Sharing a song adds it to your profile note with a 15-30s preview.</p>
                </div>

                <div className={styles.footer}>
                    <Button variant="ghost" onClick={handleClear} disabled={isSaving}>
                        Clear All
                    </Button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave} loading={isSaving}>
                            Save Note
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
