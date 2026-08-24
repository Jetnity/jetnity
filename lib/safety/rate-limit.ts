// lib/safety/rate-limit.ts
//
// Schranke für die Safety-Naht. S1: gemeinsame In-Memory-Form.

import { providerOpsInMemoryCostGuard, providerOpsRateKennungAus } from '@/lib/provider-ops'

const SAFETY_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  anfragenJeFenster: 20,
  tagMs: 24 * 60 * 60 * 1000,
  anfragenJeTag: 80,
} as const

const guard = providerOpsInMemoryCostGuard({
  fensterMs: SAFETY_RATE_GRENZEN.fensterMs,
  anfragenJeFenster: SAFETY_RATE_GRENZEN.anfragenJeFenster,
  tagMs: SAFETY_RATE_GRENZEN.tagMs,
  anfragenJeTag: SAFETY_RATE_GRENZEN.anfragenJeTag,
})

export function safetyAnfrageErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  return guard.erlaubt(kennung.trim() || 'unbekannt', uhr)
}

export function safetyRateKennungAus(headers: Headers): string {
  return providerOpsRateKennungAus(headers, 'plain')
}

export function safetyRateLeeren() {
  guard.leeren()
}
