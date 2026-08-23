// lib/safety/evidence.ts
//
// External Event / Source Fact und Trust-/Freshness-Grenze.
// Browser- oder LLM-Felder setzen niemals Official Evidence.

import {
  SAFETY_AUTHORITY_CLASSES,
  SAFETY_GRENZEN,
  enumLesen,
  type SafetyAuthorityClass,
  type SafetyFreshness,
} from '@/lib/safety/domain'

const CHECKED_AT_SKEW_MS = 5 * 60 * 1000

export type SafetyEvidence = {
  provider: string | null
  authority: string | null
  authorityClass: SafetyAuthorityClass
  sourceUrl: string | null
  publishedAt: string | null
  updatedAt: string | null
  checkedAt: string | null
  validFrom: string | null
  validUntil: string | null
  headline: string | null
  summary: string | null
}

export function isoZeitLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const zeit = wert.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(zeit)) return null
  return Number.isFinite(Date.parse(zeit)) ? zeit : null
}

export function isoDatumLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return Number.isFinite(Date.parse(`${text}T00:00:00.000Z`)) ? text : null
  }
  return isoZeitLesen(text)
}

export function zeitMs(wert: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(wert) ? `${wert}T00:00:00.000Z` : wert)
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
  return sicherheitstextLesen(wert, SAFETY_GRENZEN.provider)
}

export function authorityLesen(wert: unknown): string | null {
  return sicherheitstextLesen(wert, SAFETY_GRENZEN.authority)
}

export function factSchluesselLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const key = wert.trim()
  if (key.length < 2 || key.length > SAFETY_GRENZEN.factKey) return null
  if (!/^[a-z0-9][a-z0-9:_-]*$/i.test(key)) return null
  return key
}

export function authorityClassLesen(wert: unknown): SafetyAuthorityClass {
  return enumLesen(wert, SAFETY_AUTHORITY_CLASSES) ?? 'unknown'
}

export function safetyEvidenceVertrauenswuerdig(opts: {
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

export function safetyFrische(opts: {
  storedFingerprint: string | null
  currentFingerprint: string
  checkedAt: string | null
  validFrom?: string | null
  validUntil: string | null
  nowMs?: number
  hasProvider: boolean
  sourceAvailable?: boolean
  eventStatus?: string | null
}): SafetyFreshness {
  if (!opts.hasProvider) return 'provider_unavailable'
  if (opts.sourceAvailable === false) return 'source_temporarily_unavailable'
  if (!opts.checkedAt) return 'never_checked'
  if (opts.storedFingerprint && opts.storedFingerprint !== opts.currentFingerprint) return 'stale'
  const jetzt = opts.nowMs ?? Date.now()
  if (opts.validFrom && jetzt < zeitMs(opts.validFrom)) return 'never_checked'
  if (opts.validUntil && jetzt > zeitMs(opts.validUntil)) return 'recheck_needed'
  if (opts.eventStatus === 'resolved' || opts.eventStatus === 'withdrawn') return 'stale'
  return 'current'
}

export function leereSafetyEvidence(fingerprint: string): SafetyEvidence {
  return {
    provider: null,
    authority: null,
    authorityClass: 'unknown',
    sourceUrl: null,
    publishedAt: null,
    updatedAt: null,
    checkedAt: null,
    validFrom: null,
    validUntil: null,
    headline: null,
    summary: null,
  }
}
