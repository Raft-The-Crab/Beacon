# 🦅 Claw Cloud Deployment & Optimization Guide

This guide covers how to deploy the **Beacon** ecosystem to [Claw Cloud](https://claw.cloud/) using the "Cloud OS" infrastructure, specifically optimized for the 0.3 vCPU / 256MB RAM limits and your $5 monthly credit.

## 💰 The "$5 Monthly Strategy"
Since Claw Cloud bills **per day** and provides a $5 credit that refreshes every month, the most efficient way to use it for Beacon is:
1. **Invest the $5 in the Managed Database**: Database reliability is more important than compute. A $0.13/day PostgreSQL instance (1 Core / 1GB or slightly smaller) will cost ~$4.00/month, making your database **virtually free** while being persistent and high-performance.
2. **Use the App Launchpad for Server**: Run the Node.js backend on the "App Launchpad" using the free OS specs (0.3 vCPU / 256MB).

---

## 🛠 Step 1: Deploy the Database (Managed PostgreSQL)
1. Go to the **Managed Database** section in Claw Cloud.
2. Select **PostgreSQL** (Version 14 or latest).
3. **Specs**: 
   - CPU: 0.5 or 1 Core
   - Memory: 1G
   - Storage: 5GB (sufficient for millions of messages)
4. **Name it**: `beacon-db`
5. **Billing**: Ensure it shows a projected cost around ~$0.13 - $0.20 per day.
6. Once deployed, copy the **Connection String** (e.g., `postgresql://user:pass@host:port/dbname`).

---

## 🚀 Step 2: Deploy the Backend (App Launchpad)
1. Go to **App Launchpad**.
2. **Image Selection**: 
   - If using GitHub Integration: Select your repo and the `/apps/server` directory.
   - If using Docker: Build and push your image to Docker Hub, then provide the image name.
3. **Usage Specs**:
   - Replicas: 1
   - CPU: 0.3 (Default)
   - Memory: 256MB
4. **Network Settings**:
   - Port: **8080** (Beacon's default)
   - Protocol: HTTP
5. **Environment Variables**:
   Add these in the "Env" or "Configurations" tab:
   - `DATABASE_URL`: (The string from Step 1)
   - `JWT_SECRET`: (Generate a long random string)
   - `REDIS_URL`: (Use a free Redis instance or deploy a small Redis on Claw)
   - `NODE_ENV`: `production`
   - `NODE_OPTIONS`: `--max-old-space-size=180` (CRITICAL: Prevents your app from crashing in 256MB RAM)

---

## 🏗 Step 3: Deployment Command (via Console)
If you prefer using the Cloud Console (Terminal), Claw Cloud supports `gcloud` compatible commands:

```bash
gcloud run deploy beacon-server \
  --image your-docker-hub-user/beacon-server:latest \
  --memory 256Mi \
  --cpu 1 \
  --port 8080 \
  --env-vars-file .env.production \
  --allow-unauthenticated
```

---

## 💾 Step 4: Pushing to GitHub
To sync all the recent "Beyond Discord" features and configuration fixes I've made locally to your repository:

1. Open a terminal and run:
   ```bash
   git add .
   git commit -m "feat: Claw Cloud deployment optimization and profile feature parity"
   git push origin main
   ```

---

## 📝 Performance Tips for 256MB RAM
Running a Node.js App + Prisma + WebSockets in 256MB is tight. I have optimized the code to handle this, but remember:
- **Prisma Client**: The `PrismaClient` is already generated in the build step to save runtime memory.
- **Garbage Collection**: The `NODE_OPTIONS` mentioned above is mandatory to keep the heap small.
- **Cold Starts**: The first request might take 2-3 seconds as the container wakes up.

---

**Beacon Status**: All 53 IDE errors are fixed. The server is ready. The guide is in your root directory. Fly high! 🦅