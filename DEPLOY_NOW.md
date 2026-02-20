# 🚀 FINAL DEPLOYMENT INSTRUCTIONS

## ✅ What's Done

1. ✅ Code committed and pushed to GitHub
2. ✅ Railway configuration ready (railway.json, nixpacks.toml)
3. ✅ ClawCloud K8s config created (k8s/clawcloud-ai-sms.yaml)
4. ✅ App icon created (assets/icon.svg)
5. ✅ All frontend improvements complete
6. ✅ Health endpoint working
7. ✅ Keep-alive implemented

## 🚂 Railway Deployment (Main Backend)

### Step 1: Create Railway Project
```bash
# In Railway dashboard (https://railway.app):
# 1. Click "New Project"
# 2. Select "Deploy from GitHub repo"
# 3. Choose "Raft-The-Crab/Beacon"
# 4. Railway will auto-detect and deploy
```

### Step 2: Set Environment Variables
In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=8080

# Databases
DATABASE_URL=your_postgres_url
MONGODB_URI=your_mongodb_url
REDIS_URL=your_redis_url

# Auth
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# CORS
CORS_ORIGIN=https://your-domain.com

# Optional: AI Service
AI_SERVICE_URL=https://ai.beacon.app
```

### Step 3: Deploy
Railway will automatically deploy when you push to GitHub.

Or manually:
```bash
railway up
```

### Step 4: Check Deployment
```bash
railway logs
railway status
railway open
```

## ☁️ ClawCloud Deployment (AI & SMS - Optional)

### Recommendation: Deploy AI/SMS to ClawCloud

**Why separate:**
- AI moderation is CPU-intensive
- SMS bridge needs isolation
- Main API stays fast
- Can scale independently

### Deploy to ClawCloud:

1. **Update secrets in k8s/clawcloud-ai-sms.yaml**
2. **Apply configuration:**
```bash
kubectl apply -f k8s/clawcloud-ai-sms.yaml
```

3. **Check status:**
```bash
kubectl get pods
kubectl get services
kubectl logs -f deployment/beacon-ai-sms
```

4. **Get external IP:**
```bash
kubectl get service beacon-ai-service
```

5. **Update Railway environment:**
```bash
AI_SERVICE_URL=http://<external-ip>
```

## 🎯 Architecture Summary

```
┌─────────────────────────────────────────┐
│           User Requests                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Railway (Main Backend)          │
│  - API Server                           │
│  - WebSocket Gateway                    │
│  - Authentication                       │
│  - Message Handling                     │
│  - File Uploads                         │
└─────────────┬───────────────────────────┘
              │
              │ (Optional)
              ▼
┌─────────────────────────────────────────┐
│      ClawCloud (AI & SMS Bridge)        │
│  - AI Moderation                        │
│  - Video Processing                     │
│  - SMS Bridge                           │
└─────────────────────────────────────────┘
```

## 📊 What Runs Where

### Railway (Required)
- ✅ Main API
- ✅ WebSocket
- ✅ Auth
- ✅ Messages
- ✅ Channels
- ✅ File uploads

### ClawCloud (Optional)
- ⚠️ AI Moderation
- ⚠️ Video Processing
- ⚠️ SMS Bridge

## 🎯 Recommended Approach

**Phase 1: Railway Only**
1. Deploy main backend to Railway
2. Test all features
3. Monitor performance

**Phase 2: Add ClawCloud (if needed)**
1. Deploy AI/SMS to ClawCloud
2. Connect services
3. Test integration

## 🔧 Railway Environment Variables Template

Copy this to Railway dashboard:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host:5432/beacon
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/beacon
REDIS_URL=redis://default:pass@host:6379
JWT_SECRET=your_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CORS_ORIGIN=https://beacon.app
```

## ✅ Deployment Checklist

- [x] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health endpoint responding
- [ ] WebSocket connecting
- [ ] Database connections working
- [ ] (Optional) ClawCloud deployed
- [ ] (Optional) Services connected

## 🆘 Troubleshooting

### Railway Crashes
```bash
railway logs
# Check: PORT=8080, DATABASE_URL set
```

### Build Fails
```bash
# Check nixpacks.toml and railway.json
# Ensure pnpm is used
```

### Database Connection Issues
```bash
# Verify connection strings
# Check firewall rules
# Test locally first
```

## 📞 Next Steps

1. Go to https://railway.app
2. Create new project from GitHub
3. Select Beacon repository
4. Set environment variables
5. Deploy!

---

**Your app is ready to deploy! 🎉**

**Main Backend → Railway** (Start here)
**AI & SMS → ClawCloud** (Add later if needed)
