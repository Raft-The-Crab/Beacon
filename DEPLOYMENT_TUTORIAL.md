# 🛰️ Beacon Sovereign Core: Deployment Guide

Welcome to the internal deployment guide for the Beacon protocol. This tutorial handles the setup of the primary API, WebSocket, and Analytics nodes.

## 🛠️ Infrastructure Requirements

- **Node.js**: v18.0.0+ (LTS Recommended)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 6.2+
- **Runtime**: `tsx` (installed via `npm install -g tsx`)

## 📦 Environment Configuration

Create a `.env` file in the root directory (never commit this) with the following parameters:

### 🚂 RAILWAY - Gateway Node (`server-railway.js`)
**Recommended for: Real-time, WebRTC, High Concurrency**

```bash
# Core Databases
DATABASE_URL="postgresql://postgres:Alixisjacob12345%2A@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public"
MONGO_URI="mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority"
REDIS_URL="redis://default:2cpn5kar@test-db-redis.m-gum54yuy.wc:6379"

# Media Storage
CLOUDINARY_CLOUD_NAME="dvbag0oy5"
CLOUDINARY_API_KEY="182285414774756"
CLOUDINARY_API_SECRET="UKrMYaaeWJPaQwNs7YQn_3yeLt0"

# Security & Governance
JWT_SECRET="83202d154d1ad4dc90c3b2b5603b81cd762f73cd56240bbf7ba72326ce6a71a5b"
CORS_ORIGIN="https://beacon.app,https://www.beacon.app"
NODE_ENV="production"
PORT=8080
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true
```

### ☁️ RENDER - API Node (`server-render.js` or `server-azure.js`)
**Recommended for: REST API, Auth, Documentation, Analytics**

```bash
# Core Databases
DATABASE_URL="postgresql://postgres:Alixisjacob12345%2A@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public"
MONGO_URI="mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority"
REDIS_URL="redis://default:2cpn5kar@test-db-redis.m-gum54yuy.wc:6379"

# Media Storage
CLOUDINARY_CLOUD_NAME="dvbag0oy5"
CLOUDINARY_API_KEY="182285414774756"
CLOUDINARY_API_SECRET="UKrMYaaeWJPaQwNs7YQn_3yeLt0"

# Security & Auth
JWT_SECRET="83202d154d1ad4dc90c3b2b5603b81cd762f73cd56240bbf7ba72326ce6a71a5b"
CORS_ORIGIN="https://beacon.app,https://www.beacon.app"
NODE_ENV="production"

# Protocols
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true
BEACOIN_WEBHOOK_SECRET="95c3c8007527f2cca8ffbd2c2b218666"
```

## 🚀 Launching the Cluster

Beacon uses proprietary entry points for each hosting environment. Use the following commands to start your nodes:

### 1. Main API Node (User/Auth/Control)
Recommended for **Azure App Service** or **Standard VPC**.
```bash
node apps/server/server-azure.js
```

### 2. Gateway Node (Real-time/WebRTC/Presence)
Recommended for **Railway** or high-concurrency environments.
```bash
node apps/server/server-railway.js
```

### 3. Analytics Node (Audit/Economy/Logs)
Recommended for **Render** or background worker instances.
```bash
node apps/server/server-render.js
```

## 🛡️ Proprietary Protection

The `server-*.js` scripts are obfuscated to protect the Sovereign Core boot sequence. Do not attempt to deobfuscate as it may trigger protocol corruption modules.

## 📦 Beacon SDK Usage

To interact with your new servers using the unified SDK:

```typescript
import { BeaconClient } from 'beacon.js';

const beacon = new BeaconClient({
  apiUrl: 'https://your-api.com',
  wsUrl: 'wss://your-gateway.com',
  token: 'YOUR_ACCESS_TOKEN'
});

await beacon.connect();
```

---
© 2026 Beacon Communication Platform. Proprietary Engine.
