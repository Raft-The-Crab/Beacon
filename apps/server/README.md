# 📡 Beacon Server v2.5.0 (Node.js)

The core backend infrastructure for the Beacon platform, providing RESTful APIs, WebSocket gateways, and specialized media workers.

## 🏗️ Architecture

- **API Server** (`src/api-server.ts`): Handles REST endpoints, authentication, and database orchestrations.
- **WebSocket Gateway** (`src/ws-server.ts`): Managed real-time presence, messaging fanout, and voice state signaling.
- **AI/Media Service**: Specialized workers for content moderation and media metadata extraction.

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file with:
   - `DATABASE_URL` (PostgreSQL/Prisma)
   - `JWT_SECRET`
   - `REDIS_URL`
   - `FRONTEND_URL` (for CORS)

3. **Database Migration:**
   ```bash
   npx prisma migrate dev
   ```

4. **Run development:**
   ```bash
   npm run dev
   ```

## 🛡️ Security Features

- **CORS Hardening**: Dynamic origin validation for multi-cloud deployments.
- **Rate Limiting**: Tiered limiting for auth and general endpoints.
- **Security Headers**: Full Helmet.js integration.
- **Moderation**: SWI-Prolog rules engine for automated content safety.

## 🚀 Deployment

The Beacon Server is designed for containerized deployment in high-availability environments. It supports horizontal scaling across multiple regions and integrates with global CDNs for localized low-latency access.

---
*Beacon Server v2.5.0 — Performance, Stability, Security.*
