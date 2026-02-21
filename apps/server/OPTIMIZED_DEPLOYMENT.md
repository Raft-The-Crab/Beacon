# 🚀 Optimized Deployment - 1 vCPU / 512MB RAM

## ⚡ Performance Optimizations Applied

### Memory Optimizations
- ✅ Node.js heap limited to 384MB (leaves 128MB for system)
- ✅ Payload limits reduced to 10MB (from 50MB)
- ✅ MongoDB connection pool: 5 max (from unlimited)
- ✅ Redis lazy connect enabled
- ✅ Optimized Docker image (Alpine Linux)

### CPU Optimizations
- ✅ Node.js optimize-for-size flag enabled
- ✅ Minimal dependencies
- ✅ No AI/video processing (heavy operations)
- ✅ Efficient WebSocket handling

## 📊 Expected Performance

| Metric | Value |
|--------|-------|
| Memory Usage | ~200-300MB |
| CPU Usage (idle) | <5% |
| CPU Usage (load) | 30-60% |
| Concurrent Users | 50-100 |
| Response Time | <200ms |
| WebSocket Connections | 100-200 |

## 🚂 Railway Deployment (Free Tier)

### Specs
- 512MB RAM ✅
- 0.5 vCPU ✅
- $5 free credit/month

### Deploy
```bash
# Just push to GitHub
git push origin main
# Railway auto-deploys!
```

### Configuration
Set in Railway dashboard:
```env
NODE_OPTIONS=--max-old-space-size=384 --optimize-for-size
```

## ☁️ ClawCloud Deployment (1 vCPU / 512MB)

### Build Optimized Image
```bash
cd apps/server
docker build -f Dockerfile.optimized -t beacon-server:optimized .
```

### Deploy
```bash
# Tag for registry
docker tag beacon-server:optimized your-registry/beacon-server:latest

# Push
docker push your-registry/beacon-server:latest

# Deploy with config
kubectl apply -f clawcloud.yaml
```

### Resource Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

## 💡 Performance Tips

### 1. Enable Compression
Already enabled via Helmet middleware

### 2. Use Redis Caching
Already configured - caches frequently accessed data

### 3. Database Indexing
Ensure indexes on:
- User.email
- Guild.id
- Channel.id
- Message.channel_id

### 4. Monitor Memory
```bash
# Check memory usage
docker stats beacon-server

# Or in ClawCloud
kubectl top pod beacon-server
```

### 5. Graceful Degradation
Server automatically:
- Reduces connection pools under pressure
- Skips optional features (AI moderation)
- Caches aggressively

## 🔧 Troubleshooting

### Out of Memory
If you see OOM errors:

1. **Reduce payload limit further:**
```typescript
app.use(express.json({ limit: '5mb' }))
```

2. **Reduce MongoDB pool:**
```typescript
maxPoolSize: 3
```

3. **Disable features:**
```env
DISABLE_ANALYTICS=true
DISABLE_AUDIT_LOGS=true
```

### High CPU Usage
1. Enable rate limiting (already configured)
2. Add request queuing
3. Scale horizontally (add more instances)

### Slow Response Times
1. Check database indexes
2. Enable Redis caching
3. Optimize queries

## 📈 Scaling Strategy

### Vertical Scaling (Upgrade Resources)
- Railway: Upgrade to $7/month (1GB RAM)
- ClawCloud: Increase to 1GB RAM

### Horizontal Scaling (More Instances)
- Railway: Pro plan ($20/month)
- ClawCloud: Add replicas in clawcloud.yaml

```yaml
spec:
  replicas: 2  # Run 2 instances
```

## 💰 Cost Optimization

### Free Tier Limits
- **Railway:** 512MB RAM, 0.5 vCPU - **FREE**
- **ClawCloud:** 1 vCPU, 512MB RAM - **Check pricing**

### Stay Within Free Tier
1. Use optimized Dockerfile
2. Enable all optimizations
3. Monitor resource usage
4. Scale only when needed

## ✅ Deployment Checklist

- [ ] Use `Dockerfile.optimized`
- [ ] Set `NODE_OPTIONS` environment variable
- [ ] Configure resource limits
- [ ] Enable health checks
- [ ] Monitor memory usage
- [ ] Test under load
- [ ] Set up alerts

## 🎯 Success Metrics

Your deployment is optimized when:
- ✅ Memory usage < 400MB
- ✅ CPU usage < 70% under load
- ✅ Response time < 200ms
- ✅ No OOM errors
- ✅ Handles 50+ concurrent users

## 📞 Support

If you need more resources:
- Railway: Upgrade to $7/month (1GB RAM)
- ClawCloud: Contact support for pricing
- Consider horizontal scaling

---

**Status:** ✅ Optimized for 512MB RAM
**Expected Cost:** $0-7/month
**Performance:** Good for 50-100 concurrent users
