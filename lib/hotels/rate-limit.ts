// lib/hotels/rate-limit.ts
//
// Schranke für externe Hotelsuchen. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

export const HOTEL_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: HOTEL_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: HOTEL_RATE_GRENZEN.suchenJeFenster,
  tagMs: HOTEL_RATE_GRENZEN.tagMs,
  anfragenJeTag: HOTEL_RATE_GRENZEN.suchenJeTag,
})

export async function hotelSucheErlaubt(
  kennung: string,
  uhr?: () => number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function hotelRateLeeren() {
  guard.leeren()
}

export function hotelRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'ip')
}
