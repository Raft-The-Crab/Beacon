/**
 * TTLCache — Time-to-live aware LRU cache backed by a Map.
 * Drop-in replacement for plain Map usage where entries expire.
 */

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private store = new Map<K, Entry<V>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private cleanupTimer: ReturnType<typeof setInterval>;

  /**
   * @param defaultTTL - Default TTL in milliseconds (0 = infinite)
   * @param maxSize    - Maximum number of entries; oldest evicted first
   */
  constructor(defaultTTL = 300_000, maxSize = 10_000) {
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.cleanupTimer = setInterval(() => this._cleanup(), Math.min(defaultTTL || 60_000, 60_000));
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  set(key: K, value: V, ttl?: number): this {
    const expiresAt = ttl !== undefined
      ? (ttl === 0 ? Infinity : Date.now() + ttl)
      : (this.defaultTTL === 0 ? Infinity : Date.now() + this.defaultTTL);

    // Evict oldest if over capacity
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }

    this.store.set(key, { value, expiresAt });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Remaining TTL for a key in milliseconds, or -1 if absent/expired. */
  ttl(key: K): number {
    const entry = this.store.get(key);
    if (!entry) return -1;
    if (entry.expiresAt === Infinity) return Infinity;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -1;
  }

  /** Extend TTL for an existing key without changing the value. */
  touch(key: K, ttl?: number): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    const addMs = ttl !== undefined ? ttl : this.defaultTTL;
    entry.expiresAt = addMs === 0 ? Infinity : Date.now() + addMs;
    return true;
  }

  forEach(cb: (value: V, key: K) => void): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > now) cb(entry.value, key);
    }
  }

  keys(): IterableIterator<K> {
    return this.store.keys();
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.store.clear();
  }

  private _cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}
