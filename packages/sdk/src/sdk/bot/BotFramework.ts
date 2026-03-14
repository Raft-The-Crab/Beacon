import type { BeaconClient } from '../BeaconClient'
import type { Message, User } from '../core-types'
import type {
  BotCommand,
  BotContext,
  BotFrameworkApi,
  BotFrameworkOptions,
  BotMiddleware,
  BotPlugin,
  BotScheduleJob
} from './types'

export class BotFramework implements BotFrameworkApi {
  private commands = new Map<string, BotCommand>()
  private aliases = new Map<string, string>()
  private middlewares: BotMiddleware[] = []
  private plugins = new Map<string, BotPlugin>()
  private jobs = new Map<string, ReturnType<typeof setInterval>>()
  private userCooldowns = new Map<string, number>()

  private options: Required<BotFrameworkOptions>

  constructor(private client: BeaconClient, options: BotFrameworkOptions = {}) {
    this.options = {
      prefix: options.prefix ?? '!',
      mentionPrefix: options.mentionPrefix ?? true,
      ownerIds: options.ownerIds ?? [],
      debug: options.debug ?? false
    }
  }

  async start(): Promise<void> {
    this.client.on('message', (message) => {
      void this.handleMessage(message)
    })

    if (!this.client.isConnected()) {
      await this.client.connect()
    }
  }

  stop(): void {
    for (const intervalId of this.jobs.values()) {
      clearInterval(intervalId)
    }
    this.jobs.clear()
  }

  registerCommand(command: BotCommand): void {
    this.commands.set(command.name.toLowerCase(), command)
    for (const alias of command.aliases ?? []) {
      this.aliases.set(alias.toLowerCase(), command.name.toLowerCase())
    }
  }

  unregisterCommand(name: string): void {
    this.commands.delete(name.toLowerCase())
    for (const [alias, mapped] of this.aliases.entries()) {
      if (mapped === name.toLowerCase()) {
        this.aliases.delete(alias)
      }
    }
  }

  use(middleware: BotMiddleware): void {
    this.middlewares.push(middleware)
  }

  schedule(job: BotScheduleJob): void {
    if (this.jobs.has(job.id)) {
      clearInterval(this.jobs.get(job.id)!)
    }

    if (job.enabled === false) {
      return
    }

    const intervalId = setInterval(() => {
      void Promise.resolve(job.task()).catch((error) => {
        if (this.options.debug) {
          console.error(`[BotFramework] schedule job failed (${job.id})`, error)
        }
      })
    }, job.intervalMs)

    this.jobs.set(job.id, intervalId)
  }

  async loadPlugin(plugin: BotPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already loaded.`)
    }

    try {
      await plugin.setup(this)
      this.plugins.set(plugin.name, plugin)
      if (this.options.debug) {
        console.log(`[BotFramework] Loaded plugin: ${plugin.name}`)
      }
    } catch (error) {
      console.error(`[BotFramework] Failed to load plugin ${plugin.name}:`, error)
      throw error
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) return

    try {
      await plugin.teardown?.()
      this.plugins.delete(name)
      if (this.options.debug) {
        console.log(`[BotFramework] Unloaded plugin: ${name}`)
      }
    } catch (error) {
      console.error(`[BotFramework] Failed to unload plugin ${name}:`, error)
    }
  }

  private async handleMessage(message: Message): Promise<void> {
    const content = message.content?.trim()
    if (!content) {
      return
    }

    const prefix = this.resolvePrefix(content)
    if (!prefix) {
      return
    }

    const withoutPrefix = content.slice(prefix.length).trim()
    const [rawCommand, ...args] = withoutPrefix.split(/\s+/)
    if (!rawCommand) {
      return
    }

    const commandName = this.resolveCommandName(rawCommand)
    if (!commandName) {
      return
    }

    const command = this.commands.get(commandName)
    if (!command) {
      return
    }

    const author = (message.author ?? { id: message.authorId ?? 'unknown', username: 'Unknown', avatar: null }) as User

    if (command.ownerOnly && !this.options.ownerIds.includes(author.id)) {
      await this.reply(message, 'This command is restricted to bot owners.')
      return
    }

    if (!this.canRunCommand(author.id, command)) {
      await this.reply(message, 'Please wait before reusing this command.')
      return
    }

    const ctx: BotContext = {
      client: this.client,
      message,
      author,
      channelId: message.channelId,
      args,
      rawArgs: args.join(' '),
      command: commandName,
      prefix,
      reply: async (replyContent: string, options?: any) => {
        return await this.reply(message, replyContent)
      },
      react: async (emoji: string) => {
        await this.client.messages.addReaction(message.channelId, message.id, emoji)
      },
      send: async (targetChannelId: string, sendContent: string) => {
        const res = await this.client.messages.send(targetChannelId, { content: sendContent })
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to send message')
        return res.data
      },
      delete: async () => {
        await this.client.messages.delete(message.channelId, message.id)
      },
      edit: async (newContent: string) => {
        const res = await this.client.messages.edit(message.channelId, message.id, newContent)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to edit message')
        return res.data
      },
      wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    }

    await this.runMiddlewares(ctx, async () => {
      await Promise.resolve(command.execute(ctx))
    })
  }

  private resolvePrefix(content: string): string | null {
    if (content.startsWith(this.options.prefix)) {
      return this.options.prefix
    }

    if (this.options.mentionPrefix) {
      const currentUser = this.client.getCurrentUser()
      if (currentUser) {
        const mentionPrefix = `<@${currentUser.id}>`
        if (content.startsWith(mentionPrefix)) {
          return mentionPrefix
        }
      }
    }

    return null
  }

  private resolveCommandName(rawCommand: string): string | null {
    const normalized = rawCommand.toLowerCase()
    if (this.commands.has(normalized)) {
      return normalized
    }

    const aliasTarget = this.aliases.get(normalized)
    return aliasTarget ?? null
  }

  private async runMiddlewares(ctx: BotContext, finalHandler: () => Promise<void>): Promise<void> {
    let index = -1

    const dispatch = async (nextIndex: number): Promise<void> => {
      if (nextIndex <= index) {
        throw new Error('next() called multiple times')
      }
      index = nextIndex

      const middleware = this.middlewares[nextIndex]
      if (!middleware) {
        await finalHandler()
        return
      }

      await middleware.run(ctx, () => dispatch(nextIndex + 1))
    }

    await dispatch(0)
  }

  private canRunCommand(userId: string, command: BotCommand): boolean {
    if (!command.cooldownMs || command.cooldownMs <= 0) {
      return true
    }

    const key = `${userId}:${command.name}`
    const now = Date.now()
    const lastUsed = this.userCooldowns.get(key) ?? 0

    if (now - lastUsed < command.cooldownMs) {
      return false
    }

    this.userCooldowns.set(key, now)
    return true
  }

  private async reply(sourceMessage: Message, content: string): Promise<Message> {
    const res = await this.client.messages.send(sourceMessage.channelId, {
      content,
      replyTo: sourceMessage.id
    })
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to reply')
    return res.data
  }
}
