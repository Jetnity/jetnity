// lib/mobility/rate-limit.ts
//
// Schranke für externe Mobilitätssuchen. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

const MOBILITY_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: MOBILITY_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: MOBILITY_RATE_GRENZEN.suchenJeFenster,
  tagMs: MOBILITY_RATE_GRENZEN.tagMs,
  anfragenJeTag: MOBILITY_RATE_GRENZEN.suchenJeTag,
})

export function mobilitySucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function mobilityRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'plain')
}
