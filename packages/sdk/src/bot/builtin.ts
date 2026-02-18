import type { BotCommand } from './types'

export const waitCommand: BotCommand = {
  name: 'wait',
  description: 'Test the wait helper',
  execute: async (ctx) => {
    await ctx.reply('Waiting for 3 seconds...')
    await ctx.wait(3000)
    await ctx.reply('Done waiting!')
  }
}

export const pingCommand: BotCommand = {
  name: 'ping',
  description: 'Check if bot is alive',
  cooldownMs: 1500,
  execute: async (ctx) => {
    await ctx.reply('Pong! ✅')
  }
}

export const helpCommand: BotCommand = {
  name: 'help',
  description: 'Get command usage help',
  aliases: ['h', 'commands'],
  execute: async (ctx) => {
    await ctx.reply('Use bot commands with the configured prefix. Example: !ping')
  }
}

export const announceCommand: BotCommand = {
  name: 'announce',
  description: 'Post an announcement message',
  ownerOnly: true,
  usage: '!announce <text>',
  execute: async (ctx) => {
    if (!ctx.rawArgs) {
      await ctx.reply('Usage: !announce <text>')
      return
    }

    await ctx.reply(`📢 ${ctx.rawArgs}`)
  }
}
