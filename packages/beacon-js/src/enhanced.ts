import { Client } from './client'
import { RestClient } from './rest/RestClient'
import { Gateway } from './gateway'

export class BotStorage {
  private client: RestClient
  private botId: string

  constructor(client: RestClient, botId: string) {
    this.client = client
    this.botId = botId
  }

  async set(key: string, userId: string, value: any): Promise<void> {
    await this.client.post(`/bots/${this.botId}/storage`, {
      key: `${key}:${userId}`,
      value: JSON.stringify(value)
    })
  }

  async get(key: string, userId: string): Promise<any> {
    const res = await this.client.get(`/bots/${this.botId}/storage/${key}:${userId}`)
    return res.value ? JSON.parse(res.value) : null
  }

  async delete(key: string, userId: string): Promise<void> {
    await this.client.delete(`/bots/${this.botId}/storage/${key}:${userId}`)
  }
}

export class BotScheduler {
  private tasks: Map<string, NodeJS.Timeout> = new Map()

  schedule(cron: string, callback: () => Promise<void>): void {
    // Simple interval-based scheduling (production would use node-cron)
    const interval = this.cronToMs(cron)
    const task = setInterval(callback, interval)
    this.tasks.set(cron, task)
  }

  private cronToMs(cron: string): number {
    // '0 0 * * *' = daily at midnight = 86400000ms
    if (cron === '0 0 * * *') return 86400000
    if (cron === '0 * * * *') return 3600000 // hourly
    return 60000 // default 1 minute
  }

  clear(cron: string): void {
    const task = this.tasks.get(cron)
    if (task) {
      clearInterval(task)
      this.tasks.delete(cron)
    }
  }
}

export class BotAnalytics {
  private client: RestClient
  private botId: string

  constructor(client: RestClient, botId: string) {
    this.client = client
    this.botId = botId
  }

  async track(event: string, data: Record<string, any>): Promise<void> {
    await this.client.post(`/bots/${this.botId}/analytics`, {
      event,
      data,
      timestamp: Date.now()
    })
  }

  async getMetrics(): Promise<any> {
    return await this.client.get(`/bots/${this.botId}/analytics`)
  }
}

// Extend Client with new features
export class EnhancedClient extends Client {
  public storage: BotStorage
  public scheduler: BotScheduler
  public analytics: BotAnalytics

  constructor(options: { token: string }) {
    super(options)
    this.storage = new BotStorage(this.rest, 'bot_id')
    this.scheduler = new BotScheduler()
    this.analytics = new BotAnalytics(this.rest, 'bot_id')
  }

  async joinVoice(channelId: string): Promise<VoiceConnection> {
    // Voice connection implementation
    return new VoiceConnection(channelId, this.gateway)
  }
}

export class VoiceConnection {
  private channelId: string
  private gateway: Gateway

  constructor(channelId: string, gateway: Gateway) {
    this.channelId = channelId
    this.gateway = gateway
  }

  async playAudio(path: string): Promise<void> {
    console.log(`Playing audio: ${path} in ${this.channelId}`)
  }

  on(event: 'speaking', callback: (userId: string) => void): void {
    // Voice event handling
  }

  disconnect(): void {
    console.log(`Disconnected from ${this.channelId}`)
  }
}

export { Client, CommandBuilder, EmbedBuilder, ButtonBuilder } from './index'
