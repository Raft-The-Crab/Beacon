import { EventEmitter } from 'eventemitter3';
import { InteractionContext } from './InteractionContext';
import type { Client } from '../client';

export interface InteractionCollectorOptions {
  filter?: (interaction: InteractionContext) => boolean;
  max?: number;
  time?: number;
  messageId?: string;
  channelId?: string;
}

export class InteractionCollector extends EventEmitter {
  public readonly client: Client;
  public readonly options: InteractionCollectorOptions;
  private _collectedCount = 0;
  private _ended = false;
  private _timer: NodeJS.Timeout | null = null;

  constructor(client: Client, options: InteractionCollectorOptions = {}) {
    super();
    this.client = client;
    this.options = options;

    if (options.time) {
      this._timer = setTimeout(() => this.stop('time'), options.time);
    }

    this._setupListener();
  }

  private _setupListener() {
    const listener = (ctx: InteractionContext) => {
      if (this._ended) return;

      // Filter by channel/message if provided
      if (this.options.channelId && ctx.channelId !== this.options.channelId) return;
      if (this.options.messageId && (ctx as any)._raw?.message?.id !== this.options.messageId) return;

      // User-defined filter
      if (this.options.filter && !this.options.filter(ctx)) return;

      this._collectedCount++;
      this.emit('collect', ctx);

      if (this.options.max && this._collectedCount >= this.options.max) {
        this.stop('max');
      }
    };

    this.client.on('interactionCreate', listener);
    this.once('end', () => this.client.off('interactionCreate', listener));
  }

  public stop(reason = 'user') {
    if (this._ended) return;
    this._ended = true;

    if (this._timer) clearTimeout(this._timer);
    this.emit('end', reason);
  }

  /** Wait for the collector to finish and return all collected interactions. */
  public async await(): Promise<InteractionContext[]> {
    return new Promise((resolve) => {
      const collected: InteractionContext[] = [];
      this.on('collect', (ctx) => collected.push(ctx));
      this.once('end', () => resolve(collected));
    });
  }
}
