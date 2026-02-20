import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import type { APIResponse } from '@beacon/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

interface RetryConfig {
  retries: number
  retryDelay: number
  retryCondition?: (error: AxiosError) => boolean
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600)
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Add CSRF token if available
  const csrfToken = getCookie('csrf_token')
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken
  }
  
  return config
})

// Response interceptor with retry logic
api.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number; _retryConfig?: RetryConfig }
    
    if (!config) {
      return Promise.reject(error)
    }

    const retryConfig = config._retryConfig || defaultRetryConfig
    config._retry = config._retry || 0

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Retry logic
    if (
      config._retry < retryConfig.retries &&
      retryConfig.retryCondition &&
      retryConfig.retryCondition(error)
    ) {
      config._retry++
      console.log(`Retrying request (${config._retry}/${retryConfig.retries})...`)
      
      await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * config._retry))
      return api.request(config)
    }

    return Promise.reject(error)
  }
)

// Helper to get cookie
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

// Typed API wrapper
export async function apiRequest<T = any>(
  config: AxiosRequestConfig,
  retryConfig?: Partial<RetryConfig>
): Promise<APIResponse<T>> {
  try {
    const response = await api.request<APIResponse<T>>({
      ...config,
      _retryConfig: { ...defaultRetryConfig, ...retryConfig } as any
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.error || error.message || 'An error occurred',
          details: error.response?.data
        }
      }
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  }
}
