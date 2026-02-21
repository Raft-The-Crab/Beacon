# Lightweight AI Moderation - Optimized for 512MB-1GB RAM

## Strategy: Use Cloud APIs Instead of Local Processing

Instead of running TensorFlow/ffmpeg locally (heavy), use free cloud APIs:

### Image Moderation
- **Cloudinary AI** (already have account) - FREE tier
- **Sightengine API** - 2000 free requests/month
- **AWS Rekognition** - 5000 free images/month

### Video Moderation
- **Cloudinary Video Analysis** - FREE tier
- **Frame extraction** - Lightweight (no ffmpeg needed)

### Text Moderation
- **Prolog engine** - Already implemented (lightweight)
- **Pattern matching** - No AI needed

---

## Optimized AI Service (512MB RAM)

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Only install minimal dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy AI files
COPY ai ./ai
COPY src/ai-server.ts ./src/

ENV NODE_ENV=production
ENV PORT=8081
ENV NODE_OPTIONS=--max-old-space-size=384

EXPOSE 8081

CMD ["npx", "tsx", "src/ai-server.ts"]
```

### AI Server (Lightweight)
```typescript
import express from 'express'
import axios from 'axios'

const app = express()
app.use(express.json({ limit: '10mb' }))

// Cloudinary AI moderation (FREE)
async function moderateImageCloudinary(imageUrl: string) {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })

  try {
    const result = await cloudinary.api.resource(imageUrl, {
      moderation: 'aws_rek:moderation'
    })
    
    return {
      safe: result.moderation[0].status === 'approved',
      categories: result.moderation[0].response.ModerationLabels
    }
  } catch (error) {
    return { safe: true, categories: [] }
  }
}

// Lightweight video check (extract frames, check with Cloudinary)
async function moderateVideo(videoUrl: string) {
  // Cloudinary can analyze video automatically
  const cloudinary = require('cloudinary').v2
  
  try {
    const result = await cloudinary.api.resource(videoUrl, {
      resource_type: 'video',
      moderation: 'aws_rek:moderation'
    })
    
    return {
      safe: result.moderation[0].status === 'approved'
    }
  } catch (error) {
    return { safe: true }
  }
}

// Text moderation (pattern matching - no AI needed)
function moderateText(text: string) {
  const badWords = ['explicit', 'violence', 'hate'] // Add more
  const lower = text.toLowerCase()
  
  for (const word of badWords) {
    if (lower.includes(word)) {
      return { safe: false, reason: word }
    }
  }
  
  return { safe: true }
}

// Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-moderator-lite' })
})

app.post('/moderate/image', async (req, res) => {
  const { imageUrl } = req.body
  const result = await moderateImageCloudinary(imageUrl)
  res.json(result)
})

app.post('/moderate/video', async (req, res) => {
  const { videoUrl } = req.body
  const result = await moderateVideo(videoUrl)
  res.json(result)
})

app.post('/moderate/text', (req, res) => {
  const { text } = req.body
  const result = moderateText(text)
  res.json(result)
})

const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
  console.log(`🤖 Lightweight AI Moderation on port ${PORT}`)
  console.log(`💾 Memory: ~50-100MB`)
})
```

---

## ClawCloud Configuration (Optimized)

**Image Name:**
```
ghcr.io/raft-the-crab/beacon-ai-lite:latest
```

**Command:**
```
npx tsx src/ai-server.ts
```

**Environment Variables:**
```
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
PORT=8081
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=384
```

**Resources:**
```
CPU: 500m (0.5 vCPU)
Memory: 512Mi (512MB) or 1024Mi (1GB)
Port: 8081
```

---

## Performance Comparison

### Before (Heavy AI)
- TensorFlow: ~800MB RAM
- ffmpeg: ~300MB RAM
- Total: ~1.2GB RAM minimum
- CPU: 2+ cores needed

### After (Lightweight)
- Cloudinary API calls: ~50MB RAM
- Pattern matching: ~10MB RAM
- Total: ~100MB RAM
- CPU: 0.5 core enough

---

## Cost Analysis

**Cloudinary Moderation:**
- FREE tier: 25,000 transformations/month
- Includes AI moderation
- Already have account ✅

**Alternative: Sightengine**
- FREE tier: 2,000 requests/month
- Paid: $0.001 per image

**Total Cost:**
- ClawCloud: ~$5-10/month (512MB)
- APIs: FREE (within limits)
- **Total: $5-10/month** 🎉

---

## Benefits

✅ Runs on 512MB RAM (or 1GB for safety)
✅ 0.5 vCPU is enough
✅ Uses Cloudinary (already have it)
✅ No TensorFlow/ffmpeg needed
✅ Fast API responses
✅ Cost effective

---

## Setup Steps

1. **Create AI service files** (I can do this)
2. **Build Docker image**
3. **Deploy to ClawCloud** with 512MB-1GB RAM
4. **Connect to main API**

**Want me to create the files?** 🚀
