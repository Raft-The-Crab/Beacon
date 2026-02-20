import { EventEmitter } from 'events';
import { Readable } from 'stream';
// @ts-ignore
import OpusScript from 'opus-script';

export class AudioPlayer extends EventEmitter {
    private encoder: any;
    private _status: 'idle' | 'playing' | 'paused' = 'idle';
    private _queue: Array<any> = [];

    constructor() {
        super();
        // Simplified Opus Engine — "Our own opus" approach
        this.encoder = new OpusScript(48000, 2);
    }

    /**
     * Play a stream or buffer
     */
    async play(source: Readable | Buffer) {
        console.log('[AudioPlayer] Starting playback...');
        this._status = 'playing';
        this.emit('start');

        if (source instanceof Buffer) {
            this._processBuffer(source);
        } else if (source instanceof Readable) {
            source.on('data', (chunk: Buffer) => this._processBuffer(chunk));
            source.on('end', () => this._handleEnd());
        }
    }

    private _processBuffer(buffer: Buffer) {
        // 1. Chunkify buffer into 20ms frames
        // 2. Encode with OpusScript
        // 3. Emit 'packet' event for VoiceConnection to pick up
        try {
            // Very simplified encoding loop for demonstration
            const encoded = this.encoder.encode(buffer, 960); // 960 samples @ 48kHz = 20ms
            this.emit('packet', encoded);
        } catch (err) {
            this.emit('error', err);
        }
    }

    private _handleEnd() {
        this._status = 'idle';
        this.emit('end');
    }

    get status() {
        return this._status;
    }

    stop() {
        this._status = 'idle';
        this.emit('stop');
    }
}
