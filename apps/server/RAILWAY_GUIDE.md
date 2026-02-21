# 🚂 Railway Deployment Guide

## Prerequisites
- GitHub account with Beacon repository
- Railway account (https://railway.app)
- All database services running (Supabase, MongoDB, Redis)

## Step-by-Step Deployment

### 1. Prepare Repository
```bash
# Ensure latest code is pushed
git add -A
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `Raft-The-Crab/Beacon`
4. Railway will detect the repository

### 3. Configure Service

1. **Set Root Directory:**
   - Go to Settings → Service Settings
   - Set Root Directory: `apps/server`
   - Save changes

2. **Configure Build:**
   - Railway will auto-detect `Dockerfile.railway`
   - Build Command: `npm run build`
   - Start Command: `npm start`

### 4. Set Environment Variables

Go to Variables tab and add:

```env
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important:** Change `JWT_SECRET` to a random string!

### 5. Deploy

1. Click "Deploy" button
2. Railway will:
   - Clone repository
   - Build Docker image
   - Start the server
   - Assign a public URL

### 6. Get Your URL

1. Go to Settings → Networking
2. Click "Generate Domain"
3. Your server will be at: `https://your-app.up.railway.app`

### 7. Update CORS

1. Copy your Railway domain
2. Go back to Variables
3. Update `CORS_ORIGIN` to include your Railway domain:
   ```
   CORS_ORIGIN=https://your-app.up.railway.app,https://your-frontend.com
   ```
4. Redeploy

### 8. Verify Deployment

Test your endpoints:

```bash
# Health check
curl https://your-app.up.railway.app/health

# API version
curl https://your-app.up.railway.app/api/version

# CSRF token
curl https://your-app.up.railway.app/api/csrf-token
```

Expected response from `/health`:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T...",
  "services": {
    "postgres": "connected",
    "mongodb": "connected",
    "redis": "connected"
  },
  "version": "1.0.0"
}
```

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Verify `Dockerfile.railway` exists in `apps/server/`
- Ensure all dependencies are in `package.json`

### Database Connection Errors
- Verify all connection strings are correct
- Check if IP whitelist includes Railway IPs (0.0.0.0/0 for all)
- Test connections locally first

### Server Crashes on Start
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Ensure PORT is set to 8080

### CORS Errors
- Add Railway domain to `CORS_ORIGIN`
- Format: `https://domain1.com,https://domain2.com`
- No trailing slashes

## Monitoring

### View Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Metrics
- Go to Railway dashboard
- Click on your service
- View Metrics tab for:
  - CPU usage
  - Memory usage
  - Network traffic
  - Request count

## Scaling

### Vertical Scaling
1. Go to Settings → Resources
2. Increase memory/CPU allocation
3. Redeploy

### Horizontal Scaling
Railway Pro plan supports multiple instances:
1. Go to Settings → Scaling
2. Set number of instances
3. Railway handles load balancing

## Cost Optimization

- **Free Tier:** $5 credit/month
- **Pro Plan:** $20/month + usage
- **Estimated Cost:** ~$10-15/month for small apps

### Tips to Reduce Costs:
1. Use Railway's sleep feature for dev environments
2. Optimize Docker image size
3. Enable caching in build process
4. Monitor resource usage

## Continuous Deployment

Railway automatically deploys on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway automatically deploys!
```

### Disable Auto-Deploy:
1. Go to Settings → Deployments
2. Toggle "Auto Deploy" off
3. Manual deploy via dashboard

## Custom Domain

1. Go to Settings → Networking
2. Click "Custom Domain"
3. Add your domain (e.g., `api.beacon.app`)
4. Update DNS records:
   ```
   CNAME api.beacon.app -> your-app.up.railway.app
   ```
5. Wait for DNS propagation (5-30 minutes)

## Rollback

If deployment fails:

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Beacon Issues: https://github.com/Raft-The-Crab/Beacon/issues

---

**Status:** ✅ Ready to deploy
**Estimated Setup Time:** 10-15 minutes
**Difficulty:** Easy
