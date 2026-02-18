/**
 * VoiceManager - Client-side voice manager
 */

import { EventEmitter } from 'events';
import SimplePeer from 'simple-peer';

export interface VoiceConnection {
  guildId: string;
  channelId: string;
  userId: string;
  peer: SimplePeer.Instance | null;
  stream: MediaStream | null;
  speaking: boolean;
}

class VoiceManagerClass extends EventEmitter {
  private connections: Map<string, VoiceConnection> = new Map();
  private mediaStream: MediaStream | null = null;

  async joinChannel(guildId: string, channelId: string, options: {
    mute?: boolean;
    deaf?: boolean;
    video?: boolean;
  } = {}): Promise<VoiceConnection> {
    
    const existingConnection = this.connections.get(guildId);
    if (existingConnection) {
      await this.leaveChannel(guildId);
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: !options.mute,
        video: options.video || false
      });
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Microphone/camera access denied');
    }

    const connection: VoiceConnection = {
      guildId,
      channelId,
      userId: '',
      peer: null,
      stream: this.mediaStream,
      speaking: false
    };

    this.connections.set(guildId, connection);
    this.emit('connected', { guildId, channelId });

    return connection;
  }

  async leaveChannel(guildId: string): Promise<void> {
    const connection = this.connections.get(guildId);
    if (!connection) return;

    if (connection.stream) {
      connection.stream.getTracks().forEach(track => track.stop());
    }

    if (connection.peer) {
      connection.peer.destroy();
    }

    this.connections.delete(guildId);
    this.emit('disconnected', { guildId });
  }

  setMute(guildId: string, mute: boolean): void {
    const connection = this.connections.get(guildId);
    if (!connection || !connection.stream) return;

    connection.stream.getAudioTracks().forEach(track => {
      track.enabled = !mute;
    });
  }

  setDeaf(guildId: string, deaf: boolean): void {
    this.emit('deafenStateChange', { guildId, deaf });
  }

  setVideo(guildId: string, enabled: boolean): void {
    const connection = this.connections.get(guildId);
    if (!connection || !connection.stream) return;

    connection.stream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  async startScreenShare(guildId: string): Promise<MediaStream> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });

    this.emit('screenShareStart', { guildId, stream: screenStream });
    return screenStream;
  }

  async stopScreenShare(guildId: string): Promise<void> {
    this.emit('screenShareStop', { guildId });
  }
}

export const voiceManager = new VoiceManagerClass();
