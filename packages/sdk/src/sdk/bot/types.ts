import type { Client as BeaconClient } from '../../client'
import type { Message, User } from '../core-types'

export interface BotCommand {
  name: string
  description?: string
  aliases?: string[]
  ownerOnly?: boolean
  cooldownMs?: number
  options?: CommandOption[]
  execute: (ctx: BotContext) => void | Promise<void>
}

export interface CommandOption {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'user' | 'channel'
  required?: boolean
  choices?: Array<{ name: string; value: string | number }>
}

export interface BotContext {
  client: BeaconClient
  message: Message
  author: User
  channelId: string
  args: string[]
  rawArgs: string
  command: string
  prefix: string
  reply: (content: string, options?: any) => Promise<Message>
  react: (emoji: string) => Promise<void>
  send: (channelId: string, content: string) => Promise<Message>
  delete: () => Promise<void>
  edit: (newContent: string) => Promise<Message>
  wait: (ms: number) => Promise<void>
}

export interface BotFrameworkApi {
  start: () => Promise<void>
  stop: () => void
  registerCommand: (command: BotCommand) => void
  unregisterCommand: (name: string) => void
  use: (middleware: BotMiddleware) => void
  schedule: (job: BotScheduleJob) => void
  loadPlugin: (plugin: BotPlugin) => Promise<void>
  unloadPlugin: (name: string) => Promise<void>
}

export interface BotFrameworkOptions {
  prefix?: string
  mentionPrefix?: boolean
  ownerIds?: string[]
  debug?: boolean
}

export interface BotMiddleware {
  run: (ctx: BotContext, next: () => Promise<void>) => void | Promise<void>
}

export interface BotPlugin {
  name: string
  version: string
  setup: (bot: BotFrameworkApi) => void | Promise<void>
  teardown?: () => void | Promise<void>
}

export interface BotScheduleJob {
  id: string
  intervalMs: number
  task: () => void | Promise<void>
  enabled?: boolean
}
