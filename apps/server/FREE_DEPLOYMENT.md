# 💰 FREE Deployment Guide - Zero Cost Setup

## 🎯 100% Free Deployment Options

All services below have **PERMANENT FREE TIERS** - no credit card trials!

---

## Option 1: Render.com (Recommended - Easiest)

### ✅ What's Free
- 750 hours/month free compute (enough for 1 server 24/7)
- 100GB bandwidth/month
- Automatic SSL
- Auto-deploy from GitHub
- **NO CREDIT CARD REQUIRED**

### Setup (5 minutes)

1. **Go to https://render.com**
2. **Sign up with GitHub**
3. **Create New Web Service**
   - Connect repository: `Raft-The-Crab/Beacon`
   - Root Directory: `apps/server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: **Free**

4. **Add Environment Variables:**
```env
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
JWT_SECRET=beacon-free-jwt-secret-2026
PORT=8080
NODE_ENV=production
```

5. **Click "Create Web Service"**

**Your API:** `https://beacon-server.onrender.com`

### ⚠️ Free Tier Limitations
- Spins down after 15 min inactivity (cold start ~30s)
- 512MB RAM
- Shared CPU

**Solution:** Use cron-job.org to ping `/health` every 10 minutes

---

## Option 2: Fly.io (Better Performance)

### ✅ What's Free
- 3 shared-cpu VMs (256MB RAM each)
- 160GB bandwidth/month
- Automatic SSL
- **NO CREDIT CARD REQUIRED**

### Setup (10 minutes)

1. **Install Fly CLI:**
```bash
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

2. **Login:**
```bash
fly auth signup  # or fly auth login
```

3. **Create fly.toml:**
```toml
app = "beacon-server"

[build]
  dockerfile = "Dockerfile.railway"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[services.concurrency]
  type = "connections"
  hard_limit = 25
  soft_limit = 20
```

4. **Set Secrets:**
```bash
cd apps/server
fly secrets set DATABASE_URL="postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres"
fly secrets set MONGO_URI="mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/"
fly secrets set REDIS_URL="redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216"
fly secrets set CLOUDINARY_CLOUD_NAME="dvbag0oy5"
fly secrets set CLOUDINARY_API_KEY="182285414774756"
fly secrets set CLOUDINARY_API_SECRET="UKrMYaaeWJPaQwNs7YQn_3yeLt0"
fly secrets set JWT_SECRET="beacon-fly-secret-2026"
```

5. **Deploy:**
```bash
fly deploy
```

**Your API:** `https://beacon-server.fly.dev`

---

## Option 3: Vercel (Serverless - Best for API)

### ✅ What's Free
- 100GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- Edge network (super fast)
- **NO CREDIT CARD REQUIRED**

### Setup (5 minutes)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Create vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/server/dist/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "apps/server/dist/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy:**
```bash
cd apps/server
npm run build
vercel --prod
```

4. **Set Environment Variables:**
```bash
vercel env add DATABASE_URL
vercel env add MONGO_URI
vercel env add REDIS_URL
# ... add all env vars
```

**Your API:** `https://beacon-server.vercel.app`

---

## 🆓 Free Database Options (Already Using!)

### PostgreSQL - Supabase ✅
- **Free Tier:** 500MB database, unlimited API requests
- **Already configured!**

### MongoDB - Atlas ✅
- **Free Tier:** 512MB storage, shared cluster
- **Already configured!**

### Redis - Redis Cloud ✅
- **Free Tier:** 30MB storage
- **Already configured!**

### Media - Cloudinary ✅
- **Free Tier:** 25GB storage, 25GB bandwidth/month
- **Already configured!**

---

## 🔧 Optimization for Free Tiers

### 1. Reduce Memory Usage

Add to `apps/server/src/index.ts`:
```typescript
// Optimize for free tier
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = '--max-old-space-size=256'
}
```

### 2. Keep Server Awake (Render/Fly)

Use **cron-job.org** (free):
1. Go to https://cron-job.org
2. Create account (free)
3. Add job:
   - URL: `https://your-server.onrender.com/health`
   - Interval: Every 10 minutes
   - Method: GET

### 3. Optimize Docker Image

Update `Dockerfile.railway`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY ai ./ai
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/src/index.js"]
```

---

## 📊 Cost Comparison

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **Render** | ✅ 750hrs/month | $7/month |
| **Fly.io** | ✅ 3 VMs free | $1.94/month per VM |
| **Vercel** | ✅ 100GB bandwidth | $20/month |
| **Supabase** | ✅ 500MB DB | $25/month |
| **MongoDB Atlas** | ✅ 512MB | $9/month |
| **Redis Cloud** | ✅ 30MB | $5/month |
| **Cloudinary** | ✅ 25GB | $0 (enough!) |

**Total Cost:** **$0/month** on free tiers! 🎉

---

## 🚀 Recommended Setup (100% Free)

1. **Backend:** Render.com (free tier)
2. **Databases:** Already using free tiers ✅
3. **Keep-Alive:** cron-job.org (free)
4. **Monitoring:** UptimeRobot (free - 50 monitors)
5. **Domain:** Freenom (free .tk/.ml domains)

**Total Monthly Cost: $0** 💰

---

## 🎯 Quick Deploy Commands

### Render (Easiest)
```bash
# Just connect GitHub repo in dashboard
# No commands needed!
```

### Fly.io (Best Performance)
```bash
fly auth signup
cd apps/server
fly launch --no-deploy
fly secrets set DATABASE_URL="..." MONGO_URI="..." REDIS_URL="..."
fly deploy
```

### Vercel (Serverless)
```bash
npm install -g vercel
cd apps/server
npm run build
vercel --prod
```

---

## 💡 Pro Tips

1. **Use Render** if you want easiest setup
2. **Use Fly.io** if you want better performance
3. **Use Vercel** if you want serverless (scales to zero)
4. **All are 100% free** - no credit card needed!
5. **Set up cron-job.org** to keep server awake

---

## ✅ Success Checklist

- [ ] Choose platform (Render recommended)
- [ ] Deploy backend
- [ ] Set environment variables
- [ ] Test `/health` endpoint
- [ ] Set up cron-job.org keep-alive
- [ ] Verify all databases connect
- [ ] Test WebSocket gateway
- [ ] Update frontend API URL

**You're now running Beacon 100% FREE!** 🎊
