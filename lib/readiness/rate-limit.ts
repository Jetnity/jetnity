// lib/readiness/rate-limit.ts
//
// Schranke für die geschlossene Requirement-Naht. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

const READINESS_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  anfragenJeFenster: 20,
  tagMs: 24 * 60 * 60 * 1000,
  anfragenJeTag: 80,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: READINESS_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: READINESS_RATE_GRENZEN.anfragenJeFenster,
  tagMs: READINESS_RATE_GRENZEN.tagMs,
  anfragenJeTag: READINESS_RATE_GRENZEN.anfragenJeTag,
})

export function readinessAnfrageErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function readinessRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'plain')
}

export function readinessRateLeeren() {
  guard.leeren()
}
