/**
 * Beacon Moderation Service v4
 * Hosted AI > Prolog > Decision > Final Fallback
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import { getProfile } from '../utils/autoTune'

const __dirname = path.resolve();
const PROLOG_SCRIPT = path.join(__dirname, 'ai', 'moderation.pl')
const SWIPL = process.env.SWIPL_PATH || 'swipl'
const AI_ENDPOINT = process.env.AI_MODERATION_ENDPOINT || 'http://localhost:11434/v1/chat/completions'
const AI_MODEL = process.env.AI_MODERATION_MODEL || 'llama3'
const AI_API_KEY = process.env.AI_API_KEY || 'sk-none'

export interface ModerationResult {
  severity: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  reason: string
  action: 'none' | 'warning' | 'account_risk_flag' | 'escalate' | 'immediate_ban_and_ip_ban' | 'Rejected'
  description: string
  approved: boolean
  priorOffenses: number
  flags?: string[]
  score?: number
  status?: 'Safe' | 'Warning' | 'Rejected'
}

export interface ModerationAction {
  type: 'warn' | 'mute' | 'temp_ban' | 'ban' | 'ip_ban' | 'account_risk' | 'none'
  duration?: number // ms, for temp actions
  reason: string
  automated: boolean
}

// ── AI Engine ─────────────────────────────────────────────────────
class AIEngine {
  async check(content: string, userId: string, priorOffenses: number): Promise<ModerationResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout for fast AI
    try {
      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a moderation AI. Reply exactly in JSON format with no extra text. Format: {"flagged": boolean, "severity": "safe"|"low"|"medium"|"high"|"critical", "reason": "short phrase"}`
            },
            {
              role: 'user',
              content: `Analyze this chat message: "${content}"`
            }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      const result = JSON.parse(data.choices[0].message.content);

      if (!result.flagged || result.severity === 'safe') {
        return { severity: 'safe', reason: 'none', action: 'none', description: 'AI verified safe.', approved: true, priorOffenses };
      }

      // If AI flags it, we normalize it to a ModerationResult to be evaluated
      let action: ModerationResult['action'] = 'warning';
      if (result.severity === 'critical') action = 'immediate_ban_and_ip_ban';
      else if (result.severity === 'high') action = 'escalate';
      else if (result.severity === 'medium') action = 'account_risk_flag';

      return {
        severity: result.severity,
        reason: result.reason || 'ai_flagged',
        action,
        description: `AI flagged message as ${result.severity}`,
        approved: false,
        priorOffenses
      };

    } catch (e) {
      // Return null to cascade down to Prolog
      console.warn(`[AI Engine] Offline or timeout, cascading to Prolog...`);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ── Prolog Bridge ─────────────────────────────────────────────────
class PrologBridge {
  private proc: ChildProcessWithoutNullStreams | null = null
  private buf = ''
  private pending: Array<{ resolve: (r: ModerationResult) => void; reject: (e: Error) => void; timer?: NodeJS.Timeout }> = []
  private available = false

  init() {
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
            const result = JSON.parse(trimmed) as ModerationResult
            const pending = this.pending.shift()
            if (pending) {
              if (pending.timer) clearTimeout(pending.timer)
              pending.resolve(result)
            }
          } catch {
            const pending = this.pending.shift()
            if (pending) {
              if (pending.timer) clearTimeout(pending.timer)
              pending.reject(new Error(`Prolog parse error: ${trimmed}`))
            }
          }
        }
      })

      this.proc.stderr.on('data', () => { /* suppress SWI-Prolog startup messages */ })

      this.proc.on('exit', () => {
        this.available = false
        // Drain pending with fallback
        while (this.pending.length) {
          const p = this.pending.shift()
          if (p) {
            if (p.timer) clearTimeout(p.timer)
            p.reject(new Error('Prolog process exited'))
          }
        }
        // Restart after 2s
        setTimeout(() => this.init(), 2000)
      })

      this.proc.on('error', () => { this.available = false })
    } catch {
      this.available = false
    }
  }

  async check(content: string, userId: string, priorOffenses: number): Promise<ModerationResult> {
    if (!this.available || !this.proc) {
      throw new Error('Prolog not available')
    }
    return new Promise((resolve, reject) => {
      const pendingObj: any = { resolve, reject }
      this.pending.push(pendingObj)
      const payload = JSON.stringify({ content, userId, priorOffenses }) + '\n'
      this.proc!.stdin.write(payload)
      // Timeout fallback
      pendingObj.timer = setTimeout(() => {
        const idx = this.pending.findIndex(p => p.resolve === resolve)
        if (idx !== -1) {
          this.pending.splice(idx, 1)
          reject(new Error('Prolog timeout'))
        }
      }, 3000)
    })
  }
}

// ── Pure TypeScript fallback (runs when Prolog unavailable) ───────
function tsFallback(content: string, priorOffenses: number): ModerationResult {
  const text = content.toLowerCase()

  const safeMarkers = [
    'wanna meet', 'want to meet', "let's hang", 'come over', 'hang out',
    'meet up', 'meetup', 'irl meetup', 'coffee', 'wanna hang',
    'jk', 'just kidding', 'lmao', 'lol', 'haha', 'joking', 'sarcasm',
    'hypothetically', 'in minecraft', 'meme', 'bruh', 'imagine',
    'educational', 'research', 'history', 'for school', 'studying',
    'ngl', 'fr fr', 'no cap', 'based', 'copypasta', 'roleplay', ' rp ',
    '💀', '😂', '😭'
  ]
  const isSafe = safeMarkers.some(m => text.includes(m))

  const csam = [
    'child pornography', 'cp collection trade', 'loli trade', 'csam',
    'pedo trade', 'selling child'
  ]
  if (csam.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'csam', action: 'immediate_ban_and_ip_ban', description: 'Explicit CSAM content detected.', approved: false, priorOffenses }
  }

  const drugTrafficking = [
    'fentanyl vendor', 'selling fentanyl', 'heroin vendor', 'meth vendor', 'cocaine shop'
  ]
  if (!isSafe && drugTrafficking.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'real_drug_trafficking', action: 'immediate_ban_and_ip_ban', description: 'Real drug trafficking coordination detected.', approved: false, priorOffenses }
  }

  const doxxing = [
    'his real address is', 'her real address is', 'their real address is',
    'leaked passport', 'credit card leak', 'social security number'
  ]
  if (!isSafe && doxxing.some(p => text.includes(p))) {
    const action = priorOffenses >= 2 ? 'immediate_ban_and_ip_ban' as const : 'escalate' as const
    return { severity: priorOffenses >= 2 ? 'critical' : 'high', reason: 'doxxing', action, description: 'Malicious info sharing.', approved: false, priorOffenses }
  }

  return { severity: 'safe', reason: 'none', action: 'none', description: 'Content is safe.', approved: true, priorOffenses }
}

// ── Decision Engine ───────────────────────────────────────────────
export function determineModerationAction(result: ModerationResult, priorOffenses: number): ModerationAction {
  switch (result.action) {
    case 'immediate_ban_and_ip_ban':
      return { type: 'ip_ban', reason: result.reason, automated: true }

    case 'escalate':
      if (priorOffenses >= 3) return { type: 'ban', reason: result.reason, automated: true }
      if (priorOffenses >= 2) return { type: 'temp_ban', duration: 7 * 24 * 60 * 60 * 1000, reason: result.reason, automated: true }
      if (priorOffenses >= 1) return { type: 'temp_ban', duration: 24 * 60 * 60 * 1000, reason: result.reason, automated: true }
      return { type: 'mute', duration: 60 * 60 * 1000, reason: result.reason, automated: true }

    case 'account_risk_flag':
      return { type: 'account_risk', reason: result.reason, automated: true }

    case 'warning':
      return { type: 'warn', reason: result.reason, automated: true }

    default:
      return { type: 'none', reason: 'safe', automated: false }
  }
}

// ── Main service ──────────────────────────────────────────────────
class ModerationService {
  private aiEngine = new AIEngine()
  private bridge = new PrologBridge()
  private offenseCache = new Map<string, { count: number; lastUpdated: number }>()
  private messageHistory = new Map<string, string[]>()
  private readonly MAX_HISTORY_PER_CHANNEL = 20
  private readonly OFFENSE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

  async init() {
    this.bridge.init()
    // Periodic cleanup: evict stale offense entries every 30 min
    setInterval(() => this.cleanupCaches(), 30 * 60 * 1000)
    console.log('[Moderation] Service started (Pipeline: AI -> Prolog -> TS)')
  }

  private cleanupCaches() {
    const now = Date.now()
    let evicted = 0
    for (const [userId, data] of this.offenseCache) {
      if (now - data.lastUpdated > this.OFFENSE_EXPIRY_MS) {
        this.offenseCache.delete(userId)
        evicted++
      }
    }
    // Also cap total history channels
    if (this.messageHistory.size > 50) {
      const keys = [...this.messageHistory.keys()]
      for (let i = 0; i < keys.length - 50; i++) {
        this.messageHistory.delete(keys[i])
      }
    }
    if (evicted > 0) console.log(`[Moderation] Evicted ${evicted} stale offense entries`)
  }

  getOffenses(userId: string): number {
    const entry = this.offenseCache.get(userId)
    if (!entry) return 0
    if (Date.now() - entry.lastUpdated > this.OFFENSE_EXPIRY_MS) {
      this.offenseCache.delete(userId)
      return 0
    }
    return entry.count
  }

  incrementOffenses(userId: string) {
    const existing = this.offenseCache.get(userId)
    this.offenseCache.set(userId, {
      count: (existing?.count || 0) + 1,
      lastUpdated: Date.now()
    })
  }

  async checkMessage(content: string, userId: string, channelId?: string): Promise<{
    result: ModerationResult
    action: ModerationAction
  }> {
    if (!content || content.trim().length === 0) {
      return {
        result: { severity: 'safe', reason: 'none', action: 'none', description: 'Empty.', approved: true, priorOffenses: 0 },
        action: { type: 'none', reason: 'safe', automated: false }
      }
    }

    if (channelId) {
      const hist = this.messageHistory.get(channelId) || []
      hist.push(content)
      if (hist.length > this.MAX_HISTORY_PER_CHANNEL) hist.shift()
      this.messageHistory.set(channelId, hist)
    }

    const priorOffenses = this.getOffenses(userId)
    let result: ModerationResult | null = null

    // 1. Hosted AI Phase
    result = await this.aiEngine.check(content, userId, priorOffenses)

    // 2. Prolog Deterministic Rules Phase (skip if memory pressure)
    if (!result) {
      const rssMB = process.memoryUsage().rss / 1024 / 1024
      const profile = getProfile()
      if (profile.prologBypassMB === 0 || rssMB > profile.prologBypassMB) {
        // Under memory pressure or minimal mode, skip Prolog and go to TS fallback
        console.warn(`[Moderation] RSS ${Math.round(rssMB)} MB, skipping Prolog → TS fallback`)
        result = tsFallback(content, priorOffenses)
      } else {
        try {
          result = await this.bridge.check(content, userId, priorOffenses)
        } catch {
          // 3. TS Fallback Phase
          result = tsFallback(content, priorOffenses)
        }
      }
    }

    // 4. Final Decision Phase
    const action = determineModerationAction(result, priorOffenses)
    if (result.severity !== 'safe' && result.severity !== 'low') {
      this.incrementOffenses(userId)
    }
    return { result, action }
  }

  async checkImage(imageBuffer: Buffer, userId: string): Promise<{ result: ModerationResult; action: ModerationAction }> {
    const priorOffenses = this.getOffenses(userId)
    // TODO: When fine-tuned image model is ready, run actual analysis here
    return {
      result: { severity: 'safe', reason: 'none', action: 'none', description: 'Image safe.', approved: true, priorOffenses },
      action: { type: 'none', reason: 'safe', automated: false }
    }
  }

  async checkVideo(videoPath: string, userId: string): Promise<{ result: ModerationResult; action: ModerationAction }> {
    const priorOffenses = this.getOffenses(userId)
    // TODO: When fine-tuned video model is ready, run frame extraction + analysis here
    return {
      result: { severity: 'safe', reason: 'none', action: 'none', description: 'Video safe.', approved: true, priorOffenses },
      action: { type: 'none', reason: 'safe', automated: false }
    }
  }

  /**
   * Register moderation handlers with the priority queue.
   * - text_moderation → fast lane (inline, < 2s)
   * - image_moderation → slow lane (background, queued)
   * - video_moderation → slow lane (background, queued)
   */
  initQueue() {
    const { priorityQueue } = require('./priorityQueue')

    // FAST: text moderation runs inline
    priorityQueue.register('text_moderation', async (job: any) => {
      const { content, userId, channelId } = job.data
      return this.checkMessage(content, userId, channelId)
    })

    // SLOW: image moderation runs in background
    priorityQueue.register('image_moderation', async (job: any) => {
      const { imageBuffer, userId } = job.data
      const buffer = Buffer.from(imageBuffer, 'base64')
      return this.checkImage(buffer, userId)
    })

    // SLOW: video moderation runs in background
    priorityQueue.register('video_moderation', async (job: any) => {
      const { videoUrl, userId } = job.data
      const { videoModerationService } = require('./videoModeration')
      return videoModerationService.moderateVideoUrl(videoUrl, userId)
    })

    console.log('[Moderation] Priority queue handlers registered (fast: text | slow: image, video)')
  }
}

export const moderationService = new ModerationService()

