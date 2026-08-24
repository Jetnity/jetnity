// lib/flights/rate-limit.ts
//
// Schranke für externe Flugsuchen. S1: gemeinsame In-Memory-Form.
// Vor Production bleibt ein persistentes Limit (PR-S6) offen.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

export const FLUG_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: FLUG_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: FLUG_RATE_GRENZEN.suchenJeFenster,
  tagMs: FLUG_RATE_GRENZEN.tagMs,
  anfragenJeTag: FLUG_RATE_GRENZEN.suchenJeTag,
})

export function flugSucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function flugRateLeeren() {
  guard.leeren()
}

export function flugRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'ip')
}
