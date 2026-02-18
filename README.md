# Beacon

**Beacon** is a fully free, cross-platform real-time communication platform built as a Discord alternative with advanced bot support, AI moderation, and native performance optimization.

## 🚀 Supported Platforms

- **Windows 10/11**: Native desktop app via Tauri
- **Android 11+**: Mobile app via Capacitor
- **Web**: Progressive Web App (React 19 + TypeScript + Vite)

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** for blazing fast builds
- Zustand for state management
- WebRTC for voice/video

### Backend
- **Node.js** (API + WebSocket Gateway)
- **PostgreSQL** (Supabase) - User data, guilds, roles
- **MongoDB** (2 clusters) - Messages & audit logs
- **Redis** (Cloud) - Caching, sessions, presence
- **Cloudinary** - Media storage
- **SWI-Prolog 10.0** - AI moderation engine

### Infrastructure
- **Railway** - Primary API & Gateway hosting
- **Supabase** - PostgreSQL database
- **MongoDB Atlas** - 2 free clusters for message storage
- **Redis Labs** - Caching and real-time state
- **Cloudinary** - Media CDN
- **GitHub** - Source control + APK/EXE releases

## 🎯 Features

### Core Messaging
- Real-time WebSocket messaging
- Rich embeds, file uploads (up to 500MB)
- Replies, reactions, mentions, threads
- Message search (Meilisearch)
- Pinned messages, edit/delete

### Voice & Video
- WebRTC voice channels
- 1080p screen sharing & video streaming
- Noise suppression, echo cancellation

### Social
- Friends & friend requests
- Direct messages & group DMs
- Blocking, custom status
- Presence tracking

### Servers (Guilds)
- Text, voice, stage channels
- Categories, threads
- Role-based permissions (bitfield)
- Audit logs
- Invites, webhooks

### Bot System
- Official **beacon.js** SDK (Node.js only)
- Slash commands, event-driven API
- Per-server isolated runtime
- Developer Portal (enable in Settings → Advanced)
- Free bot marketplace

### AI Moderation
- SWI-Prolog rule-based engine
- Context-aware, conversation history analysis
- Explainable decisions, human review fallback
- No automatic law enforcement reporting

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ (or Bun)
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/Raft-The-Crab/Beacon.git
cd Beacon

# Install dependencies
npm install

# Set up environment variables
cp apps/server/.env.example apps/server/.env
# Edit .env with your credentials

# Run development servers
npm run dev:web      # Frontend (http://localhost:5173)
npm run dev:server   # Backend API & Gateway
```

### Environment Setup

Create `apps/server/.env`:

```env
# PostgreSQL (Supabase)
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# MongoDB
MONGO_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&&w=majority"

# Redis
REDIS_URL="redis://default:PASSWORD@HOST:PORT"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Security
JWT_SECRET="your-secret-key"
PORT="4000"
NODE_ENV="development"
```

## 📦 Deployment

### Backend (Railway)

1. Push code to GitHub
2. Connect Railway to your repo
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

### Database (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Copy DATABASE_URL
3. Run migrations: `npx prisma migrate deploy`

### Releases (GitHub)

- **APK**: Build with `npm run build:android` → Upload to GitHub Releases
- **EXE**: Build with `npm run build:desktop` → Upload to GitHub Releases

## 🔑 Architecture

```
User Client (Web/Desktop/Mobile)
    ↓ WebSocket
Gateway (Railway)
    ↓
┌─────────────┬─────────────┬──────────────┐
PostgreSQL    MongoDB       Redis         Cloudinary
(Supabase)    (Atlas x2)    (Cloud)      (Media CDN)
Users/Guilds  Messages/Logs Cache/Sessions Images/Videos
```

## 🛡️ License

**PROPRIETARY** - Source code is confidential. See [LICENSE](LICENSE) for details.

Authorized for deployment on:
- Railway (API/Gateway)
- Supabase (Database)
- MongoDB Atlas (Messages)
- Redis Labs (Cache)
- Cloudinary (Media)

For licensing inquiries, contact: [Your Email]

---

**Note**: This project is closed-source. Do not redistribute or publicly disclose the source code.
