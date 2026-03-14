import { BeaconClient, resolveApiClientBaseUrl, resolveApiClientGatewayUrl } from 'beacon-sdk'
import type { Client } from 'beacon-sdk'

export interface BeaconSdkServerConfig {
  apiUrl: string
  wsUrl: string
}

export function resolveServerSdkConfig(): BeaconSdkServerConfig {
  const rawApi = process.env.BEACON_API_URL
    || process.env.API_URL
    || (process.env.RAILWAY_ENVIRONMENT_NAME ? 'https://beacon-v1-api.up.railway.app/api' : 'https://api.beacon.qzz.io/api')
  const rawGateway = process.env.BEACON_GATEWAY_URL || process.env.GATEWAY_URL

  const apiUrl = resolveApiClientBaseUrl(rawApi)
  const wsUrl = resolveApiClientGatewayUrl(rawGateway, apiUrl)

  return { apiUrl, wsUrl }
}

export function createServerBeaconClient(token?: string): BeaconClient {
  const cfg = resolveServerSdkConfig()
  return new BeaconClient({
    apiUrl: cfg.apiUrl,
    wsUrl: cfg.wsUrl,
    token,
    reconnect: true,
    reconnectAttempts: 10,
    reconnectDelay: 2000,
    requestTimeout: 20000,
    userAgent: 'BeaconServerSDK/1.0',
  })
}

export async function createBotRuntimeClient(token: string): Promise<Client> {
  const { Client: BotClient } = await import('beacon-sdk')
  const cfg = resolveServerSdkConfig()

  return new BotClient({
    token,
    apiURL: cfg.apiUrl,
    gatewayURL: cfg.wsUrl,
  })
}
