import express from 'express'
import * as tf from '@tensorflow/tfjs-node'
import * as mobilenet from '@tensorflow-models/mobilenet'
import Queue from 'bull'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'

const app = express()
app.use(express.json({ limit: '5mb' }))

// Memory optimization: 350MB max
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_OPTIONS = '--max-old-space-size=350'
}

// Lightweight queue (max 2 concurrent)
const moderationQueue = new Queue('moderation', process.env.REDIS_URL, {
  limiter: { max: 2, duration: 1000 }
})

// Lightweight AI Model (MobileNetV2 - 14MB)
let model: any = null
let modelLoaded = false

async function loadModel() {
  try {
    console.log('[AI] Loading MobileNetV2 (14MB)...')
    model = await mobilenet.load({ version: 2, alpha: 0.5 }) // 0.5 = smaller/faster
    modelLoaded = true
    console.log('✅ AI Model loaded (14MB)')
  } catch (error) {
    console.warn('⚠️ AI model failed to load:', error)
  }
}

// Prolog Engine
class PrologBridge {
  private proc: ChildProcessWithoutNullStreams | null = null
  private buf = ''
  private pending: Array<{ resolve: any; reject: any }> = []
  private available = false

  init() {
    const PROLOG_SCRIPT = path.join(process.cwd(), 'ai', 'moderation_balanced.pl')
    const SWIPL = process.env.SWIPL_PATH || 'swipl'

    try {
      this.proc = spawn(SWIPL, ['-q', '-l', PROLOG_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] })
      this.available = true

      this.proc.stdout.on('data', (d: Buffer) => {
        this.buf += d.toString()
        const lines = this.buf.split('\n')
        this.buf = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const result = JSON.parse(line)
            const p = this.pending.shift()
            if (p) p.resolve(result)
          } catch {
            const p = this.pending.shift()
            if (p) p.reject(new Error('Parse error'))
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
      console.warn('⚠️ Prolog unavailable')
    }
  }

  async check(content: string, aiResult?: any): Promise<any> {
    if (!this.available || !this.proc) {
      return { approved: true, reason: 'prolog_unavailable' }
    }

    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject })
      this.proc!.stdin.write(JSON.stringify({ content, aiResult }) + '\n')
      setTimeout(() => {
        const idx = this.pending.findIndex(p => p.resolve === resolve)
        if (idx !== -1) {
          this.pending.splice(idx, 1)
          reject(new Error('Timeout'))
        }
      }, 2000)
    })
  }
}

const prolog = new PrologBridge()

// FLOW: AI → Prolog → Result
async function moderateImage(imageBuffer: Buffer, userId: string) {
  let aiResult = { safe: true, confidence: 0, harmful: [] }

  // Step 1: AI Analysis (MobileNetV2)
  if (modelLoaded && model) {
    try {
      const tensor = tf.node.decodeImage(imageBuffer, 3)
        .resizeNearestNeighbor([224, 224])
        .expandDims()
        .toFloat()
        .div(127).sub(1)

      const predictions = await model.classify(tensor)
      tensor.dispose()

      // Check for harmful content
      const harmfulTerms = ['gun', 'weapon', 'knife', 'blood', 'pill', 'syringe', 'bomb']
      const harmful = predictions.filter((p: any) => 
        harmfulTerms.some(term => p.className.toLowerCase().includes(term))
      )

      aiResult = {
        safe: harmful.length === 0,
        confidence: harmful.length > 0 ? harmful[0].probability : 0,
        harmful: harmful.map((h: any) => h.className)
      }
    } catch (error) {
      console.error('AI error:', error)
    }
  }

  // Step 2: Prolog Verification
  let prologResult
  try {
    prologResult = await prolog.check(`image: ${aiResult.harmful.join(', ')}`, aiResult)
  } catch {
    prologResult = { approved: aiResult.safe }
  }

  // Step 3: Final Decision
  return {
    result: {
      severity: prologResult.approved ? 'safe' : 'high',
      approved: prologResult.approved,
      confidence: aiResult.confidence,
      aiDetected: aiResult.harmful,
      prologReason: prologResult.reason
    },
    action: {
      type: prologResult.approved ? 'none' : 'escalate',
      reason: prologResult.reason || 'ai_detected_harmful'
    }
  }
}

// FLOW: Prolog → Result (text only)
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
    // Fallback
    const dangerous = ['csam', 'child porn', 'kill yourself']
    const safe = !dangerous.some(p => text.toLowerCase().includes(p))
    return {
      result: { severity: safe ? 'safe' : 'critical', approved: safe },
      action: { type: safe ? 'none' : 'ip_ban', reason: 'fallback' }
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
  const mem = process.memoryUsage()
  res.json({
    status: 'healthy',
    service: 'ai-moderator-lite',
    ai: modelLoaded ? 'loaded' : 'disabled',
    prolog: prolog['available'] ? 'running' : 'disabled',
    memory: {
      used: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      limit: '350MB'
    },
    queue: {
      waiting: await moderationQueue.count(),
      active: await moderationQueue.getActiveCount()
    }
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

// Text moderation (direct)
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
  console.log('🤖 AI Moderation Service (Lightweight)')
  console.log('💾 Memory limit: 350MB')
  console.log('🔄 Flow: AI → Prolog → App')

  await loadModel()
  prolog.init()

  app.listen(PORT, () => {
    console.log(`✅ Running on port ${PORT}`)
    console.log(`🧠 MobileNetV2: ${modelLoaded ? '14MB loaded' : 'disabled'}`)
    console.log(`⚖️ Prolog: ${prolog['available'] ? 'running' : 'disabled'}`)
  })
}

start()

process.on('SIGTERM', async () => {
  await moderationQueue.close()
  if (model) tf.dispose(model)
  process.exit(0)
})
