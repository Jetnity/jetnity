// lib/commercial-provenance/frischheit.ts
//
// Commercial Freshness. Fehlt freshUntil, bleibt unknown – nie current.
// User-Intake/Manual haben eine Eintragszeit (observedAt), keinen Provider-Abruf.

import {
  COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS,
  type CommercialFreshness,
  type CommercialProvenanceFehler,
  type CommercialSourceKind,
} from '@/lib/commercial-provenance/domain'
import { commercialAugenblickMs } from '@/lib/commercial-provenance/lesen'
import { istCommercialProviderQuelle } from '@/lib/commercial-provenance/trust'

const QUELLEN_MIT_FRESH_UNTIL = new Set(['live_api', 'provider_snapshot', 'persisted_snapshot'])

function zeitpunktLesen(
  wert: string | null | undefined,
  code: CommercialProvenanceFehler['code'],
  path: string,
): { ok: true; iso: string; ms: number } | { ok: false; fehler: CommercialProvenanceFehler[] } {
  const ms = commercialAugenblickMs(wert ?? null)
  if (!wert || ms == null) {
    return { ok: false, fehler: [{ code, path }] }
  }
  return { ok: true, iso: wert, ms }
}

export function commercialZeitPruefen(opts: {
  retrievedAt: string | null | undefined
  observedAt: string | null | undefined
  freshUntil: string | null | undefined
  sourceKind: CommercialSourceKind
  nowMs: number
}):
  | {
      ok: true
      retrievedAt: string | null
      observedAt: string
      freshUntil: string | null
      freshness: CommercialFreshness
    }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  if (!istCommercialProviderQuelle(opts.sourceKind)) {
    if (opts.retrievedAt) {
      return { ok: false, fehler: [{ code: 'retrieved_at_ohne_abruf', path: 'retrievedAt' }] }
    }
    if (opts.freshUntil) {
      return { ok: false, fehler: [{ code: 'fresh_until_ohne_quellenbeleg', path: 'freshUntil' }] }
    }
    const observed = zeitpunktLesen(opts.observedAt, 'missing_observed_at', 'observedAt')
    if (!observed.ok) return observed
    if (observed.ms > opts.nowMs + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS) {
      return { ok: false, fehler: [{ code: 'invalid_observed_at', path: 'observedAt' }] }
    }
    return {
      ok: true,
      retrievedAt: null,
      observedAt: observed.iso,
      freshUntil: null,
      freshness: 'unknown',
    }
  }

  const retrieved = zeitpunktLesen(opts.retrievedAt, 'invalid_retrieved_at', 'retrievedAt')
  if (!retrieved.ok) return retrieved
  if (retrieved.ms > opts.nowMs + COMMERCIAL_RETRIEVED_AT_FUTURE_SKEW_MS) {
    return { ok: false, fehler: [{ code: 'retrieved_at_in_future', path: 'retrievedAt' }] }
  }

  const observedRoh = opts.observedAt ?? null
  if (observedRoh) {
    const observed = zeitpunktLesen(observedRoh, 'invalid_observed_at', 'observedAt')
    if (!observed.ok) return observed
    if (observedRoh !== opts.retrievedAt) {
      return { ok: false, fehler: [{ code: 'observed_at_mismatch', path: 'observedAt' }] }
    }
  }

  const freshRoh = opts.freshUntil ?? null
  if (freshRoh) {
    if (!QUELLEN_MIT_FRESH_UNTIL.has(opts.sourceKind)) {
      return { ok: false, fehler: [{ code: 'fresh_until_ohne_quellenbeleg', path: 'freshUntil' }] }
    }
    const fresh = zeitpunktLesen(freshRoh, 'invalid_fresh_until', 'freshUntil')
    if (!fresh.ok) return fresh
    if (fresh.ms < retrieved.ms) {
      return { ok: false, fehler: [{ code: 'fresh_until_before_retrieved_at', path: 'freshUntil' }] }
    }
    return {
      ok: true,
      retrievedAt: retrieved.iso,
      observedAt: observedRoh ?? retrieved.iso,
      freshUntil: fresh.iso,
      freshness: opts.nowMs > fresh.ms ? 'stale' : 'current',
    }
  }

  return {
    ok: true,
    retrievedAt: retrieved.iso,
    observedAt: observedRoh ?? retrieved.iso,
    freshUntil: null,
    freshness: 'unknown',
  }
}

export function commercialFrischheitBewerten(opts: {
  retrievedAt: string | null
  freshUntil: string | null
  nowMs: number
}): CommercialFreshness {
  if (!opts.retrievedAt || !opts.freshUntil) return 'unknown'
  const bis = commercialAugenblickMs(opts.freshUntil)
  if (bis == null) return 'unknown'
  return opts.nowMs > bis ? 'stale' : 'current'
}
