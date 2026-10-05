// lib/flights/duffel/konfiguration.ts
//
// Duffel ist in Phase 3.1 nur Daten-/Entwicklungsprovider.
// Es gibt genau einen Hostname; Test und Live unterscheiden sich am Token.
// Live-Tokens und Buchungsendpunkte werden hier nicht verwendet.

export const DUFFEL_API_BASIS = 'https://api.duffel.com'

export const DUFFEL_VERSION = 'v2'

export const DUFFEL_PFADE = {
  suche: '/air/offer_requests',
} as const

/** Lieferanten-Wartezeit unter unserem eigenen 12-s-Timeout. */
export const DUFFEL_LIEFERANT_TIMEOUT_MS = 10_000
