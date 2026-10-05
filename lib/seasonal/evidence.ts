// lib/seasonal/evidence.ts
//
// Source-/Freshness-Grenze. Browser- oder LLM-Felder setzen niemals Evidence.
// Freshness kopiert nicht die Safety-7-Tage-Defaultgültigkeit.

import { SEASONAL_GRENZEN, type SeasonalAuthorityClass, type SeasonalFreshness } from '@/lib/seasonal/domain'
import { zeitMs } from '@/lib/seasonal/kalender'

const CHECKED_AT_SKEW_MS = 5 * 60 * 1000

export type SeasonalEvidence = {
  provider: string | null
  authority: string | null
  authorityClass: SeasonalAuthorityClass
  sourceUrl: string | null
  publishedAt: string | null
  updatedAt: string | null
  checkedAt: string | null
  freshUntil: string | null
  headline: string | null
  summary: string | null
  referencePeriod: { startYear: number; endYear: number } | null
}

export function quelleUrlLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const url = wert.trim()
  if (url.length < 12 || url.length > 500) return null
  if (!/^https:\/\//i.test(url)) return null
  try {
    const gelesen = new URL(url)
    if (gelesen.protocol !== 'https:') return null
    if (gelesen.username || gelesen.password) return null
    if (gelesen.hostname === 'localhost' || gelesen.hostname.endsWith('.local')) return null
    return gelesen.toString()
  } catch {
    return null
  }
}

export function sicherheitstextLesen(wert: unknown, max: number): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F]/g, '').trim()
  if (text.length < 2 || text.length > max) return null
  if (/<\/?[a-z][\s\S]*>/i.test(text)) return null
  return text
}

export function providerNameLesen(wert: unknown): string | null {
  return sicherheitstextLesen(wert, SEASONAL_GRENZEN.provider)
}

export function authorityLesen(wert: unknown): string | null {
  return sicherheitstextLesen(wert, SEASONAL_GRENZEN.authority)
}

export function factSchluesselLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const key = wert.trim()
  if (key.length < 2 || key.length > SEASONAL_GRENZEN.factKey) return null
  if (!/^[a-z0-9][a-z0-9:_-]*$/i.test(key)) return null
  return key
}

export function seasonalEvidenceVertrauenswuerdig(opts: {
  provider: string | null
  checkedAt: string | null
  authority: string | null
  sourceUrl: string | null
  sourceUrlRoh?: unknown
  nowMs?: number
}): boolean {
  if (!opts.provider || !opts.checkedAt || !opts.authority) return false
  const ms = Date.parse(opts.checkedAt)
  if (!Number.isFinite(ms) || ms > (opts.nowMs ?? Date.now()) + CHECKED_AT_SKEW_MS) return false
  if (typeof opts.sourceUrlRoh === 'string' && opts.sourceUrlRoh.trim() !== '' && !opts.sourceUrl) {
    return false
  }
  return true
}

export function seasonalFrische(opts: {
  storedFingerprint: string | null
  currentFingerprint: string
  checkedAt: string | null
  freshUntil?: string | null
  nowMs?: number
  hasProvider: boolean
  sourceAvailable?: boolean
  timedOut?: boolean
}): SeasonalFreshness {
  if (!opts.hasProvider) return 'provider_unavailable'
  if (opts.timedOut || opts.sourceAvailable === false) return 'source_temporarily_unavailable'
  if (!opts.checkedAt) return 'never_checked'
  if (opts.storedFingerprint && opts.storedFingerprint !== opts.currentFingerprint) return 'stale'
  const geprueft = zeitMs(opts.checkedAt)
  if (!Number.isFinite(geprueft)) return 'never_checked'
  if (!opts.freshUntil) return 'recheck_needed'
  const bis = zeitMs(opts.freshUntil)
  const jetzt = opts.nowMs ?? Date.now()
  if (!Number.isFinite(bis) || jetzt > bis) return 'recheck_needed'
  return 'current'
}

export function leereSeasonalEvidence(): SeasonalEvidence {
  return {
    provider: null,
    authority: null,
    authorityClass: 'unknown',
    sourceUrl: null,
    publishedAt: null,
    updatedAt: null,
    checkedAt: null,
    freshUntil: null,
    headline: null,
    summary: null,
    referencePeriod: null,
  }
}
