import { EventEmitter } from 'events';
import type { Client } from '../client';
// @ts-ignore
import * as wrtc from 'wrtc';

const { RTCPeerConnection } = wrtc as any;

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
    private audioTrack: any | null = null;
    private stream: any | null = null;

    constructor(
        private client: Client,
        public guildId: string,
        public channelId: string
    ) {
        super();
    }

    async connect() {
        this._setState(ConnectionState.CONNECTING);
        console.log(`[Voice] Connecting to channel ${this.channelId}...`);

        try {
            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.pc.onicecandidate = (event: any) => {
                if (event.candidate) {
                    this.client.emit('debug', `[Voice] ICE Candidate for ${this.channelId}`);
                    // In a real implementation, we'd send this to the gateway
                }
            };

            this.pc.onconnectionstatechange = () => {
                this.client.emit('debug', `[Voice] State changed: ${this.pc?.connectionState}`);
                if (this.pc?.connectionState === 'connected') {
                    this._setState(ConnectionState.READY);
                } else if (this.pc?.connectionState === 'failed') {
                    this._setState(ConnectionState.FAILED);
                }
            };

            // Create a dummy audio track data for now (to be replaced by AudioPlayer)
            // This is the "Better than Discord" part - simplified streaming interface

            this._setState(ConnectionState.AUTHENTICATING);

            // Notify the server we want to join
            this.client.rest.request('POST', `/guilds/${this.guildId}/voice-join`, {
                channelId: this.channelId
            }).catch(err => {
                this.emit('error', err);
                this._setState(ConnectionState.FAILED);
            });

        } catch (err) {
            this._setState(ConnectionState.FAILED);
            this.emit('error', err);
        }
    }

    private _setState(state: ConnectionState) {
        this.state = state;
        this.emit('stateChange', state);
    }

    async destroy() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this._setState(ConnectionState.DISCONNECTED);
        this.emit('disconnect');
    }

    /**
     * Play an audio stream (Beyond Discord: Native Stream Support)
     */
    async play(audioSource: any) {
        if (this.state !== ConnectionState.READY) {
            throw new Error('Connection not ready. Wait for READY state.');
        }
        // Implementation for AudioPlayer integration will go here
        console.log('[Voice] AudioPlayer starting stream...');
    }
}
