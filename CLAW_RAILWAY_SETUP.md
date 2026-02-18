# 🚀 Deployment Guide: Claw Cloud Run & Railway

This guide covers setting up the Beacon backend on **Claw Cloud Run** and **Railway**.

---

## 🌩️ Claw Cloud Run Setup

Claw Cloud Run is a powerful container-based hosting platform that provides a "Cloud OS" experience with an integrated terminal.

### 1. Account & Project Setup
1. Sign up at [Claw.cloud](https://claw.cloud).
2. Create a new project named `beacon`.
3. Open the **Claw Console** (Terminal).

### 2. Environment Configuration
In the Claw Cloud Dashboard, navigate to **Environment Variables** and add:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random string.
- `REDIS_URL`: Your Redis connection string.
- `PORT`: `8080` (Standard for Claw Cloud Run).

### 3. Deployment via CLI (Terminal)
You can deploy directly using the `gcloud`-compatible CLI provided in the Claw terminal:

```bash
# Clone the repository
git clone https://github.com/your-username/beacon.git
cd beacon

# Run the deployment script
bash scripts/deploy-clawcloudrun.sh
```

### 4. Continuous Deployment
Link your GitHub repository in the Claw Dashboard under the **Deployments** tab. Claw will automatically build and deploy every time you push to `main`.

---

## 🚂 Railway Setup

Railway is the fastest way to deploy modern apps with automatic infrastructure management.

### 1. One-Click Setup
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your `beacon` repository.

### 2. Infrastructure
Railway will automatically detect your `apps/server/Dockerfile` or `package.json`.
- It will provision a **PostgreSQL** and **Redis** instance if you add them to your project via the "New" button.
- Railway will automatically inject `DATABASE_URL` and `REDIS_URL` if you link the services.

### 3. Deployment via Script
From your local machine, you can use the provided PowerShell script:

```powershell
./scripts/deploy-server.ps1
```

### 4. Custom Domains
In your Backend service settings on Railway, go to **Networking** and click **Generate Domain** to get your public API URL.

---

## 🛠️ Deployment Troubleshooting

- **Migrations**: Ensure you run `npx prisma migrate deploy` before the server starts. The deployment scripts handle this automatically.
- **Port Matching**: Claw Cloud Run expects the app to listen on the port provided in the `$PORT` environment variable (usually `8080`).
- **Health Checks**: The server includes a `/health` endpoint that both platforms use to verify the instance is running.

---

## 📜 Key Deployment Files
- `apps/server/Dockerfile`: Container configuration.
- `apps/server/railway.json`: Railway-specific build settings.
- `scripts/deploy-clawcloudrun.sh`: Automated bash script for Claw.
- `scripts/deploy-server.ps1`: Automated PowerShell script for Railway.
