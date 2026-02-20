# 🚀 BEACON v1.0 - COMPLETE SETUP & DEPLOYMENT

## 🎯 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
# Copy example env files
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env
```

### 3. Start Development
```bash
# Terminal 1 - Backend
cd apps/server
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

---

## 🚂 Railway Deployment (Production)

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository
- Database services ready (PostgreSQL, MongoDB, Redis)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Create Railway Project
```bash
railway init
railway link
```

### Step 3: Set Environment Variables
```bash
# Set all required variables
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set DATABASE_URL="your_postgres_url"
railway variables set MONGODB_URI="your_mongodb_url"
railway variables set REDIS_URL="your_redis_url"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set CORS_ORIGIN="https://your-domain.com"
```

### Step 4: Deploy
```bash
railway up
```

### Step 5: Check Status
```bash
railway status
railway logs
```

---

## 📱 Mobile & Desktop Build

### Android (Capacitor)
```bash
cd apps/mobile
pnpm build
npx cap sync android
npx cap open android
# Build APK in Android Studio
```

### Windows (Tauri)
```bash
cd apps/desktop
pnpm tauri build
# Output: src-tauri/target/release/beacon.exe
```

---

## 🔧 Fix IDE Problems

Run type checking:
```bash
cd apps/web
pnpm tsc --noEmit

cd apps/server
pnpm tsc --noEmit
```

---

## 📦 Git Commit & Push

```bash
# Add all files
git add .

# Commit
git commit -m "feat: Beacon v1.0 stable release - minimalistic design, Railway ready"

# Push
git push origin main
```

---

## 🎨 App Icons Generated

Icons are in `/assets/icon.svg` - use online converters:
- Android: https://romannurik.github.io/AndroidAssetStudio/
- Windows: https://www.icoconverter.com/

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Health endpoint working (/health)
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled
- [ ] Git repository pushed
- [ ] Railway project linked

---

## 🆘 Troubleshooting

### Railway Crashes
```bash
# Check logs
railway logs

# Common fixes:
# 1. Ensure PORT=8080 (Railway requirement)
# 2. Check DATABASE_URL is set
# 3. Verify build command in railway.json
```

### Build Fails
```bash
# Clear cache
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## 📞 Support

- GitHub Issues: https://github.com/Raft-The-Crab/Beacon/issues
- Email: support@beacon.app
