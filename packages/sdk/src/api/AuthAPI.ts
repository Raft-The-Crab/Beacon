import type { HTTPClient } from './HTTPClient'
import type { User, ApiResponse } from '../types'

/**
 * Authentication API
 */
export class AuthAPI {
  constructor(private client: HTTPClient) {}

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post<{ user: User; token: string }>('/auth/login', {
      email,
      password
    })

    if (response.success && response.data) {
      this.client.setToken(response.data.token)
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
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post<{ user: User; token: string }>('/auth/register', {
      email,
      username,
      password
    })

    if (response.success && response.data) {
      this.client.setToken(response.data.token)
    }

    return response
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post<void>('/auth/logout')
    
    if (response.success) {
      this.client.setToken('')
    }

    return response
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
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.client.post<{ token: string }>('/auth/refresh', {
      refreshToken
    })

    if (response.success && response.data) {
      this.client.setToken(response.data.token)
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
