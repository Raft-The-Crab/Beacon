import { Router } from 'express'
import axios from 'axios'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/status', authenticate, async (_req, res) => {
  const started = Date.now()

  const aiUrl = (process.env.CLAWCLOUD_AI_URL || '').trim()
  const apiKey = (process.env.CLAWCLOUD_API_KEY || process.env.AI_API_KEY || '').trim()
  const configured = Boolean(aiUrl && apiKey)

  if (!configured) {
    return res.status(200).json({
      status: 'degraded',
      provider: 'clawcloud',
      configured: false,
      modelStatus: 'not-configured',
      latencyMs: Date.now() - started,
      details: {
        endpoint: aiUrl || null,
        reason: 'Missing CLAWCLOUD_AI_URL or CLAWCLOUD_API_KEY',
      },
    })
  }

  try {
    const response = await axios.get(`${aiUrl.replace(/\/$/, '')}/health`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 4000,
      validateStatus: () => true,
    })

    const latencyMs = Date.now() - started
    const ok = response.status >= 200 && response.status < 300

    return res.status(200).json({
      status: ok ? 'healthy' : 'degraded',
      provider: 'clawcloud',
      configured: true,
      modelStatus: ok ? 'reachable' : 'unreachable',
      latencyMs,
      details: {
        endpoint: aiUrl,
        upstreamStatus: response.status,
      },
    })
  } catch (error: any) {
    return res.status(200).json({
      status: 'degraded',
      provider: 'clawcloud',
      configured: true,
      modelStatus: 'unreachable',
      latencyMs: Date.now() - started,
      details: {
        endpoint: aiUrl,
        reason: error?.message || 'Unknown upstream error',
      },
    })
  }
})

export default router
