import React, { useEffect, useRef } from 'react'
import { Phone, Video, X } from 'lucide-react'
import { Modal, Avatar } from '../ui'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useNavigate } from 'react-router-dom'

export function IncomingCallModal() {
  const { incomingCall, setIncomingCall } = useVoiceStore()
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (incomingCall) {
      // Play ringing sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
      audio.loop = true
      audio.play().catch(console.error)
      audioRef.current = audio
    } else {
      audioRef.current?.pause()
    }
    return () => audioRef.current?.pause()
  }, [incomingCall])

  if (!incomingCall) return null

  const handleAccept = () => {
    setIncomingCall(null)
    // Navigate to the channel or voice page
    if (incomingCall.channelId) {
      navigate(`/channels/@me/${incomingCall.channelId}`)
    } else {
      navigate('/voice')
    }
  }

  const handleDecline = () => {
    setIncomingCall(null)
  }

  return (
    <Modal isOpen={true} onClose={handleDecline} size="sm" hideHeader={true} noPadding={true}>
      <div className="relative overflow-hidden p-8 text-center bg-(--bg-secondary) rounded-2xl border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-b from-(--beacon-brand)-muted to-transparent opacity-20" />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
             <div className="absolute inset-0 rounded-full bg-(--beacon-brand) opacity-20 animate-ping" />
             <Avatar src={incomingCall.callerAvatar} alt={incomingCall.callerName} size="xl" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-(--text-primary)">
              {incomingCall.callerName}
            </h2>
            <p className="text-sm text-(--text-muted) flex items-center justify-center gap-2">
              {incomingCall.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
              Incoming {incomingCall.callType} call...
            </p>
          </div>

          <div className="flex w-full gap-3 mt-4">
            <button
              onClick={handleDecline}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-(--text-primary) hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all font-semibold"
            >
              <X size={20} />
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-(--beacon-brand) text-white hover:opacity-90 transition-all shadow-lg font-bold"
            >
              {incomingCall.callType === 'video' ? <Video size={20} /> : <Phone size={20} />}
              Accept
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
