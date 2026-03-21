import EventEmitter from 'eventemitter3';
import { Client } from '../client';
import { InteractionContext } from './InteractionContext';

export interface ModalCollectorOptions {
  filter?: (interaction: InteractionContext) => boolean;
  time?: number;
  max?: number;
}

export class ModalCollector extends EventEmitter {
  public readonly client: Client;
  public readonly options: ModalCollectorOptions;
  private _collected = 0;
  private _timeout: NodeJS.Timeout | null = null;

  constructor(client: Client, options: ModalCollectorOptions = {}) {
    super();
    this.client = client;
    this.options = options;

    if (options.time) {
      this._timeout = setTimeout(() => this.stop('time'), options.time);
    }

    this._onInteraction = this._onInteraction.bind(this);
    this.client.on('interactionCreate', this._onInteraction);
  }

  private _onInteraction(interaction: InteractionContext) {
    if (interaction.type !== 5) return; // MODAL_SUBMIT

    if (this.options.filter && !this.options.filter(interaction)) return;

    this._collected++;
    this.emit('collect', interaction);

    if (this.options.max && this._collected >= this.options.max) {
      this.stop('limit');
    }
  }

  public stop(reason = 'user') {
    if (this._timeout) clearTimeout(this._timeout);
    this.client.removeListener('interactionCreate', this._onInteraction);
    this.emit('end', { reason, collected: this._collected });
  }
}
