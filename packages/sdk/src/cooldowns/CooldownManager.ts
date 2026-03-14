/**
 * CooldownManager — Per-user, per-command cooldown enforcement with TTL cleanup.
 * Supports bucket modes: user, channel, guild, or global.
 */

export type CooldownScope = 'user' | 'channel' | 'guild' | 'global';

export interface CooldownOptions {
  /** Duration in milliseconds */
  duration: number;
  /** How many uses are allowed before the cooldown kicks in, default 1 */
  maxUses?: number;
  /** Controls whose activity triggers the cooldown, default 'user' */
  scope?: CooldownScope;
}

interface BucketEntry {
  uses: number;
  expiresAt: number;
}

export class CooldownManager {
  private buckets = new Map<string, BucketEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this._cleanup(), cleanupIntervalMs);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  /**
   * Check if an action is on cooldown.
   * Returns the remaining milliseconds if on cooldown, or 0 if allowed.
   */
  check(
    commandId: string,
    ctx: { userId?: string; channelId?: string; guildId?: string },
    options: CooldownOptions
  ): number {
    const key = this._key(commandId, ctx, options.scope ?? 'user');
    const maxUses = options.maxUses ?? 1;
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.buckets.set(key, { uses: 1, expiresAt: now + options.duration });
      return 0;
    }

    if (entry.uses < maxUses) {
      entry.uses++;
      return 0;
    }

    return entry.expiresAt - now;
  }

  /**
   * Manually reset the cooldown for a key.
   */
  reset(commandId: string, ctx: { userId?: string; channelId?: string; guildId?: string }, scope: CooldownScope = 'user') {
    this.buckets.delete(this._key(commandId, ctx, scope));
  }

  /**
   * Reset all cooldowns for a specific user across all commands.
   */
  resetUser(userId: string) {
    for (const key of this.buckets.keys()) {
      if (key.includes(`:user:${userId}`)) this.buckets.delete(key);
    }
  }

  /** Destroy the cleanup timer (call when shutting down). */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }

  private _key(
    commandId: string,
    ctx: { userId?: string; channelId?: string; guildId?: string },
    scope: CooldownScope
  ): string {
    switch (scope) {
      case 'global': return `${commandId}:global`;
      case 'guild': return `${commandId}:guild:${ctx.guildId ?? 'dm'}`;
      case 'channel': return `${commandId}:channel:${ctx.channelId ?? 'unknown'}`;
      default: return `${commandId}:user:${ctx.userId ?? 'unknown'}`;
    }
  }

  private _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.buckets) {
      if (entry.expiresAt <= now) this.buckets.delete(key);
    }
  }
}
