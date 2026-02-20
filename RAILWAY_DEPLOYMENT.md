# 🚀 Railway Deployment Guide for Beacon

This guide explains how to deploy the Beacon server to Railway and ensure it stays running 24/7.

## 📦 Prerequisites

1.  **Railway CLI**: Install it via `npm i -g @railway/cli`.
2.  **Login**: Run `railway login`.
3.  **Project Linked**: Ensure you have run `railway link` in the root of the project.

## 🛠️ Step 1: Deployment

To deploy the current codebase to Railway, run the following command from the project root:

```bash
npm run deploy:server
```

This script executes `cd apps/server && railway up`, which packages your server and pushes it to Railway's infrastructure.

## ⚙️ Step 2: Environment Variables

For the server to function correctly, you **must** configure the following variables in the Railway Dashboard (Variables tab):

| Variable | Description |
| :--- | :--- |
| `PORT` | Set to `8080` (or Railway will assign one) |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `REDIS_URL` | Your Redis connection string |
| `JWT_SECRET` | A secure random string for authentication |
| `NODE_ENV` | Set to `production` |
| `SOVEREIGNTY_LEVEL` | `3` (for Zero-Data mode optimization) |

## 🔄 Step 3: Keeping it Running (24/7)

Railway is a **managed platform**. This means:
1.  **Automatic Restarts**: If your server crashes, Railway will automatically attempt to restart it.
2.  **Health Checks**: The server includes a `/health` endpoint. Railway uses this to verify the server is responding.
3.  **Zero Downtime**: When you run `railway up`, Railway starts the new version before killing the old one.

### 📊 Monitoring Status

To check the logs and see if your server is running well:

```bash
# View live logs
railway logs

# Check service status
railway status
```

## 🤖 beacon.js (Bot SDK)

The **beacon.js** SDK is currently located in `packages/beacon-js`. 

- **Public Availability**: It is configured for the **npm public registry** (`beacon.js` v2.5.0).
- **To Publish**: If you want to push the latest version to npm, run:
  ```bash
  cd packages/beacon-js
  npm run publish:npm
  ```
- **To Install**: Once published, anyone can use it by running `npm install beacon.js`.
