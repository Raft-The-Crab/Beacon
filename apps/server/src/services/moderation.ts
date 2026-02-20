/**
 * Beacon Moderation Service v3
 * Context-aware, multi-language, NOT paranoid
 * Supports: SWI-Prolog engine + pure TS fallback + any language
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROLOG_SCRIPT = path.join(__dirname, '../../ai/moderation.pl')
const SWIPL = process.env.SWIPL_PATH || 'swipl'

import { aiManager } from '../../ai/models'
import { videoProcessor } from '../../ai/video_processor'

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

// ── Prolog Bridge ─────────────────────────────────────────────────
class PrologBridge {
  private proc: ChildProcessWithoutNullStreams | null = null
  private buf = ''
  private pending: Array<{ resolve: (r: ModerationResult) => void; reject: (e: Error) => void }> = []
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
            if (pending) pending.resolve(result)
          } catch {
            const pending = this.pending.shift()
            if (pending) pending.reject(new Error(`Prolog parse error: ${trimmed}`))
          }
        }
      })

      this.proc.stderr.on('data', () => { /* suppress SWI-Prolog startup messages */ })

      this.proc.on('exit', () => {
        this.available = false
        // Drain pending with fallback
        while (this.pending.length) {
          const p = this.pending.shift()
          if (p) p.reject(new Error('Prolog process exited'))
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
      this.pending.push({ resolve, reject })
      const payload = JSON.stringify({ content, userId, priorOffenses }) + '\n'
      this.proc!.stdin.write(payload)
      // Timeout fallback
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
    'pedo trade', 'selling child',
    'bata porn', 'bata hubad ibenta', 'anak porno jual',
    'pornografia infantil vender'
  ]
  if (csam.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'csam', action: 'immediate_ban_and_ip_ban', description: 'Explicit CSAM content detected.', approved: false, priorOffenses }
  }

  const drugTrafficking = [
    'fentanyl vendor', 'selling fentanyl', 'heroin vendor', 'meth vendor',
    'cocaine shop', 'shabu ibenta', 'droga ibenta telegram', 'sabu jual telegram',
    'drogas vender telegram'
  ]
  if (!isSafe && drugTrafficking.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'real_drug_trafficking', action: 'immediate_ban_and_ip_ban', description: 'Real drug trafficking coordination detected.', approved: false, priorOffenses }
  }

  const terrorism = ['mass shooting', 'isis', 'al-qaeda', 'how to make pipe bomb', 'جهاد', 'داعش']
  if (!isSafe && terrorism.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'terrorism_radicalization', action: 'immediate_ban_and_ip_ban', description: 'Terrorism or radicalization content detected.', approved: false, priorOffenses }
  }

  const humanTrafficking = ['job offer abroad no experience', 'passport pickup', 'selling girl', 'escort service minors']
  if (!isSafe && humanTrafficking.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'human_trafficking', action: 'immediate_ban_and_ip_ban', description: 'Human trafficking pattern detected.', approved: false, priorOffenses }
  }

  const financialCrimes = ['money laundering', 'clean stolen cash', 'bank login trade', 'phishing script']
  if (!isSafe && financialCrimes.some(p => text.includes(p))) {
    return { severity: 'critical', reason: 'financial_crimes', action: 'immediate_ban_and_ip_ban', description: 'Financial crime involvement detected.', approved: false, priorOffenses }
  }

  const doxxing = [
    'his real address is', 'her real address is', 'their real address is',
    'leaked passport', 'credit card leak', 'social security number'
  ]
  if (!isSafe && doxxing.some(p => text.includes(p))) {
    const action = priorOffenses >= 2 ? 'immediate_ban_and_ip_ban' as const : 'escalate' as const
    return { severity: priorOffenses >= 2 ? 'critical' : 'high', reason: 'doxxing', action, description: 'Malicious info sharing.', approved: false, priorOffenses }
  }

  const credibleThreats = ["i will kill you irl", "i know where you live and", "you're dead tonight"]
  if (!isSafe && credibleThreats.some(p => text.includes(p))) {
    return { severity: 'high', reason: 'credible_targeted_threat', action: 'escalate', description: 'Specific threat detected.', approved: false, priorOffenses }
  }

  return { severity: 'safe', reason: 'none', action: 'none', description: 'Content is safe.', approved: true, priorOffenses }
}

// ── Determine moderation action from result ───────────────────────
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
  private bridge = new PrologBridge()
  private offenseCache = new Map<string, number>()
  private messageHistory = new Map<string, string[]>()

  async init() {
    this.bridge.init()
    console.log('[Moderation] Service started (AI + Prolog + TS fallback)')
  }

  getOffenses(userId: string): number {
    return this.offenseCache.get(userId) || 0
  }

  incrementOffenses(userId: string) {
    this.offenseCache.set(userId, (this.offenseCache.get(userId) || 0) + 1)
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
      if (hist.length > 50) hist.shift()
      this.messageHistory.set(channelId, hist)
    }

    const priorOffenses = this.getOffenses(userId)
    let result: ModerationResult
    try {
      result = await this.bridge.check(content, userId, priorOffenses)
    } catch {
      result = tsFallback(content, priorOffenses)
    }

    const action = determineModerationAction(result, priorOffenses)
    if (result.severity !== 'safe' && result.severity !== 'low') {
      this.incrementOffenses(userId)
    }
    return { result, action }
  }

  async checkImage(imageBuffer: Buffer, userId: string): Promise<{ result: ModerationResult; action: ModerationAction }> {
    const priorOffenses = this.getOffenses(userId)
    const detections = await aiManager.analyzeImage(imageBuffer)

    if (detections.length > 0) {
      const sorted = detections.sort((a, b) => b.probability - a.probability)
      const highestThreat = sorted[0];
      if (highestThreat) {
        const result: ModerationResult = {
          severity: 'critical',
          reason: highestThreat.className,
          action: 'immediate_ban_and_ip_ban',
          description: `AI detected ${highestThreat.className} (conf: ${highestThreat.probability.toFixed(2)})`,
          approved: false,
          priorOffenses
        }
        this.incrementOffenses(userId)
        return { result, action: determineModerationAction(result, priorOffenses) }
      }
    }

    return {
      result: { severity: 'safe', reason: 'none', action: 'none', description: 'Image safe.', approved: true, priorOffenses },
      action: { type: 'none', reason: 'safe', automated: false }
    }
  }

  async checkVideo(videoPath: string, userId: string): Promise<{ result: ModerationResult; action: ModerationAction }> {
    const priorOffenses = this.getOffenses(userId)
    const vResult = await videoProcessor.processVideo(videoPath)

    if (!vResult.safe) {
      const result: ModerationResult = {
        severity: 'critical',
        reason: vResult.threats.join(', '),
        action: 'immediate_ban_and_ip_ban',
        description: `AI detected threats in video: ${vResult.threats.join(', ')}`,
        approved: false,
        priorOffenses
      }
      this.incrementOffenses(userId)
      return { result, action: determineModerationAction(result, priorOffenses) }
    }

    return {
      result: { severity: 'safe', reason: 'none', action: 'none', description: 'Video safe.', approved: true, priorOffenses },
      action: { type: 'none', reason: 'safe', automated: false }
    }
  }

  getLanguageHint(text: string): string {
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'
    if (/[\u0900-\u097f]/.test(text)) return 'hi'
    if (/[\u0e00-\u0e7f]/.test(text)) return 'th'
    return 'en'
  }
}

export const moderationService = new ModerationService()
