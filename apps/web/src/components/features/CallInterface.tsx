import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Monitor, Users, Maximize2 } from 'lucide-react'
import { Avatar, Tooltip } from '../ui'

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

  const controlBase = 'inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-100 transition hover:-translate-y-0.5 hover:bg-white/10'

  return (
    <div className="relative flex h-full min-h-140 flex-col overflow-hidden rounded-2xl bg-(--bg-primary) text-white" ref={containerRef}>
      <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-2">
        {callType === 'video' ? (
          <>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-(--bg-secondary) shadow-xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-linear-to-br from-zinc-900 to-zinc-800">
                  <Avatar src={undefined} alt="You" size="xl" />
                  <span className="text-lg font-bold tracking-tight">You</span>
                </div>
              )}
              {isMuted && (
                <div className="absolute bottom-3 left-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/45 text-rose-400 backdrop-blur">
                  <MicOff size={16} />
                </div>
              )}
            </div>

            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative aspect-video overflow-hidden rounded-2xl border bg-(--bg-secondary) shadow-xl ${participant.isSpeaking ? 'border-(--beacon-brand) ring-2 ring-indigo-400/35' : 'border-white/10'}`}
              >
                {participant.isVideoOn ? (
                  <div className="h-full w-full">
                    <div className="flex h-full items-center justify-center bg-linear-to-br from-zinc-900 to-zinc-800">
                      <span>📹 Video Stream</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-linear-to-br from-zinc-900 to-zinc-800">
                    <Avatar src={participant.avatar} alt={participant.username} size="xl" />
                    <span className="text-lg font-bold tracking-tight">{participant.username}</span>
                  </div>
                )}
                {participant.isMuted && (
                  <div className="absolute bottom-3 left-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/45 text-rose-400 backdrop-blur">
                    <MicOff size={16} />
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="col-span-full flex flex-wrap items-center justify-center gap-6 p-6">
            <div className={`relative flex min-w-36 flex-col items-center gap-3 rounded-2xl border bg-zinc-900/70 p-5 ${isMuted ? 'border-white/15' : 'border-(--beacon-brand) ring-2 ring-indigo-400/25'}`}>
              <Avatar src={undefined} alt="You" size="xl" />
              <span className="text-sm font-semibold">You</span>
              {isMuted && <MicOff size={18} className="absolute right-2 top-2 text-rose-400" />}
            </div>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative flex min-w-36 flex-col items-center gap-3 rounded-2xl border bg-zinc-900/70 p-5 ${participant.isSpeaking ? 'border-(--beacon-brand) ring-2 ring-indigo-400/25' : 'border-white/15'}`}
              >
                <Avatar
                  src={participant.avatar}
                  alt={participant.username}
                  size="xl"
                />
                <span className="text-sm font-semibold">{participant.username}</span>
                {participant.isMuted && <MicOff size={18} className="absolute right-2 top-2 text-rose-400" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {showParticipants && (
        <div className="absolute right-0 top-0 z-20 flex h-full w-72 flex-col border-l border-white/10 bg-zinc-950/90 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Participants ({participants.length + 1})</h3>
            <button
              className="text-zinc-400 transition hover:text-zinc-100"
              onClick={() => setShowParticipants(false)}
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Avatar src={undefined} alt="You" size="sm" />
              <span className="flex-1 text-sm">You</span>
              {isMuted && <MicOff size={16} />}
            </div>
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Avatar
                  src={participant.avatar}
                  alt={participant.username}
                  size="sm"
                />
                <span className="flex-1 text-sm">{participant.username}</span>
                {participant.isMuted && <MicOff size={16} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-2">
          <Tooltip content={isMuted ? 'Unmute' : 'Mute'} position="top">
            <button
              onClick={onToggleMute}
              className={`${controlBase} ${isMuted ? 'border-rose-400/50 bg-rose-500/25 text-rose-200' : ''}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </Tooltip>

          {callType === 'video' && (
            <Tooltip content={isVideoOn ? 'Stop Video' : 'Start Video'} position="top">
              <button
                onClick={onToggleVideo}
                className={`${controlBase} ${!isVideoOn ? 'border-rose-400/50 bg-rose-500/25 text-rose-200' : ''}`}
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
            </Tooltip>
          )}

          <Tooltip content="Screen Share" position="top">
            <button
              onClick={onToggleScreenShare}
              className={`${controlBase} ${isScreenSharing ? 'border-indigo-300/40 bg-indigo-500/25 text-indigo-100' : ''}`}
            >
              <Monitor size={24} />
            </button>
          </Tooltip>

          <Tooltip content="Settings" position="top">
            <button className={controlBase}>
              <Settings size={24} />
            </button>
          </Tooltip>

          <Tooltip content="Participants" position="top">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`${controlBase} ${showParticipants ? 'border-indigo-300/40 bg-indigo-500/25 text-indigo-100' : ''}`}
            >
              <Users size={24} />
            </button>
          </Tooltip>

          <Tooltip content="Fullscreen" position="top">
            <button
              onClick={toggleFullscreen}
              className={controlBase}
            >
              <Maximize2 size={24} />
            </button>
          </Tooltip>
        </div>

        <Tooltip content="End Call" position="top">
          <button
            onClick={onEndCall}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/85 px-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-500"
          >
            <PhoneOff size={24} />
            <span>End Call</span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
