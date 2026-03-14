/**
 * Beacon Image Moderation — nsfwjs
 *
 * Policy: Beacon only blocks CSAM at the platform level.
 * nsfwjs cannot detect minors specifically, so we use it to
 * flag explicit sexual content and return metadata to be stored
 * on the message record / used for NSFW-channel gating.
 *
 * Categories:
 *   Drawing  — safe / illustrated
 *   Hentai   — adult illustrated (allowed in NSFW channels)
 *   Neutral  — safe
 *   Porn     — explicit (allowed in NSFW channels)
 *   Sexy     — suggestive (borderline)
 *
 * checkImage() never rejects a message outright — it returns a
 * classifiedAs/score payload that the gateway/API layer uses to
 * decide whether the channel is marked NSFW before allowing it.
 */

let nsfwModel: any = null
let tfNode: any = null
let disabledLogPrinted = false

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue
  const normalized = String(value).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return defaultValue
}

function isImageModerationEnabled(): boolean {
  if (parseEnvBool(process.env.ENABLE_IMAGE_MODERATION, !process.env.RAILWAY_ENVIRONMENT_NAME)) return true
  if (!parseEnvBool(process.env.ENABLE_IMAGE_MODERATION, !process.env.RAILWAY_ENVIRONMENT_NAME)) return false
  // Safe default: keep Railway lightweight unless explicitly enabled.
  return !process.env.RAILWAY_ENVIRONMENT_NAME
}

async function loadModel() {
  if (nsfwModel) return nsfwModel
  try {
    const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
    tfNode = await dynamicImport('@tensorflow/tfjs-node')
    const nsfwjs = await dynamicImport('nsfwjs')
    nsfwModel = await nsfwjs.load()
    console.log('[ImageMod] nsfwjs model loaded')
  } catch (err) {
    console.warn('[ImageMod] nsfwjs unavailable — image classification disabled:', (err as Error).message)
    nsfwModel = null
  }
  return nsfwModel
}

export interface ImageModerationResult {
  safe: boolean
  explicitScore: number   // 0–1: porn+hentai combined score
  classifiedAs: 'neutral' | 'sexy' | 'hentai' | 'porn' | 'drawing' | 'unknown'
  predictions?: Array<{ className: string; probability: number }>
}

export async function checkImageBuffer(
  buffer: Buffer,
  _userId?: string
): Promise<ImageModerationResult> {
  if (!isImageModerationEnabled()) {
    if (!disabledLogPrinted) {
      console.log('[ImageMod] disabled by profile (ENABLE_IMAGE_MODERATION=false/default on Railway)')
      disabledLogPrinted = true
    }
    return { safe: true, explicitScore: 0, classifiedAs: 'unknown' }
  }

  const model = await loadModel()
  if (!model || !tfNode) {
    return { safe: true, explicitScore: 0, classifiedAs: 'unknown' }
  }

  let tensor: any
  try {
    tensor = tfNode.node.decodeImage(buffer, 3)
    const predictions: Array<{ className: string; probability: number }> =
      await model.classify(tensor)
    tensor.dispose()

    const byClass = Object.fromEntries(
      predictions.map((p: any) => [p.className.toLowerCase(), p.probability])
    )

    const pornScore  = byClass['porn']    ?? 0
    const hentaiScore= byClass['hentai']  ?? 0
    const sexyScore  = byClass['sexy']    ?? 0
    const explicitScore = pornScore + hentaiScore

    // Dominant category
    const sorted = predictions.sort((a: any, b: any) => b.probability - a.probability)
    const topClass = sorted[0]?.className?.toLowerCase() ?? 'unknown'

    let classifiedAs: ImageModerationResult['classifiedAs'] = 'unknown'
    if (['neutral', 'sexy', 'hentai', 'porn', 'drawing'].includes(topClass)) {
      classifiedAs = topClass as ImageModerationResult['classifiedAs']
    }

    // Images are never hard-blocked here — the channel NSFW-gate handles that.
    // Only extremely high-confidence explicit content gets safe=false so the
    // API layer can reject in non-NSFW channels.
    const safe = explicitScore < 0.80

    return { safe, explicitScore, classifiedAs, predictions }
  } catch (err) {
    if (tensor) tensor.dispose()
    console.error('[ImageMod] Classification error:', err)
    return { safe: true, explicitScore: 0, classifiedAs: 'unknown' }
  }
}
