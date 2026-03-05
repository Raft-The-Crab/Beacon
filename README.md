# 📡 Beacon

**The Zero-Barrier Communication Platform**

Beacon is a next-generation messaging platform where premium communication is free, private, and developer-first. No subscriptions. No paywalls. No data-harvesting.

---

## ⚡ Features

- **Unlimited for Everyone** — HD screen sharing, file uploads, and full feature access with no paywall
- **Earned Premium** — Earn **Beacoin** by being active. Spend it on themes, animated banners, and badges
- **AI Moderation** — Every server ships with intelligent content moderation. Zero setup required
- **End-to-End Encryption** — Private conversations stay private
- **Bot Framework** — Build powerful bots with `beacon.js`, our official SDK
- **Cross-Platform** — Web, Windows (Tauri), Android (Capacitor)

---

## 🚀 Quick Start

```bash
git clone https://github.com/Raft-The-Crab/Beacon.git
cd Beacon
pnpm install
pnpm dev:web      # Frontend → http://localhost:5173
pnpm dev:server   # Backend  → http://localhost:4000
```

## 📡 Bot SDK

```typescript
import { Client, EmbedBuilder } from 'beacon.js'

const client = new Client({ token: process.env.BEACON_TOKEN! })

client.on('messageCreate', (msg) => {
  if (msg.content === '!ping') {
    client.sendMessage(msg.channel_id, 'Pong! 🏓')
  }
})

client.login()
```

See the full SDK documentation at [beacon.js README](packages/beacon-js/README.md).

---

## 🛡️ License

Beacon is proprietary software. Source provided for transparency among authorized developers.

**Built with ❤️ by the Beacon team**
