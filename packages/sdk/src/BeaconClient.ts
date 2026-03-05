import { BeaconEventEmitter } from './BeaconEventEmitter'
import { HTTPClient } from './api/HTTPClient'
import { AuthAPI } from './api/AuthAPI'
import { MessagesAPI } from './api/MessagesAPI'
import { ServersAPI } from './api/ServersAPI'
import { ChannelsAPI } from './api/ChannelsAPI'
import { UsersAPI } from './api/UsersAPI'
import { RolesAPI } from './api/RolesAPI'
import { PresenceAPI } from './api/PresenceAPI'
import { VoiceAPI } from './api/VoiceAPI'
import { WSClient } from './ws/WSClient'
import { MemoryCacheManager } from './utils/CacheManager'
import type { BeaconClientOptions, User, SDKEventMap, CacheManager } from './types'

/**
 * Main Beacon SDK client
 */
export class BeaconClient extends BeaconEventEmitter {
  private httpClient: HTTPClient
  private wsClient: WSClient
  private _cache: CacheManager

  // API modules
  public readonly auth: AuthAPI
  public readonly messages: MessagesAPI
  public readonly servers: ServersAPI
  public readonly channels: ChannelsAPI
  public readonly users: UsersAPI
  public readonly roles: RolesAPI
  public readonly presence: PresenceAPI
  public readonly voice: VoiceAPI

  private currentUser?: User
  private options: Required<BeaconClientOptions>

  constructor(options: BeaconClientOptions) {
    super()

    // Set default options
    this.options = {
      apiUrl: options.apiUrl,
      wsUrl: options.wsUrl,
      token: options.token || '',
      reconnect: options.reconnect !== false,
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 3000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      requestTimeout: options.requestTimeout || 10000,
      debug: options.debug || false,
      headers: options.headers || {},
      userAgent: options.userAgent || 'BeaconSDK/2.5'
    }

    // Initialize cache
    this._cache = new MemoryCacheManager()

    // Initialize HTTP client
    this.httpClient = new HTTPClient(this.options)

    // Initialize WebSocket client
    this.wsClient = new WSClient(this.options, this.options.token, this)

    // Initialize API modules
    this.auth = new AuthAPI(this.httpClient)
    this.messages = new MessagesAPI(this.httpClient)
    this.servers = new ServersAPI(this.httpClient)
    this.channels = new ChannelsAPI(this.httpClient)
    this.users = new UsersAPI(this.httpClient)
    this.roles = new RolesAPI(this.httpClient)
    this.presence = new PresenceAPI(this.httpClient, this.wsClient)
    this.voice = new VoiceAPI(this.httpClient, this.wsClient)

    // Cache user updates
    this.on('userUpdate', (user) => {
      if (user.id === this.currentUser?.id) {
        this.currentUser = user
      }
      this._cache.set(`user:${user.id}`, user)
    })

    // Cache server updates
    this.on('serverUpdate', (server) => {
      this._cache.set(`server:${server.id}`, server)
    })

    // Cache channel updates
    this.on('channelUpdate', (channel) => {
      this._cache.set(`channel:${channel.id}`, channel)
    })

    // Clear caches on server/channel delete
    this.on('serverDelete', (serverId) => {
      this._cache.delete(`server:${serverId}`)
    })

    this.on('channelDelete', (data) => {
      this._cache.delete(`channel:${data.id}`)
    })
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (!this.httpClient.getToken()) {
      throw new Error('Not authenticated. Please login first.')
    }

    await this.wsClient.connect()
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.wsClient.disconnect()
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    const response = await this.auth.login(email, password)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed')
    }

    this.currentUser = response.data.user
    this.httpClient.setToken(response.data.token)
    this.wsClient = new WSClient(this.options, response.data.token, this)

    return response.data.user
  }

  /**
   * Register a new account
   */
  async register(email: string, username: string, password: string): Promise<User> {
    const response = await this.auth.register(email, username, password)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed')
    }

    this.currentUser = response.data.user
    this.httpClient.setToken(response.data.token)
    this.wsClient = new WSClient(this.options, response.data.token, this)

    return response.data.user
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.auth.logout()
    this.disconnect()
    this.currentUser = undefined
    this.httpClient.setToken('')
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | undefined {
    return this.currentUser
  }

  /**
   * Set current user (for manual authentication)
   */
  setCurrentUser(user: User): void {
    this.currentUser = user
  }

  /**
   * Set authentication token (for manual authentication)
   */
  setToken(token: string): void {
    this.httpClient.setToken(token)
    this.wsClient = new WSClient(this.options, token, this)
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.httpClient.getToken() && !!this.currentUser
  }

  /**
   * Get cache manager
   */
  get cache(): CacheManager {
    return this._cache
  }

  /**
   * Destroy the client and clean up resources
   */
  destroy(): void {
    this.disconnect()
    this.removeAllListeners()
    if (this._cache instanceof MemoryCacheManager) {
      this._cache.destroy()
    }
  }

  /**
   * Enable debug mode
   */
  setDebug(enabled: boolean): void {
    this.options.debug = enabled
  }

  /**
   * Get client options
   */
  getOptions(): Readonly<Required<BeaconClientOptions>> {
    return this.options
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.wsClient.isConnected()
  }

  /**
   * Wait for the client to be ready
   */
  async waitForReady(timeout: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve()
        return
      }

      const timer = setTimeout(() => {
        this.off('ready', onReady)
        reject(new Error('Connection timeout'))
      }, timeout)

      const onReady = () => {
        clearTimeout(timer)
        resolve()
      }

      this.once('ready', onReady)
    })
  }

  /**
   * Invite helpers
   */
  async acceptInvite(inviteCode: string): Promise<void> {
    const response = await this.httpClient.post<void>(`/invites/${inviteCode}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to accept invite')
    }
  }

  async getInvite(inviteCode: string): Promise<any> {
    const response = await this.httpClient.get<any>(`/invites/${inviteCode}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to get invite')
    }

    return response.data
  }
}
