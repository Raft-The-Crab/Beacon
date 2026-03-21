import EventEmitter from 'eventemitter3';
import type { Client } from '../client';
import { AudioPlayer } from './AudioPlayer';
import { VoiceInteraction } from './VoiceInteraction';
import type { Readable } from 'stream';

let cachedRTCPeerConnection: any | null | undefined;

function getRTCPeerConnectionCtor() {
    if (cachedRTCPeerConnection !== undefined) {
        return cachedRTCPeerConnection;
    }

    // 1. Check if we're in a browser (Native RTCPeerConnection)
    if (typeof window !== 'undefined' && (window as any).RTCPeerConnection) {
        cachedRTCPeerConnection = (window as any).RTCPeerConnection;
        return cachedRTCPeerConnection;
    }

    // 2. Check for global RTCPeerConnection (e.g. newer Node.js or polyfilled environments)
    if (typeof global !== 'undefined' && (global as any).RTCPeerConnection) {
        cachedRTCPeerConnection = (global as any).RTCPeerConnection;
        return cachedRTCPeerConnection;
    }

    // 3. Fallback to optional 'wrtc' dependency for Node.js
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const maybeWrtc = require('wrtc');
        cachedRTCPeerConnection = maybeWrtc?.RTCPeerConnection || maybeWrtc?.default?.RTCPeerConnection || null;
    } catch {
        cachedRTCPeerConnection = null;
    }

    return cachedRTCPeerConnection;
}

export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    AUTHENTICATING = 'authenticating',
    READY = 'ready',
    FAILED = 'failed',
}

export class VoiceConnection extends EventEmitter {
    public state: ConnectionState = ConnectionState.DISCONNECTED;
    private pc: any | null = null;
    private audioPlayer: AudioPlayer | null = null;
    public interaction: VoiceInteraction;
    public ping = -1;

    constructor(
        public readonly client: Client,
        public guildId: string,
        public channelId: string
    ) {
        super();
        this.interaction = new VoiceInteraction(this);
    }

    async connect() {
        if (this.state === ConnectionState.READY) return;
        
        this._setState(ConnectionState.CONNECTING);
        this.client.emit('debug', `[Voice] Connecting to channel ${this.channelId}...`);

        try {
            const RTCPeerConnectionCtor = getRTCPeerConnectionCtor();
            if (!RTCPeerConnectionCtor) {
                throw new Error('Voice requires optional dependency "wrtc". Install it to enable voice features.');
            }

            this.pc = new RTCPeerConnectionCtor({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.pc.onicecandidate = (event: any) => {
                if (event.candidate) {
                    this.client.emit('debug', `[Voice] ICE Candidate for ${this.channelId}`);
                }
            };

            this.pc.onconnectionstatechange = () => {
                const pcState = this.pc?.connectionState;
                this.client.emit('debug', `[Voice] WebRTC State: ${pcState}`);
                
                if (pcState === 'connected') {
                    this._setState(ConnectionState.READY);
                } else if (pcState === 'failed' || pcState === 'closed') {
                    this._setState(ConnectionState.FAILED);
                }
            };

            this._setState(ConnectionState.AUTHENTICATING);

            // Notify server & get join payload
            await this.client.rest.post(`/guilds/${this.guildId}/voice-join`, {
                channelId: this.channelId
            });

        } catch (err) {
            this._setState(ConnectionState.FAILED);
            this.emit('error', err);
            throw err;
        }
    }

    /**
     * Create or get the AudioPlayer for this connection
     */
    player(): AudioPlayer {
        if (!this.audioPlayer) {
            this.audioPlayer = new AudioPlayer();
            this.audioPlayer.on('packet', (packet) => this._sendPacket(packet));
            this.audioPlayer.on('error', (err) => this.emit('error', err));
        }
        return this.audioPlayer;
    }

    private _sendPacket(packet: Buffer) {
        if (this.state !== ConnectionState.READY || !this.pc) return;
        
        // High-End Logic: In WebRTC environments, we use a DataChannel or MediaStreamTrack
        // For custom Opus streaming, we'll emit the packet for the underlying driver
        this.emit('packet', packet);
        
        // Bridge to RTCPeerConnection if a data channel is active
        if (this.pc._dataChannel && this.pc._dataChannel.readyState === 'open') {
            this.pc._dataChannel.send(packet);
        }
    }

    private _setState(state: ConnectionState) {
        if (this.state === state) return;
        const oldState = this.state;
        this.state = state;
        this.emit('stateChange', { oldState, newState: state });
    }

    async destroy() {
        if (this.audioPlayer) {
            this.audioPlayer.stop();
            this.audioPlayer = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this._setState(ConnectionState.DISCONNECTED);
        this.emit('disconnect');
    }

    /**
     * Play an audio stream (Beyond Discord: Simplified native modulation)
     */
    async play(source: Readable | Buffer) {
        return this.player().play(source);
    }

    setMute(muted: boolean) {
        this.client.rest.patch(`/guilds/${this.guildId}/members/@me`, {
            mute: muted
        });
    }

    setDeaf(deafened: boolean) {
        this.client.rest.patch(`/guilds/${this.guildId}/members/@me`, {
            deaf: deafened
        });
    }
}
