import type SimplePeerModule from 'simple-peer';
import SimplePeerBrowser from 'simple-peer/simplepeer.min.js';
import { wsClient } from './websocket';
import { useAuthStore } from '../stores/useAuthStore';
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

  private getMediaErrorMessage(error: unknown, device: 'microphone' | 'camera' | 'screen'): string {
    const err = error as { name?: string; message?: string };
    const name = err?.name || 'UnknownError';

    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return `Permission denied for ${device}. Please allow browser access and try again.`;
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return `No ${device} device was found on this system.`;
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return `The ${device} is currently unavailable or in use by another app.`;
    }
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return `The requested ${device} settings are not supported on this device.`;
    }

    return err?.message || `Failed to access ${device}.`;
  }

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
      selfScreen: !!data.self_screen,
      speaking: false,
      isBeaconPlus: !!data.is_beacon_plus,
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
      selfScreen: partial.selfScreen ?? store.currentVoiceState?.selfScreen ?? false,
      speaking: partial.speaking ?? store.currentVoiceState?.speaking ?? false,
      isBeaconPlus: partial.isBeaconPlus ?? store.currentVoiceState?.isBeaconPlus ?? (useAuthStore.getState().user as any)?.isBeaconPlus ?? false,
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
      let mediaError: unknown = null;
      const user = useAuthStore.getState().user;
      const isBeaconPlus = (user as any)?.isBeaconPlus;
      const videoConstraints = isBeaconPlus
        ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };

      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: videoConstraints
        });
        console.log(`[VoiceManager] Joined with ${isBeaconPlus ? '1080p 60fps' : '720p 30fps'} (Beacon+: ${isBeaconPlus})`);
      } catch (e) {
        mediaError = e;
        console.warn('[VoiceManager] Audio/Video failed, trying audio-only fallback', e);
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
        } catch (e2) {
          console.warn('[VoiceManager] Audio fallback failed, trying video-only fallback', e2);
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: videoConstraints,
            });
          } catch (vErr) {
            console.warn('[VoiceManager] All media capture failed, falling back to listen-only mode', { mediaError, vErr });
            this.localStream = new MediaStream();
          }
        }
      }

      this.initAudioContext();
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.localAnalyzer = this.audioCtx!.createAnalyser();
        const source = this.audioCtx!.createMediaStreamSource(this.localStream);
        source.connect(this.localAnalyzer);
        this.startAnalysisLoop();
        audioTracks.forEach(t => t.enabled = !options.mute);
      }

      const hasVideoTrack = this.localStream.getVideoTracks().length > 0;
      if (options.video && !hasVideoTrack) {
        // Attempt to upgrade to video if requested but not available in current localStream
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const vTrack = videoStream.getVideoTracks()[0];
          if (vTrack) this.localStream.addTrack(vTrack);
        } catch (vErr) {
          console.warn('[VoiceManager] Video upgrade failed', vErr);
        }
      }

      this.currentGuildId = guildId;
      this.currentChannelId = channelId;

      this.syncLocalVoiceState({
        selfMute: audioTracks.length === 0 ? true : !!options.mute,
        selfDeaf: !!options.deaf,
        selfVideo: this.localStream.getVideoTracks().length > 0 && !!options.video,
        selfStream: true,
        selfScreen: false,
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
        selfScreen: false,
        speaking: false,
      });

      wsClient.sendVoiceStateUpdate(guildId, channelId, { mute: true, deaf: !!options.deaf, video: false });
      this.emit('connected', { guildId, channelId });
    }
  }

  async leaveChannel(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (!this.currentGuildId) {
      // Still clear state even if guildId is missing
      const store = useVoiceStore.getState();
      store.setCurrentVoiceState(null);
      store.setConnectedChannel(null);
      this.currentChannelId = null;
      return;
    }

    wsClient.sendVoiceStateUpdate(this.currentGuildId, null);
    this.peers.forEach((_, userId) => this.destroyPeer(userId));

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

    let lastUpdate = 0;
    const update = (now: number) => {
      // Throttle analysis to ~10 FPS to prevent render bloat
      if (now - lastUpdate < 100) {
        this.animationId = requestAnimationFrame(update);
        return;
      }
      lastUpdate = now;

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

    this.animationId = requestAnimationFrame(update);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private calculateLevel(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }

  async setMute(guildId: string, mute: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error('Not connected to voice');
    }

    const audioTracks = this.localStream.getAudioTracks();

    // If unmuting without an audio track (e.g. initial permission failure),
    // attempt to reacquire mic so voice can recover without rejoining.
    if (!mute && audioTracks.length === 0) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2,
          },
          video: false,
        });

        const micTrack = micStream.getAudioTracks()[0];
        if (!micTrack) {
          throw new Error('No microphone track available.');
        }

        this.localStream.addTrack(micTrack);
        const peers = this.getPeerConnections();
        peers.forEach((pc) => {
          pc.addTrack(micTrack, this.localStream as MediaStream);
        });
      } catch (error) {
        this.syncLocalVoiceState({ selfMute: true });
        wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { mute: true });
        throw new Error(this.getMediaErrorMessage(error, 'microphone'));
      }
    }
    
    audioTracks.forEach((track) => {
      track.enabled = !mute;
    });

    const user = useAuthStore.getState().user;
    const isBeaconPlus = (user as any)?.isBeaconPlus;
    this.syncLocalVoiceState({ selfMute: mute, isBeaconPlus });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { mute, isBeaconPlus } as any);
  }

  setDeaf(guildId: string, deaf: boolean): void {
    const user = useAuthStore.getState().user;
    const isBeaconPlus = (user as any)?.isBeaconPlus;
    this.syncLocalVoiceState({ selfDeaf: deaf, isBeaconPlus });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { deaf, isBeaconPlus } as any);
    this.emit('deafenStateChange', { guildId, deaf });
  }

  async setVideo(guildId: string, enabled: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error('Not connected to voice');
    }

    const existingTrack = this.localStream.getVideoTracks()[0] || null;

    if (!enabled) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      const user = useAuthStore.getState().user;
      const isBeaconPlus = (user as any)?.isBeaconPlus;
      this.syncLocalVoiceState({ selfVideo: false, isBeaconPlus });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false, isBeaconPlus } as any);
      return;
    }

    const user = useAuthStore.getState().user;
    const isBeaconPlus = (user as any)?.isBeaconPlus;

    if (existingTrack) {
      existingTrack.enabled = true;
      this.syncLocalVoiceState({ selfVideo: true, isBeaconPlus });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true, isBeaconPlus } as any);
      return;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      const track = videoStream.getVideoTracks()[0];
      if (!track || !this.localStream) {
        throw new Error('No camera track available.');
      }

      this.localStream.addTrack(track);

      const peers = this.getPeerConnections();
      // Ensure we replace any existing video senders or add a new track
      peers.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          void sender.replaceTrack(track);
        } else {
          pc.addTrack(track, this.localStream as MediaStream);
        }
      });

      this.syncLocalVoiceState({ selfVideo: true, isBeaconPlus });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true, isBeaconPlus } as any);
    } catch (error) {
      console.error('[VoiceManager] setVideo error:', error);
      this.syncLocalVoiceState({ selfVideo: false, isBeaconPlus });
      wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false, isBeaconPlus } as any);
      throw new Error(this.getMediaErrorMessage(error, 'camera'));
    }
  }

  async startScreenShare(guildId: string): Promise<void> {
    if (!this.localStream) {
      throw new Error('Not connected to voice');
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser');
    }

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
      const user = useAuthStore.getState().user;
      const isBeaconPlus = (user as any)?.isBeaconPlus;

      if (cameraTrack && localVideoSenders.length > 0) {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(cameraTrack);
        });
        this.syncLocalVoiceState({ selfVideo: true, isBeaconPlus });
        wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true, isBeaconPlus } as any);
      } else {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(null);
        });
        this.syncLocalVoiceState({ selfVideo: false, selfScreen: false, isBeaconPlus });
        wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false, screen: false, isBeaconPlus } as any);
      }
      return;
    }

    let displayStream: MediaStream;
    try {
      const user = useAuthStore.getState().user;
      const isBeaconPlus = (user as any)?.isBeaconPlus;
      
      const screenConstraints = isBeaconPlus
        ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }; // Keep 1080p for everyone but lower FPS for normal

      displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: screenConstraints, 
        audio: false 
      });
    } catch (error) {
      throw new Error(this.getMediaErrorMessage(error, 'screen'));
    }
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
      const user = useAuthStore.getState().user;
      const isBeaconPlus = (user as any)?.isBeaconPlus;

      if (cameraTrack && localVideoSenders.length > 0) {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(cameraTrack);
        });
        this.syncLocalVoiceState({ selfVideo: true, isBeaconPlus });
        wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true, isBeaconPlus } as any);
      } else {
        localVideoSenders.forEach((sender) => {
          void sender.replaceTrack(null);
        });
        this.syncLocalVoiceState({ selfVideo: false, selfScreen: false, isBeaconPlus });
        wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: false, screen: false, isBeaconPlus } as any);
      }
    };

    this.screenStream = displayStream;
    
    // Replace existing video tracks in localStream with the display track
    this.localStream.getVideoTracks().forEach(t => {
      if (t !== displayTrack) {
        // We don't stop the camera track here, just remove it from the stream
        // so the local <video> element switches to the screen share.
        this.localStream?.removeTrack(t);
      }
    });
    this.localStream.addTrack(displayTrack);

    // Swap all existing video senders to the display track
    const peers = this.getPeerConnections();
    peers.forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      if (videoSender) {
        void videoSender.replaceTrack(displayTrack);
      } else {
        // If no video sender exists, add it
        pc.addTrack(displayTrack, this.localStream as MediaStream);
      }
    });

    const user = useAuthStore.getState().user;
    const isBeaconPlus = (user as any)?.isBeaconPlus;
    this.syncLocalVoiceState({ selfVideo: true, selfScreen: true, isBeaconPlus });
    wsClient.sendVoiceStateUpdate(guildId, this.currentChannelId, { video: true, screen: true, isBeaconPlus } as any);
  }
}

export const voiceManager = new VoiceManagerClass();
