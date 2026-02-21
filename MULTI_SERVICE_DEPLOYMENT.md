# 🚀 Multi-Service Deployment Strategy

## Architecture: Railway + ClawCloud

```
┌─────────────────────────────────────────────────────────┐
│                    Railway (512MB)                       │
│  - Main API (beaconserver-production.up.railway.app)   │
│  - WebSocket Gateway                                     │
│  - Authentication                                        │
│  - Database Access                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  ClawCloud Services                      │
├─────────────────────────────────────────────────────────┤
│  Service 1: AI Moderation (1GB RAM, 0.5 vCPU)          │
│  - MobileNetV2 (14MB model)                             │
│  - Prolog engine                                         │
│  - Image/Text moderation                                 │
│  - Memory: <350MB                                        │
├─────────────────────────────────────────────────────────┤
│  Service 2: Media Processing (Optional - 1GB, 0.5 vCPU)│
│  - Image optimization                                    │
│  - Video transcoding                                     │
│  - Thumbnail generation                                  │
├─────────────────────────────────────────────────────────┤
│  Service 3: Analytics (Optional - 512MB, 0.5 vCPU)     │
│  - Usage metrics                                         │
│  - Performance monitoring                                │
│  - Log aggregation                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Service 1: AI Moderation (REQUIRED)

### ClawCloud Configuration

**Image Name:**
```
ghcr.io/raft-the-crab/beacon-ai-lite:latest
```

**Command:**
```
npx tsx src/ai-server-lite.ts
```

**Environment Variables:**
```
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
PORT=8081
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=350
SWIPL_PATH=swipl
```

**Resources:**
```
CPU: 500m (0.5 vCPU)
Memory: 1024Mi (1GB)
Port: 8081
```

**Memory Breakdown:**
```
MobileNetV2 Model:    14MB
Node.js Runtime:      80MB
Prolog Engine:        20MB
Queue System:         30MB
Image Processing:     150-200MB (per job)
Buffer:               50MB
------------------------
Total:                344-394MB
Peak:                 <400MB ✅
```

---

## Service 2: Media Processing (OPTIONAL)

Use if you need heavy media processing separate from main API.

**Image Name:**
```
ghcr.io/raft-the-crab/beacon-media:latest
```

**Command:**
```
node dist/media-server.js
```

**Environment Variables:**
```
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
PORT=8082
NODE_ENV=production
```

**Resources:**
```
CPU: 500m
Memory: 1024Mi
Port: 8082
```

---

## Service 3: Analytics (OPTIONAL)

Use if you want separate analytics processing.

**Image Name:**
```
ghcr.io/raft-the-crab/beacon-analytics:latest
```

**Command:**
```
node dist/analytics-server.js
```

**Environment Variables:**
```
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
PORT=8083
NODE_ENV=production
```

**Resources:**
```
CPU: 500m
Memory: 512Mi
Port: 8083
```

---

## Build & Deploy AI Service

### 1. Build Docker Image
```bash
cd apps/server

# Build
docker build -f Dockerfile.ai-lite -t beacon-ai-lite:latest .

# Tag
docker tag beacon-ai-lite:latest ghcr.io/raft-the-crab/beacon-ai-lite:latest

# Login
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u raft-the-crab --password-stdin

# Push
docker push ghcr.io/raft-the-crab/beacon-ai-lite:latest
```

### 2. Deploy to ClawCloud
1. Open ClawCloud Launchpad
2. Click "New Application"
3. Name: `beacon-ai-moderation`
4. Image: `ghcr.io/raft-the-crab/beacon-ai-lite:latest`
5. Command: `npx tsx src/ai-server-lite.ts`
6. Add environment variables
7. Resources: **1GB RAM, 0.5 vCPU**
8. Port: 8081
9. Click "Launch"

### 3. Update Railway Main API
Add to Railway environment variables:
```
AI_SERVICE_URL=https://beacon-ai-moderation.clawcloud.io
```

---

## Cost Breakdown

### Railway (Main API)
- 512MB RAM, 0.5 vCPU
- Cost: **$0-7/month**

### ClawCloud Services

**Required:**
- AI Moderation (1GB, 0.5 vCPU): **$8-12/month**

**Optional:**
- Media Processing (1GB, 0.5 vCPU): **$8-12/month**
- Analytics (512MB, 0.5 vCPU): **$5-8/month**

**Total Cost:**
- Minimal (Railway + AI): **$8-19/month**
- Full Stack (All services): **$21-39/month**

---

## Performance Metrics

### AI Moderation Service
- Text: <10ms (Prolog only)
- Image: 200-500ms (AI + Prolog)
- Memory: 200-350MB
- Queue: Max 2 concurrent

### Main API (Railway)
- Response time: <100ms
- WebSocket latency: <10ms
- Memory: 200-400MB
- Concurrent users: 50-100

---

## Integration Example

Update `apps/server/src/services/moderation.ts`:

```typescript
async checkImage(imageBuffer: Buffer, userId: string) {
  const AI_URL = process.env.AI_SERVICE_URL
  
  if (!AI_URL) {
    return { result: { approved: true }, action: { type: 'none' } }
  }

  try {
    const response = await fetch(`${AI_URL}/moderate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBuffer: imageBuffer.toString('base64'),
        userId
      }),
      signal: AbortSignal.timeout(5000)
    })
    
    return await response.json()
  } catch (error) {
    console.error('AI service error:', error)
    return { result: { approved: true }, action: { type: 'none' } }
  }
}
```

---

## Monitoring

### AI Service Health
```bash
curl https://beacon-ai-moderation.clawcloud.io/health
```

### Check Memory Usage
```bash
curl https://beacon-ai-moderation.clawcloud.io/stats
```

---

## Scaling Strategy

### If AI service gets overloaded:
1. Increase memory to 2GB
2. Increase queue concurrency to 5
3. Add second replica (load balanced)

### If main API gets overloaded:
1. Upgrade Railway to 1GB
2. Add caching layer
3. Optimize database queries

---

**Start with: Railway + AI Moderation only = $8-19/month** 💰
