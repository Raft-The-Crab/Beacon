import { EventEmitter } from 'events';
import SimplePeer from 'simple-peer';
import { wsClient } from './websocket';
import { useVoiceStore } from '../stores/useVoiceStore';

export interface RemoteUserStream {
  userId: string;
  stream: MediaStream;
}

class VoiceManagerClass extends EventEmitter {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private currentGuildId: string | null = null;
  private currentChannelId: string | null = null;

  // Pillar III: Advanced RTC Infrastructure
  private audioCtx: AudioContext | null = null;
  private localAnalyzer: AnalyserNode | null = null;
  private remoteAnalyzers: Map<string, AnalyserNode> = new Map();
  private animationId: number | null = null;

  constructor() {
    super();
    this.setupSignaling();
  }

  private setupSignaling() {
    wsClient.on('WEBRTC_SIGNAL', (event) => {
      const { senderUserId, signal } = event.data;
      const peer = this.peers.get(senderUserId);
      if (peer) {
        peer.signal(signal);
      } else {
        this.createPeer(senderUserId, false, signal);
      }
    });

    wsClient.on('VOICE_STATE_UPDATE', (event) => {
      const { user_id, channel_id, guild_id } = event.data;
      const myUserId = useVoiceStore.getState().userId;

      if (user_id === myUserId) return;

      if (guild_id === this.currentGuildId && channel_id === this.currentChannelId) {
        if (!this.peers.has(user_id)) {
          this.createPeer(user_id, true);
        }
      } else {
        this.destroyPeer(user_id);
      }
    });
  }

  private createPeer(userId: string, initiator: boolean, incomingSignal?: any) {
    if (!this.localStream) return;

    console.log(`[VoiceManager] Creating peer for ${userId} (initiator: ${initiator})`);

    const peer = new SimplePeer({
      initiator,
      stream: this.localStream,
      trickle: false,
    });

    peer.on('signal', (signal) => {
      wsClient.sendWebRTCSignal(userId, signal);
    });

    peer.on('stream', (stream) => {
      console.log(`[VoiceManager] Received stream from ${userId}`);
      this.attachAnalyzer(userId, stream);
      this.emit('user-stream', { userId, stream });
    });

    peer.on('close', () => this.destroyPeer(userId));
    peer.on('error', (err) => {
      console.error(`[VoiceManager] Peer error for ${userId}:`, err);
      this.destroyPeer(userId);
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    this.peers.set(userId, peer);
    return peer;
  }

  private destroyPeer(userId: string) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
      this.remoteAnalyzers.delete(userId);
      this.emit('user-left', userId);
    }
  }

  async joinChannel(guildId: string, channelId: string, options: {
    mute?: boolean;
    deaf?: boolean;
    video?: boolean;
  } = {}): Promise<void> {

    if (this.currentGuildId) {
      await this.leaveChannel();
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        },
        video: options.video || false
      });

      this.initAudioContext();
      this.localAnalyzer = this.audioCtx!.createAnalyser();
      const source = this.audioCtx!.createMediaStreamSource(this.localStream);
      source.connect(this.localAnalyzer);

      this.startAnalysisLoop();

      this.localStream.getAudioTracks().forEach(t => t.enabled = !options.mute);

      this.currentGuildId = guildId;
      this.currentChannelId = channelId;

      wsClient.sendVoiceStateUpdate(guildId, channelId, options);
      this.emit('connected', { guildId, channelId });

    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Microphone/camera access denied');
    }
  }

  async leaveChannel(): Promise<void> {
    if (!this.currentGuildId) return;

    wsClient.sendVoiceStateUpdate(this.currentGuildId, null);
    this.peers.forEach((_, userId) => this.destroyPeer(userId));

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.remoteAnalyzers.clear();
    this.localAnalyzer = null;

    const guildId = this.currentGuildId;
    this.currentGuildId = null;
    this.currentChannelId = null;
    this.emit('disconnected', { guildId });
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private attachAnalyzer(userId: string, stream: MediaStream) {
    this.initAudioContext();
    const analyzer = this.audioCtx!.createAnalyser();
    analyzer.fftSize = 256;
    const source = this.audioCtx!.createMediaStreamSource(stream);
    source.connect(analyzer);
    this.remoteAnalyzers.set(userId, analyzer);
  }

  private startAnalysisLoop() {
    if (this.animationId) return;

    const update = () => {
      const dataArray = new Uint8Array(128);

      if (this.localAnalyzer) {
        this.localAnalyzer.getByteFrequencyData(dataArray);
        const level = this.calculateLevel(dataArray);
        const myUserId = useVoiceStore.getState().userId;
        if (myUserId) useVoiceStore.getState().setUserAudioLevel(myUserId, level);
      }

      this.remoteAnalyzers.forEach((analyzer, userId) => {
        analyzer.getByteFrequencyData(dataArray);
        const level = this.calculateLevel(dataArray);
        useVoiceStore.getState().setUserAudioLevel(userId, level);
      });

      this.animationId = requestAnimationFrame(update);
    };

    update();
  }

  private calculateLevel(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }

  setMute(guildId: string, mute: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = !mute);
    }
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { mute });
  }

  setDeaf(guildId: string, deaf: boolean): void {
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { deaf });
    this.emit('deafenStateChange', { guildId, deaf });
  }

  setVideo(guildId: string, enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => track.enabled = enabled);
    }
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: enabled });
  }

  async startScreenShare(guildId: string): Promise<void> {
    console.warn('[VoiceManager] startScreenShare not fully implemented in stub', guildId);
  }
}

export const voiceManager = new VoiceManagerClass();
