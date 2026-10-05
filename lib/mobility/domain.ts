// lib/mobility/domain.ts
//
// Provider-unabhängige Mobilitätsdomäne für Bahn, Bus, Fähre und Transfer.
// Kein zweiter Reisegraph. Keine erfundenen Fahrpläne, Preise oder Wegezeiten.
//
// Provider-SDKs, Next, Supabase und Umgebungsvariablen gehören nicht hierher.

import type { MobilityMode } from '@/types/trips'

export const MOBILITY_SUCHE_GRENZEN = {
  reisende: { min: 1, max: 20 },
  angebote: 40,
  empfohleneOptionen: 5,
  timeoutMs: 12_000,
  maxAnfrageBytes: 16_384,
  umstiege: { min: 0, max: 20 },
  titel: 120,
  verbindung: 40,
} as const

export const MOBILITY_MODE_BEZEICHNUNG: Record<MobilityMode, string> = {
  rail: 'Bahn',
  bus: 'Bus',
  ferry: 'Fähre',
  transfer: 'Transfer',
}

export type MobilitySuchanfrage = {
  originPlaceId: string | null
  originName: string
  destinationPlaceId: string | null
  destinationName: string
  date: string | null
  mode: MobilityMode | null
  travellers: number
  currency: string
}

/**
 * Normalisierte Provideroption. Suche und Affiliate bleiben getrennt:
 * keine Booking-URL, keine Provisionsfelder.
 *
 * Kommerzielle Provenance (`retrievedAt`, Freshness, Währungsabgleich) liegt
 * nicht in diesem Domänenmodell. Siehe `lib/commercial-provenance`.
 */
export type MobilityOption = {
  id: string
  provider: string
  externalRef: string
  mode: MobilityMode
  title: string
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  durationMinutes: number | null
  changes: number | null
  preis: number | null
  preisWaehrung: string | null
  stornierbar: boolean | null
  connectionRef: string | null
  operatorName: string | null
}

export type MobilityKontext = {
  routeFit: number | null
  zeitFit: number | null
  dauerFit: number | null
  umstiegFit: number | null
  preisFit: number | null
  flexibilitaetFit: number | null
  evidenzFit: number | null
}

export type MobilityKandidat = MobilityOption & {
  context: MobilityKontext
}

export const MOBILITY_MARKEN = ['jetnity', 'best_value', 'fastest', 'fewest_changes', 'flexible'] as const
export type MobilityMarke = (typeof MOBILITY_MARKEN)[number]

export type BewerteteMobilityOption = MobilityKandidat & {
  score: number
  labels: MobilityMarke[]
  reasons: string[]
}

export type MobilitySuchStatus =
  | 'ok'
  | 'partial'
  | 'empty'
  | 'unavailable'
  | 'timeout'
  | 'error'
  | 'invalid'
  | 'rate_limited'

export type MobilityEvidenz = {
  hatStart: boolean
  hatZiel: boolean
  hatDatum: boolean
  hatModus: boolean
}

export const LEERE_MOBILITY_EVIDENZ: MobilityEvidenz = {
  hatStart: false,
  hatZiel: false,
  hatDatum: false,
  hatModus: false,
}

export type MobilitySuchergebnis = {
  status: MobilitySuchStatus
  message: string
  coverageNote: string
  evidenz: MobilityEvidenz
  options: BewerteteMobilityOption[]
}

export const MOBILITY_MARKE_TEXT: Record<MobilityMarke, string> = {
  jetnity: 'Jetnity empfiehlt',
  best_value: 'Best Value',
  fastest: 'Kürzeste Reisezeit',
  fewest_changes: 'Wenige Umstiege',
  flexible: 'Flexibel',
}

export const MOBILITY_ABDECKUNGSHINWEIS =
  'Die Mobilitätssuche zeigt verfügbare Verbindungen unseres jeweils angebundenen Datenpartners. Jetnitys Empfehlung bewertet die Passung zum Reisegraphen und ist keine provisionsgetriebene Rangliste.'
