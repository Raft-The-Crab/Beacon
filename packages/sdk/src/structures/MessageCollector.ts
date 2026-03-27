import { EventEmitter } from 'eventemitter3';
import { Message } from './Message';
import type { Client } from '../client';

export interface MessageCollectorOptions {
  filter?: (message: Message) => boolean;
  max?: number;
  time?: number;
}

export class MessageCollector extends EventEmitter {
  public readonly client: Client;
  public readonly channelId: string;
  public readonly options: MessageCollectorOptions;
  private _collectedCount = 0;
  private _ended = false;
  private _timer: NodeJS.Timeout | null = null;

  constructor(client: Client, channelId: string, options: MessageCollectorOptions = {}) {
    super();
    this.client = client;
    this.channelId = channelId;
    this.options = options;

    if (options.time) {
      this._timer = setTimeout(() => this.stop('time'), options.time);
    }

    this._setupListener();
  }

  private _setupListener() {
    const listener = (msg: Message) => {
      if (this._ended) return;
      if (msg.channelId !== this.channelId) return;

      // User-defined filter
      if (this.options.filter && !this.options.filter(msg)) return;

      this._collectedCount++;
      this.emit('collect', msg);

      if (this.options.max && this._collectedCount >= this.options.max) {
        this.stop('max');
      }
    };

    this.client.on('messageCreate', listener);
    this.once('end', () => this.client.off('messageCreate', listener));
  }

  public stop(reason = 'user') {
    if (this._ended) return;
    this._ended = true;

    if (this._timer) clearTimeout(this._timer);
    this.emit('end', reason);
  }

  /** Wait for the collector to finish and return all collected messages. */
  public async await(): Promise<Message[]> {
    return new Promise((resolve) => {
      const collected: Message[] = [];
      this.on('collect', (m) => collected.push(m));
      this.once('end', () => resolve(collected));
    });
  }
}
