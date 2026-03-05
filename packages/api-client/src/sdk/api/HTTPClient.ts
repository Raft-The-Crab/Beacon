import type { BeaconClientOptions, ApiResponse } from '../types'
import { AuthenticationError, RateLimitError, NetworkError, BeaconError } from '../types'
import { APIRateLimiter } from '../utils/RateLimiter'

/**
 * Base HTTP client for API requests
 */
export class HTTPClient {
  private rateLimiter = new APIRateLimiter()
  private token?: string

  constructor(private options: BeaconClientOptions) {
    this.token = options.token
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * Get authentication token
   */
  getToken(): string | undefined {
    return this.token
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.options.apiUrl}${endpoint}`
    const route = this.getRouteKey(method, endpoint)

    // Wait for rate limit if needed
    if (!this.rateLimiter.canMakeRequest(route)) {
      await this.rateLimiter.waitForBucket(route)
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.options.userAgent || 'BeaconSDK/1.0',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...this.options.headers,
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: this.options.requestTimeout
          ? AbortSignal.timeout(this.options.requestTimeout)
          : undefined
      })

      // Update rate limits from headers
      this.rateLimiter.updateFromHeaders(route, response.headers)

      // Handle different status codes
      if (response.status === 401) {
        throw new AuthenticationError('Authentication failed')
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        throw new RateLimitError(
          'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter) * 1000 : undefined
        )
      }

      if (response.status >= 500) {
        throw new BeaconError('Server error', response.status)
      }

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
          code: response.status
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      if (error instanceof BeaconError) {
        throw error
      }

      if ((error as any).name === 'AbortError') {
        throw new NetworkError('Request timeout')
      }

      throw new NetworkError('Network request failed')
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, headers)
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, headers)
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, headers)
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, headers)
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, headers)
  }

  /**
   * Upload file
   */
  async upload<T = any>(endpoint: string, file: File | Blob, additionalData?: any): Promise<ApiResponse<T>> {
    const url = `${this.options.apiUrl}${endpoint}`
    const formData = new FormData()
    
    formData.append('file', file)
    
    if (additionalData) {
      for (const key in additionalData) {
        formData.append(key, additionalData[key])
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': this.options.userAgent || 'BeaconSDK/1.0',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...this.options.headers
        },
        body: formData,
        signal: this.options.requestTimeout
          ? AbortSignal.timeout(this.options.requestTimeout)
          : undefined
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          success: false,
          error: data.error || 'Upload failed',
          code: response.status
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      throw new NetworkError('File upload failed')
    }
  }

  /**
   * Generate route key for rate limiting
   */
  private getRouteKey(method: string, endpoint: string): string {
    // Replace IDs with placeholders for consistent rate limit buckets
    const normalized = endpoint.replace(/\/\d+/g, '/:id')
    return `${method}:${normalized}`
  }
}
