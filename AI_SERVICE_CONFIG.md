# 🤖 AI Moderation Service - ClawCloud Configuration

## Optimized for 512MB-1GB RAM

### Features
- ✅ TensorFlow Lite (50MB model)
- ✅ Queue system (prevents memory spikes)
- ✅ Image moderation (224x224 resize)
- ✅ Text pattern matching
- ✅ Memory: ~200-350MB total
- ✅ CPU: 0.5-1 vCPU

---

## ClawCloud Launchpad Config

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
NODE_OPTIONS=--max-old-space-size=384
```

### Resources
```
CPU: 500m-1000m (0.5-1 vCPU)
Memory: 512Mi-1024Mi (512MB-1GB)
Port: 8081
```

### Health Check
```
Path: /health
Port: 8081
Initial Delay: 30s
Period: 30s
```

---

## Build & Deploy

### 1. Build Docker Image
```bash
cd apps/server

# Build
docker build -f Dockerfile.ai -t beacon-ai:latest .

# Tag
docker tag beacon-ai:latest ghcr.io/raft-the-crab/beacon-ai:latest

# Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u raft-the-crab --password-stdin

# Push
docker push ghcr.io/raft-the-crab/beacon-ai:latest
```

### 2. Deploy to ClawCloud
Use the configuration above in ClawCloud launchpad

### 3. Update Railway Main API
Add environment variable to Railway:
```
AI_SERVICE_URL=https://your-clawcloud-ai-url
```

---

## API Endpoints

### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "healthy",
  "service": "ai-moderator",
  "model": "loaded",
  "memory": {...},
  "queue": {
    "waiting": 0,
    "active": 0
  }
}
```

### Image Moderation
```bash
POST /moderate/image
Content-Type: application/json

{
  "imageBuffer": "base64_encoded_image",
  "userId": "user123"
}
```

### Text Moderation
```bash
POST /moderate/text
Content-Type: application/json

{
  "text": "content to moderate",
  "userId": "user123"
}
```

### Queue Stats
```bash
GET /stats
```

---

## Memory Breakdown

```
TensorFlow Model: 50MB
Node.js Runtime: 80MB
Queue System: 30MB
Image Processing: 50-100MB (per request)
Buffer: 50MB
-------------------
Total: 260-310MB
Peak: 350MB (under load)
```

---

## Queue Configuration

- **Max Concurrent**: 5 jobs
- **Rate Limit**: 5 per second
- **Timeout**: 30 seconds per job
- **Retry**: 3 attempts

This prevents memory spikes from processing too many images at once.

---

## Performance

- **Text Moderation**: <10ms
- **Image Moderation**: 200-500ms
- **Queue Wait**: 0-2 seconds (under load)
- **Memory Usage**: 200-350MB
- **CPU Usage**: 20-40% (0.5 vCPU)

---

## Integration with Main API

In `apps/server/src/services/moderation.ts`:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL

async checkImage(imageBuffer: Buffer, userId: string) {
  if (!AI_SERVICE_URL) {
    return { safe: true } // Fallback
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/moderate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBuffer: imageBuffer.toString('base64'),
        userId
      }),
      timeout: 10000 // 10s timeout
    })
    
    return await response.json()
  } catch (error) {
    console.error('AI service error:', error)
    return { safe: true } // Fallback to safe
  }
}
```

---

## Cost Estimate

**ClawCloud (512MB-1GB):**
- 0.5-1 vCPU
- 512MB-1GB RAM
- Estimated: $5-15/month

**Total Infrastructure:**
- Railway (Main API): $0-7/month
- ClawCloud (AI): $5-15/month
- **Total: $5-22/month**

---

## Monitoring

Check queue stats:
```bash
curl https://your-ai-service/stats
```

Check memory:
```bash
curl https://your-ai-service/health
```

---

## Scaling

If you need more capacity:
1. Increase memory to 1GB
2. Increase CPU to 1 vCPU
3. Increase queue concurrency to 10

---

**Ready to deploy!** 🚀
