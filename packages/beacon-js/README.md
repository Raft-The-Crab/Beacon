# beacon.js

Official Bot SDK for Beacon - The next-generation communication platform that beats Discord.

[![npm](https://img.shields.io/npm/v/beacon.js)](https://www.npmjs.com/package/beacon.js)
[![Downloads](https://img.shields.io/npm/dm/beacon.js)](https://www.npmjs.com/package/beacon.js)
[![License](https://img.shields.io/npm/l/beacon.js)](https://github.com/Raft-The-Crab/Beacon/blob/main/LICENSE)

## 🚀 Features

- ✅ **TypeScript-first** with full type safety
- 🎨 **Rich Components** (Buttons, Modals, Embeds, Polls)
- 🎵 **Voice & Video** support
- 💾 **Persistent Storage** built-in
- 📊 **Analytics** tracking
- ⚡ **WebSocket** with auto-reconnect
- 🔄 **Rate Limiting** handled automatically
- 🎯 **Slash Commands** with autocomplete

## 📦 Installation

```bash
npm install beacon.js
```

## 🎯 Quick Start

```typescript
import { Client } from 'beacon.js'

const client = new Client({ token: process.env.BEACON_TOKEN })

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.username}`)
})

client.on('messageCreate', async (msg) => {
  if (msg.content === '!ping') {
    await msg.reply('Pong! 🏓')
  }
})

client.login()
```

## 📚 Examples

### Slash Commands

```typescript
import { CommandBuilder } from 'beacon.js'

client.registerCommand(
  new CommandBuilder()
    .setName('hello')
    .setDescription('Say hello')
    .addStringOption(opt => 
      opt.setName('name')
         .setDescription('Your name')
         .setRequired(true)
    )
    .build()
)

client.on('interactionCreate', async (interaction) => {
  if (interaction.commandName === 'hello') {
    const name = interaction.options.getString('name')
    await interaction.reply(`Hello, ${name}! 👋`)
  }
})
```

### Rich Embeds

```typescript
import { EmbedBuilder } from 'beacon.js'

const embed = new EmbedBuilder()
  .setTitle('Welcome to Beacon!')
  .setDescription('The Discord killer')
  .setColor(0x6366f1)
  .addField('Feature 1', 'Free forever', true)
  .addField('Feature 2', '500MB uploads', true)
  .setThumbnail('https://beacon.chat/logo.png')
  .setFooter({ text: 'Powered by Beacon' })
  .setTimestamp()
  .build()

await channel.send({ embeds: [embed] })
```

### Interactive Buttons

```typescript
import { ButtonBuilder, ActionRowBuilder } from 'beacon.js'

const row = new ActionRowBuilder()
  .addButton(
    new ButtonBuilder()
      .setLabel('Click Me')
      .setStyle('PRIMARY')
      .setCustomId('my_button')
      .build()
  )
  .build()

await channel.send({
  content: 'Click the button!',
  components: [row]
})

client.on('interactionCreate', async (interaction) => {
  if (interaction.customId === 'my_button') {
    await interaction.reply('Button clicked! 🎉')
  }
})
```

### Persistent Storage

```typescript
// Save user data
await client.storage.set('points', userId, 100)

// Get user data
const points = await client.storage.get('points', userId)

// Delete user data
await client.storage.delete('points', userId)
```

### Scheduled Tasks

```typescript
// Run daily at midnight
client.scheduler.schedule('0 0 * * *', async () => {
  console.log('Daily task running!')
  await resetDailyQuests()
})
```

### Analytics

```typescript
// Track events
await client.analytics.track('command_used', {
  command: 'hello',
  userId: msg.author.id
})

// Get metrics
const metrics = await client.analytics.getMetrics()
console.log(`Total commands: ${metrics.commandUsage}`)
```

### Voice Integration

```typescript
// Join voice channel
const connection = await client.joinVoice(channelId)

// Play audio
await connection.playAudio('./music.mp3')

// Listen for speaking
connection.on('speaking', (userId) => {
  console.log(`${userId} is speaking`)
})

// Disconnect
connection.disconnect()
```

## 📖 Documentation

Full documentation: [beacon.chat/docs/sdk](https://beacon.chat/docs/sdk)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT © Beacon Team

## 📄 License

**PROPRIETARY** - Free to use, not open source.

### ✅ What you CAN do:
- Use beacon.js to build bots
- Distribute your bots
- Use in commercial projects
- Read documentation

### ❌ What you CANNOT do:
- Redistribute modified SDK
- Reverse engineer
- Create competing SDKs
- Remove copyright notices

**Similar to Discord.js licensing model.**

© 2024 Beacon Team. All rights reserved.

## 🔗 Links

- [Website](https://beacon.chat)
- [Documentation](https://docs.beacon.chat)
- [Developer Portal](https://developers.beacon.chat)
- [GitHub](https://github.com/Raft-The-Crab/Beacon)
- [Discord Server](https://beacon.chat/discord)

---

**Made with ❤️ by the Beacon Team**
