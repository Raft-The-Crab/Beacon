import type SimplePeerModule from 'simple-peer';
import SimplePeerBrowser from 'simple-peer/simplepeer.min.js';
import { wsClient } from './websocket';
import { useVoiceStore, type VoiceState } from '../stores/useVoiceStore';

const SimplePeer = SimplePeerBrowser as unknown as typeof SimplePeerModule;

type SimplePeerInstance = InstanceType<typeof SimplePeer>;

export interface RemoteUserStream {
  userId: string;
  stream: MediaStream;
}

type VoiceManagerEvents = {
  'user-stream': RemoteUserStream;
  'user-left': string;
  'connected': { guildId: string; channelId: string };
  'disconnected': { guildId: string };
  'deafenStateChange': { guildId: string; deaf: boolean };
};

class VoiceManagerClass {
  private listeners: Map<keyof VoiceManagerEvents, Set<(payload: any) => void>> = new Map();
  private peers: Map<string, SimplePeerInstance> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentGuildId: string | null = null;
  private currentChannelId: string | null = null;

  // Pillar III: Advanced RTC Infrastructure
  private audioCtx: AudioContext | null = null;
  private localAnalyzer: AnalyserNode | null = null;
  private remoteAnalyzers: Map<string, AnalyserNode> = new Map();
  private animationId: number | null = null;
  private hasWarnedMissingMedia = false;

  private getPeerConnections(): RTCPeerConnection[] {
    return Array.from(this.peers.values())
      .map((peer) => (peer as any)?._pc as RTCPeerConnection | undefined)
      .filter((pc): pc is RTCPeerConnection => !!pc);
  }

  private getVideoSenders(): RTCRtpSender[] {
    return this.getPeerConnections()
      .flatMap((pc) => pc.getSenders())
      .filter((sender) => sender.track?.kind === 'video');
  }

  constructor() {
    this.setupSignaling();
  }

  on<K extends keyof VoiceManagerEvents>(event: K, listener: (payload: VoiceManagerEvents[K]) => void) {
    const listeners = this.listeners.get(event) || new Set();
    listeners.add(listener as (payload: any) => void);
    this.listeners.set(event, listeners);
  }

  off<K extends keyof VoiceManagerEvents>(event: K, listener: (payload: VoiceManagerEvents[K]) => void) {
    this.listeners.get(event)?.delete(listener as (payload: any) => void);
  }

  private emit<K extends keyof VoiceManagerEvents>(event: K, payload: VoiceManagerEvents[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  private buildVoiceState(data: any): VoiceState | null {
    if (!data?.user_id || !data?.guild_id) return null;

    return {
      userId: data.user_id,
      guildId: data.guild_id,
      channelId: data.channel_id ?? null,
      selfMute: !!data.self_mute,
      selfDeaf: !!data.self_deaf,
      selfVideo: !!data.self_video,
      selfStream: !!data.channel_id,
      speaking: false,
    };
  }

  private syncLocalVoiceState(partial: Partial<VoiceState>) {
    const store = useVoiceStore.getState();
    const userId = store.userId;

    if (!userId || !this.currentGuildId) return;

    const nextState: VoiceState = {
      userId,
      guildId: this.currentGuildId,
      channelId: partial.channelId !== undefined ? partial.channelId : this.currentChannelId,
      selfMute: partial.selfMute ?? store.currentVoiceState?.selfMute ?? false,
      selfDeaf: partial.selfDeaf ?? store.currentVoiceState?.selfDeaf ?? false,
      selfVideo: partial.selfVideo ?? store.currentVoiceState?.selfVideo ?? false,
      selfStream: partial.selfStream ?? Boolean(this.localStream),
      speaking: partial.speaking ?? store.currentVoiceState?.speaking ?? false,
      position: partial.position ?? store.currentVoiceState?.position,
      audioLevel: partial.audioLevel ?? store.currentVoiceState?.audioLevel,
    };

    store.setCurrentVoiceState(nextState);
    store.setConnectedChannel(nextState.channelId);
    store.setVoiceState(userId, nextState);
  }

  private applyVoiceStateUpdate(data: any) {
    const store = useVoiceStore.getState();
    const userId = data?.user_id;

    if (!userId) return;

    if (!data.channel_id) {
      store.removeVoiceState(userId);

      if (userId === store.userId) {
        store.setCurrentVoiceState(null);
        store.setConnectedChannel(null);
      } else {
        this.destroyPeer(userId);
      }

      return;
    }

    const voiceState = this.buildVoiceState(data);
    if (!voiceState) return;

    store.setVoiceState(userId, voiceState);

    if (userId === store.userId) {
      store.setCurrentVoiceState(voiceState);
      store.setConnectedChannel(voiceState.channelId);
      return;
    }

    if (voiceState.guildId === this.currentGuildId && voiceState.channelId === this.currentChannelId) {
      if (!this.peers.has(userId)) {
        this.createPeer(userId, true);
      }
    } else {
      this.destroyPeer(userId);
    }
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
      this.applyVoiceStateUpdate(event.data);
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

      this.syncLocalVoiceState({
        selfMute: !!options.mute,
        selfDeaf: !!options.deaf,
        selfVideo: !!options.video,
        selfStream: true,
        speaking: false,
      });

      wsClient.sendVoiceStateUpdate(guildId, channelId, options);
      this.emit('connected', { guildId, channelId });

    } catch (error) {
      // Allow joining in listen-only mode when no capture devices are present.
      if (!this.hasWarnedMissingMedia) {
        console.warn('Failed to get user media, joining without local media stream:', error);
        this.hasWarnedMissingMedia = true;
      }

      this.localStream = new MediaStream();
      this.currentGuildId = guildId;
      this.currentChannelId = channelId;

      this.syncLocalVoiceState({
        selfMute: true,
        selfDeaf: !!options.deaf,
        selfVideo: false,
        selfStream: false,
        speaking: false,
      });

      wsClient.sendVoiceStateUpdate(guildId, channelId, { mute: true, deaf: !!options.deaf, video: false });
      this.emit('connected', { guildId, channelId });
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

    const store = useVoiceStore.getState();
    if (store.userId) {
      store.removeVoiceState(store.userId);
    }
    store.setCurrentVoiceState(null);
    store.setConnectedChannel(null);

    const guildId = this.currentGuildId;
    this.currentGuildId = null;
    this.currentChannelId = null;
    this.hasWarnedMissingMedia = false;
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

  getLocalStream(): MediaStream | null {
    return this.localStream;
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
    this.syncLocalVoiceState({ selfMute: mute });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { mute });
  }

  setDeaf(guildId: string, deaf: boolean): void {
    this.syncLocalVoiceState({ selfDeaf: deaf });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { deaf });
    this.emit('deafenStateChange', { guildId, deaf });
  }

  setVideo(guildId: string, enabled: boolean): void {
    if (!this.localStream) return;

    const existingTrack = this.localStream.getVideoTracks()[0] || null;

    if (!enabled) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      this.syncLocalVoiceState({ selfVideo: false });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false });
      return;
    }

    if (existingTrack) {
      existingTrack.enabled = true;
      this.syncLocalVoiceState({ selfVideo: true });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true });
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((videoStream) => {
      const track = videoStream.getVideoTracks()[0];
      if (!track || !this.localStream) return;

      this.localStream.addTrack(track);

      const peers = this.getPeerConnections();
      const senders = peers.flatMap((pc) => pc.getSenders()).filter((sender) => sender.track?.kind === 'video');
      if (senders.length > 0) {
        senders.forEach((sender) => {
          void sender.replaceTrack(track);
        });
      } else {
        peers.forEach((pc) => {
          pc.addTrack(track, this.localStream as MediaStream);
        });
      }

      this.syncLocalVoiceState({ selfVideo: true });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true });
    }).catch((error) => {
      console.warn('[VoiceManager] Failed to enable camera track:', error);
      this.syncLocalVoiceState({ selfVideo: false });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false });
    });
  }

  async startScreenShare(guildId: string): Promise<void> {
    if (!this.localStream) {
      throw new Error('Not connected to voice');
    }

    const peerConnections = this.getPeerConnections();
    const localVideoSenders = this.getVideoSenders();

    if (this.screenStream) {
      const currentTrack = this.screenStream.getVideoTracks()[0];
      currentTrack?.stop();
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      if (currentTrack && this.localStream.getVideoTracks().includes(currentTrack)) {
        this.localStream.removeTrack(currentTrack);
      }

      const cameraTrack = this.localStream.getVideoTracks()[0] || null;
      if (cameraTrack && localVideoSenders.length > 0) {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(cameraTrack);
        });
      } else {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(null);
        });
      }
      return;
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const displayTrack = displayStream.getVideoTracks()[0];

    if (!displayTrack) {
      throw new Error('No display track available');
    }

    displayTrack.onended = () => {
      if (!this.screenStream) return;
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      if (this.localStream?.getVideoTracks().includes(displayTrack)) {
        this.localStream.removeTrack(displayTrack);
      }

      const cameraTrack = this.localStream?.getVideoTracks()[0] || null;
      if (cameraTrack && localVideoSenders.length > 0) {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(cameraTrack);
        });
      } else {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(null);
        });
      }
    };

    this.screenStream = displayStream;
    this.localStream.addTrack(displayTrack);

    if (localVideoSenders.length > 0) {
      await Promise.all(localVideoSenders.map((sender) => sender.replaceTrack(displayTrack)));
    } else {
      peerConnections.forEach((pc) => {
        pc.addTrack(displayTrack, this.localStream as MediaStream);
      });
    }

    this.syncLocalVoiceState({ selfVideo: true });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true });
  }
}

export const voiceManager = new VoiceManagerClass();
