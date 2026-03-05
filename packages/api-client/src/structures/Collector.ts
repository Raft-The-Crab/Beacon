/**
 * Collector — Await messages or reactions matching a filter
 */
import { EventEmitter } from 'events';

export interface CollectorOptions<T> {
  filter?: (item: T) => boolean;
  time?: number;       // ms timeout
  max?: number;        // max items to collect
  errors?: string[];   // emit error if these events fire
}

export class Collector<T> extends EventEmitter {
  private collected: T[] = [];
  private ended = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<CollectorOptions<T>>;

  constructor(options: CollectorOptions<T> = {}) {
    super();
    this.options = {
      filter: options.filter ?? (() => true),
      time: options.time ?? 60000,
      max: options.max ?? Infinity,
      errors: options.errors ?? [],
    };

    if (this.options.time > 0) {
      this.timer = setTimeout(() => this.stop('time'), this.options.time);
    }
  }

  /** Feed an item into the collector */
  collect(item: T): boolean {
    if (this.ended) return false;
    if (!this.options.filter(item)) return false;

    this.collected.push(item);
    this.emit('collect', item);

    if (this.collected.length >= this.options.max) {
      this.stop('limit');
    }
    return true;
  }

  /** Stop collecting */
  stop(reason = 'manual') {
    if (this.ended) return;
    this.ended = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.options.errors.includes(reason)) {
      this.emit('error', new Error(`Collector ended with reason: ${reason}`));
    }

    this.emit('end', this.collected, reason);
  }

  /** Wait until collector ends */
  await(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.once('end', (collected) => resolve(collected));
      this.once('error', reject);
    });
  }

  get items(): T[] {
    return [...this.collected];
  }

  get count(): number {
    return this.collected.length;
  }

  get isEnded(): boolean {
    return this.ended;
  }
}
