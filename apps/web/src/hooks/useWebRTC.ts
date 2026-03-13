import { useEffect, useRef, useState } from 'react'
import { wsClient } from '../services/websocket'
import { useAuthStore } from '../stores/useAuthStore'

interface PeerConnection {
    connection: RTCPeerConnection
    stream: MediaStream
}

interface WebRTCState {
    localStream: MediaStream | null
    peers: Record<string, PeerConnection>
    joinChannel: (channelId: string) => Promise<void>
    leaveChannel: (channelId: string) => void
    toggleAudio: () => void
    toggleVideo: () => void
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Add TURN servers for production (requires credentials)
        // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ]
}

export function useWebRTC(channelId: string | null): WebRTCState {
    const { user } = useAuthStore()

    // Used for logging/debugging connection intent
    if (channelId) {
        // console.debug(`useWebRTC initialized for channel: ${channelId}`)
    }

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [peers, setPeers] = useState<Record<string, PeerConnection>>({})

    const peersRef = useRef<Record<string, PeerConnection>>({})
    const streamRef = useRef<MediaStream | null>(null)

    // Request native microphone/camera access
    const initializeMedia = async (video: boolean = false) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false
            })
            setLocalStream(stream)
            streamRef.current = stream
            console.log('✅ Media stream initialized:', { audio: true, video })
            return stream
        } catch (err: any) {
            console.error('❌ Failed to get local stream:', err.message)
            // Show user-friendly error
            if (err.name === 'NotAllowedError') {
                console.warn('Microphone/camera permission denied')
            } else if (err.name === 'NotFoundError') {
                console.warn('No microphone/camera found')
            }
            return null
        }
    }

    const createPeerConnection = (targetUserId: string, isInitiator: boolean) => {
        if (peersRef.current[targetUserId]) return peersRef.current[targetUserId].connection

        const pc = new RTCPeerConnection(ICE_SERVERS)

        // Add local tracks to connection
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, streamRef.current!)
            })
        }

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
            setPeers(prev => ({
                ...prev,
                [targetUserId]: {
                    connection: pc,
                    stream: event.streams[0]
                }
            }))
            peersRef.current[targetUserId] = { connection: pc, stream: event.streams[0] }
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                wsClient.sendWebRTCSignal(targetUserId, {
                    type: 'candidate',
                    candidate: event.candidate,
                })
            }
        }

        // If we are the initiator, create the offer
        if (isInitiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    if (pc.localDescription) {
                        wsClient.sendWebRTCSignal(targetUserId, pc.localDescription)
                    }
                })
        }

        // Cleanup on disconnect
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                const newPeers = { ...peersRef.current }
                delete newPeers[targetUserId]
                peersRef.current = newPeers
                setPeers(newPeers)
            }
        }

        return pc
    }

    const joinChannel = async (id: string, guildId?: string) => {
        try {
            const stream = await initializeMedia(false)
            if (!stream) {
                console.error('Cannot join channel: no media stream')
                return
            }

            // Announce presence via WS
            wsClient.sendVoiceStateUpdate(guildId || 'global', id)
            console.log('🔊 Joined voice channel:', id)
        } catch (err) {
            console.error('Failed to join voice channel:', err)
        }
    }

    const leaveChannel = (_id: string, guildId?: string) => {
        wsClient.sendVoiceStateUpdate(guildId || 'global', null)

        // Close all peer connections
        Object.values(peersRef.current).forEach(peer => peer.connection.close())
        peersRef.current = {}
        setPeers({})

        // Stop all local tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
            setLocalStream(null)
        }
    }

    useEffect(() => {
        if (!user) return

        // Another user joined, initiate connection to them
        const onUserJoined = async (event: any) => {
            const { userId } = event?.data || {}
            if (userId === user.id) return
            createPeerConnection(userId, true) // We are the initiator
        }

        // Handle incoming WebRTC signaling data
        const onSignal = async (event: any) => {
            const { senderUserId, signal } = event?.data || {}
            if (senderUserId === user.id) return

            let pc = peersRef.current[senderUserId]?.connection

            if (!pc && signal.type === 'offer') {
                pc = createPeerConnection(senderUserId, false)
            }

            if (!pc) return

            if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                if (pc.localDescription) {
                    wsClient.sendWebRTCSignal(senderUserId, pc.localDescription)
                }
            } else if (signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal))
            } else if (signal.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
            }
        }

        const onUserLeft = (event: any) => {
            const { userId } = event?.data || {}
            if (peersRef.current[userId]) {
                peersRef.current[userId].connection.close()
                const newPeers = { ...peersRef.current }
                delete newPeers[userId]
                peersRef.current = newPeers
                setPeers(newPeers)
            }
        }

        wsClient.on('VOICE_USER_JOINED', onUserJoined)
        wsClient.on('VOICE_USER_LEFT', onUserLeft)
        wsClient.on('WEBRTC_SIGNAL', onSignal)

        return () => {
            wsClient.off('VOICE_USER_JOINED', onUserJoined)
            wsClient.off('VOICE_USER_LEFT', onUserLeft)
            wsClient.off('WEBRTC_SIGNAL', onSignal)
        }
    }, [user])

    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                // Update local store or announce to socket if needed
            }
        }
    }

    const toggleVideo = async () => {
        if (!streamRef.current) return

        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (videoTrack) {
            // If we already have a track, toggle it off
            videoTrack.stop()
            streamRef.current.removeTrack(videoTrack)

            // We'd potentially want to tell peers we dropped video by renegotiating
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                const newTrack = stream.getVideoTracks()[0]
                streamRef.current.addTrack(newTrack)

                // Add to all existing peer connections
                Object.values(peersRef.current).forEach(({ connection }) => {
                    connection.addTrack(newTrack, streamRef.current!)
                })

                // Force renegotiation will happen implicitly or we might need to manually trigger createOffer
                setLocalStream(new MediaStream(streamRef.current.getTracks()))
            } catch (err) {
                console.error('Failed to get video', err)
            }
        }
    }

    return {
        localStream,
        peers,
        joinChannel,
        leaveChannel,
        toggleAudio,
        toggleVideo
    }
}
