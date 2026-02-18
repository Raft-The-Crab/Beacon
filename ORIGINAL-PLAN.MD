Note; This is the main plan, most/some of it are probably done after this was made.


# Beacon

Beacon is a fully free, cross-platform real-time communication platform built as a Discord alternative.  
It matches Discord feature-for-feature while adding advanced bot support, AI moderation, native performance optimization, and optional heavy service backup.

---

## Platforms

**Android**
- Capacitor 7.1.0
- Kotlin 2.3.0
- Android NDK (C++ bridge via JNI)

**Windows**
- Tauri 2.10.2
- Rust backend
- Rust ↔ C++ FFI bridge

**Frontend**
- React 19
- TypeScript
- Vite 7

**Backend**
- Node.js (API + WebSocket gateway)
- SWI-Prolog 10.0 (AI moderation)
- C++ 23 (optional performance accelerator)

---

## Core Features

**Servers**
- Guilds
- Categories
- Text channels
- Voice channels
- Stage channels
- Threads
- Roles & permissions
- Invites
- Audit logs

**Messaging**
- Real-time WebSocket messaging
- Replies, reactions, mentions
- Rich embeds
- File uploads
- Edit/delete
- Pinned messages
- Indexed search
- Slowmode
- Typing indicators

**Voice & Streaming**
- WebRTC voice channels
- 1080p screen sharing
- 1080p video streaming
- Adaptive bitrate
- Noise suppression
- Echo cancellation

**User System**
- Friends & requests
- DMs & group DMs
- Blocking
- Custom status
- Presence tracking

**Webhooks & Commands**
- Webhooks
- Slash command system
- Permission-based execution

---

## Bot System

Official SDK: **beacon.js** (Node.js only)

- Event-driven API
- Permission guards
- Rate limiting
- Slash command builder
- Embed builder
- Gateway + REST support
- Per-server isolated runtime
- Scheduled jobs
- Optional hosted bot sandbox
- Bot dashboard
- Free bot marketplace

---

## AI Moderation

Powered by SWI-Prolog (rule-based, context-aware)

**Allowed**
- Swearing
- Dark humor
- Drug jokes
- Mild NSFW
- Educational sensitive discussions

**Prohibited**
- Child exploitation material
- Real illegal coordination
- Drug selling
- Terrorism support
- Credible threats

**System**
- Context-aware analysis
- Confidence scoring
- Conversation history evaluation
- Explainable moderation logs
- Human review fallback

**Escalation**
Warning → Restriction → Mute → Review → Ban

No automatic law enforcement reporting.

---

## Performance Architecture

- Optimized eager loading (channels, messages, presence)
- Redis caching for presence, sessions, rate limiting
- Indexed DB queries
- Message batching
- Optional binary protocol
- C++ modules handle:
  - Binary serialization (Protobuf/FlatBuffers)
  - Compression (Zstd/Brotli)
  - Packet batching
  - High-speed rate limiting
  - Media frame optimization

**Performance Targets**
- <400MB RAM (Windows idle)
- <250MB RAM (Android idle)

---

## Media Handling

- Cloudinary for media storage  
- Video uploads limited to **≤5 minutes or 500MB**  
- Optional fallback: ClawCloud Run as secondary server if Railway approaches full load  

---

## Search System

- PostgreSQL & MongoDB indexing
- **Meilisearch** (ClawCloud Run) for fast full-text search
- Channel/server scoped search
- Fuzzy search supported

---

## Observability & Monitoring

- Structured logging
- Error tracking
- Gateway performance metrics
- Memory & CPU usage tracking
- Admin dashboard for system health
- Rate-limit monitoring
- Moderation event logging

---

## Infrastructure (Free-Tier)

**Primary Host (Railway)**
- Node.js API + WebSocket gateway
- Redis cache
- AI moderation (optional)

**Backup / Heavy Modules (ClawCloud Run)**
- Meilisearch
- AI moderation (resource-heavy)
- Optional bot sandbox
- Optional media transcoding

**Database**
- MongoDB Atlas (2 free accounts)
- PostgreSQL (Supabase free-tier)
- Cloudinary (media storage)

**Other Services**
- GitHub (repo + APK/EXE releases)

- Optional ClawCloud server used only as backup if Railway is full  
- No billing required  
- No paid services  
- No hidden costs

---

## UI / UX

Discord-familiar layout with improvements:

- Softer rounded buttons
- Cleaner spacing
- Less clutter
- Smooth animations
- Fully responsive
- Dark & light modes [Custom themes/backgrounds, glassmorphism support, vibrant etc)

---