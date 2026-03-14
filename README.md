# 📡 Beacon v1.0.0

**The Zero-Barrier, Developer-First Communication Platform**

Beacon is a next-generation messaging platform where premium communication is free, private, and open to developers. No subscriptions. No paywalls. No data harvesting. Built on modern, secure infrastructure with a thriving bot ecosystem.

---

## ⚡ Core Features

### Communication
- **Unlimited for Everyone** — HD screen sharing, file uploads, voice/video calls, and full feature access with no paywall
- **Earned Premium** — Earn **Beacoin** by being active. Customize with themes, animated banners, Beacon+ status, and exclusive badges
- **Friends & Servers** — Build communities with public servers, private groups, and direct messaging
- **Persistent Voice** — Always-on voice channels with automatic user management

### Safety & Moderation
- **AI Moderation** — Every server ships with intelligent content moderation. Zero setup required
- **End-to-End Encryption** — Private conversations stay private with modern cryptography
- **Security-First** — Input validation, rate limiting, CSRF protection, IP blocklists, and comprehensive security middleware

### Developer Features
- **Bot Framework** — Build powerful bots with `beacon-sdk`, our official TypeScript SDK
- **REST API** — Full-featured REST API for bot development (v2.0+ compatible)
- **Webhooks** — Server and user webhooks for event-driven automation
- **Type-Safe** — Full TypeScript support with optional type packages

### Platform Support
- **Web** — Modern single-page app with responsive design (mobile, tablet, desktop)
- **Desktop** — Native Windows support via Tauri desktop framework
- **Mobile** — Android support via Capacitor with native integrations
- **API Clients** — Official clients for TypeScript/JavaScript, with community packages for other languages

---

## 🚀 Getting Started with Beacon

Beacon is a proprietary closed-source platform. Source code is not publicly available.

**Want to build a bot?** Use the public SDK below.
**Using Beacon?** Visit [beacon.qzz.io](https://beacon.qzz.io) to sign up.

---

## 📡 Bot SDK Usage

### Installation

```bash
npm install beacon-sdk
# or
pnpm add beacon-sdk
```

### Basic Example

```typescript
import { BeaconClient } from 'beacon-sdk'

const client = new BeaconClient({
  token: process.env.BEACON_TOKEN!,
  intents: ['GUILDS', 'GUILD_MESSAGES']
})

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    await message.reply('Pong! 🏓')
  }
})

await client.login()
```

### Available Commands

```typescript
// Messages
await message.reply('Hello!')
await message.edit('Updated message')
await message.delete()

// Embeds
const embed = {
  title: 'Hello',
  description: 'World',
  color: 0xff6b6b,
  fields: [{ name: 'Field', value: 'Value' }]
}
await channel.send({ embeds: [embed] })

// Permissions
const member = await guild.members.fetch(userId)
await member.setRoles(['roleId1', 'roleId2'])
```

See full docs: [`packages/sdk/README.md`](packages/sdk/README.md)

---

## 📚 API Documentation

### REST API

The Beacon API is RESTful with WebSocket support for real-time features.

**Base URL:** `https://api.beacon.qzz.io` (or `http://localhost:8080/api` locally)

**Authentication:** Bearer token in `Authorization` header

Example:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.beacon.qzz.io/users/@me
```

### Available Endpoints

- **Users** — Profile, settings, notifications, friends
- **Guilds** — Server management, members, roles, invites
- **Channels** — Messages, threads, pins, reaction categories
- **Messages** — Send/edit/delete, embeds, attachments
- **Voice** — Channel state, RTC offer/answer
- **Webhooks** — Event subscriptions

### WebSocket (Real-Time)

Connect to `wss://gateway.beacon.qzz.io` for:
- Message events (new, edit, delete)
- User presence updates
- Voice state changes
- Typing indicators
- Custom bot events

---

## 🛡️ Security

Beacon takes security seriously:

- ✅ **Input Validation** — All user inputs validated before database operations
- ✅ **Rate Limiting** — Per-endpoint rate limits prevent abuse
  - General: 300 req/15min
  - Auth: 5 req/15min  
  - Guild management: 20 req/1min
  - Message send: 60 req/1min
- ✅ **CSRF Protection** — Double-submit cookie pattern
- ✅ **Helmet.js** — CSP, HSTS, X-Frame-Options, and more
- ✅ **IP Blocklist** — Automatic blocking with appeal mechanism
- ✅ **Password Security** — bcrypt hashing with salt rounds
- ✅ **JWT Tokens** — Secure token-based authentication
- ✅ **HTTPS Enforced** — Production requires HTTPS

**Report Security Issues:** Security vulnerabilities should be reported privately to [security@beacon.qzz.io](mailto:security@beacon.qzz.io)

---

## 📦 Package Versions

This is Beacon **v1.0.0**, with all packages synchronized:

| Package | Version | NPM |
|---------|---------|-----|
| beacon-sdk | 1.1.0 | [`npm`](https://npmjs.com/package/beacon-sdk) |
| @beacon/types | 1.0.0 | [`npm`](https://npmjs.com/package/@beacon/types) |

---

## 📄 License

Beacon is proprietary software. Source provided for transparency among authorized developers. See [LICENSE](LICENSE) for details.

---

## 🙋 Support

- **GitHub Issues** — [Report bugs](https://github.com/Raft-The-Crab/Beacon/issues)
- **Documentation** — [Full API docs](https://docs.beacon.qzz.io)
- **Email** — [support@beacon.qzz.io](mailto:support@beacon.qzz.io)

---

**Built with ❤️ by the Beacon team**

*Beacon 1.0.0 - The future of communication is decentralized, secure, and open to all developers.*
