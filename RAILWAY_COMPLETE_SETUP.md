# 🚂 Complete Railway Setup - Copy & Paste

## Step 1: Delete Wrong Services

Go to Railway dashboard and delete:
- ❌ android service
- ❌ desktop service

Keep only:
- ✅ @beacon/server

---

## Step 2: Configure @beacon/server

### Service Settings

**Root Directory:**
```
apps/server
```

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
node dist/src/index.js
```

**Dockerfile Path:**
```
apps/server/Dockerfile.optimized
```

---

## Step 3: Environment Variables

Copy ALL these variables to Railway:

### Database URLs
```env
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public

MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority

REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
```

### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=dvbag0oy5

CLOUDINARY_API_KEY=182285414774756

CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
```

### Security
```env
JWT_SECRET=beacon-production-secret-change-this-to-random-string-2026

CORS_ORIGIN=https://your-frontend-domain.com,https://beacon-server.up.railway.app
```

### Server Config
```env
PORT=8080

NODE_ENV=production

NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size
```

### Optional Features
```env
SOVEREIGNTY_LEVEL=3

SMS_BRIDGE_ENABLED=true
```

---

## Step 4: Deploy

Railway will auto-deploy when you:
```bash
git push origin main
```

Or click "Deploy" in Railway dashboard.

---

## Step 5: Get Your URL

After deployment:
1. Go to Settings → Networking
2. Click "Generate Domain"
3. Your API will be at: `https://beacon-server.up.railway.app`

---

## Step 6: Test Deployment

```bash
# Health check
curl https://beacon-server.up.railway.app/health

# Should return:
# {"status":"healthy","timestamp":"...","services":{...}}
```

---

## Step 7: Update CORS

Once you have your Railway URL:
1. Go back to Variables
2. Update `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://beacon-server.up.railway.app,https://your-frontend.com
```
3. Redeploy

---

## 📋 Quick Copy-Paste for Railway Variables

**Variable Name** → **Value**

```
DATABASE_URL → postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public

MONGO_URI → mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority

REDIS_URL → redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216

CLOUDINARY_CLOUD_NAME → dvbag0oy5

CLOUDINARY_API_KEY → 182285414774756

CLOUDINARY_API_SECRET → UKrMYaaeWJPaQwNs7YQn_3yeLt0

JWT_SECRET → beacon-production-secret-2026

PORT → 8080

NODE_ENV → production

NODE_OPTIONS → --max-old-space-size=384 --optimize-for-size

CORS_ORIGIN → https://your-frontend.com

SOVEREIGNTY_LEVEL → 3

SMS_BRIDGE_ENABLED → true
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Only 1 service on Railway (@beacon/server)
- [ ] Root directory set to `apps/server`
- [ ] All environment variables added
- [ ] Deployment successful (green checkmark)
- [ ] `/health` endpoint returns 200 OK
- [ ] All databases show "connected"
- [ ] No build errors in logs

---

## 🐛 Troubleshooting

### Build Fails
Check Railway logs for errors. Common fixes:
```bash
# If Prisma fails
npx prisma generate

# If build fails
npm run build
```

### Database Connection Errors
Verify connection strings are correct (no extra spaces)

### Server Crashes
Check `NODE_OPTIONS` is set correctly

---

## 💰 Cost

With optimizations:
- **Free Tier:** $5 credit/month (enough for 24/7 uptime)
- **Paid:** $7/month if you exceed free tier

---

## 🎯 Final Result

You should have:
- ✅ 1 Railway service (not 3)
- ✅ Server running on 512MB RAM
- ✅ All databases connected
- ✅ API accessible at Railway URL
- ✅ Cost: $0-7/month

**Done!** 🎉
