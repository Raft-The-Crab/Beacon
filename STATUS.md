# Beacon — Project Status

_Last updated: 2026-02-18_

---

## ✅ Overall Status: Feature-Complete (Beta)

Beacon is a Discord-like communication platform with a React 19 frontend, Node.js/Express backend, Socket.IO WebSockets, Prisma + PostgreSQL, MongoDB, and Redis.

---

## Backend (`apps/server`)

| Feature | Status |
|---|---|
| Auth (register/login/JWT/refresh) | ✅ Done |
| Guild (server) CRUD | ✅ Done |
| Channel CRUD + invite links | ✅ Done |
| Message CRUD + pagination | ✅ Done |
| Message editing + deletion | ✅ Done |
| Message pins (GET/PUT/DELETE) | ✅ Done |
| Message reactions (add/remove) | ✅ Done |
| Slowmode enforcement via Redis | ✅ Done |
| Direct Messages (1:1) | ✅ Done |
| Group DMs (POST /channels/group-dm) | ✅ Done |
| Friends (add/remove/list) | ✅ Done |
| Audit Logs | ✅ Done |
| Webhooks (CRUD + execute) | ✅ Done |
| User profile (PATCH /users/me) | ✅ Done |
| Custom status (status + text) | ✅ Done |
| Avatar/banner upload (Cloudinary) | ✅ Done |
| Roles & permissions | ✅ Done |
| Socket.IO WebSocket gateway | ✅ Done |
| Presence system (online/idle/dnd) | ✅ Done |
| Typing indicators | ✅ Done |
| Voice WebRTC signaling | ✅ Done |
| App/Bot OAuth2 | ✅ Done |
| AI moderation (Prolog engine) | ✅ Done |
| Rate limiting | ✅ Done |
| Redis caching | ✅ Done |

---

## Frontend (`apps/web`)

| Feature | Status |
|---|---|
| Landing page | ✅ Done |
| Login / Register | ✅ Done |
| Messaging home (friends, DMs) | ✅ Done |
| Server list sidebar | ✅ Done |
| Channel sidebar | ✅ Done |
| Chat area (messages, reactions) | ✅ Done |
| Message input (file upload, emoji) | ✅ Done |
| Pinned messages panel | ✅ Done |
| Typing indicators | ✅ Done |
| Voice/video call UI | ✅ Done |
| User settings modal | ✅ Done |
| **Custom status modal** | ✅ Done |
| Server settings modal | ✅ Done |
| **Audit log modal** | ✅ Done |
| **Webhooks manager modal** | ✅ Done |
| **Group DM modal** | ✅ Done |
| **Slowmode control UI** | ✅ Done |
| User profile modal | ✅ Done |
| Role manager | ✅ Done |
| Create server / channel modals | ✅ Done |
| Toast notifications | ✅ Done |
| Theme switcher (classic/glass/light) | ✅ Done |
| Dark/light mode | ✅ Done |
| Developer portal | ✅ Done |
| Bot console | ✅ Done |
| Docs (API reference, Gateway, SDK tutorial) | ✅ Done |
| Legal pages (TOS, Privacy) | ✅ Done |
| About Us / Contact | ✅ Done |
| Mobile responsive layout | ✅ Done |

---

## SDK (`packages/beacon-js`)

| Feature | Status |
|---|---|
| npm package name: `beacon.js` | ✅ Done |
| Node.js WebSocket (`ws` package) | ✅ Done |
| Rate-limit-aware REST client | ✅ Done |
| Gateway with auto-reconnect + session resume | ✅ Done |
| Collection<K,V> (enhanced Map) | ✅ Done |
| InteractionContext (slash command context) | ✅ Done |
| Collector<T> (await messages/reactions) | ✅ Done |
| Guild/channel/user/message caches | ✅ Done |
| Presence update | ✅ Done |
| Slash command deploy | ✅ Done |
| Message pins API | ✅ Done |
| Reactions API | ✅ Done |
| Ban/kick/unban members | ✅ Done |
| Audit log API | ✅ Done |
| Webhook execute API | ✅ Done |
| `publishConfig` for npm public registry | ✅ Done |
| README + CHANGELOG | ✅ Done |

---

## Desktop (`apps/desktop`)

| Feature | Status |
|---|---|
| Tauri shell | ✅ Scaffolded |
| Production build script | ✅ Done |

---

## Mobile (`apps/mobile`)

| Feature | Status |
|---|---|
| Capacitor shell | ✅ Scaffolded |
| Android build script | ✅ Done |

---

## Deployment

| Target | Status |
|---|---|
| Railway (server) | ✅ Ready (railway.json + Procfile + Dockerfile) |
| Claw Cloud Run | ✅ Ready (deploy script) |
| Vercel/Netlify (web) | ✅ Ready (static build) |

---

## Publishing `beacon.js` to npm

```bash
cd packages/beacon-js
npm run build
npm publish --access public
```

Requires: `npm login` with an account that has access to the `beacon.js` package name.

---

## Known Issues / TODO

- TypeScript strict mode may surface minor type issues in generated code — run `pnpm tsc --noEmit` to check
- Voice/video WebRTC requires TURN server configuration for production
- Mobile app needs platform-specific permission handling
- Desktop Tauri app needs code signing for distribution
