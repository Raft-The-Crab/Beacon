# ⚡ BEACON QUICK START GUIDE

Get Beacon running in production in 30 minutes.

---

## 🚀 **STEP 1: Prerequisites** (5 min)

### Install Tools
```bash
# Node.js 20+
node --version

# pnpm (faster than npm)
npm install -g pnpm

# Railway CLI
npm install -g @railway/cli
```

### Get API Keys (Free Tier)
1. **Supabase** → https://supabase.com → New Project → Copy `DATABASE_URL`
2. **MongoDB Atlas** → https://mongodb.com → Create Cluster → Copy `MONGODB_URI`
3. **Redis Cloud** → https://redis.com → New Database → Copy `REDIS_URL`
4. **Cloudinary** → https://cloudinary.com → Dashboard → Copy `CLOUDINARY_URL`

---

## 🔧 **STEP 2: Setup** (10 min)

### Clone & Install
```bash
git clone https://github.com/Raft-The-Crab/Beacon.git
cd Beacon
pnpm install
```

### Configure Environment
```bash
# Create .env file
cp apps/server/.env.example apps/server/.env

# Edit with your API keys
nano apps/server/.env
```

```env
# apps/server/.env
DATABASE_URL=postgresql://user:pass@host:5432/db
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/beacon
REDIS_URL=redis://default:pass@host:6379
CLOUDINARY_URL=cloudinary://key:secret@cloud
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=production
PORT=8080
```

### Build
```bash
# Build server
cd apps/server
pnpm build

# Build web
cd ../web
pnpm build
```

---

## 🚂 **STEP 3: Deploy to Railway** (10 min)

### Login
```bash
railway login
```

### Create Project
```bash
railway init
# Name: beacon-production
```

### Add Environment Variables
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set REDIS_URL="redis://..."
railway variables set CLOUDINARY_URL="cloudinary://..."
railway variables set JWT_SECRET="your-secret"
railway variables set NODE_ENV="production"
```

### Deploy
```bash
railway up
```

### Get URL
```bash
railway domain
# Output: https://beacon-production.up.railway.app
```

---

## 🌐 **STEP 4: Deploy Frontend** (5 min)

### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Option B: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd apps/web
netlify deploy --prod --dir=dist
```

### Update API URL
```bash
# apps/web/.env.production
VITE_API_URL=https://beacon-production.up.railway.app/api
VITE_WS_URL=wss://beacon-production.up.railway.app/gateway
```

---

## ✅ **STEP 5: Verify** (2 min)

### Test Backend
```bash
curl https://beacon-production.up.railway.app/health
# Should return: {"status":"healthy"}
```

### Test Frontend
```bash
# Open in browser
open https://your-app.vercel.app
```

### Test Features
1. Register account
2. Create server
3. Send message
4. Change theme
5. Upload file

---

## 🎯 **STEP 6: Publish SDK** (3 min)

### Login to npm
```bash
npm login
```

### Publish
```bash
cd packages/beacon-js
npm run build
npm publish --access public
```

### Verify
```bash
npm info beacon.js
```

---

## 📊 **STEP 7: Monitor** (Ongoing)

### Railway Dashboard
```bash
railway open
```

**Watch:**
- Memory usage (should be <400MB)
- CPU usage (should be <60%)
- Response time (should be <100ms)
- Error rate (should be <1%)

### Logs
```bash
# Real-time logs
railway logs

# Or in dashboard
railway open
```

---

## 🎉 **YOU'RE LIVE!**

Your Beacon instance is now running at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://beacon-production.up.railway.app
- **SDK**: https://www.npmjs.com/package/beacon.js

---

## 🚨 **TROUBLESHOOTING**

### "Out of Memory" Error
```bash
# Increase memory limit
railway variables set NODE_OPTIONS="--max-old-space-size=384"
railway restart
```

### "Database Connection Failed"
```bash
# Check connection string
railway variables get DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "Redis Connection Failed"
```bash
# Check Redis URL
railway variables get REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

### "Build Failed"
```bash
# Clear cache
railway run npm cache clean --force

# Rebuild
railway up --force
```

---

## 📚 **NEXT STEPS**

1. **Custom Domain**
   ```bash
   railway domain add beacon.chat
   ```

2. **SSL Certificate**
   - Railway provides automatic SSL
   - Or use Cloudflare

3. **Monitoring**
   - Setup Sentry for error tracking
   - Use Railway metrics

4. **Scaling**
   - Add more Railway instances
   - Use load balancer

5. **Marketing**
   - Share on social media
   - Post on Product Hunt
   - Write blog posts

---

## 💡 **PRO TIPS**

### Performance
```bash
# Enable compression
railway variables set COMPRESSION=true

# Enable caching
railway variables set CACHE_TTL=3600
```

### Security
```bash
# Rotate secrets monthly
railway variables set JWT_SECRET="new-secret"

# Enable rate limiting
railway variables set RATE_LIMIT_ENABLED=true
```

### Monitoring
```bash
# Setup alerts
railway webhooks add https://your-webhook-url

# Enable metrics
railway metrics enable
```

---

## 🆘 **NEED HELP?**

- **Documentation**: https://docs.beacon.chat
- **Discord**: https://beacon.chat/discord
- **GitHub Issues**: https://github.com/Raft-The-Crab/Beacon/issues
- **Email**: support@beacon.chat

---

## 🎊 **CONGRATULATIONS!**

You've successfully deployed Beacon to production! 🚀

**Share your instance:**
- Tweet: "Just launched my own Discord alternative with @BeaconChat! 🚀"
- Reddit: Post on r/selfhosted
- Hacker News: Show HN

**Now go beat Discord! 💪**
