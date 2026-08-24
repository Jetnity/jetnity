// lib/activities/rate-limit.ts
//
// Schranke für externe Aktivitätensuchen. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

export const ACTIVITY_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: ACTIVITY_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: ACTIVITY_RATE_GRENZEN.suchenJeFenster,
  tagMs: ACTIVITY_RATE_GRENZEN.tagMs,
  anfragenJeTag: ACTIVITY_RATE_GRENZEN.suchenJeTag,
})

export function activitySucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function activityRateLeeren() {
  guard.leeren()
}

export function activityRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'ip')
}
