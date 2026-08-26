// lib/commercial-provenance/frischheit.ts
//
// Commercial Freshness. Fehlt freshUntil, bleibt unknown – nie current.
// Ein Snapshot wird hier nicht automatisch live. Seasonal-Defaults gelten nicht.

import {
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  type CommercialFreshness,
  type CommercialProvenanceFehler,
  type CommercialSourceKind,
} from '@/lib/commercial-provenance/domain'
import { commercialAugenblickMs } from '@/lib/commercial-provenance/lesen'

const QUELLEN_MIT_FRESH_UNTIL: ReadonlySet<CommercialSourceKind> = new Set([
  'live_api',
  'provider_snapshot',
  'persisted_snapshot',
])

export function commercialZeitPruefen(opts: {
  retrievedAt: string | null | undefined
  observedAt: string | null | undefined
  freshUntil: string | null | undefined
  sourceKind: CommercialSourceKind
  nowMs: number
}):
  | {
      ok: true
      retrievedAt: string
      observedAt: string
      freshUntil: string | null
      freshness: CommercialFreshness
    }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  const fehler: CommercialProvenanceFehler[] = []
  const retrievedMs = commercialAugenblickMs(opts.retrievedAt ?? null)
  if (!opts.retrievedAt || retrievedMs == null) {
    fehler.push({ code: 'invalid_retrieved_at', path: 'retrievedAt' })
    return { ok: false, fehler }
  }
  if (retrievedMs > opts.nowMs + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS) {
    fehler.push({ code: 'retrieved_at_in_future', path: 'retrievedAt' })
    return { ok: false, fehler }
  }

  const observedRoh = opts.observedAt ?? null
  if (observedRoh) {
    const observedMs = commercialAugenblickMs(observedRoh)
    if (observedMs == null) {
      fehler.push({ code: 'invalid_retrieved_at', path: 'observedAt' })
      return { ok: false, fehler }
    }
    if (observedRoh !== opts.retrievedAt) {
      fehler.push({ code: 'observed_at_mismatch', path: 'observedAt' })
      return { ok: false, fehler }
    }
  }

  const freshRoh = opts.freshUntil ?? null
  if (freshRoh) {
    if (!QUELLEN_MIT_FRESH_UNTIL.has(opts.sourceKind)) {
      fehler.push({ code: 'fresh_until_ohne_quellenbeleg', path: 'freshUntil' })
      return { ok: false, fehler }
    }
    const freshMs = commercialAugenblickMs(freshRoh)
    if (freshMs == null) {
      fehler.push({ code: 'invalid_fresh_until', path: 'freshUntil' })
      return { ok: false, fehler }
    }
    if (freshMs < retrievedMs) {
      fehler.push({ code: 'fresh_until_before_retrieved_at', path: 'freshUntil' })
      return { ok: false, fehler }
    }
    return {
      ok: true,
      retrievedAt: opts.retrievedAt,
      observedAt: observedRoh ?? opts.retrievedAt,
      freshUntil: freshRoh,
      freshness: opts.nowMs > freshMs ? 'stale' : 'current',
    }
  }

  return {
    ok: true,
    retrievedAt: opts.retrievedAt,
    observedAt: observedRoh ?? opts.retrievedAt,
    freshUntil: null,
    freshness: 'unknown',
  }
}

export function commercialFrischheitBewerten(opts: {
  retrievedAt: string
  freshUntil: string | null
  nowMs: number
}): CommercialFreshness {
  if (!opts.freshUntil) return 'unknown'
  const bis = commercialAugenblickMs(opts.freshUntil)
  if (bis == null) return 'unknown'
  return opts.nowMs > bis ? 'stale' : 'current'
}
