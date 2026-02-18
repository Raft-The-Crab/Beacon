import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Monitor, Users, Maximize2 } from 'lucide-react'
import { Avatar, Button, Tooltip } from '../ui'
import styles from './CallInterface.module.css'

export interface CallParticipant {
  id: string
  username: string
  avatar?: string
  isMuted: boolean
  isVideoOn: boolean
  isSpeaking: boolean
}

interface CallInterfaceProps {
  callType: 'voice' | 'video'
  participants: CallParticipant[]
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
}

export function CallInterface({
  callType,
  participants,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  isMuted,
  isVideoOn,
  isScreenSharing,
}: CallInterfaceProps) {
  const [showParticipants, setShowParticipants] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // In a real app, this would connect to WebRTC
    if (callType === 'video' && isVideoOn && localVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch((err) => console.error('Failed to get media:', err))
    }
  }, [callType, isVideoOn])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Video Grid */}
      <div className={styles.videoGrid}>
        {callType === 'video' ? (
          <>
            {/* Local video */}
            <div className={styles.videoTile}>
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.video}
                />
              ) : (
                <div className={styles.videoPlaceholder}>
                  <Avatar src={undefined} alt="You" size="xl" />
                  <span className={styles.username}>You</span>
                </div>
              )}
              {isMuted && (
                <div className={styles.mutedIndicator}>
                  <MicOff size={16} />
                </div>
              )}
            </div>

            {/* Remote participants */}
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`${styles.videoTile} ${
                  participant.isSpeaking ? styles.speaking : ''
                }`}
              >
                {participant.isVideoOn ? (
                  <div className={styles.remoteVideo}>
                    {/* In real app, would display remote video stream */}
                    <div className={styles.videoPlaceholder}>
                      <span>📹 Video Stream</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <Avatar src={participant.avatar} alt={participant.username} size="xl" />
                    <span className={styles.username}>{participant.username}</span>
                  </div>
                )}
                {participant.isMuted && (
                  <div className={styles.mutedIndicator}>
                    <MicOff size={16} />
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* Voice call - show avatars */
          <div className={styles.voiceParticipants}>
            <div className={`${styles.voiceParticipant} ${isMuted ? '' : styles.speaking}`}>
              <Avatar src={undefined} alt="You" size="xl" />
              <span className={styles.participantName}>You</span>
              {isMuted && <MicOff size={20} className={styles.mutedIcon} />}
            </div>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`${styles.voiceParticipant} ${
                  participant.isSpeaking ? styles.speaking : ''
                }`}
              >
                <Avatar
                  src={participant.avatar}
                  alt={participant.username}
                  size="xl"
                />
                <span className={styles.participantName}>{participant.username}</span>
                {participant.isMuted && <MicOff size={20} className={styles.mutedIcon} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants sidebar */}
      {showParticipants && (
        <div className={styles.participantsSidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Participants ({participants.length + 1})</h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowParticipants(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.participantsList}>
            <div className={styles.participantItem}>
              <Avatar src={undefined} alt="You" size="sm" />
              <span>You</span>
              {isMuted && <MicOff size={16} />}
            </div>
            {participants.map((participant) => (
              <div key={participant.id} className={styles.participantItem}>
                <Avatar
                  src={participant.avatar}
                  alt={participant.username}
                  size="sm"
                />
                <span>{participant.username}</span>
                {participant.isMuted && <MicOff size={16} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call controls */}
      <div className={styles.controls}>
        <div className={styles.controlsGroup}>
          <Tooltip content={isMuted ? 'Unmute' : 'Mute'} position="top">
            <Button
              variant={isMuted ? 'danger' : 'secondary'}
              size="lg"
              onClick={onToggleMute}
              className={styles.controlButton}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </Button>
          </Tooltip>

          {callType === 'video' && (
            <Tooltip content={isVideoOn ? 'Stop Video' : 'Start Video'} position="top">
              <Button
                variant={isVideoOn ? 'secondary' : 'danger'}
                size="lg"
                onClick={onToggleVideo}
                className={styles.controlButton}
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </Button>
            </Tooltip>
          )}

          <Tooltip content="Screen Share" position="top">
            <Button
              variant={isScreenSharing ? 'primary' : 'secondary'}
              size="lg"
              onClick={onToggleScreenShare}
              className={styles.controlButton}
            >
              <Monitor size={24} />
            </Button>
          </Tooltip>

          <Tooltip content="Settings" position="top">
            <Button variant="secondary" size="lg" className={styles.controlButton}>
              <Settings size={24} />
            </Button>
          </Tooltip>

          <Tooltip content="Participants" position="top">
            <Button
              variant={showParticipants ? 'primary' : 'secondary'}
              size="lg"
              onClick={() => setShowParticipants(!showParticipants)}
              className={styles.controlButton}
            >
              <Users size={24} />
            </Button>
          </Tooltip>

          <Tooltip content="Fullscreen" position="top">
            <Button
              variant="secondary"
              size="lg"
              onClick={toggleFullscreen}
              className={styles.controlButton}
            >
              <Maximize2 size={24} />
            </Button>
          </Tooltip>
        </div>

        <Tooltip content="End Call" position="top">
          <Button
            variant="danger"
            size="lg"
            onClick={onEndCall}
            className={styles.endCallButton}
          >
            <PhoneOff size={24} />
            <span>End Call</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
