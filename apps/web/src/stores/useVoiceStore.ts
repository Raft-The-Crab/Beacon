import { create } from 'zustand'

export interface VoiceState {
  guildId: string;
  channelId: string | null;
  userId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  selfVideo: boolean;
  selfStream: boolean;
  speaking: boolean;
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

  bandwidthMode: 'low' | 'balanced' | 'high'
  setBandwidthMode: (mode: 'low' | 'balanced' | 'high') => void

  typingUsers: Set<string>
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  isUserTyping: (userId: string) => boolean

  setUserPosition: (userId: string, x: number, y: number, z: number) => void
  setUserAudioLevel: (userId: string, level: number) => void
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  userId: null,
  voiceUsers: new Map(),
  connectedVoiceChannelId: null,
  currentVoiceState: null,
  bandwidthMode: 'balanced',
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

  setBandwidthMode: (mode) => set({ bandwidthMode: mode }),

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
      const newVoiceUsers = new Map(state.voiceUsers)
      newVoiceUsers.set(userId, { ...vs, audioLevel: level })
      return { voiceUsers: newVoiceUsers }
    }),
}))
