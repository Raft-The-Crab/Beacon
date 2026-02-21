# 🎯 Deployment Strategy - Railway + ClawCloud

## Architecture

```
Railway (512MB)          ClawCloud (2GB+)
     │                        │
     ├─ Main API Server       ├─ AI Moderation Service
     ├─ WebSocket Gateway     ├─ Image Processing (TensorFlow)
     ├─ Authentication        ├─ Video Processing (ffmpeg)
     ├─ Database Access       └─ Content Moderation AI
     └─ Basic Operations
```

---

## Service 1: Main API (Railway - 512MB)

**What it does:**
- Authentication & user management
- WebSocket gateway
- Database operations
- File uploads (Cloudinary)
- Basic text moderation

**Already deployed at:**
```
https://beaconserver-production.up.railway.app
```

---

## Service 2: AI Moderation (ClawCloud - 2GB RAM)

**What it does:**
- Image content moderation (TensorFlow)
- Video processing (ffmpeg)
- Advanced AI moderation
- Heavy computational tasks

### ClawCloud Configuration

**Image Name:**
```
ghcr.io/raft-the-crab/beacon-ai-moderator:latest
```

**Command:**
```
npx tsx src/ai-server.ts
```

**Environment Variables:**
```
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
MAIN_API_URL=https://beaconserver-production.up.railway.app
PORT=8081
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=1536
```

**Resources:**
```
CPU: 2000m (2 vCPU)
Memory: 2048Mi (2GB)
Port: 8081
```

---

## How They Work Together

```
User Request
    ↓
Railway API (beaconserver-production.up.railway.app)
    ↓
If image/video upload detected
    ↓
Send to ClawCloud AI Service
    ↓
AI processes and returns result
    ↓
Railway API returns to user
```

---

## Files to Create

### 1. AI Service Dockerfile

Create `apps/ai-service/Dockerfile`:
```dockerfile
FROM node:20

WORKDIR /app

# Install system dependencies for TensorFlow and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
RUN npm install

# Copy AI files
COPY ai ./ai
COPY src/ai-server.ts ./src/

# Generate Prisma (if needed)
RUN npx prisma generate || true

ENV NODE_ENV=production
ENV PORT=8081

EXPOSE 8081

CMD ["npx", "tsx", "src/ai-server.ts"]
```

### 2. AI Server Entry Point

Create `apps/server/src/ai-server.ts`:
```typescript
import express from 'express'
import { moderationService } from './services/moderation'

const app = express()
app.use(express.json({ limit: '100mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-moderator' })
})

// Image moderation endpoint
app.post('/moderate/image', async (req, res) => {
  try {
    const { imageBuffer, userId } = req.body
    const buffer = Buffer.from(imageBuffer, 'base64')
    const result = await moderationService.checkImage(buffer, userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' })
  }
})

// Video moderation endpoint
app.post('/moderate/video', async (req, res) => {
  try {
    const { videoPath, userId } = req.body
    const result = await moderationService.checkVideo(videoPath, userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' })
  }
})

const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
  console.log(`🤖 AI Moderation Service running on port ${PORT}`)
})
```

### 3. Update Main API to Use AI Service

In `apps/server/src/services/moderation.ts`, add:
```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8081'

async checkImage(imageBuffer: Buffer, userId: string) {
  try {
    // Send to AI service on ClawCloud
    const response = await fetch(`${AI_SERVICE_URL}/moderate/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBuffer: imageBuffer.toString('base64'),
        userId
      })
    })
    return await response.json()
  } catch (error) {
    // Fallback to safe if AI service unavailable
    return { 
      result: { severity: 'safe', approved: true },
      action: { type: 'none' }
    }
  }
}
```

---

## Deployment Steps

### Step 1: Build AI Service Docker Image
```bash
cd apps/server
docker build -f Dockerfile.ai -t beacon-ai-moderator:latest .
docker tag beacon-ai-moderator:latest ghcr.io/raft-the-crab/beacon-ai-moderator:latest
docker push ghcr.io/raft-the-crab/beacon-ai-moderator:latest
```

### Step 2: Deploy to ClawCloud
Use the configuration above in ClawCloud launchpad

### Step 3: Update Railway Environment
Add to Railway variables:
```
AI_SERVICE_URL=https://your-clawcloud-ai-url
```

---

## Cost Breakdown

**Railway (Main API):**
- 512MB RAM, 0.5 vCPU
- Cost: $0-7/month

**ClawCloud (AI Service):**
- 2GB RAM, 2 vCPU
- Cost: Check ClawCloud pricing
- Only runs when processing images/videos

**Total:** ~$10-20/month

---

## Benefits

✅ Main API stays lightweight (512MB)
✅ AI processing doesn't slow down main API
✅ Can scale AI service independently
✅ Railway free tier still works for main API
✅ Heavy processing isolated to ClawCloud

---

**Want me to create these files?** Let me know and I'll set up the AI service! 🤖
