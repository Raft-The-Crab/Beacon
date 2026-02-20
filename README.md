# 📡 Beacon — The Zero-Barrier Communication Platform

Beacon isn't just another messaging app. It's an ecosystem built on the radical idea that **premium communication should be free, private, and developer-first.**

No subscriptions. No paywalls. No data-harvesting. Just a genuinely elite space for communities to thrive.

---

## ⚡ Why Beacon?

Most platforms today are designed to extract value from you. Beacon is designed to provide it.

1. **Total Freedom**: Every feature — from HD screen sharing to 500MB file uploads — is unlocked by default.
2. **Earned Premium**: We don't want your credit card. Earn **Beacoin** by simply being active in the community. Spend it on custom themes, animated banners, and exclusive badges.
3. **Developer First**: Built-in IDE-grade tools. Our `beacon.js` SDK (available privately at `Raft-The-Crab/Beacon-Sdk`) allows you to build bots that feel like native parts of the OS.
4. **AI Moderation**: Every server comes equipped with a Prolog-powered moderation engine. It's fast, predictable, and requires zero setup.

---

## 🛠️ The Tech Behind the Glow

Beacon is a masterclass in modern full-stack architecture, blending high-frequency trading principles with cinematic web design.

*   **Frontend**: React 19 + Vite 7 with a custom "Glassmorphism 3.0" design system.
*   **Real-time Core**: A custom WebSocket Gateway optimized for sub-10ms latency.
*   **Infrastructure**:
    *   **PostgreSQL (Supabase)**: Relational data & user auth.
    *   **MongoDB Atlas**: Horizontally scalable message storage (Audit & Chat clusters).
    *   **Redis Cloud**: Intelligent presence and session caching.
    *   **Cloudinary**: Global media CDN for ultra-fast asset delivery.

---

## 🚀 Getting Started

Beacon runs natively across all your devices.

*   **Windows**: Native desktop experience via Tauri.
*   **Android**: Smooth mobile performance via Capacitor.
*   **Web**: Full PWA support for quick access.

### Developer Setup

```bash
# Clone the heart of the system
git clone https://github.com/Raft-The-Crab/Beacon.git
cd Beacon
pnpm install

# Ignite the platform
pnpm dev:web      # Launch the frontend (http://localhost:5173)
pnpm dev:server   # Launch the API & Gateway (http://localhost:4000)
```

---

## 📡 The SDK (`beacon.js`)

Build anything from simple utility bots to complex RPGs inside Beacon. 

```typescript
import { Client, ButtonBuilder, ActionRowBuilder } from 'beacon.js'

const client = new Client({ token: process.env.BEACON_TOKEN })

client.on('messageCreate', (msg) => {
  if (msg.content === '!ping') {
    msg.reply('Pong! 🏓', {
      components: [
        new ActionRowBuilder()
          .addComponent(new ButtonBuilder().setLabel('Magic Button').setStyle('primary').build())
          .build()
      ]
    })
  }
})

client.login()
```

---

## 🛡️ License & Mission

Beacon is proprietary software. The source is provided for transparency and community contribution among authorized developers. We are on a mission to reclaim the digital town square.

**[Contact for Backend Access]** | **[Visit Developer Portal]** | **[Read the Docs]**
