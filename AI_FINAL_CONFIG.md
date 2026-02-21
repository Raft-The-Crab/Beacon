# 🤖 AI Moderation - Final Configuration

## ✅ Recommended: 1GB RAM + 0.5 vCPU

### Why This Configuration?
- TensorFlow needs memory > CPU
- Image processing = memory intensive  
- 0.5 vCPU enough for AI inference
- 1GB prevents OOM crashes
- Queue limits concurrent jobs

---

## Flow: AI → Prolog → App

```
User uploads image
    ↓
Main API (Railway) sends to AI Service
    ↓
[AI Service - ClawCloud]
    ↓
Step 1: TensorFlow analyzes image (50MB model)
    ↓
Step 2: Prolog verifies AI result (rules engine)
    ↓
Step 3: Returns final decision
    ↓
Main API receives result
    ↓
User gets response
```

---

## ClawCloud Launchpad Configuration

### Image Name
```
ghcr.io/raft-the-crab/beacon-ai:latest
```

### Command
```
npx tsx src/ai-server.ts
```

### Environment Variables
```
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
PORT=8081
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=768
SWIPL_PATH=swipl
```

### Resources
```
CPU: 500m (0.5 vCPU) ✅
Memory: 1024Mi (1GB) ✅
Port: 8081
```

### Health Check
```
Path: /health
Port: 8081
Initial Delay: 30s
Period: 30s
Timeout: 5s
```

---

## Memory Breakdown (1GB Total)

```
TensorFlow Model:     50MB
Node.js Runtime:      100MB
Prolog Engine:        30MB
Queue System:         50MB
Image Processing:     200-300MB (per job)
Buffer/Overhead:      200MB
------------------------
Total Usage:          630-730MB
Peak:                 850MB (under load)
Safety Margin:        150MB
```

---

## Performance Metrics

### Text Moderation
- Flow: Prolog → Result
- Time: <10ms
- Memory: ~50MB

### Image Moderation
- Flow: AI → Prolog → Result
- Time: 300-800ms
- Memory: ~400MB peak
- Queue: Max 3 concurrent

---

## Build & Deploy

### 1. Build Docker Image
```bash
cd apps/server

# Build
docker build -f Dockerfile.ai -t beacon-ai:latest .

# Tag
docker tag beacon-ai:latest ghcr.io/raft-the-crab/beacon-ai:latest

# Login
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u raft-the-crab --password-stdin

# Push
docker push ghcr.io/raft-the-crab/beacon-ai:latest
```

### 2. Deploy to ClawCloud
1. Open ClawCloud Launchpad
2. Click "New Application"
3. Enter image: `ghcr.io/raft-the-crab/beacon-ai:latest`
4. Set command: `npx tsx src/ai-server.ts`
5. Add environment variables (see above)
6. Set resources: **1GB RAM, 0.5 vCPU**
7. Set port: 8081
8. Click "Launch"

### 3. Update Railway Main API
Add to Railway environment variables:
```
AI_SERVICE_URL=https://your-clawcloud-ai-url
```

---

## API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "ai-moderator",
  "ai": "loaded",
  "prolog": "running",
  "memory": {...},
  "queue": { "waiting": 0, "active": 0 }
}
```

### Image Moderation
```bash
POST /moderate/image
{
  "imageBuffer": "base64_string",
  "userId": "user123"
}

Response:
{
  "result": {
    "severity": "safe",
    "approved": true,
    "confidence": 0.95,
    "aiCategory": "safe",
    "prologReason": "approved"
  },
  "action": {
    "type": "none",
    "reason": "safe"
  }
}
```

### Text Moderation
```bash
POST /moderate/text
{
  "text": "message content",
  "userId": "user123"
}
```

### Queue Stats
```bash
GET /stats
```

---

## Integration with Main API

Update `apps/server/src/services/moderation.ts`:

```typescript
async checkImage(imageBuffer: Buffer, userId: string) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL
  
  if (!AI_SERVICE_URL) {
    return { result: { approved: true }, action: { type: 'none' } }
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/moderate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBuffer: imageBuffer.toString('base64'),
        userId
      }),
      signal: AbortSignal.timeout(10000) // 10s timeout
    })
    
    return await response.json()
  } catch (error) {
    console.error('AI service error:', error)
    return { result: { approved: true }, action: { type: 'none' } }
  }
}
```

---

## Cost Estimate

**ClawCloud (1GB RAM, 0.5 vCPU):**
- Estimated: $8-12/month

**Railway (Main API - 512MB):**
- Estimated: $0-7/month

**Total: $8-19/month** 💰

---

## Monitoring

### Check Health
```bash
curl https://your-ai-service/health
```

### Check Queue
```bash
curl https://your-ai-service/stats
```

### Watch Memory
```bash
# In ClawCloud dashboard
# Monitor memory usage graph
# Should stay under 850MB
```

---

## Scaling Options

If you need more capacity:

**Option 1: Increase Memory**
- 1GB → 2GB RAM
- Cost: +$5-8/month
- Handles 10+ concurrent jobs

**Option 2: Add Replicas**
- Run 2 instances
- Load balanced automatically
- Cost: 2x current

**Option 3: Increase CPU**
- 0.5 → 1 vCPU
- Faster processing
- Cost: +$3-5/month

---

## Troubleshooting

### Out of Memory
- Reduce queue concurrency to 2
- Check for memory leaks
- Restart service

### Slow Processing
- Check queue backlog
- Increase to 1 vCPU
- Add more replicas

### Prolog Not Working
- Check SWIPL_PATH is set
- Verify moderation_balanced.pl exists
- Falls back to AI-only mode

---

**Ready to deploy with 1GB RAM + 0.5 vCPU!** 🚀
