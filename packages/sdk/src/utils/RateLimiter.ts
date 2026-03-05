import type { RateLimiter } from '../types'

interface Bucket {
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter for API requests
 */
export class APIRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>()
  private globalBucket?: Bucket

  canMakeRequest(route: string): boolean {
    // Check global rate limit
    if (this.globalBucket) {
      if (this.globalBucket.remaining <= 0 && Date.now() < this.globalBucket.reset) {
        return false
      }
    }

    // Check route-specific rate limit
    const bucket = this.buckets.get(route)
    if (bucket) {
      if (bucket.remaining <= 0 && Date.now() < bucket.reset) {
        return false
      }
    }

    return true
  }

  async waitForBucket(route: string): Promise<void> {
    // Wait for global rate limit
    if (this.globalBucket && this.globalBucket.remaining <= 0) {
      const waitTime = this.globalBucket.reset - Date.now()
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // Wait for route-specific rate limit
    const bucket = this.buckets.get(route)
    if (bucket && bucket.remaining <= 0) {
      const waitTime = bucket.reset - Date.now()
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  updateFromHeaders(route: string, headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit')
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')
    const isGlobal = headers.get('x-ratelimit-global') === 'true'

    if (limit && remaining && reset) {
      const bucket: Bucket = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000 // Convert to milliseconds
      }

      if (isGlobal) {
        this.globalBucket = bucket
      } else {
        this.buckets.set(route, bucket)
      }
    }
  }

  /**
   * Clear all rate limit buckets
   */
  clear(): void {
    this.buckets.clear()
    this.globalBucket = undefined
  }
}
