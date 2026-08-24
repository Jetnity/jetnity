// lib/rental-cars/rate-limit.ts
//
// Schranke für externe Mietwagensuchen. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

const RENTAL_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: RENTAL_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: RENTAL_RATE_GRENZEN.suchenJeFenster,
  tagMs: RENTAL_RATE_GRENZEN.tagMs,
  anfragenJeTag: RENTAL_RATE_GRENZEN.suchenJeTag,
})

export function rentalCarSucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function rentalCarRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'plain')
}
