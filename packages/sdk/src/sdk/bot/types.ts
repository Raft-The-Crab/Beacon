import type { BeaconClient } from '../BeaconClient'
import type { Message, User, Channel, Server } from '../core-types'

export interface BotContext {
  client: BeaconClient
  message: Message
  author: User
  channel?: Channel
  server?: Server
  channelId: string
  args: string[]
  rawArgs: string
  command: string
  prefix: string
  reply: (content: string, options?: any) => Promise<Message>
  react: (emoji: string) => Promise<void>
  send: (targetChannelId: string, content: string) => Promise<Message>
  delete: () => Promise<void>
  edit: (newContent: string) => Promise<Message>
  wait: (ms: number) => Promise<void>
}

export interface CommandOption {
  name: string
  description: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'user' | 'channel'
}

export interface BotCommand {
  name: string
  description: string
  aliases?: string[]
  usage?: string
  cooldownMs?: number
  ownerOnly?: boolean
  options?: CommandOption[]
  execute: (ctx: BotContext) => Promise<void> | void
}

export interface BotPlugin {
  name: string
  version: string
  setup: (framework: BotFrameworkApi) => void | Promise<void>
  teardown?: () => void | Promise<void>
}

export interface BotMiddleware {
  name: string
  run: (ctx: BotContext, next: () => Promise<void>) => Promise<void>
}

export interface BotScheduleJob {
  id: string
  intervalMs: number
  task: () => Promise<void> | void
  enabled?: boolean
}

export interface BotFrameworkOptions {
  prefix?: string
  mentionPrefix?: boolean
  ownerIds?: string[]
  debug?: boolean
}

export interface BotFrameworkApi {
  registerCommand: (command: BotCommand) => void
  unregisterCommand: (name: string) => void
  use: (middleware: BotMiddleware) => void
  schedule: (job: BotScheduleJob) => void
  loadPlugin: (plugin: BotPlugin) => Promise<void>
  unloadPlugin: (name: string) => Promise<void>
}
