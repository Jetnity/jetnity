// lib/safety/evidence.ts
//
// External Event / Source Fact und Trust-/Freshness-Grenze.
// Browser- oder LLM-Felder setzen niemals Official Evidence.

import {
  SAFETY_GRENZEN,
  type SafetyAuthorityClass,
  type SafetyFreshness,
} from '@/lib/safety/domain'

const CHECKED_AT_SKEW_MS = 5 * 60 * 1000

function kalenderteileGueltig(jahr: number, monat: number, tag: number): boolean {
  if (!Number.isInteger(jahr) || !Number.isInteger(monat) || !Number.isInteger(tag)) return false
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

export function istKalenderdatum(wert: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  return kalenderteileGueltig(jahr ?? 0, monat ?? 0, tag ?? 0)
}

function istIsoZeit(wert: string): boolean {
  const treffer = wert.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/)
  if (!treffer) return false
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  if (!kalenderteileGueltig(jahr, monat, tag)) return false
  return stunde <= 23 && minute <= 59 && sekunde <= 59
}

export type SafetyEvidence = {
  provider: string | null
  authority: string | null
  authorityClass: SafetyAuthorityClass
  sourceUrl: string | null
  publishedAt: string | null
  updatedAt: string | null
  checkedAt: string | null
  freshUntil: string | null
  validFrom: string | null
  validUntil: string | null
  headline: string | null
  summary: string | null
}

export function isoZeitLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const zeit = wert.trim()
  return istIsoZeit(zeit) ? zeit : null
}

export function isoDatumLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (istKalenderdatum(text)) return text
  return isoZeitLesen(text)
}

export function zeitMs(wert: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(wert) ? `${wert}T00:00:00.000Z` : wert)
}

export function zeitgrenzeMs(wert: string, kante: 'start' | 'end'): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) {
    return Date.parse(kante === 'start' ? `${wert}T00:00:00.000Z` : `${wert}T23:59:59.999Z`)
  }
  if (zeitForm(wert) === 'clock') return Number.NaN
  return Date.parse(wert)
}

export function zeitForm(wert: string): 'date' | 'clock' | 'instant' | 'invalid' {
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) return 'date'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/.test(wert)) return 'instant'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wert)) return 'clock'
  return 'invalid'
}

export function kalendertagAus(wert: string): string | null {
  const treffer = /^(\d{4}-\d{2}-\d{2})/.exec(wert)
  return treffer?.[1] ?? null
}

export function ziviluhrAus(wert: string): string | null {
  const treffer = /T(\d{2}:\d{2})/.exec(wert)
  return treffer?.[1] ?? null
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
  freshUntil?: string | null
  nowMs?: number
  hasProvider: boolean
  sourceAvailable?: boolean
  timedOut?: boolean
}): SafetyFreshness {
  if (!opts.hasProvider) return 'provider_unavailable'
  if (opts.timedOut || opts.sourceAvailable === false) return 'source_temporarily_unavailable'
  if (!opts.checkedAt) return 'never_checked'
  if (opts.storedFingerprint && opts.storedFingerprint !== opts.currentFingerprint) return 'stale'
  const jetzt = opts.nowMs ?? Date.now()
  const geprueft = zeitMs(opts.checkedAt)
  if (!Number.isFinite(geprueft)) return 'never_checked'
  if (opts.freshUntil) {
    const bis = zeitMs(opts.freshUntil)
    if (!Number.isFinite(bis) || jetzt > bis) return 'recheck_needed'
  } else if (jetzt - geprueft > SAFETY_GRENZEN.maxEvidenceAgeMs) {
    return 'recheck_needed'
  }
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
    freshUntil: null,
    validFrom: null,
    validUntil: null,
    headline: null,
    summary: null,
  }
}
