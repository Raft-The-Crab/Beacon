# Beacon

Beacon is the messaging app that doesn't nickel-and-dime you. No subscriptions, no paywalls, no selling your data. Just a genuinely great place to hang out with your people.

It runs natively on Windows and Android, and the whole thing — servers, DMs, voice, bots, the works — is completely free. You can even earn the in-app currency (Beacoin) just by being active, and use it to unlock cosmetic perks. That's it. No credit card, ever.

---

## What it actually does

- **Real-time messaging** — Text channels, DMs, group DMs, threads, forums. Reactions, replies, embeds, file uploads up to 500MB. Everything you'd expect, done properly.
- **Voice & Video** — WebRTC-powered voice channels with noise suppression. 1080p screen sharing. Stage channels for broadcast-style events.
- **Servers** — Full server management: roles, permissions, categories, channels (text, voice, stage, forum, announcement), invite manager, webhooks, audit logs.
- **Friends & Social** — Friend requests, custom status, presence, blocking.
- **Bots** — Build bots with the official **beacon.js** SDK. Slash commands, interactive buttons, dropdowns, modals, polls, cards, paginated embeds, timelines, tables — everything you need. The Developer Portal is built right into the app.
- **Built-in AI Moderation** — Every server gets Beacon's Prolog-based moderation engine for free, automatically. No setup needed.
- **Beacoin** — Earned by chatting, joining voice, creating polls, daily logins, inviting friends. Spend it on Premium cosmetics. Zero real money involved.
- **Premium** — Animated banners, exclusive badges, HD uploads, custom themes. Paid for with Beacoin only.

---

## Platforms

| Platform | How |
|---|---|
| Windows 10/11 | Native desktop app via Tauri |
| Android 11+ | Mobile app via Capacitor |
| Web (PWA) | React 19 + Vite (for development/testing) |

Releases ship as `.exe` installers and `.apk` files through GitHub Releases.

---

## Tech Stack

**Frontend** — React 19, TypeScript, Vite 7, Zustand, CSS Modules

**Backend** — Node.js + Express, WebSocket Gateway, SWI-Prolog moderation engine

**Databases**
- PostgreSQL (Supabase) — users, guilds, roles, channels
- MongoDB Atlas (2 clusters) — messages, audit logs
- Redis Cloud — caching, sessions, presence
- Cloudinary — media CDN

**Desktop** — Tauri (Rust shell, web renderer)

**Mobile** — Capacitor + Android SDK

---

## Running locally

You'll need Node.js 18+ and pnpm.

```bash
git clone https://github.com/Raft-The-Crab/Beacon.git
cd Beacon
pnpm install
```

Copy and fill in the server environment file:

```bash
cp apps/server/.env.example apps/server/.env
```

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
MONGO_URI="mongodb+srv://USER:PASS@cluster.mongodb.net/"
REDIS_URL="redis://default:PASSWORD@HOST:PORT"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
JWT_SECRET="your-super-secret-key"
PORT=4000
NODE_ENV=development
```

Then start everything:

```bash
pnpm dev:web      # Frontend on http://localhost:5173
pnpm dev:server   # API + Gateway on http://localhost:4000
```

The app will redirect to `/login` on first load. You can also hit "Continue in Offline Mode" to poke around without a backend.

---

## Deploying

### Server → Railway

1. Push to GitHub
2. Link your repo in [Railway](https://railway.app)
3. Add environment variables in the Railway dashboard
4. It deploys automatically on every push

### Database → Supabase + MongoDB Atlas

1. Create a Supabase project, grab the `DATABASE_URL`
2. Run `npx prisma migrate deploy` to apply the schema
3. Create two free MongoDB Atlas clusters for messages and audit logs

### Building the apps

```bash
pnpm build:desktop   # Produces Windows .exe via Tauri
pnpm build:android   # Produces .apk via Capacitor
```

Attach the output files to a GitHub Release for distribution.

---

## beacon.js SDK

The official bot SDK lives in `packages/beacon-js`. Install it in your bot project:

```bash
npm install beacon.js
```

```typescript
import { Client, CommandBuilder, ButtonBuilder, ActionRowBuilder, PollBuilder } from 'beacon.js'

const client = new Client({ token: 'Bot YOUR_TOKEN' })

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.username}`)
})

client.on('messageCreate', (msg) => {
  if (msg.content === '!ping') {
    const row = new ActionRowBuilder()
      .addComponent(
        new ButtonBuilder()
          .setLabel('Pong! 🏓')
          .setStyle('primary')
          .setCustomId('pong_btn')
          .build()
      )
      .build()

    client.sendMessage(msg.channel_id, { content: 'Pong!', components: [row] })
  }
})

client.login()
```

Available builders: `CommandBuilder`, `EmbedBuilder`, `ButtonBuilder`, `SelectMenuBuilder`, `ActionRowBuilder`, `ModalBuilder`, `PollBuilder`, `CardBuilder`, `FormBuilder`, `PaginatorBuilder`, `TimelineBuilder`, `TableBuilder`, `DropdownBuilder`

---

## Project layout

```
Beacon/
├── apps/
│   ├── web/          # React frontend (Vite)
│   ├── server/       # Node.js API + WebSocket gateway
│   ├── desktop/      # Tauri wrapper
│   └── mobile/       # Capacitor wrapper
├── packages/
│   ├── beacon-js/    # Official bot SDK
│   ├── sdk/          # Internal bot runtime
│   ├── types/        # Shared TypeScript types
│   └── api-client/   # Typed API client
└── scripts/          # Build & deploy scripts
```

---

## Architecture overview

```
Client (Desktop / Android / Web)
        │
        ▼  WebSocket
   Gateway (Railway)
        │
        ├──► PostgreSQL (Supabase)   — Users, Guilds, Roles, Channels
        ├──► MongoDB Atlas           — Messages, Audit Logs
        ├──► Redis Cloud             — Cache, Sessions, Presence
        ├──► Cloudinary              — Media CDN
        └──► SWI-Prolog              — AI Moderation (built-in, all servers)
```

---

## License

**Proprietary** — Source is confidential. See [LICENSE](LICENSE).

Authorized hosting targets: Railway · Supabase · MongoDB Atlas · Redis Labs · Cloudinary
