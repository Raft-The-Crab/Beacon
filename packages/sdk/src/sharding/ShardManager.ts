/**
 * ShardManager — Spawn and manage multiple Gateway shards for large bots.
 * Each shard gets a slice of guilds. Handles restarts, health checks, and IPC.
 */

import EventEmitter from 'eventemitter3';
import { Gateway, GatewayOptions } from '../gateway';
import { ShardError } from '../errors';

export interface ShardManagerOptions {
  token: string;
  totalShards: number | 'auto';
  gatewayURL?: string;
  apiURL?: string;
  intents?: number;
  /** ms between spawning each shard to avoid rate limits */
  spawnDelay?: number;
  /** Maximum shard restart attempts before giving up */
  maxRestarts?: number;
}

interface ShardState {
  id: number;
  gateway: Gateway;
  status: 'idle' | 'connecting' | 'ready' | 'reconnecting' | 'dead';
  restarts: number;
  readyAt?: number;
  guilds: Set<string>;
}

export class ShardManager extends EventEmitter {
  private shards = new Map<number, ShardState>();
  private options: ShardManagerOptions;
  private totalShards!: number;
  private _spawnDelay: number;
  private _maxRestarts: number;

  constructor(options: ShardManagerOptions) {
    super();
    this.options = options;
    this._spawnDelay = options.spawnDelay ?? 5_500;
    this._maxRestarts = options.maxRestarts ?? 5;
  }

  /** Spawn all shards sequentially. */
  async spawn(): Promise<void> {
    if (this.options.totalShards === 'auto') {
      this.totalShards = await this._fetchRecommendedShardCount();
    } else {
      this.totalShards = this.options.totalShards;
    }

    this.emit('debug', `[ShardManager] Spawning ${this.totalShards} shards`);

    for (let i = 0; i < this.totalShards; i++) {
      await this._spawnShard(i);
      if (i < this.totalShards - 1) {
        await this._sleep(this._spawnDelay);
      }
    }
  }

  /** Send a broadcast to all shards. */
  broadcast(event: string, data?: any): void {
    for (const shard of this.shards.values()) {
      shard.gateway.emit(event, data);
    }
  }

  /** Get a specific shard by ID. */
  getShard(id: number): ShardState | undefined {
    return this.shards.get(id);
  }

  /** Health summary of all shards. */
  get status(): Array<{ id: number; status: ShardState['status']; guilds: number; uptime?: number }> {
    return [...this.shards.values()].map(s => ({
      id: s.id,
      status: s.status,
      guilds: s.guilds.size,
      uptime: s.readyAt ? Date.now() - s.readyAt : undefined,
    }));
  }

  /** Total guild count across all shards. */
  get guildCount(): number {
    let total = 0;
    for (const s of this.shards.values()) total += s.guilds.size;
    return total;
  }

  /** Destroy all shards gracefully. */
  destroy(): void {
    for (const shard of this.shards.values()) {
      try { shard.gateway.disconnect(); } catch {}
      shard.status = 'dead';
    }
    this.shards.clear();
  }

  /** Number of shards that are in ready state. */
  get readyCount(): number {
    return [...this.shards.values()].filter(s => s.status === 'ready').length;
  }

  private async _spawnShard(id: number): Promise<void> {
    const gatewayOpts: GatewayOptions = {
      token: this.options.token,
      url: this.options.gatewayURL,
      intents: this.options.intents,
    };

    const gateway = new Gateway(gatewayOpts);

    const state: ShardState = {
      id,
      gateway,
      status: 'idle',
      restarts: 0,
      guilds: new Set(),
    };

    this.shards.set(id, state);
    this._wireShardEvents(state);

    state.status = 'connecting';
    gateway.connect();
  }

  private _wireShardEvents(shard: ShardState): void {
    const { gateway } = shard;

    gateway.on('ready', () => {
      shard.status = 'ready';
      shard.readyAt = Date.now();
      shard.restarts = 0;
      this.emit('shardReady', shard.id);
      this.emit('debug', `[Shard ${shard.id}] Ready`);

      // Once all shards are ready, emit allShardsReady
      if (this.readyCount === this.totalShards) {
        this.emit('allShardsReady');
      }
    });

    gateway.on('disconnect', () => {
      shard.status = 'reconnecting';
      this.emit('shardDisconnect', shard.id);
    });

    gateway.on('guildCreate', (guild: any) => {
      shard.guilds.add(guild.id);
      this.emit('guildCreate', guild, shard.id);
    });

    gateway.on('guildDelete', (guild: any) => {
      shard.guilds.delete(guild.id);
      this.emit('guildDelete', guild, shard.id);
    });

    gateway.on('error', async (err: Error) => {
      this.emit('shardError', shard.id, err);

      if (shard.restarts >= this._maxRestarts) {
        shard.status = 'dead';
        const shardErr = new ShardError(shard.id, `Max restarts (${this._maxRestarts}) exceeded: ${err.message}`);
        this.emit('shardDead', shard.id, shardErr);
        return;
      }

      shard.restarts++;
      shard.status = 'reconnecting';
      this.emit('debug', `[Shard ${shard.id}] Restarting (attempt ${shard.restarts}/${this._maxRestarts})`);

      await this._sleep(2_000 * shard.restarts);
      gateway.connect();
    });

    // Forward all events with shard context
    gateway.onAny((event: string, ...args: any[]) => {
      // Avoid infinite loops if we ever emit on the gateway itself
      if (['debug', 'packet'].includes(event)) return;
      this.emit(event, ...args, shard.id);
    });
  }

  private async _fetchRecommendedShardCount(): Promise<number> {
    try {
      const apiURL = this.options.apiURL || 'https://beacon-v1-api.up.railway.app/api';
      const response = await fetch(`${apiURL}/gateway/bot`, {
        headers: { 'Authorization': `Bot ${this.options.token}` }
      });
      if (!response.ok) throw new Error(`Gateway API returned ${response.status}`);
      const data = await response.json();
      return data.shards || 1;
    } catch (err) {
      this.emit('debug', `[ShardManager] Failed to fetch recommended shards: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
