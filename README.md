# 📡 Beacon v1.0.0

**The Zero-Barrier, Developer-First Communication Platform**

Beacon is a next-generation messaging platform where premium communication is free, private, and open to developers. No subscriptions. No paywalls. No data harvesting. Built on modern, secure infrastructure with a thriving bot ecosystem.

---

# 📡 Beacon v1.2.0

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
- **REST API** — Full-featured REST API for bot development (v1.2.0)
- **Webhooks** — Server and user webhooks for event-driven automation
- **Type-Safe** — Full TypeScript support with optional type packages

### Platform Support
- **Web** — Modern single-page app with responsive design (mobile, tablet, desktop)
- **Desktop** — Native Windows support via Tauri desktop framework
- **Mobile** — Android support via Capacitor with native integrations

---

## 🏗️ Infrastructure

Beacon uses a three-tier deployment, all in Singapore (`asia-southeast1`):

| Service | Platform | Role | Resources |
|---------|----------|------|-----------|
| **API + Gateway** | Railway | REST API & WebSocket gateway | 1 vCPU / 512 MB |
| **Main Server** | ClawCloud | Full API image + SWI-Prolog moderation | 0.6 vCPU / 1112 MB |
| **AI Service** | ClawCloud | ONNX inference + yt-dlp + Redis | 0.6 vCPU / 1112 MB |
| **Web Frontend** | Static CDN | React SPA | — |

### Docker Images (GitHub Container Registry)

Built and published automatically on every push to `main`:

```
ghcr.io/raft-the-crab/beacon-server:latest   # API + Gateway (Node.js + SWI-Prolog)
ghcr.io/raft-the-crab/beacon-ai:latest       # AI service (Python + ONNX + yt-dlp)
```

---

## 🤖 AI Service

The `beacon-ai` container runs a lightweight Python Flask service designed to fit within the ClawCloud allocation:

| Component | Memory |
|-----------|--------|
| ONNX model (DistilBERT) | ~450 MB |
| Redis cache (bundled) | ~140 MB |
| Flask + yt-dlp + deps | ~150 MB |
| **Total** | **~740 MB / 1112 MB** |

**Routes:**
- `GET  /health` — liveness check
- `POST /extract` — audio/video URL extraction via yt-dlp
- `POST /analyze` — ONNX content classification (graceful fallback if no model)

The ONNX model is optional. Place it at `apps/server/ai/models/moderation.onnx` before building to bake it into the image, or download it at runtime via `download_model.py`.

---

## 🚀 Getting Started

Beacon is a proprietary closed-source platform. Source code is not publicly available.

**Want to build a bot?** Use the public SDK below.  
**Using Beacon?** Visit [beacon.qzz.io](https://beacon.qzz.io) to sign up.

---

## 📡 Bot SDK (beacon-sdk)

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

### Key Exports

```typescript
// Core
BeaconClient, BotFramework, Client, AIClient

// REST APIs
MessagesAPI, ServersAPI, ChannelsAPI, UsersAPI, RolesAPI
PresenceAPI, VoiceAPI, NotificationsAPI, WebhooksAPI, InvitesAPI

// Builders
CommandBuilder, EmbedBuilder, ButtonBuilder, SelectMenuBuilder
ActionRowBuilder, ModalBuilder, PollBuilder, CardBuilder

// Utilities
Gateway, Intents, RestClient, Collection, InteractionContext
```

See full docs: [`packages/sdk/README.md`](packages/sdk/README.md)

---

## 📚 API Reference

**Base URL:** `https://api.beacon.qzz.io/api`  
**Alt (Railway):** `https://beacon-v1-api.up.railway.app/api`  
**WebSocket:** `wss://gateway.beacon.qzz.io`  
**Auth:** `Authorization: Bot <token>` or `Authorization: Bearer <token>`

Endpoints: Auth, Users, Servers, Channels, Messages, Voice, Webhooks, Notifications, Invites

Full reference: [beacon.qzz.io/docs/api](https://beacon.qzz.io/docs/api)

---

## 🛡️ Security

- ✅ Input validation on all user-supplied data
- ✅ Rate limiting per endpoint (300 req/15min general · 5 req/15min auth)
- ✅ Helmet.js headers (CSP, HSTS, X-Frame-Options)
- ✅ bcrypt password hashing
- ✅ JWT-based auth with refresh tokens
- ✅ SSRF protection in AI extraction endpoint
- ✅ SWI-Prolog rules engine for content moderation

**Report vulnerabilities:** [security@beacon.qzz.io](mailto:security@beacon.qzz.io)

---

## 📦 Package Versions

| Package | Version |
|---------|---------|
| beacon-sdk | 1.2.0 |
| @beacon/types | 1.0.0 |
| @beacon/server | 1.0.0 |

---

## 📄 License

Beacon is proprietary software. Source provided for transparency among authorized developers. See [LICENSE](LICENSE) for details.

---

## 🙋 Support

- **GitHub Issues** — [Report bugs](https://github.com/Raft-The-Crab/Beacon/issues)
- **Documentation** — [beacon.qzz.io/docs](https://beacon.qzz.io/docs)
- **Email** — [support@beacon.qzz.io](mailto:support@beacon.qzz.io)

---

**Built with ❤️ by the Beacon team**  
*Beacon v1.2.0 — The future of communication is secure, open, and developer-first.*
