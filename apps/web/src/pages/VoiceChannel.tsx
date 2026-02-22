import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Users, MessageSquare, Settings, Volume2,
  VolumeX, Hand, MoreVertical, Maximize2, Crown, Shield
} from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { Avatar } from '../components/ui'
import styles from './VoiceChannel.module.css'

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
}

export function VoiceChannel() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const channelName = searchParams.get('name') || 'Voice Channel'
  const serverName = searchParams.get('server') || 'Server'
  const user = useAuthStore((s) => s.user)

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'focus'>('grid')
  const [sidePanel, setSidePanel] = useState<'members' | 'chat' | null>('members')
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])

  // Add self to participants on mount
  useEffect(() => {
    if (user) {
      setParticipants([
        {
          id: user.id,
          username: user.username,
          avatar: user.avatar as any,
          isMuted: false,
          isDeafened: false,
          isVideoOn: false,
          isSpeaking: false,
          isHandRaised: false,
          isScreenSharing: false,
          role: 'member',
        },
      ])
    }
  }, [user])

  const handleLeave = () => {
    navigate(-1)
  }

  const toggleMute = () => {
    setIsMuted((m) => !m)
    setParticipants((ps) =>
      ps.map((p) => (p.id === user?.id ? { ...p, isMuted: !isMuted } : p))
    )
  }

  const toggleDeafen = () => {
    setIsDeafened((d) => {
      const next = !d
      if (next) setIsMuted(true)
      return next
    })
  }

  const toggleVideo = () => {
    setIsVideoOn((v) => !v)
    setParticipants((ps) =>
      ps.map((p) => (p.id === user?.id ? { ...p, isVideoOn: !isVideoOn } : p))
    )
  }

  const toggleScreenShare = () => setIsScreenSharing((s) => !s)
  const toggleHand = () => {
    setIsHandRaised((h) => !h)
    setParticipants((ps) =>
      ps.map((p) => (p.id === user?.id ? { ...p, isHandRaised: !isHandRaised } : p))
    )
  }

  const speakingCount = participants.filter((p) => p.isSpeaking && !p.isMuted).length

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
          {speakingCount > 0 && (
            <div className={styles.speakingPill}>
              <span className={styles.speakingDot} />
              {speakingCount} speaking
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
        </div>
      </div>

      {/* Main content */}
      <div className={styles.main}>
        {/* Video grid */}
        <div className={`${styles.videoArea} ${sidePanel ? styles.videoAreaShrunk : ''}`}>
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
              <ChatPanel channelName={channelName} />
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
            onClick={toggleMute}
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
            onClick={toggleVideo}
          />
          <ControlButton
            icon={isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            active={isScreenSharing}
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
  participant: VoiceParticipant
  isSelf: boolean
}) {
  const avatarUrl = p.avatar && !p.avatar.includes('dicebear') ? p.avatar : null

  return (
    <div className={`${styles.tile} ${p.isSpeaking && !p.isMuted ? styles.tileSpeaking : ''}`}>
      {p.isVideoOn ? (
        <video className={styles.tileVideo} autoPlay muted={isSelf} playsInline />
      ) : (
        <div className={styles.tileAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Avatar username={p.username} size="lg" />
          )}
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
function ChatPanel({ channelName }: { channelName: string }) {
  const [msgs, setMsgs] = useState<{ id: number; author: string; text: string }[]>([])
  const [input, setInput] = useState('')
  const user = useAuthStore((s) => s.user)
  const endRef = useRef<HTMLDivElement>(null)

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMsgs((m) => [...m, { id: Date.now(), author: user?.username || 'You', text }])
    setInput('')
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  return (
    <div className={styles.chatPanel}>
      <div className={styles.panelHeader}>
        <MessageSquare size={15} />
        <span>Chat — {channelName}</span>
      </div>
      <div className={styles.chatMessages}>
        {msgs.length === 0 && (
          <div className={styles.chatEmpty}>
            <MessageSquare size={28} style={{ opacity: 0.3 }} />
            <p>No messages yet. Say hi!</p>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={styles.chatMsg}>
            <span className={styles.chatAuthor}>{m.author}</span>
            <span className={styles.chatText}>{m.text}</span>
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
