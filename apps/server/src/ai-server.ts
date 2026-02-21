import express from 'express'
import * as tf from '@tensorflow/tfjs-node'
import { createCanvas, loadImage } from 'canvas'
import Queue from 'bull'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'

const app = express()
app.use(express.json({ limit: '10mb' }))

// Memory optimization for 1GB RAM
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = '--max-old-space-size=768'
}

// Queue for processing (max 3 concurrent to save memory)
const moderationQueue = new Queue('moderation', process.env.REDIS_URL || 'redis://localhost:6379', {
  limiter: {
    max: 3,
    duration: 1000
  }
})

// TensorFlow Model (50MB)
let model: any = null
async function loadModel() {
  try {
    model = await tf.loadLayersModel('file://./ai/models/moderation-lite/model.json')
    console.log('✅ TensorFlow model loaded (50MB)')
  } catch (error) {
    console.warn('⚠️ TensorFlow model not found, using Prolog only')
  }
}

// Prolog Bridge
class PrologBridge {
  private proc: ChildProcessWithoutNullStreams | null = null
  private buf = ''
  private pending: Array<{ resolve: (r: any) => void; reject: (e: Error) => void }> = []
  private available = false

  init() {
    const PROLOG_SCRIPT = path.join(process.cwd(), 'ai', 'moderation_balanced.pl')
    const SWIPL = process.env.SWIPL_PATH || 'swipl'

    try {
      this.proc = spawn(SWIPL, ['-q', '-l', PROLOG_SCRIPT, '-g', 'run_moderation_loop'], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      this.available = true

      this.proc.stdout.on('data', (d: Buffer) => {
        this.buf += d.toString()
        const lines = this.buf.split('\n')
        this.buf = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const result = JSON.parse(trimmed)
            const pending = this.pending.shift()
            if (pending) pending.resolve(result)
          } catch {
            const pending = this.pending.shift()
            if (pending) pending.reject(new Error('Prolog parse error'))
          }
        }
      })

      this.proc.on('exit', () => {
        this.available = false
        while (this.pending.length) {
          const p = this.pending.shift()
          if (p) p.reject(new Error('Prolog exited'))
        }
        setTimeout(() => this.init(), 2000)
      })

      console.log('✅ Prolog engine initialized')
    } catch {
      this.available = false
      console.warn('⚠️ Prolog not available')
    }
  }

  async check(content: string, aiResult?: any): Promise<any> {
    if (!this.available || !this.proc) {
      return { approved: true, reason: 'prolog_unavailable' }
    }

    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject })
      const payload = JSON.stringify({ content, aiResult }) + '\n'
      this.proc!.stdin.write(payload)
      setTimeout(() => {
        const idx = this.pending.findIndex(p => p.resolve === resolve)
        if (idx !== -1) {
          this.pending.splice(idx, 1)
          reject(new Error('Prolog timeout'))
        }
      }, 3000)
    })
  }
}

const prolog = new PrologBridge()

// FLOW: AI → Prolog → Result
async function moderateImage(imageBuffer: Buffer, userId: string) {
  let aiResult = { safe: true, confidence: 0, category: 'unknown' }

  // Step 1: AI Analysis (TensorFlow)
  if (model) {
    try {
      const img = await loadImage(imageBuffer)
      const canvas = createCanvas(224, 224)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, 224, 224)

      const imageData = ctx.getImageData(0, 0, 224, 224)
      const tensor = tf.browser.fromPixels(imageData)
        .toFloat()
        .div(255.0)
        .expandDims(0)

      const prediction = await model.predict(tensor)
      const data = await prediction.data()

      tensor.dispose()
      prediction.dispose()

      const confidence = data[0]
      aiResult = {
        safe: confidence < 0.5,
        confidence,
        category: confidence >= 0.5 ? 'unsafe' : 'safe'
      }
    } catch (error) {
      console.error('AI error:', error)
    }
  }

  // Step 2: Prolog Verification
  let prologResult
  try {
    prologResult = await prolog.check(`image_analysis: ${aiResult.category}`, aiResult)
  } catch {
    prologResult = { approved: aiResult.safe }
  }

  // Step 3: Final Decision
  return {
    result: {
      severity: prologResult.approved ? 'safe' : 'high',
      approved: prologResult.approved,
      confidence: aiResult.confidence,
      aiCategory: aiResult.category,
      prologReason: prologResult.reason
    },
    action: {
      type: prologResult.approved ? 'none' : 'escalate',
      reason: prologResult.reason || aiResult.category
    }
  }
}

// FLOW: Prolog → Result (text is fast, no AI needed)
async function moderateText(text: string, userId: string) {
  try {
    const prologResult = await prolog.check(text)
    return {
      result: {
        severity: prologResult.approved ? 'safe' : 'high',
        approved: prologResult.approved,
        reason: prologResult.reason
      },
      action: {
        type: prologResult.approved ? 'none' : 'escalate',
        reason: prologResult.reason
      }
    }
  } catch {
    // Fallback: simple pattern matching
    const dangerous = ['csam', 'child porn', 'kill yourself', 'bomb']
    const safe = !dangerous.some(p => text.toLowerCase().includes(p))
    return {
      result: { severity: safe ? 'safe' : 'critical', approved: safe },
      action: { type: safe ? 'none' : 'ip_ban', reason: 'pattern_match' }
    }
  }
}

// Queue processor
moderationQueue.process(async (job) => {
  const { type, data } = job.data

  if (type === 'image') {
    const buffer = Buffer.from(data.imageBuffer, 'base64')
    return await moderateImage(buffer, data.userId)
  } else if (type === 'text') {
    return await moderateText(data.text, data.userId)
  }

  return { result: { approved: true }, action: { type: 'none' } }
})

// Health check
app.get('/health', async (req, res) => {
  const waiting = await moderationQueue.count()
  const active = await moderationQueue.getActiveCount()

  res.json({
    status: 'healthy',
    service: 'ai-moderator',
    ai: model ? 'loaded' : 'disabled',
    prolog: prolog['available'] ? 'running' : 'disabled',
    memory: process.memoryUsage(),
    queue: { waiting, active }
  })
})

// Image moderation (queued)
app.post('/moderate/image', async (req, res) => {
  try {
    const { imageBuffer, userId } = req.body
    const job = await moderationQueue.add({ type: 'image', data: { imageBuffer, userId } })
    const result = await job.finished()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' })
  }
})

// Text moderation (direct - fast)
app.post('/moderate/text', async (req, res) => {
  try {
    const { text, userId } = req.body
    const result = await moderateText(text, userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Moderation failed' })
  }
})

// Stats
app.get('/stats', async (req, res) => {
  res.json({
    queue: {
      waiting: await moderationQueue.count(),
      active: await moderationQueue.getActiveCount(),
      completed: await moderationQueue.getCompletedCount(),
      failed: await moderationQueue.getFailedCount()
    },
    memory: process.memoryUsage()
  })
})

const PORT = process.env.PORT || 8081

async function start() {
  console.log('🤖 AI Moderation Service Starting...')
  console.log('💾 Memory: 1GB RAM, 0.5 vCPU')

  await loadModel()
  prolog.init()

  app.listen(PORT, () => {
    console.log(`✅ AI Service on port ${PORT}`)
    console.log(`🧠 Flow: AI → Prolog → App`)
  })
}

start()

process.on('SIGTERM', async () => {
  await moderationQueue.close()
  if (model) model.dispose()
  process.exit(0)
})
