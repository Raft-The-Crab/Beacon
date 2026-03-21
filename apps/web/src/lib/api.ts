import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { APIResponse } from 'beacon-sdk'
import { API_BASE_URL } from '../config/endpoints'

const API_URL = API_BASE_URL
let csrfBootstrapPromise: Promise<void> | null = null

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
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

function getAuthToken(): string | null {
  return (
    localStorage.getItem('beacon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  )
}

async function ensureCsrfToken(): Promise<void> {
  const existingToken = getCookie('csrf_token')
  if (existingToken) return
  if (csrfBootstrapPromise) return csrfBootstrapPromise

  csrfBootstrapPromise = fetch(`${API_URL}/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      csrfBootstrapPromise = null
    })

  return csrfBootstrapPromise
}

// Request interceptor
api.interceptors.request.use(async (config: any) => {
  const token = getAuthToken()
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  const method = (config.method || 'get').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    await ensureCsrfToken()
  }

  // Add CSRF token if available
  const csrfToken = getCookie('csrf_token')
  if (csrfToken) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('x-csrf-token', csrfToken)
    } else {
      config.headers = config.headers || {}
      config.headers['x-csrf-token'] = csrfToken
    }
  }

  return config
})

// Response interceptor with retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // If the backend wrapped this in our standard APIResponse, unwrap it for raw Axios users.
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if ('data' in response.data) {
        response.data = response.data.data
      } else {
        response.data = undefined
      }
    }
    return response
  },
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
        localStorage.removeItem('beacon_token')
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

      await new Promise(resolve => setTimeout(resolve, (retryConfig.retryDelay as number) * (config._retry as number)))
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
  _retryConfig?: Partial<RetryConfig>
): Promise<APIResponse<T>> {
  try {
    const resolvedConfig = _retryConfig
      ? {
          ...config,
          _retryConfig: {
            ...defaultRetryConfig,
            ..._retryConfig,
          },
        }
      : config

    const response = await api.request(resolvedConfig as AxiosRequestConfig)
    // The interceptor already unwrapped `response.data`. We re-wrap it to maintain the APIResponse contract.
    return { success: true, data: response.data as T }
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
