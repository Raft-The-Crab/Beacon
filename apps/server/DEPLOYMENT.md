# 🚀 Beacon Server Deployment Guide

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (Supabase recommended)
- MongoDB database (Atlas recommended)
- Redis instance (Redis Cloud recommended)
- Cloudinary account

## 🚂 Railway Deployment

### Step 1: Prepare Your Repository
```bash
cd apps/server
```

### Step 2: Set Environment Variables in Railway Dashboard
```env
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
REDIS_URL=redis://default:password@host:port
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your-super-secret-jwt-key
PORT=8080
NODE_ENV=production
```

### Step 3: Deploy
1. Connect your GitHub repository to Railway
2. Set root directory to `apps/server`
3. Railway will auto-detect the Dockerfile
4. Click "Deploy"

### Step 4: Verify
```bash
curl https://your-app.railway.app/health
```

## ☁️ ClawCloud Deployment

### Step 1: Build Docker Image
```bash
cd apps/server
docker build -f Dockerfile.clawcloud -t beacon-server .
```

### Step 2: Push to Registry
```bash
docker tag beacon-server your-registry/beacon-server:latest
docker push your-registry/beacon-server:latest
```

### Step 3: Deploy to ClawCloud
```bash
# Use ClawCloud CLI or dashboard
clawcloud deploy --image your-registry/beacon-server:latest
```

## 🔧 Local Development

### Install Dependencies
```bash
npm install
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

## 📊 Health Check Endpoints

- `GET /health` - Server health status
- `GET /api/version` - API version

## 🐛 Troubleshooting

### Database Connection Issues
- Verify all connection strings are correct
- Check firewall rules allow connections
- Ensure IP whitelist includes your deployment platform

### Build Failures
- Clear node_modules: `rm -rf node_modules && npm install`
- Regenerate Prisma: `npx prisma generate`
- Check TypeScript errors: `npm run build`

### Runtime Errors
- Check logs: `railway logs` or ClawCloud dashboard
- Verify environment variables are set
- Test database connections individually

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS in production
- [ ] Rotate database credentials regularly
- [ ] Enable rate limiting (already configured)
- [ ] Monitor logs for suspicious activity

## 📈 Performance Tips

- Redis caching is enabled by default
- WebSocket connections are optimized for sub-10ms latency
- Database queries use proper indexing
- Static assets should be served via CDN (Cloudinary)

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables
3. Test database connections
4. Review the health check endpoint

---

**Built with ❤️ for the Beacon community**
