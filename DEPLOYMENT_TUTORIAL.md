# 🛰️ Beacon Sovereign Core: Deployment Guide

Welcome to the internal deployment guide for the Beacon protocol. This tutorial handles the setup of the primary API, WebSocket, and Analytics nodes.

## 🛠️ Infrastructure Requirements

- **Node.js**: v18.0.0+ (LTS Recommended)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 6.2+
- **Runtime**: `tsx` (installed via `npm install -g tsx`)

## 📦 Environment Configuration

Create a `.env` file in the root directory (never commit this) with the following parameters:

```bash
# Core Connection Strings
DATABASE_URL="postgresql://user:pass@localhost:5432/beacon"
REDIS_URL="redis://localhost:6379"

# Security & Proxy
JWT_SECRET="your_ultra_secret_keys"
INTERNAL_API_KEY="protocol_handshake_key"

# Integrations (Optional)
CLOUDINARY_URL="cloudinary://..." # For Image Processing
BEACOIN_WEBHOOK_SECRET="beacoin_internal_sync"
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
