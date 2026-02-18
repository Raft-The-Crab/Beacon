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
}

interface VoiceStore {
  voiceUsers: Map<string, VoiceState> 
  connectedVoiceChannelId: string | null
  currentVoiceState: VoiceState | null
  
  setVoiceState: (userId: string, voiceState: VoiceState) => void
  removeVoiceState: (userId: string) => void
  getChannelVoiceMembers: (channelId: string) => VoiceState[]
  
  setConnectedChannel: (channelId: string | null) => void
  setCurrentVoiceState: (state: VoiceState | null) => void
  
  setSelfMute: (muted: boolean) => void
  setSelfDeaf: (deafened: boolean) => void
  setSelfVideo: (video: boolean) => void

  typingUsers: Set<string> 
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  isUserTyping: (userId: string) => boolean
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  voiceUsers: new Map(),
  connectedVoiceChannelId: null,
  currentVoiceState: null,
  typingUsers: new Set(),

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

  isUserTyping: (userId) => {
    return get().typingUsers.has(userId)
  },
}))
