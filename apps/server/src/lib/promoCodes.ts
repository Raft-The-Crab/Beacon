import fs from 'fs'
import path from 'path'

export type PromoCodeBenefit =
  | { kind: 'percent'; value: number }
  | { kind: 'coins'; value: number }
  | { kind: 'beacon_plus'; value: number }

interface PromoDefinition {
  code: string
  benefit: PromoCodeBenefit
  description: string
  active: boolean
  startsAt?: string
  expiresAt?: string
}

interface PromoConfigEntry {
  code?: unknown
  kind?: unknown
  value?: unknown
  description?: unknown
  active?: unknown
  startsAt?: unknown
  expiresAt?: unknown
}

function getPromoConfigPaths(): string[] {
  return [
    path.resolve(process.cwd(), 'config', 'coupon-codes.json'),
    path.resolve(__dirname, '../../config/coupon-codes.json'),
    path.resolve(process.cwd(), 'config', 'redeem-codes.json'),
    path.resolve(__dirname, '../../config/redeem-codes.json'),
    // Legacy combined file fallback
    path.resolve(process.cwd(), 'config', 'promo-codes.json'),
    path.resolve(__dirname, '../../config/promo-codes.json'),
  ]
}

function isActiveByDate(promo: PromoDefinition, now: Date): boolean {
  const start = promo.startsAt ? new Date(promo.startsAt) : null
  const end = promo.expiresAt ? new Date(promo.expiresAt) : null
  if (start && !Number.isNaN(start.getTime()) && now < start) return false
  if (end && !Number.isNaN(end.getTime()) && now > end) return false
  return true
}

function parsePromoConfig(entries: PromoConfigEntry[]): PromoDefinition[] {
  return entries
    .map((entry): PromoDefinition | null => {
      const code = typeof entry.code === 'string' ? entry.code.trim().toUpperCase() : ''
      const kind = entry.kind === 'percent' || entry.kind === 'coins' || entry.kind === 'beacon_plus' ? entry.kind : null
      const value = typeof entry.value === 'number' ? entry.value : Number(entry.value)
      const active = entry.active !== false
      const description = typeof entry.description === 'string' ? entry.description : ''
      const startsAt = typeof entry.startsAt === 'string' ? entry.startsAt : undefined
      const expiresAt = typeof entry.expiresAt === 'string' ? entry.expiresAt : undefined

      if (!code || !kind || Number.isNaN(value)) return null
      return {
        code,
        benefit: { kind, value },
        description,
        active,
        startsAt,
        expiresAt,
      }
    })
    .filter((promo): promo is PromoDefinition => Boolean(promo))
}

function loadPromoDefinitions(): PromoDefinition[] {
  const aggregated: PromoDefinition[] = []
  for (const configPath of getPromoConfigPaths()) {
    try {
      if (!fs.existsSync(configPath)) continue
      const raw = fs.readFileSync(configPath, 'utf8')
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) continue
      aggregated.push(...parsePromoConfig(parsed as PromoConfigEntry[]))
    } catch (err) {
      console.error('[promoCodes] Failed to load promo config:', err)
    }
  }

  // Last one wins if duplicate code appears across files.
  const deduped = new Map<string, PromoDefinition>()
  for (const promo of aggregated) deduped.set(promo.code, promo)
  return Array.from(deduped.values())
}

export function normalizePromoCode(input?: unknown): string | null {
  if (typeof input !== 'string') return null
  const normalized = input.trim().toUpperCase()
  return normalized.length > 0 ? normalized : null
}

export function resolvePromoCode(input?: unknown): PromoDefinition | null {
  const code = normalizePromoCode(input)
  if (!code) return null
  const now = new Date()
  const promo = loadPromoDefinitions().find((item) => item.code === code)
  if (!promo || !promo.active || !isActiveByDate(promo, now)) return null
  return promo
}

export function applyPercentPromo(baseCost: number, input?: unknown): { cost: number; code: string | null; discountPercent: number } {
  const promo = resolvePromoCode(input)
  if (!promo || promo.benefit.kind !== 'percent') {
    return { cost: baseCost, code: null, discountPercent: 0 }
  }

  const discountPercent = Math.max(0, Math.min(90, promo.benefit.value))
  const cost = Math.max(0, Math.floor(baseCost * (1 - discountPercent / 100)))
  return { cost, code: promo.code, discountPercent }
}

export function getCoinPromoAmount(input?: unknown): { amount: number; code: string | null } {
  const promo = resolvePromoCode(input)
  if (!promo || promo.benefit.kind !== 'coins') {
    return { amount: 0, code: null }
  }

  return { amount: Math.max(0, promo.benefit.value), code: promo.code }
}

export function listPublicPromoCodes() {
  const now = new Date()
  return loadPromoDefinitions().filter((promo) => promo.active && isActiveByDate(promo, now)).map((promo) => ({
    code: promo.code,
    description: promo.description,
    kind: promo.benefit.kind,
    value: promo.benefit.value,
    startsAt: promo.startsAt,
    expiresAt: promo.expiresAt,
  }))
}
