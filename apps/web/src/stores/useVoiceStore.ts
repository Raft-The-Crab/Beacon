import { create } from 'zustand'

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

  setUserId: (userId: string | null) => void

  setVoiceState: (userId: string, voiceState: VoiceState) => void
  removeVoiceState: (userId: string) => void
  getChannelVoiceMembers: (channelId: string) => VoiceState[]

  setConnectedChannel: (channelId: string | null) => void
  setCurrentVoiceState: (state: VoiceState | null) => void

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

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  userId: null,
  voiceUsers: new Map(),
  connectedVoiceChannelId: null,
  currentVoiceState: null,
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

  setSelfMute: (muted) =>
    set(state => ({
      currentVoiceState: state.currentVoiceState ? { ...state.currentVoiceState, selfMute: muted } : null
    })),

  setSelfDeaf: (deafened) =>
    set(state => ({
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
  // Adding new actions as per the user's snippet.
  // Note: `isVideoEnabled` and `localStream` are not part of the initial state or interface.
  // If they are meant to be state properties, they should be added to the VoiceStore interface and initialized.
  setVideoEnabled: (enabled: boolean) => { /* This action would typically update a state property like `isVideoEnabled` */ },
  setLocalStream: (stream: MediaStream | null) => { /* This action would typically update a state property like `localStream` */ },

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
      newVoiceUsers.set(userId, { ...vs, audioLevel: level })
      return { voiceUsers: newVoiceUsers }
    }),

  resetStore: () => set({
    voiceUsers: new Map(),
    connectedVoiceChannelId: null,
    currentVoiceState: null,
    typingUsers: new Set(),
  })
}));
