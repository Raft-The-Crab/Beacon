import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Monitor, Users, Maximize2, Radio } from 'lucide-react'
import { Avatar, Tooltip } from '../ui'
import { useAuthStore } from '../../stores/useAuthStore'

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
  const { user } = useAuthStore()
  const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)
  
  const [showParticipants, setShowParticipants] = useState(false)
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [noiseCancellation, setNoiseCancellation] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  
  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const animationRef = useRef<number | undefined>(undefined)

  // Media Capture (Mic & Cam)
  useEffect(() => {
    let activeStream: MediaStream | null = null

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video' && isVideoOn,
          audio: true // Always get audio to test speaking/mute
        })
        activeStream = stream
        streamRef.current = stream

        if (localVideoRef.current && isVideoOn && callType === 'video') {
          localVideoRef.current.srcObject = stream
        }

        // Set up audio analyzer
        const AudioContextClass = (window.AudioContext as any) || (window as any).webkitAudioContext
        if (AudioContextClass && !isMuted) {
          const ctx: AudioContext = new AudioContextClass()
          audioContextRef.current = ctx
          const analyser = ctx.createAnalyser()
          analyserRef.current = analyser
          const source = ctx.createMediaStreamSource(stream)
          source.connect(analyser)
          analyser.fftSize = 256
          const bufferLength = analyser.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>

          const updateAudioParams = () => {
            if (!analyserRef.current || !dataArrayRef.current) return
            analyserRef.current.getByteFrequencyData(dataArrayRef.current as any)
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArrayRef.current[i]
            }
            const avg = sum / bufferLength
            setIsSpeakingLocal(avg > 10) // Threshold for speaking
            animationRef.current = requestAnimationFrame(updateAudioParams)
          }
          updateAudioParams()
        }

        // Handle logical mute state (do not send audio)
        stream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted
        })

      } catch (err) {
        console.error('Failed to get media:', err)
      }
    }

    initMedia()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop())
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
      }
      setIsSpeakingLocal(false)
    }
  }, [callType, isVideoOn, isMuted])

  // Screen Share Capture
  useEffect(() => {
    if (!isScreenSharing) {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop())
            screenStreamRef.current = null
        }
        return
    }

    navigator.mediaDevices.getDisplayMedia({ 
        video: { 
            frameRate: hasBeaconPlus ? { ideal: 60, max: 60 } : { ideal: 30, max: 30 },
            width: hasBeaconPlus ? { ideal: 1920 } : { ideal: 1280 },
            height: hasBeaconPlus ? { ideal: 1080 } : { ideal: 720 }
        }, 
        audio: true 
    })
      .then(stream => {
        screenStreamRef.current = stream
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream
        }
        stream.getVideoTracks()[0].onended = () => {
          onToggleScreenShare() 
        }
      })
      .catch(err => {
        console.error("Screen share error", err)
        onToggleScreenShare() // Turn off if permission denied
      })

    return () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop())
            screenStreamRef.current = null
        }
    }
  }, [isScreenSharing, hasBeaconPlus, onToggleScreenShare])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  const controlBase = 'inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-100 transition hover:-translate-y-0.5 hover:bg-white/10'

  const localCardClasses = `relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-zinc-900/70 p-5 ${isSpeakingLocal ? 'border-(--beacon-brand) ring-2 ring-indigo-400/35' : 'border-white/15'}`

  return (
    <div className="relative flex h-full min-h-140 flex-col overflow-hidden rounded-2xl bg-(--bg-primary) text-white" ref={containerRef}>
      
      <div className={`grid flex-1 overflow-auto p-4 gap-4 ${isScreenSharing ? 'grid-cols-1 grid-rows-[1fr_auto]' : 'auto-rows-fr'}`}>
        
        {isScreenSharing && (
          <div className="relative overflow-hidden rounded-2xl border border-(--beacon-brand) ring-2 ring-indigo-400/25 bg-black shadow-xl flex items-center justify-center min-h-[40vh]">
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg flex items-center gap-2">
              <Monitor size={16} />
              You are sharing your screen
              <span className="ml-2 rounded bg-black/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                {hasBeaconPlus ? '1080p 60FPS' : '720p 30FPS'}
              </span>
            </div>
            {!hasBeaconPlus && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg font-medium shadow-lg flex items-center gap-2 text-xs border border-white/10 hover:bg-white/10 cursor-pointer transition">
                 Upgrade to Beacon+ for 1080p 60FPS
              </div>
            )}
          </div>
        )}

        <div className={`grid gap-4 ${isScreenSharing ? 'grid-cols-2 lg:grid-cols-4 h-48 auto-rows-fr' : callType === 'voice' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr p-6' : 'grid-cols-1 md:grid-cols-2 auto-rows-fr'}`}>
          {/* Local User */}
          {callType === 'video' ? (
            <div className={`relative aspect-video overflow-hidden rounded-2xl border bg-(--bg-secondary) shadow-xl flex items-center justify-center ${isSpeakingLocal ? 'border-(--beacon-brand) ring-2 ring-indigo-400/35' : 'border-white/10'}`}>
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-zinc-900 to-zinc-800">
                  <Avatar src={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined} alt="You" size="xl" />
                  <span className="text-lg font-bold tracking-tight">You</span>
                </div>
              )}
              {isMuted && (
                <div className="absolute bottom-3 left-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/45 text-rose-400 backdrop-blur">
                  <MicOff size={16} />
                </div>
              )}
            </div>
          ) : (
            <div className={localCardClasses}>
              <Avatar src={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined} alt="You" size="xl" />
              <span className="text-sm font-semibold">You</span>
              {isMuted && <MicOff size={18} className="absolute right-3 top-3 text-rose-400" />}
            </div>
          )}

          {/* Remote Participants */}
          {participants.map((participant) => (
            callType === 'video' ? (
               <div
                key={participant.id}
                className={`relative aspect-video overflow-hidden rounded-2xl border bg-(--bg-secondary) shadow-xl flex items-center justify-center ${participant.isSpeaking ? 'border-(--beacon-brand) ring-2 ring-indigo-400/35' : 'border-white/10'}`}
              >
                {participant.isVideoOn ? (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-900 to-zinc-800">
                    <span>📹 Video Stream</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-zinc-900 to-zinc-800">
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
            ) : (
               <div
                key={participant.id}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-zinc-900/70 p-5 ${participant.isSpeaking ? 'border-(--beacon-brand) ring-2 ring-indigo-400/35' : 'border-white/15'}`}
              >
                <Avatar src={participant.avatar} alt={participant.username} size="xl" />
                <span className="text-sm font-semibold">{participant.username}</span>
                {participant.isMuted && <MicOff size={18} className="absolute right-3 top-3 text-rose-400" />}
              </div>
            )
          ))}
        </div>
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
              <Avatar src={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined} alt="You" size="sm" />
              <span className="flex-1 text-sm font-medium">You</span>
              {isMuted && <MicOff size={16} className="text-rose-400" />}
            </div>
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Avatar src={participant.avatar} alt={participant.username} size="sm" />
                <span className="flex-1 text-sm">{participant.username}</span>
                {participant.isMuted && <MicOff size={16} className="text-rose-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl z-30">
        <div className="flex gap-2">
          <Tooltip content={isMuted ? 'Unmute' : 'Mute'} position="top">
            <button
              onClick={onToggleMute}
              className={`${controlBase} ${isMuted ? 'border-rose-400/50 bg-rose-500/25 text-rose-200 hover:bg-rose-500/35' : ''}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </Tooltip>

          {callType === 'video' && (
            <Tooltip content={isVideoOn ? 'Stop Video' : 'Start Video'} position="top">
              <button
                onClick={onToggleVideo}
                className={`${controlBase} ${!isVideoOn ? 'border-zinc-400/50 bg-zinc-500/25 text-zinc-200' : ''}`}
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
            </Tooltip>
          )}

          <Tooltip content={isScreenSharing ? "Stop Sharing" : "Screen Share"} position="top">
            <button
              onClick={onToggleScreenShare}
              className={`${controlBase} ${isScreenSharing ? 'border-indigo-300/40 bg-indigo-500/25 text-indigo-100 hover:bg-indigo-500/35' : ''}`}
            >
              <Monitor size={24} />
            </button>
          </Tooltip>

          <Tooltip content={noiseCancellation ? "Crystal Clear Audio Active (Beacon+)" : "Enable Noise Cancellation (Beacon+)"} position="top">
            <button
              onClick={() => {
                if (hasBeaconPlus) setNoiseCancellation(!noiseCancellation)
              }}
              className={`${controlBase} ${noiseCancellation ? 'border-amber-300/40 bg-amber-500/25 text-amber-100' : ''} ${!hasBeaconPlus && 'opacity-50 cursor-not-allowed'}`}
            >
              <Radio size={24} />
            </button>
          </Tooltip>

          <div className="w-px h-8 bg-white/10 mx-2 my-auto" />

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
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/85 px-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            <PhoneOff size={24} />
            <span>End Call</span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
