# 🚀 BEACON DEPLOYMENT ARCHITECTURE

## 📊 Service Distribution

### Railway (Main Backend)
**What runs here:**
- ✅ Main API Server (Express + WebSocket)
- ✅ User Authentication
- ✅ Message Handling
- ✅ Channel Management
- ✅ File Uploads (Cloudinary)
- ✅ Real-time Gateway
- ✅ Database Connections (PostgreSQL, MongoDB, Redis)

**Why Railway:**
- Zero-config deployment
- Auto-scaling
- Built-in monitoring
- Free tier available
- Easy environment variables

### ClawCloud (AI & SMS Bridge)
**What runs here:**
- ✅ AI Moderation Engine (Prolog)
- ✅ Video Content Moderation
- ✅ SMS Bridge (Twilio)
- ✅ Heavy Processing Tasks

**Why ClawCloud:**
- Kubernetes native
- Better for CPU-intensive tasks
- Isolated from main traffic
- Can scale independently

## 🔧 Railway Deployment

### Environment Variables Needed:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CORS_ORIGIN=https://your-domain.com
```

### Deploy Command:
```bash
railway up
```

## ☁️ ClawCloud Deployment

### For AI & SMS Bridge:

1. **Create ConfigMap:**
```bash
kubectl apply -f k8s/clawcloud-ai-sms.yaml
```

2. **Update Secrets:**
Edit `k8s/clawcloud-ai-sms.yaml` with your actual credentials

3. **Deploy:**
```bash
kubectl apply -f k8s/clawcloud-ai-sms.yaml
```

4. **Check Status:**
```bash
kubectl get pods
kubectl logs -f deployment/beacon-ai-sms
```

### Nginx Ingress Configuration:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: beacon-ai-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ai.beacon.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: beacon-ai-service
            port:
              number: 80
```

## 🔗 Service Communication

```
User Request
    ↓
Railway (Main API)
    ↓
├─→ Direct Response (auth, messages, etc)
└─→ ClawCloud (AI moderation, SMS)
        ↓
    Response back to Railway
        ↓
    User receives result
```

## 📝 Recommendation

**Main Backend → Railway** ✅
- Handles 95% of traffic
- Fast deployment
- Easy to manage
- Auto-scaling

**AI & SMS → ClawCloud** ✅
- Heavy processing
- Isolated workload
- Can be optional
- Scales independently

## 🚀 Quick Deploy

### Step 1: Deploy Main Backend to Railway
```bash
railway up
```

### Step 2: Deploy AI/SMS to ClawCloud (Optional)
```bash
kubectl apply -f k8s/clawcloud-ai-sms.yaml
```

### Step 3: Connect Services
Update Railway environment:
```bash
AI_SERVICE_URL=https://ai.beacon.app
SMS_BRIDGE_URL=https://ai.beacon.app/sms
```

## ✅ What's Already Done

- ✅ Code pushed to GitHub
- ✅ Railway config ready
- ✅ ClawCloud K8s config created
- ✅ Health endpoints working
- ✅ Keep-alive implemented

## 🎯 Next Steps

1. Deploy to Railway: `railway up`
2. Set environment variables in Railway dashboard
3. (Optional) Deploy AI/SMS to ClawCloud
4. Test endpoints
5. Monitor logs

---

**Recommendation: Start with Railway only. Add ClawCloud later if needed.**
