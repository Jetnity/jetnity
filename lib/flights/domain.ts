// lib/flights/domain.ts
//
// Die interne Flugdomäne. UI, Ranking und Reisegraph sprechen nur diese Typen.
// Ein Provider-SDK – zuerst Duffel – endet im Adapter und kommt hier nicht vor.
//
// Frei von Next, Supabase und `process.env`.

/** Kabine, wie Jetnity sie kennt – nicht die Provider-Schreibweise. */
export const FLUG_KABINEN = ['economy', 'premium_economy', 'business', 'first'] as const
export type FlugKabine = (typeof FLUG_KABINEN)[number]

/** Wie viele Zwischenlandungen die Suche höchstens liefern soll. */
export const FLUG_STOPP_PRAEFERENZEN = ['any', 'nonstop', 'at_most_one'] as const
export type FlugStoppPraeferenz = (typeof FLUG_STOPP_PRAEFERENZEN)[number]

export const FLUG_SUCHE_GRENZEN = {
  beine: { min: 1, max: 6 },
  erwachsene: { min: 1, max: 9 },
  kinder: { min: 0, max: 8 },
  sauglinge: { min: 0, max: 8 },
  personenGesamt: { min: 1, max: 9 },
  angebote: 20,
  timeoutMs: 12_000,
  maxAnfrageBytes: 16_384,
} as const

/** Eine Teilstrecke der Suche: von–nach an einem Kalendertag. */
export type FlugSuchBein = {
  origin: string
  destination: string
  date: string
}

export type FlugPassagiere = {
  adults: number
  children: number
  infants: number
}

/**
 * Was der Nutzer sucht, plus optionale Reisedaten für das Ranking.
 *
 * `context` ändert die Treffermenge nicht. Es hilft nur der Rangfolge, eine
 * Verbindung an den bekannten Reisetagen zu messen.
 */
export type FlugSuchanfrage = {
  legs: FlugSuchBein[]
  passengers: FlugPassagiere
  cabin: FlugKabine
  stopPreference: FlugStoppPraeferenz
  currency: string
  context: {
    tripStartDate: string | null
    tripEndDate: string | null
    selectedDate: string | null
  }
}

/** Ein Flugabschnitt. Zeiten sind Ortszeiten des jeweiligen Flughafens. */
export type FlugSegment = {
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  /**
   * Explizite IANA-/tz-database-Provenance des Abflug-Endpunkts.
   * Nur aus einer validierten Provider-Airport-Response; sonst `null`.
   */
  departureTimezone?: string | null
  /**
   * Explizite IANA-/tz-database-Provenance des Ankunfts-Endpunkts.
   * Nur aus einer validierten Provider-Airport-Response; sonst `null`.
   */
  arrivalTimezone?: string | null
  airline: string
  airlineName: string
  operatingAirline: string | null
  operatingAirlineName: string | null
  flightNumber: string
  durationMinutes: number
}

/** Eine zusammenhängende Verbindung, etwa Hinflug oder Rückflug. */
export type FlugTeilstrecke = {
  segments: FlugSegment[]
  durationMinutes: number
  stops: number
}

/**
 * Eine normalisierte Flugoption.
 *
 * Fare, Gepäck und Stornierbarkeit nur, wenn der Adapter sie zuverlässig
 * gelesen hat. Sonst `null` – nicht raten.
 *
 * Kommerzielle Provenance (`retrievedAt`, Freshness, Währungsabgleich) liegt
 * nicht in diesem Domänenmodell. Siehe `lib/commercial-provenance`.
 */
export type FlugOption = {
  id: string
  provider: string
  externalRef: string
  airline: string
  airlineName: string
  legs: FlugTeilstrecke[]
  durationMinutes: number
  stops: number
  priceAmount: number
  priceCurrency: string
  cabin: FlugKabine | null
  baggage: { checkedBags: number | null } | null
  refundable: boolean | null
  fare: { brandedFare: string | null } | null
}

const FLUG_MARKEN = ['jetnity', 'cheapest', 'fastest'] as const
export type FlugMarke = (typeof FLUG_MARKEN)[number]

export type BewerteteFlugOption = FlugOption & {
  score: number
  labels: FlugMarke[]
  reasons: string[]
}

export type FlugSuchStatus =
  | 'ok'
  | 'partial'
  | 'empty'
  | 'unavailable'
  | 'timeout'
  | 'error'
  | 'invalid'
  | 'rate_limited'

export type FlugSuchergebnis = {
  status: FlugSuchStatus
  message: string
  coverageNote: string
  options: BewerteteFlugOption[]
}

export const FLUG_ABDECKUNGSHINWEIS =
  'Die Suche zeigt verfügbare Verbindungen über unseren ersten Flugdaten-Adapter. Nicht alle Airlines und Billigflieger sind enthalten – das ist kein Vergleich des gesamten Marktes.'

/**
 * Technische Kennung des ersten Suchadapters in `trip_items.provider`.
 * Keine UI-Abhängigkeit und keine strategische Bindung: Ein späterer
 * Metasuch-Provider (Skyscanner, Aviasales) schreibt eine andere Kennung
 * in dasselbe Feld.
 */
export const FLUG_PROVIDER_DUFFEL = 'duffel'
