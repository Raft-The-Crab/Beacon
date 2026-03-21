import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Users, MessageSquare, Settings, Volume2,
  VolumeX, Hand, MoreVertical, Maximize2, Crown, Shield
} from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { useVoiceStore } from '../stores/useVoiceStore'
import { useMessageStore } from '../stores/useMessageStore'
import { voiceManager } from '../services/voiceManager'
import { apiClient } from '../services/apiClient'
import { Avatar } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { ServerSoundboard } from '../components/features/ServerSoundboard'
import styles from '../styles/modules/pages/VoiceChannel.module.css'

interface VoiceParticipant {
  id: string
  username: string
  avatar?: string
  isMuted: boolean
  isDeafened: boolean
  isVideoOn: boolean
  isSpeaking: boolean
  isHandRaised: boolean
  isScreenSharing: boolean
  role?: 'owner' | 'mod' | 'member'
  isBeaconPlus?: boolean
  stream?: MediaStream
}

export function VoiceChannel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const channelName = searchParams.get('name') || 'Voice Channel'
  const serverName = searchParams.get('server') || searchParams.get('guildName') || 'Server'
  const channelId = searchParams.get('channelId') || searchParams.get('channel_id') || 'preview_channel'
  const guildId = searchParams.get('guildId') || searchParams.get('server_id') || 'preview_guild'
  const user = useAuthStore((s) => s.user)
  const voiceUsers = useVoiceStore((s) => s.voiceUsers)
  const currentVoiceState = useVoiceStore((s) => s.currentVoiceState)
  const { show } = useToast()

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'focus'>('grid')
  const [sidePanel, setSidePanel] = useState<'members' | 'chat' | 'soundboard' | null>('members')
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [mediaNotice, setMediaNotice] = useState<string | null>(null)

  // Join Voice Channel on Mount
  useEffect(() => {
    if (channelId) {
      setConnectionStatus('connecting')
      setMediaNotice(null)
      voiceManager.joinChannel(guildId, channelId)
        .then(() => {
          setConnectionStatus('connected')
          const stream = voiceManager.getLocalStream()
          const audioTracks = stream?.getAudioTracks()?.length || 0
          const videoTracks = stream?.getVideoTracks()?.length || 0

          if (audioTracks === 0 && videoTracks === 0) {
            setMediaNotice('Joined in listen-only mode. Microphone/camera were not available.')
          } else if (audioTracks === 0 && videoTracks > 0) {
            setMediaNotice('Joined with camera only. Microphone was not available.')
          } else if (audioTracks > 0 && videoTracks === 0) {
            setMediaNotice('Joined with microphone only. Camera was not available.')
          }
        })
        .catch(() => setConnectionStatus('failed'))
    }

    const onUserStream = ({ userId, stream }: { userId: string; stream: MediaStream }) => {
      setRemoteStreams((prev) => ({ ...prev, [userId]: stream }))
    }

    const onUserLeft = (userId: string) => {
      setRemoteStreams((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }

    voiceManager.on('user-stream', onUserStream)
    voiceManager.on('user-left', onUserLeft)

    return () => {
      void voiceManager.leaveChannel()
      voiceManager.off('user-stream', onUserStream)
      voiceManager.off('user-left', onUserLeft)
    }
  }, [channelId, guildId])

  useEffect(() => {
    setIsMuted(!!currentVoiceState?.selfMute)
    setIsDeafened(!!currentVoiceState?.selfDeaf)
    setIsVideoOn(!!currentVoiceState?.selfVideo)
  }, [currentVoiceState?.selfMute, currentVoiceState?.selfDeaf, currentVoiceState?.selfVideo])

  // Map local stream and remote peers into participants array for UI rendering
  const participants = useMemo(() => {
    if (!user) return []

    const localStream = voiceManager.getLocalStream()
    const channelVoiceStates = Array.from(voiceUsers.values()).filter((state) => state.channelId === channelId)

    const me: VoiceParticipant = {
      id: user.id,
      username: user.username,
      avatar: user.avatar as any,
      isMuted: !!currentVoiceState?.selfMute,
      isDeafened: !!currentVoiceState?.selfDeaf,
      isVideoOn: !!currentVoiceState?.selfVideo,
      isSpeaking: (currentVoiceState?.audioLevel || 0) > 0.08,
      isHandRaised,
      isScreenSharing: !!currentVoiceState?.selfScreen,
      isBeaconPlus: !!currentVoiceState?.isBeaconPlus,
      role: 'member',
      stream: localStream || undefined
    }

    const peerParticipants: VoiceParticipant[] = channelVoiceStates
      .filter((state) => state.userId !== user.id)
      .map((state) => ({
        id: state.userId,
        username: `User ${state.userId.substring(0, 4)}`,
        isMuted: state.selfMute,
        isDeafened: state.selfDeaf,
        isVideoOn: state.selfVideo,
        isSpeaking: (state.audioLevel || 0) > 0.08,
        isHandRaised: false,
        isScreenSharing: !!state.selfScreen,
        isBeaconPlus: !!state.isBeaconPlus,
        role: 'member',
        stream: remoteStreams[state.userId]
      }))

    return [me, ...peerParticipants]
  }, [user, voiceUsers, channelId, currentVoiceState, isHandRaised, isScreenSharing, remoteStreams])

  const handleLeave = () => {
    void voiceManager.leaveChannel()
    navigate(-1)
  }

  const handleToggleMute = useCallback(async () => {
    const next = currentVoiceState ? !currentVoiceState.selfMute : !isMuted
    try {
      await voiceManager.setMute(guildId, next)
      setIsMuted(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change microphone state.'
      show(message, 'error')
      setIsMuted(true)
    }
  }, [currentVoiceState, isMuted, guildId, show])

  const toggleDeafen = useCallback(() => {
    if (!currentVoiceState) return
    const next = !currentVoiceState.selfDeaf
    voiceManager.setDeaf(guildId, next)
    setIsDeafened(next)
    if (next) {
      void voiceManager.setMute(guildId, true)
      setIsMuted(true)
    }
  }, [currentVoiceState, guildId])

  const handleToggleVideo = useCallback(async () => {
    const next = currentVoiceState ? !currentVoiceState.selfVideo : !isVideoOn
    try {
      await voiceManager.setVideo(guildId, next)
      setIsVideoOn(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change camera state.'
      show(message, 'error')
      setIsVideoOn(false)
    }
  }, [currentVoiceState, isVideoOn, guildId, show])

  const toggleScreenShare = useCallback(async () => {
    try {
      await voiceManager.startScreenShare(guildId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start screen sharing.'
      show(message, 'error')
      setIsScreenSharing(false)
    }
  }, [guildId, show])

  const toggleHand = useCallback(() => {
    setIsHandRaised((h) => !h)
  }, [])

  const handleRetryMedia = async () => {
    const stream = voiceManager.getLocalStream()
    const audioTracks = stream?.getAudioTracks()?.length || 0
    const videoTracks = stream?.getVideoTracks()?.length || 0

    const errors: string[] = []

    if (audioTracks === 0) {
      try {
        await voiceManager.setMute(guildId, false)
        setIsMuted(false)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Microphone is still unavailable.')
      }
    }

    if (videoTracks === 0) {
      try {
        await voiceManager.setVideo(guildId, true)
        setIsVideoOn(true)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Camera is still unavailable.')
      }
    }

    const refreshedStream = voiceManager.getLocalStream()
    const refreshedAudioTracks = refreshedStream?.getAudioTracks()?.length || 0
    const refreshedVideoTracks = refreshedStream?.getVideoTracks()?.length || 0

    if (refreshedAudioTracks > 0 && refreshedVideoTracks > 0) {
      setMediaNotice(null)
      show('Microphone and camera are now available.', 'success')
      return
    }

    if (refreshedAudioTracks > 0 && refreshedVideoTracks === 0) {
      setMediaNotice('Joined with microphone only. Camera was not available.')
      return
    }

    if (refreshedAudioTracks === 0 && refreshedVideoTracks > 0) {
      setMediaNotice('Joined with camera only. Microphone was not available.')
      return
    }

    setMediaNotice('Joined in listen-only mode. Microphone/camera were not available.')
    if (errors.length > 0) {
      show(errors[0], 'error')
    }
  }

  const speakingCount = participants.filter((p) => p.isSpeaking && !p.isMuted).length

  useEffect(() => {
    return () => {
      setIsScreenSharing(false)
    }
  }, [])

  return (
    <div className={styles.root}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.channelBadge}>
            <Volume2 size={16} />
            <span>{channelName}</span>
          </div>
          <span className={styles.serverLabel}>{serverName}</span>
          {connectionStatus === 'connecting' && (
            <div className={styles.statusPill} style={{ background: 'rgba(250, 166, 26, 0.15)', color: '#faa61a' }}>
              <span className={styles.statusDot} style={{ background: '#faa61a' }} />
              Connecting...
            </div>
          )}
          {connectionStatus === 'connected' && speakingCount > 0 && (
            <div className={styles.speakingPill}>
              <span className={styles.speakingDot} />
              {speakingCount} speaking
            </div>
          )}
          {connectionStatus === 'failed' && (
            <div className={styles.statusPill} style={{ background: 'rgba(242, 63, 67, 0.15)', color: '#f04747' }}>
              <span className={styles.statusDot} style={{ background: '#f04747' }} />
              Connection Failed
            </div>
          )}
        </div>
        <div className={styles.topRight}>
          <button
            className={`${styles.topBtn} ${layout === 'focus' ? styles.topBtnActive : ''}`}
            onClick={() => setLayout(layout === 'grid' ? 'focus' : 'grid')}
            title="Toggle layout"
          >
            <Maximize2 size={17} />
          </button>
          <button
            className={`${styles.topBtn} ${sidePanel === 'members' ? styles.topBtnActive : ''}`}
            onClick={() => setSidePanel(sidePanel === 'members' ? null : 'members')}
            title="Members"
          >
            <Users size={17} />
            <span className={styles.memberCountBadge}>{participants.length}</span>
          </button>
          <button
            className={`${styles.topBtn} ${sidePanel === 'chat' ? styles.topBtnActive : ''}`}
            onClick={() => setSidePanel(sidePanel === 'chat' ? null : 'chat')}
            title="Channel chat"
          >
            <MessageSquare size={17} />
          </button>
          <button
            className={`${styles.topBtn} ${sidePanel === 'soundboard' ? styles.topBtnActive : ''}`}
            onClick={() => setSidePanel(sidePanel === 'soundboard' ? null : 'soundboard')}
            title="Soundboard"
          >
            <Volume2 size={17} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.main}>
        {mediaNotice && (
          <div className={styles.mediaNotice} role="status" aria-live="polite">
            <span>{mediaNotice}</span>
            <div className={styles.mediaNoticeActions}>
              <button type="button" className={styles.mediaNoticeButton} onClick={handleRetryMedia}>
                Retry media access
              </button>
              <button
                type="button"
                className={`${styles.mediaNoticeButton} ${styles.mediaNoticeButtonSecondary}`}
                onClick={() => setMediaNotice(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {/* Video grid */}
        <div className={`${styles.videoArea} ${sidePanel ? styles.videoAreaShrunk : ''} ${mediaNotice ? styles.videoAreaWithNotice : ''}`}>
          {participants.length === 0 ? (
            <div className={styles.emptyVoice}>
              <Volume2 size={56} className={styles.emptyIcon} />
              <h2>No one else is here yet</h2>
              <p>You're in <strong>{channelName}</strong>. Invite friends to join!</p>
            </div>
          ) : (
            <div className={`${styles.videoGrid} ${layout === 'focus' ? styles.videoGridFocus : ''}`}>
              {participants.map((p) => (
                <ParticipantTile key={p.id} participant={p} isSelf={p.id === user?.id} />
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        {sidePanel && (
          <div className={styles.sidePanel}>
            {sidePanel === 'members' && (
              <MembersPanel participants={participants} />
            )}
            {sidePanel === 'chat' && (
              <ChatPanel channelId={channelId} channelName={channelName} />
            )}
            {sidePanel === 'soundboard' && (
              <ServerSoundboard guildId={guildId} />
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <div className={styles.channelInfo}>
            <Volume2 size={14} />
            <span>{channelName}</span>
          </div>
        </div>

        <div className={styles.controlsCenter}>
          <ControlButton
            icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            danger={isMuted}
            onClick={handleToggleMute}
          />
          <ControlButton
            icon={isDeafened ? <VolumeX size={20} /> : <Volume2 size={20} />}
            label={isDeafened ? 'Undeafen' : 'Deafen'}
            active={isDeafened}
            danger={isDeafened}
            onClick={toggleDeafen}
          />
          <ControlButton
            icon={isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            label={isVideoOn ? 'Stop Video' : 'Start Video'}
            active={!isVideoOn}
            onClick={handleToggleVideo}
          />
          <ControlButton
            icon={currentVoiceState?.selfScreen ? <MonitorOff size={20} /> : <Monitor size={20} />}
            label={currentVoiceState?.selfScreen ? 'Stop Share' : 'Share Screen'}
            active={!!currentVoiceState?.selfScreen}
            onClick={toggleScreenShare}
          />
          <ControlButton
            icon={<Hand size={20} />}
            label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            active={isHandRaised}
            accent={isHandRaised}
            onClick={toggleHand}
          />

          <div className={styles.controlDivider} />

          <button className={styles.leaveBtn} onClick={handleLeave} title="Leave channel">
            <PhoneOff size={20} />
            <span>Leave</span>
          </button>
        </div>

        <div className={styles.controlsRight}>
          <button className={styles.topBtn} title="Voice Settings">
            <Settings size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Participant tile ──────────────────────────────────────────────
function ParticipantTile({
  participant: p,
  isSelf,
}: {
  participant: VoiceParticipant & { stream?: MediaStream }
  isSelf: boolean
}) {
  const avatarUrl = p.avatar && !p.avatar.includes('dicebear') ? p.avatar : null
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleTrackEvent = () => {
      if (videoRef.current && p.stream) {
        console.log(`[ParticipantTile] Track event for ${p.id}, re-binding stream`);
        videoRef.current.srcObject = p.stream;
      }
    };

    if (p.stream) {
      p.stream.addEventListener('addtrack', handleTrackEvent);
      p.stream.addEventListener('removetrack', handleTrackEvent);
    }

    // Comprehensive binding effect
    if (videoRef.current) {
      if (p.isVideoOn || p.isScreenSharing) {
        if (p.stream) {
          // Force a full re-bind to clear potential black feeds from previous tracks
          videoRef.current.srcObject = null;
          videoRef.current.srcObject = p.stream;
          videoRef.current.play().catch(e => console.warn('[ParticipantTile] Play failed:', e));
        }
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [p.stream, p.isVideoOn, p.isScreenSharing])

  return (
    <div className={`${styles.tile} ${p.isSpeaking && !p.isMuted ? styles.tileSpeaking : ''}`}>
      {(p.isVideoOn || p.isScreenSharing) ? (
        <video
          ref={videoRef}
          className={`${styles.tileVideo} ${isSelf && !p.isScreenSharing ? styles.localVideo : ''}`}
          autoPlay
          muted={isSelf}
          playsInline
          onCanPlay={(e) => {
            e.currentTarget.play().catch(err => {
              console.warn('[ParticipantTile] Autoplay prevented, retrying muted...', err);
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(e => console.error('[ParticipantTile] Play retry failed:', e));
              }
            });
          }}
        />
      ) : (
        <div className={styles.tileAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Avatar username={p.username} size="lg" />
          )}
        </div>
      )}

      {/* Beacon+ indicator */}
      {p.isBeaconPlus && (
        <div className={styles.premiumBadge} title="Beacon+ Member">
          <Crown size={12} style={{ color: '#ffcc00' }} />
        </div>
      )}

      {/* Role badge */}
      {p.role === 'owner' && (
        <div className={`${styles.roleBadge} ${styles.roleOwner}`}>
          <Crown size={12} />
        </div>
      )}
      {p.role === 'mod' && (
        <div className={`${styles.roleBadge} ${styles.roleMod}`}>
          <Shield size={12} />
        </div>
      )}

      {/* Status icons */}
      <div className={styles.tileStatus}>
        {p.isHandRaised && <Hand size={14} className={styles.handIcon} />}
        {p.isMuted && <MicOff size={14} className={styles.mutedIcon} />}
        {p.isScreenSharing && <Monitor size={14} className={styles.screenIcon} />}
      </div>

      {/* Name label */}
      <div className={styles.tileLabel}>
        <div className={`${styles.speakIndicator} ${p.isSpeaking && !p.isMuted ? styles.speakIndicatorActive : ''}`} />
        <span>{p.username}{isSelf ? ' (You)' : ''}</span>
      </div>

      {/* More options */}
      {!isSelf && (
        <button className={styles.tileMore}>
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  )
}

// ── Members panel ─────────────────────────────────────────────────
function MembersPanel({ participants }: { participants: VoiceParticipant[] }) {
  return (
    <div className={styles.membersPanel}>
      <div className={styles.panelHeader}>
        <span>Members — {participants.length}</span>
      </div>
      <div className={styles.membersList}>
        {participants.map((p) => (
          <div key={p.id} className={styles.memberItem}>
            <div className={styles.memberAvatarWrap}>
              {p.avatar && !p.avatar.includes('dicebear') ? (
                <img
                  src={p.avatar}
                  alt={p.username}
                  className={styles.memberAvatar}
                />
              ) : (
                <Avatar username={p.username} size="sm" />
              )}
              {p.isSpeaking && !p.isMuted && (
                <div className={styles.memberSpeakRing} />
              )}
            </div>
            <div className={styles.memberName}>{p.username}</div>
            <div className={styles.memberIcons}>
              {p.isMuted && <MicOff size={13} className={styles.memberMuted} />}
              {p.isDeafened && <VolumeX size={13} className={styles.memberMuted} />}
              {p.isHandRaised && <Hand size={13} className={styles.memberMuted} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chat panel ────────────────────────────────────────────────────
function ChatPanel({ channelId: propChannelId, channelName }: { channelId?: string; channelName: string }) {
  const channelId = propChannelId || 'voice-chat' // Fallback
  const messages = useMessageStore((s: any) => s.messages.get(channelId) || [])
  const fetchMessages = useMessageStore((s: any) => s.fetchMessages)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (channelId) void fetchMessages(channelId)
  }, [channelId, fetchMessages])

  const send = async () => {
    const text = input.trim()
    if (!text || !channelId) return
    
    try {
      await apiClient.sendMessage(channelId, { content: text })
      setInput('')
    } catch (err) {
      console.warn('Voice chat send failed:', err)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className={styles.chatPanel}>
      <div className={styles.panelHeader}>
        <MessageSquare size={15} />
        <span>Chat — {channelName}</span>
      </div>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>
            <MessageSquare size={28} style={{ opacity: 0.3 }} />
            <p>No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map((m: any) => (
          <div key={m.id} className={styles.chatMsg}>
            <div className={styles.chatMsgHeader}>
               <span className={styles.chatAuthor}>{m.author?.username || 'Unknown'}</span>
               <span className={styles.chatTime}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span className={styles.chatText}>{m.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className={styles.chatInput}>
        <input
          className={styles.chatInputField}
          placeholder={`Message ${channelName}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className={styles.chatSendBtn} onClick={send}>
          ↵
        </button>
      </div>
    </div>
  )
}

// ── Control button ────────────────────────────────────────────────
function ControlButton({
  icon,
  label,
  active,
  danger,
  accent,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  danger?: boolean
  accent?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`${styles.controlBtn} ${active && danger ? styles.controlBtnDanger : ''} ${accent ? styles.controlBtnAccent : ''}`}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className={styles.controlLabel}>{label}</span>
    </button>
  )
}
