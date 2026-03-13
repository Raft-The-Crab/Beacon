import type { HTTPClient } from './HTTPClient'
import type { User, ApiResponse } from '../types'

/**
 * Authentication API
 */
export class AuthAPI {
  constructor(private client: HTTPClient) {}

  private extractAccessToken(data: any): string | undefined {
    return data?.accessToken || data?.token
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>> {
    const response = await this.client.post<{ user: User; accessToken: string; refreshToken?: string }>('/auth/login', {
      email,
      password
    })

    if (response.success && response.data) {
      const accessToken = this.extractAccessToken(response.data)
      if (accessToken) {
        this.client.setToken(accessToken)
      }
    }

    return response
  }

  /**
   * Register a new account
   */
  async register(
    email: string,
    username: string,
    password: string
  ): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>> {
    const response = await this.client.post<{ user: User; accessToken: string; refreshToken?: string }>('/auth/register', {
      email,
      username,
      password
    })

    if (response.success && response.data) {
      const accessToken = this.extractAccessToken(response.data)
      if (accessToken) {
        this.client.setToken(accessToken)
      }
    }

    return response
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    // Server does not expose a logout endpoint; clear local auth state.
    this.client.setToken('')
    return { success: true }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.client.get<User>('/auth/me')
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken?: string }>> {
    const response = await this.client.post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
      refreshToken
    })

    if (response.success && response.data) {
      const accessToken = this.extractAccessToken(response.data)
      if (accessToken) {
        this.client.setToken(accessToken)
      }
    }

    return response
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return this.client.post<void>('/auth/forgot-password', { email })
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.client.post<void>('/auth/reset-password', {
      token,
      password: newPassword
    })
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.client.post<void>('/auth/verify-email', { token })
  }
}
