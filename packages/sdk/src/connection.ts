function trimTrailingSlashes(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

function getGlobalProcess(): { env?: Record<string, string | undefined> } | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined
  }

  return (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process
}

function getBrowserOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.location.origin
}

function isProductionLike(): boolean {
  const env = getGlobalProcess()?.env?.NODE_ENV
  return env === 'production'
}

function fallbackApiBaseUrl(): string {
  const origin = getBrowserOrigin()
  if (origin) {
    return `${origin}/api`
  }

  // Default to Railway production to ensure out-of-the-box connectivity
  return 'https://beacon-v1-api.up.railway.app/api'
}

function fallbackGatewayUrl(): string {
  const origin = getBrowserOrigin()
  if (origin) {
    const wsOrigin = origin.replace(/^http/i, 'ws')
    return `${wsOrigin}/gateway`
  }

  return 'wss://beacon-v1-api.up.railway.app/gateway'
}

export function resolveApiClientBaseUrl(rawUrl?: string): string {
  const configured = trimTrailingSlashes(
    rawUrl ||
      getGlobalProcess()?.env?.BEACON_API_URL ||
      (typeof window !== 'undefined' ? (window as typeof window & { BEACON_API_URL?: string }).BEACON_API_URL : '') ||
      ''
  )

  if (!configured) {
    return fallbackApiBaseUrl()
  }

  const origin = getBrowserOrigin()
  const absolute = configured.startsWith('/') && origin ? `${origin}${configured}` : configured
  return /\/api$/i.test(absolute) ? absolute : `${absolute}/api`
}

export function resolveApiClientGatewayUrl(rawUrl?: string, apiUrl?: string): string {
  const configured = trimTrailingSlashes(
    rawUrl ||
      getGlobalProcess()?.env?.BEACON_GATEWAY_URL ||
      (typeof window !== 'undefined' ? (window as typeof window & { BEACON_GATEWAY_URL?: string }).BEACON_GATEWAY_URL : '') ||
      ''
  )

  if (configured) {
    if (/^wss?:\/\//i.test(configured)) {
      return configured
    }

    if (/^https?:\/\//i.test(configured)) {
      const wsBase = configured.replace(/^http/i, 'ws')
      return /\/gateway$/i.test(wsBase) ? wsBase : `${wsBase}/gateway`
    }

    const origin = getBrowserOrigin()
    return origin ? `${origin.replace(/^http/i, 'ws')}${configured}` : configured
  }

  const resolvedApiUrl = trimTrailingSlashes(apiUrl || resolveApiClientBaseUrl())
  if (/^https?:\/\//i.test(resolvedApiUrl)) {
    return resolvedApiUrl.replace(/^http/i, 'ws').replace(/\/api$/i, '/gateway')
  }

  return fallbackGatewayUrl()
}
