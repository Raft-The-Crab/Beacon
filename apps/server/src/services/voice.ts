/**
 * Voice Signaling Service (Server-side)
 * Manages voice channel states and signaling relay
 */

import { EventEmitter } from 'events';

export interface VoiceState {
  guildId: string;
  channelId: string;
  userId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  selfVideo: boolean;
  speaking: boolean;
}

export class VoiceManager extends EventEmitter {
  // Map<channelId, Set<userId>>
  private channelMembers: Map<string, Set<string>> = new Map();
  // Map<userId, VoiceState>
  private userStates: Map<string, VoiceState> = new Map();

  setUserState(state: VoiceState): void {
    // Remove from old channel if changed
    const prevState = this.userStates.get(state.userId);
    if (prevState && prevState.channelId !== state.channelId) {
      this.channelMembers.get(prevState.channelId)?.delete(state.userId);
    }

    // Add to new channel
    if (state.channelId) {
      if (!this.channelMembers.has(state.channelId)) {
        this.channelMembers.set(state.channelId, new Set());
      }
      this.channelMembers.get(state.channelId)?.add(state.userId);
    }

    this.userStates.set(state.userId, state);
    this.emit('voiceStateUpdate', state);
  }

  removeUser(userId: string): void {
    const state = this.userStates.get(userId);
    if (state) {
      this.channelMembers.get(state.channelId)?.delete(userId);
      this.userStates.delete(userId);
      this.emit('voiceStateUpdate', { ...state, channelId: null });
    }
  }

  getChannelMembers(channelId: string): string[] {
    return Array.from(this.channelMembers.get(channelId) || []);
  }

  getUserState(userId: string): VoiceState | undefined {
    return this.userStates.get(userId);
  }

  /**
   * Signaling Relay
   * Relay WebRTC signals between users in the same channel
   */
  handleSignaling(fromId: string, toId: string, signal: any): void {
    // This is typically called by the WebSocket Gateway
    // The gateway should verify both users are in the same channel
    this.emit('relaySignal', { fromId, toId, signal });
  }
}

export const voiceManager = new VoiceManager();
