# ClawCloud Launchpad Configuration

## Image Name
```
ghcr.io/raft-the-crab/beacon-server:latest
```
OR if using Docker Hub:
```
yourusername/beacon-server:latest
```

---

## Command Arguments
```
npx tsx src/index.ts
```

---

## Environment Variables

```
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public

MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority

REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216

CLOUDINARY_CLOUD_NAME=dvbag0oy5

CLOUDINARY_API_KEY=182285414774756

CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0

JWT_SECRET=beacon-production-secret-2026

PORT=8080

NODE_ENV=production

NODE_OPTIONS=--max-old-space-size=384

CORS_ORIGIN=https://beaconserver-production.up.railway.app

SOVEREIGNTY_LEVEL=3

SMS_BRIDGE_ENABLED=true
```

---

## ConfigMaps (Optional)
Leave empty or add:
```
Name: beacon-config
Data:
  app.name: Beacon
  app.version: 2.3.0
```

---

## Resource Limits
```
CPU: 1000m (1 vCPU)
Memory: 512Mi
```

---

## Port Configuration
```
Container Port: 8080
Protocol: TCP
```

---

## Health Check
```
Path: /health
Port: 8080
Initial Delay: 30s
Period: 30s
Timeout: 5s
```

---

## Quick Copy-Paste Format

**Image:** `ghcr.io/raft-the-crab/beacon-server:latest`

**Command:** `npx tsx src/index.ts`

**Environment Variables (one per line):**
```
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
JWT_SECRET=beacon-production-secret-2026
PORT=8080
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=384
CORS_ORIGIN=https://beaconserver-production.up.railway.app
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true
```

---

## Before Deploying to ClawCloud

### 1. Build and Push Docker Image

```bash
cd apps/server

# Build
docker build -f Dockerfile.optimized -t beacon-server:latest .

# Tag for GitHub Container Registry
docker tag beacon-server:latest ghcr.io/raft-the-crab/beacon-server:latest

# Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u raft-the-crab --password-stdin

# Push
docker push ghcr.io/raft-the-crab/beacon-server:latest
```

### 2. Make Image Public (if needed)
Go to GitHub → Packages → beacon-server → Package settings → Change visibility to Public

---

## ClawCloud Launchpad Steps

1. **Click "New Application"**
2. **Image Name:** `ghcr.io/raft-the-crab/beacon-server:latest`
3. **Command:** `npx tsx src/index.ts`
4. **Add Environment Variables** (copy from above)
5. **Set Resources:** 1 vCPU, 512MB RAM
6. **Port:** 8080
7. **Click "Launch"**

---

## Verify Deployment

```bash
# Health check
curl https://your-clawcloud-url/health

# Should return:
# {"status":"healthy","timestamp":"...","services":{...}}
```

---

**Ready to deploy to ClawCloud!** 🚀
