import { BeaconClient, RestClient, resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from 'beacon-sdk'
import { API_BASE_URL, WS_BASE_URL } from '../config/endpoints'

const resolvedApiUrl = resolveApiClientBaseUrl(API_BASE_URL)
const resolvedWsUrl = resolveApiClientGatewayUrl(WS_BASE_URL, resolvedApiUrl)

export function createWebSdkClient(token?: string): BeaconClient {
  return new BeaconClient({
    apiURL: resolvedApiUrl,
    gatewayURL: resolvedWsUrl,
    token: token || '',
    debug: true
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
