import type { CacheManager } from '../types'

interface CacheEntry<T> {
  value: T
  expires?: number
}

/**
 * Simple in-memory cache manager with TTL support
 */
export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval?: ReturnType<typeof setInterval>

  constructor(private defaultTTL: number = 300000) { // 5 minutes default
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }

    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expires = ttl !== undefined
      ? Date.now() + ttl
      : this.defaultTTL > 0
      ? Date.now() + this.defaultTTL
      : undefined

    this.cache.set(key, { value, expires })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Destroy the cache manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}
