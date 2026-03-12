import { useEffect, useMemo, useState } from 'react'
import { Settings, Moon, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { useProfileArtStore } from '../../stores/useProfileArtStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { apiClient } from '../../services/apiClient'
import { Avatar } from '../ui/Avatar'
import { Tooltip } from '../ui/Tooltip'
import { CurrentUserProfileCard } from './CurrentUserProfileCard'
import styles from '../../styles/modules/features/CurrentUserControls.module.css'

const THEMES = ['dark', 'midnight', 'oled', 'light', 'neon'] as const

interface ProfileNote {
    text?: string
    emoji?: string
    musicMetadata?: {
        title?: string
    } | null
}

export function CurrentUserControls() {
    const user = useAuthStore(state => state.user)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const setShowUserSettings = useUIStore(state => state.setShowUserSettings)
    const setTheme = useUIStore(state => state.setTheme)
    const currentTheme = useUIStore(state => state.theme)
    const currentVoiceState = useVoiceStore(state => state.currentVoiceState)
    const setSelfMute = useVoiceStore(state => state.setSelfMute)
    const setSelfDeaf = useVoiceStore(state => state.setSelfDeaf)
    const equippedFrame = useProfileArtStore(state => state.equippedFrame)
    const profileArts = useProfileArtStore(state => state.arts)
    const [profileNote, setProfileNote] = useState<ProfileNote | null>(null)

    const equippedFrameArt = profileArts.find(a => a.id === equippedFrame)
    const notePreview = useMemo(() => {
        if (!profileNote) return null
        if (profileNote.text?.trim()) return profileNote.text.trim()
        if (profileNote.musicMetadata?.title) return `Listening to ${profileNote.musicMetadata.title}`
        return null
    }, [profileNote])

    const username = user?.username || 'Guest'
    const discriminator = user?.discriminator || '0000'

    useEffect(() => {
        if (!isAuthenticated) return
        apiClient.request('GET', '/notes/profile/me').then((res) => {
            if (res.success && res.data?.note) {
                setProfileNote(res.data.note as ProfileNote)
            }
        }).catch(() => {
            setProfileNote(null)
        })
    }, [isAuthenticated])

    if (!isAuthenticated) return null

    return (
        <div className={styles.userArea}>
            <CurrentUserProfileCard>
                <div className={styles.userPanel}>
                    <div className={styles.avatarWrapper}>
                        <Avatar
                            username={username}
                            src={user?.avatar ?? undefined}
                            status={user?.status as any || 'online'}
                            size="sm"
                            frameUrl={equippedFrameArt?.imageUrl}
                            frameGradient={!equippedFrameArt?.imageUrl ? equippedFrameArt?.preview : undefined}
                        />
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{username}</div>
                        <div className={styles.userStatusRow}>
                            {profileNote?.emoji && <span className={styles.miniEmoji}>{profileNote.emoji}</span>}
                            <div className={styles.userStatusText}>
                                {notePreview || `#${discriminator}`}
                            </div>
                        </div>
                    </div>
                </div>
            </CurrentUserProfileCard>

            <div className={styles.userControls}>
                <Tooltip content={currentVoiceState?.selfMute ? 'Unmute Mic' : 'Mute Mic'} position="top">
                    <button
                        className={`${styles.iconCtrlBtn} ${currentVoiceState?.selfMute ? styles.iconCtrlBtnActive : ''}`}
                        onClick={() => setSelfMute(!currentVoiceState?.selfMute)}
                        aria-label={currentVoiceState?.selfMute ? 'Unmute microphone' : 'Mute microphone'}
                    >
                        {currentVoiceState?.selfMute ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                </Tooltip>

                <Tooltip content={currentVoiceState?.selfDeaf ? 'Undeafen' : 'Deafen'} position="top">
                    <button
                        className={`${styles.iconCtrlBtn} ${currentVoiceState?.selfDeaf ? styles.iconCtrlBtnActive : ''}`}
                        onClick={() => setSelfDeaf(!currentVoiceState?.selfDeaf)}
                        aria-label={currentVoiceState?.selfDeaf ? 'Undeafen' : 'Deafen'}
                    >
                        {currentVoiceState?.selfDeaf ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </Tooltip>

                <Tooltip content="Settings" position="top">
                    <button className={styles.iconCtrlBtn} onClick={() => setShowUserSettings(true)}>
                        <Settings size={16} />
                    </button>
                </Tooltip>
                <Tooltip content="Switch Theme" position="top">
                    <button
                        className={styles.iconCtrlBtn}
                        onClick={() => {
                            const next = THEMES[(THEMES.indexOf(currentTheme as any) + 1) % THEMES.length]
                            setTheme(next as any)
                        }}
                    >
                        <Moon size={16} />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}
