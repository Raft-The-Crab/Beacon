function trimTrailingSlashes(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.location.origin
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function toAbsoluteUrl(value: string): string {
  const origin = getBrowserOrigin()
  if (!origin || !value.startsWith('/')) {
    return value
  }

  return `${origin}${value}`
}

export function resolveApiBaseUrl(rawUrl?: string): string {
  const configured = trimTrailingSlashes(rawUrl || '')

  if (!configured) {
    // Smart localhost detection: auto-target local API in dev mode
    if (typeof window !== 'undefined' && isLocalDevHost(window.location.hostname)) {
      return '/api'
    }
    return 'https://api.beacon.qzz.io/api'
  }

  const absolute = toAbsoluteUrl(configured)
  return /\/api$/i.test(absolute) ? absolute : `${absolute}/api`
}

export function resolveWebSocketUrl(rawUrl?: string, apiUrl?: string): string {
  const configured = trimTrailingSlashes(rawUrl || '')

  if (configured) {
    if (/^wss?:\/\//i.test(configured)) {
      return configured
    }

    const absolute = toAbsoluteUrl(configured)
    if (/^https?:\/\//i.test(absolute)) {
      const wsBase = absolute.replace(/^http/i, 'ws')
      return /\/gateway$/i.test(wsBase) ? wsBase : `${wsBase}/gateway`
    }

    return absolute
  }

  const apiBase = trimTrailingSlashes(apiUrl || '')
  if (apiBase) {
    const absoluteApiBase = toAbsoluteUrl(apiBase)
    if (/^https?:\/\//i.test(absoluteApiBase)) {
      return absoluteApiBase.replace(/^http/i, 'ws').replace(/\/api$/i, '/gateway')
    }
  }

  if (typeof window !== 'undefined') {
    if (isLocalDevHost(window.location.hostname)) {
      return '/gateway'
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/gateway`
  }

  return 'ws://localhost:8080/gateway'
}

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return ''
  
  // Handle absolute URLs, data URIs, and blobs
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  
  // Handle protocol-relative URLs
  if (url.startsWith('//')) {
    return `https:${url}`
  }

  // Handle server-relative URLs
  const base = API_BASE_URL.replace(/\/api$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  
  // If base is empty (local relative path), just return the path
  if (!base) return path
  
  // Return absolute URL relative to API base
  return `${base}${path}`
}

const isLocal = typeof window !== 'undefined' && isLocalDevHost(window.location.hostname)

const envApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_BACKEND_URL
const envWsUrl = (import.meta as any).env?.VITE_GATEWAY_URL

const configuredApiUrl = envApiUrl || '/api'

// CRITICAL: If no explicit gateway URL is set, derive it from the API URL.
// This prevents the WS URL from defaulting to the frontend CDN domain
// (e.g. beacon.qzz.io/gateway) which doesn't support WebSocket upgrades.
// Instead, it will correctly resolve to wss://beacon-v1-api.up.railway.app/gateway
const configuredWsUrl = envWsUrl || undefined

export const API_BASE_URL = resolveApiBaseUrl(configuredApiUrl)
export const WS_BASE_URL = resolveWebSocketUrl(configuredWsUrl, configuredApiUrl)