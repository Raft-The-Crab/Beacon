import { BeaconClient, RestClient, resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from 'beacon-sdk/browser'
import { API_BASE_URL, WS_BASE_URL } from '../config/endpoints'

const resolvedApiUrl = resolveApiClientBaseUrl(API_BASE_URL)
const resolvedWsUrl = resolveApiClientGatewayUrl(WS_BASE_URL, resolvedApiUrl)

export function createWebSdkClient(token?: string): BeaconClient {
  return new BeaconClient({
    apiUrl: resolvedApiUrl,
    wsUrl: resolvedWsUrl,
    token,
    reconnect: true,
    reconnectAttempts: 8,
    reconnectDelay: 1500,
    requestTimeout: 15000,
    userAgent: 'BeaconWebSDK/1.0',
  })
}

export function createWebRestClient(token: string): RestClient {
  return new RestClient({
    token,
    baseURL: resolvedApiUrl,
  })
}

export const WEB_SDK_ENDPOINTS = {
  apiUrl: resolvedApiUrl,
  wsUrl: resolvedWsUrl,
}
