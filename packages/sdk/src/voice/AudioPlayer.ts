import EventEmitter from 'eventemitter3';
import * as streamModule from 'stream';
const Readable = streamModule.Readable || (globalThis as any).Readable || Object;
// @ts-ignore
import OpusScript from 'opusscript';

export type AudioPlayerStatus = 'idle' | 'playing' | 'paused' | 'buffering';

export interface AudioResource {
  stream: typeof Readable | any;
  metadata?: any;
  silencePadding?: boolean;
}

export class AudioPlayer extends EventEmitter {
  private encoder: any;
  private _status: AudioPlayerStatus = 'idle';
  private _volume = 1.0;
  private _paused = false;
  private _currentResource: AudioResource | null = null;
  private _streamSubscription: any = null;

  constructor() {
    super();
    // 48kHz, 2 channels (Stereo)
    this.encoder = new OpusScript(48000, 2);
  }

  /**
   * Play an audio resource
   * @param resource The resource to play (wrapper for a Readable stream)
   */
  public play(resource: AudioResource | typeof Readable | Buffer | any) {
    this.stop();

    if (resource instanceof Buffer) {
      this._currentResource = {
        stream: Readable.from(resource),
      } as AudioResource;
    } else if (resource instanceof Readable) {
      this._currentResource = { stream: resource } as AudioResource;
    } else {
      this._currentResource = resource as AudioResource;
    }

    this._status = 'buffering';
    this.emit('stateChange', { oldStatus: 'idle', newStatus: 'buffering' });

    this._setupStream();
  }

  private _setupStream() {
    if (!this._currentResource) return;

    const stream = this._currentResource.stream;

    const onData = (chunk: Buffer) => {
      if (this._paused) return;
      if (this._status === 'buffering') {
        this._status = 'playing';
        this.emit('stateChange', { oldStatus: 'buffering', newStatus: 'playing' });
        this.emit('start');
      }
      this._processBuffer(chunk);
    };

    const onError = (err: Error) => {
      this.emit('error', err);
      this.stop();
    };

    const onEnd = () => {
      this._handleEnd();
    };

    stream.on('data', onData);
    stream.on('error', onError);
    stream.on('end', onEnd);

    this._streamSubscription = { onData, onError, onEnd };
  }

  /** Set playback volume (0.0 to 1.0) */
  public setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1.0, volume));
    this.emit('volumeChange', this._volume);
  }

  public pause() {
    if (this._status === 'playing' || this._status === 'buffering') {
      const old = this._status;
      this._status = 'paused';
      this._paused = true;
      this.emit('stateChange', { oldStatus: old, newStatus: 'paused' });
      this.emit('pause');
      return true;
    }
    return false;
  }

  public resume() {
    if (this._status === 'paused') {
      this._status = 'playing';
      this._paused = false;
      this.emit('stateChange', { oldStatus: 'paused', newStatus: 'playing' });
      this.emit('resume');
      return true;
    }
    return false;
  }

  public stop() {
    if (this._status === 'idle') return;

    const old = this._status;
    this._cleanup();
    this._status = 'idle';
    this._paused = false;
    this._currentResource = null;

    this.emit('stateChange', { oldStatus: old, newStatus: 'idle' });
    this.emit('stop');
  }

  private _processBuffer(buffer: Buffer) {
    try {
      let pcm = buffer;
      
      // Dynamic volume adjustment (High-End Logic)
      if (this._volume !== 1.0) {
        pcm = Buffer.allocUnsafe(buffer.length);
        for (let i = 0; i < buffer.length; i += 2) {
          const sample = buffer.readInt16LE(i);
          pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(sample * this._volume))), i);
        }
      }

      // Encode to Opus (48kHz, 20ms frame size = 960 samples per channel)
      const encoded = this.encoder.encode(pcm, 960);
      this.emit('packet', encoded);
    } catch (err) {
      this.emit('error', err);
    }
  }

  private _handleEnd() {
    this.emit('finish');
    this.stop();
  }

  private _cleanup() {
    if (this._streamSubscription && this._currentResource) {
      const { onData, onError, onEnd } = this._streamSubscription;
      const stream = this._currentResource.stream;
      stream.removeListener('data', onData);
      stream.removeListener('error', onError);
      stream.removeListener('end', onEnd);
      this._streamSubscription = null;
    }
  }

  get status(): AudioPlayerStatus {
    return this._status;
  }

  get volume(): number {
    return this._volume;
  }

  get playing(): boolean {
    return this._status === 'playing';
  }
}
