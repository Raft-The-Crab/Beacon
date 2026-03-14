/**
 * Collection<K, V> — Enhanced Map with utility methods and LRU cache limits
 * Similar to Discord.js Collection, but memory-safe for edge environments
 */
export class Collection<K, V> extends Map<K, V> {
  public maxSize?: number;

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries);
  }

  /** Set maximum cache size before oldest entries are evicted */
  setMaxSize(size: number): this {
    this.maxSize = size;
    return this;
  }

  /** Set an item, automatically evicting the oldest if over capacity */
  set(key: K, value: V): this {
    super.set(key, value);
    if (this.maxSize !== undefined && this.size > this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) this.delete(firstKey);
    }
    return this;
  }
  /** Return first value matching predicate */
  find(predicate: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (predicate(val, key, this)) return val;
    }
    return undefined;
  }

  /** Filter into a new Collection */
  filter(predicate: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const result = new Collection<K, V>();
    if (this.maxSize) result.setMaxSize(this.maxSize);
    for (const [key, val] of this) {
      if (predicate(val, key, this)) result.set(key, val);
    }
    return result;
  }

  /** Map values into a new array */
  map<T>(transform: (value: V, key: K, collection: this) => T): T[] {
    const result: T[] = [];
    for (const [key, val] of this) {
      result.push(transform(val, key, this));
    }
    return result;
  }

  /** Reduce into a single value */
  reduce<T>(reducer: (accumulator: T, value: V, key: K, collection: this) => T, initial: T): T {
    let acc = initial;
    for (const [key, val] of this) {
      acc = reducer(acc, val, key, this);
    }
    return acc;
  }

  /** Check if some values match predicate */
  some(predicate: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (predicate(val, key, this)) return true;
    }
    return false;
  }

  /** Check if every value matches predicate */
  every(predicate: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (!predicate(val, key, this)) return false;
    }
    return true;
  }

  /** Get first N values */
  first(count?: number): V | V[] | undefined {
    if (count === undefined) {
      return this.values().next().value;
    }
    return [...this.values()].slice(0, count);
  }

  /** Get last N values */
  last(count?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (count === undefined) return arr[arr.length - 1];
    return arr.slice(-count);
  }

  /** Random value */
  random(): V | undefined {
    const arr = [...this.values()];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Convert to plain array */
  toArray(): V[] {
    return [...this.values()];
  }

  /** Convert to JSON-safe object */
  toJSON(): Record<string, V> {
    const obj: Record<string, V> = {};
    for (const [key, val] of this) {
      obj[String(key)] = val;
    }
    return obj;
  }

  /** Clone this collection */
  clone(): Collection<K, V> {
    const cloned = new Collection<K, V>([...this]);
    if (this.maxSize) cloned.setMaxSize(this.maxSize);
    return cloned;
  }

  /** Merge another collection into this one (non-destructive, returns new) */
  concat(...collections: Collection<K, V>[]): Collection<K, V> {
    const result = this.clone();
    for (const col of collections) {
      for (const [key, val] of col) {
        result.set(key, val);
      }
    }
    return result;
  }

  /** Sort into array by comparator */
  sorted(comparator?: (a: V, b: V) => number): V[] {
    return [...this.values()].sort(comparator);
  }
}
