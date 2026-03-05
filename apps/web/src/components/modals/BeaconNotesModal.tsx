import { useState, useEffect } from 'react'
import { Music, Check, Smile, Loader2 } from 'lucide-react'
import { Modal, Input, Button, EmojiPicker } from '../ui'
import { useAuthStore, PresenceStatus } from '../../stores/useAuthStore'
import { MusicScrubber } from '../ui/MusicScrubber'
import { fetchMusicMetadata, type MusicMetadata } from '../../services/musicMetadata'
import styles from '../../styles/modules/modals/BeaconNotesModal.module.css'

interface BeaconNotesModalProps {
    isOpen: boolean
    onClose: () => void
}

const PRESENCE_OPTIONS: { status: PresenceStatus; label: string; color: string }[] = [
    { status: 'online', label: 'Online', color: '#23a559' },
    { status: 'idle', label: 'Idle', color: '#f0b232' },
    { status: 'dnd', label: 'Do Not Disturb', color: '#f23f43' },
    { status: 'invisible', label: 'Invisible', color: '#80848e' },
]

export function BeaconNotesModal({ isOpen, onClose }: BeaconNotesModalProps) {
    const { user, updateStatus, updateProfile } = useAuthStore()
    const [text, setText] = useState(user?.statusText || '')
    const [emoji, setEmoji] = useState(user?.statusEmoji || '✨')
    const [musicUrl, setMusicUrl] = useState(user?.statusMusic || '')
    const [metadata, setMetadata] = useState<MusicMetadata | null>(null)
    const [clipDuration, setClipDuration] = useState<15 | 30>(15)
    const [clipStart, setClipStart] = useState(0)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    const [currentStatus, setCurrentStatus] = useState<PresenceStatus>((user?.status as PresenceStatus) || 'online')
    const [isSaving, setIsSaving] = useState(false)
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

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
            await updateStatus({
                statusText: text,
                statusEmoji: emoji,
                statusMusic: musicUrl,
                statusMusicMetadata: metadata ? {
                    url: musicUrl,
                    start: clipStart,
                    duration: clipDuration,
                    title: metadata.title,
                    artist: metadata.artist,
                    platform: metadata.platform
                } : undefined
            })
            await updateProfile({ status: currentStatus } as any)
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Beacon Notes" size="md">
            <div className={styles.container}>
                <p className={styles.description}>
                    Update your presence and share what's on your mind.
                </p>

                {/* Presence Selection */}
                <div className={styles.section}>
                    <label className={styles.label}>Presence</label>
                    <div className={styles.presenceGrid}>
                        {PRESENCE_OPTIONS.map((opt) => (
                            <button
                                key={opt.status}
                                className={`${styles.presenceBtn} ${currentStatus === opt.status ? styles.activePresence : ''}`}
                                onClick={() => setCurrentStatus(opt.status)}
                            >
                                <div className={styles.presenceDot} style={{ backgroundColor: opt.color }} />
                                <span>{opt.label}</span>
                                {currentStatus === opt.status && <Check size={14} className={styles.activeIcon} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Input */}
                <div className={styles.section}>
                    <label className={styles.label}>What's happening?</label>
                    <div className={styles.statusInputArea}>
                        <button
                            className={styles.emojiBtn}
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        >
                            <span style={{ fontSize: 20 }}>{emoji}</span>
                            <Smile size={14} className={styles.miniSmile} />
                        </button>
                        <Input
                            placeholder="I'm feeling lucky today..."
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
