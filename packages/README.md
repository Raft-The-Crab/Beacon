# 📡 Beacon SDK

Official SDK packages for Beacon - The next-generation communication platform.

## 📦 Packages

This monorepo contains all official Beacon SDK packages:

### 🤖 beacon.js
**Bot Framework SDK** - Build powerful bots for Beacon (like Discord.js)

```bash
npm install beacon.js
```

- Full TypeScript support
- Rich component builders (Buttons, Modals, Embeds, Polls)
- Voice & Video integration
- Slash commands with autocomplete
- Event-driven architecture

[📖 Documentation](./beacon-js/README.md)

---

### 💻 @beacon/sdk
**Client SDK** - Build apps and clients for Beacon

```bash
npm install @beacon/sdk
```

- Authentication & user management
- Real-time messaging via WebSocket
- Voice & Video calls (WebRTC)
- Server & channel management
- Presence & typing indicators

[📖 Documentation](./sdk/README.md)

---

### 🌐 @beacon/api-client
**REST API Client** - Low-level HTTP client for Beacon API

```bash
npm install @beacon/api-client
```

- Direct REST API access
- Rate limiting handled
- TypeScript types included

---

### 📘 @beacon/types
**Shared Types** - TypeScript type definitions

```bash
npm install @beacon/types
```

- Shared types across all packages
- Channel types, permissions, etc.

---

## 🚀 Quick Start

### Building a Bot (beacon.js)

```typescript
import { Client, EmbedBuilder } from 'beacon.js'

const client = new Client({ token: process.env.BEACON_TOKEN })

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.username}`)
})

client.on('messageCreate', async (msg) => {
  if (msg.content === '!hello') {
    const embed = new EmbedBuilder()
      .setTitle('Hello!')
      .setDescription('Welcome to Beacon')
      .setColor(0x6366f1)
      .build()
    
    await msg.reply({ embeds: [embed] })
  }
})

client.login()
```

### Building a Client (@beacon/sdk)

```typescript
import { BeaconClient } from '@beacon/sdk'

const beacon = new BeaconClient({
  apiUrl: 'https://api.beacon.app',
  wsUrl: 'wss://gateway.beacon.app'
})

await beacon.auth.login('user@example.com', 'password')

beacon.on('message', (message) => {
  console.log(`${message.author.username}: ${message.content}`)
})

await beacon.connect()
```

## 📚 Documentation

- [Beacon Documentation](https://docs.beacon.app)
- [Developer Portal](https://developers.beacon.app)
- [API Reference](https://api.beacon.app/docs)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

- **beacon.js**: PROPRIETARY (free to use for building bots)
- **@beacon/sdk**: MIT
- **@beacon/api-client**: MIT
- **@beacon/types**: MIT

## 🔗 Links

- [Website](https://beacon.app)
- [Main Repository](https://github.com/Raft-The-Crab/Beacon)
- [Discord Community](https://beacon.app/discord)

---

**Made with ❤️ by the Beacon Team**
