import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VoiceState {
  guildId: string;
  channelId: string | null;
  userId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  selfVideo: boolean;
  selfStream: boolean;
  selfScreen: boolean;
  speaking: boolean;
  isBeaconPlus?: boolean;
  position?: { x: number; y: number; z: number };
  audioLevel?: number;
}

interface VoiceStore {
  userId: string | null
  voiceUsers: Map<string, VoiceState>
  connectedVoiceChannelId: string | null
  currentVoiceState: VoiceState | null
  selfMute: boolean
  selfDeaf: boolean
  incomingCall: { callerId: string; callerName: string; callerAvatar?: string; callType: 'voice' | 'video'; channelId: string } | null

  setUserId: (userId: string | null) => void

  setVoiceState: (userId: string, voiceState: VoiceState) => void
  removeVoiceState: (userId: string) => void
  getChannelVoiceMembers: (channelId: string) => VoiceState[]

  setConnectedChannel: (channelId: string | null) => void
  setCurrentVoiceState: (state: VoiceState | null) => void
  setIncomingCall: (call: VoiceStore['incomingCall']) => void

  setSelfMute: (muted: boolean) => void
  setSelfDeaf: (deafened: boolean) => void
  setSelfVideo: (video: boolean) => void
  setSelfScreen: (screen: boolean) => void

  bandwidthMode: 'low' | 'balanced' | 'high'
  videoQuality: '480p' | '720p' | '1080p' | '1440p' | '4k'
  frameRate: 15 | 30 | 60
  setBandwidthMode: (mode: 'low' | 'balanced' | 'high') => void
  setVideoQuality: (quality: '480p' | '720p' | '1080p' | '1440p' | '4k') => void
  setFrameRate: (rate: 15 | 30 | 60) => void

  typingUsers: Set<string>
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  isUserTyping: (userId: string) => boolean

  setUserPosition: (userId: string, x: number, y: number, z: number) => void
  setUserAudioLevel: (userId: string, level: number) => void
  resetStore: () => void
}

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set, get) => ({
      userId: null,
      voiceUsers: new Map(),
      connectedVoiceChannelId: null,
      currentVoiceState: null,
      selfMute: false,
      selfDeaf: false,
      incomingCall: null,
      bandwidthMode: 'balanced',
      videoQuality: '720p',
      frameRate: 30,
      typingUsers: new Set(),

      setUserId: (userId: string | null) => set({ userId }),

      setVoiceState: (userId, voiceState) =>
        set((state) => {
          const newVoiceUsers = new Map(state.voiceUsers)
          newVoiceUsers.set(userId, voiceState)
          return { voiceUsers: newVoiceUsers }
        }),

      removeVoiceState: (userId) =>
        set((state) => {
          const newVoiceUsers = new Map(state.voiceUsers)
          newVoiceUsers.delete(userId)
          return { voiceUsers: newVoiceUsers }
        }),

      getChannelVoiceMembers: (channelId) => {
        return Array.from(get().voiceUsers.values()).filter((vs) => vs.channelId === channelId)
      },

      setConnectedChannel: (channelId) =>
        set({ connectedVoiceChannelId: channelId }),

      setCurrentVoiceState: (state) => set({ currentVoiceState: state }),

      setIncomingCall: (call) => set({ incomingCall: call }),

      setSelfMute: (muted) =>
        set(state => ({
          selfMute: muted,
          currentVoiceState: state.currentVoiceState ? { ...state.currentVoiceState, selfMute: muted } : null
        })),

      setSelfDeaf: (deafened) =>
        set(state => ({
          selfDeaf: deafened,
          currentVoiceState: state.currentVoiceState ? { ...state.currentVoiceState, selfDeaf: deafened } : null
        })),

      setSelfVideo: (video) =>
        set(state => ({
          currentVoiceState: state.currentVoiceState ? { ...state.currentVoiceState, selfVideo: video } : null
        })),

      setSelfScreen: (screen) =>
        set(state => ({
          currentVoiceState: state.currentVoiceState ? { ...state.currentVoiceState, selfScreen: screen } : null
        })),

      setBandwidthMode: (mode) => set({ bandwidthMode: mode }),
      setVideoEnabled: (enabled: boolean) => { },
      setLocalStream: (stream: MediaStream | null) => { },

      setVideoQuality: (quality) => set({ videoQuality: quality }),
      setFrameRate: (rate) => set({ frameRate: rate }),

      addTypingUser: (userId) =>
        set((state) => {
          const newTypingUsers = new Set(state.typingUsers)
          newTypingUsers.add(userId)
          return { typingUsers: newTypingUsers }
        }),

      removeTypingUser: (userId) =>
        set((state) => {
          const newTypingUsers = new Set(state.typingUsers)
          newTypingUsers.delete(userId)
          return { typingUsers: newTypingUsers }
        }),

      isUserTyping: (userId: string) => {
        return get().typingUsers.has(userId)
      },

      setUserPosition: (userId, x, y, z) =>
        set((state) => {
          const vs = state.voiceUsers.get(userId)
          if (!vs) return state
          const newVoiceUsers = new Map(state.voiceUsers)
          newVoiceUsers.set(userId, { ...vs, position: { x, y, z } })
          return { voiceUsers: newVoiceUsers }
        }),

      setUserAudioLevel: (userId, level) =>
        set((state) => {
          const vs = state.voiceUsers.get(userId)
          if (!vs) return state

          // Throttle: Only update if change is significant (> 1%)
          const currentLevel = vs.audioLevel || 0
          if (Math.abs(currentLevel - level) < 0.01) return state

          const newVoiceUsers = new Map(state.voiceUsers)
          // Auto-toggle speaking state based on audio level threshold
          const speaking = level > 0.05
          newVoiceUsers.set(userId, { ...vs, audioLevel: level, speaking })

          // Also update currentVoiceState if it's the current user
          let nextCurrentVoiceState = state.currentVoiceState
          if (userId === state.userId && state.currentVoiceState) {
            nextCurrentVoiceState = { ...state.currentVoiceState, audioLevel: level, speaking }
          }

          return {
            voiceUsers: newVoiceUsers,
            currentVoiceState: nextCurrentVoiceState
          }
        }),

      resetStore: () => set({
        voiceUsers: new Map(),
        connectedVoiceChannelId: null,
        currentVoiceState: null,
        typingUsers: new Set(),
      })
    }),
    {
      name: 'beacon:voice',
      partialize: (state) => ({
        selfMute: state.selfMute,
        selfDeaf: state.selfDeaf,
      }),
    }
  )
)
