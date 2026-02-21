# 🚂 Railway Deployment - What Should Be Deployed?

## ❌ WRONG: You have 3 services on Railway

Currently deployed:
1. @beacon/server ✅ (CORRECT - Backend API)
2. android ❌ (WRONG - This is a mobile app!)
3. desktop ❌ (WRONG - This is a desktop app!)

## ✅ CORRECT: Only deploy the SERVER

### What Each App Is:

**1. @beacon/server (Backend)**
- This is your API server
- Handles authentication, messages, database
- **SHOULD be on Railway** ✅
- Users connect to this via API

**2. android (Mobile App)**
- This is the Android mobile app
- Users install it on their phones
- **Should NOT be on Railway** ❌
- Deploy to: Google Play Store

**3. desktop (Desktop App)**
- This is the Tauri desktop app
- Users install it on their computers
- **Should NOT be on Railway** ❌
- Deploy to: GitHub Releases or your website

## 🔧 How to Fix Railway

### Step 1: Remove Wrong Services

1. Go to Railway dashboard
2. Delete the "android" service
3. Delete the "desktop" service
4. Keep only "@beacon/server"

### Step 2: Configure Server Correctly

In Railway dashboard for @beacon/server:
- **Root Directory:** `apps/server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Dockerfile:** Use `Dockerfile.optimized`

### Step 3: Set Environment Variables

Only for @beacon/server:
```env
DATABASE_URL=postgresql://...
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=...
PORT=8080
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size
```

## 📱 How to Deploy Mobile & Desktop Apps

### Android App
```bash
cd apps/mobile
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
# Upload .apk to Google Play Store
```

### Desktop App
```bash
cd apps/desktop
npm run build
# Creates installer in src-tauri/target/release/
# Upload to GitHub Releases
```

## 💰 Cost Savings

**Before (WRONG):**
- 3 services on Railway = $21/month or more
- Wasting resources on apps that shouldn't be hosted

**After (CORRECT):**
- 1 service on Railway = $0-7/month
- Mobile/Desktop apps distributed to users directly

## 🎯 Summary

**Deploy to Railway:**
- ✅ Backend server only

**Don't Deploy to Railway:**
- ❌ Android app (users install it)
- ❌ Desktop app (users install it)
- ❌ Web frontend (use Vercel/Netlify free tier)

## 🚀 Quick Fix

1. **Delete android & desktop from Railway**
2. **Keep only server**
3. **Save $14-20/month**
4. **Server runs on free tier (512MB)**

---

**You only need 1 Railway service, not 3!**
