// lib/rental-cars/domain.ts
//
// Provider-unabhängige Mietwagendomäne.
// Ein Mietwagen ist ein mehrtägiger Reisebaustein, kein Transfer.
// Keine erfundenen Preise, Verfügbarkeiten oder Mietbedingungen.
//
// Provider-SDKs, Next, Supabase und Umgebungsvariablen gehören nicht hierher.

import type { Transmission, VehicleClass } from '@/types/trips'

export const RENTAL_SUCHE_GRENZEN = {
  angebote: 40,
  empfohleneOptionen: 5,
  timeoutMs: 12_000,
  maxAnfrageBytes: 16_384,
  titel: 120,
  supplier: 120,
  dauerInTagen: 365,
} as const

export const VEHICLE_CLASS_BEZEICHNUNG: Record<VehicleClass, string> = {
  economy: 'Economy',
  compact: 'Kompakt',
  intermediate: 'Mittelklasse',
  fullsize: 'Fullsize',
  suv: 'SUV',
  van: 'Van',
  luxury: 'Premium',
}

export const TRANSMISSION_BEZEICHNUNG: Record<Transmission, string> = {
  automatic: 'Automatik',
  manual: 'Schaltgetriebe',
}

export type RentalCarSuchanfrage = {
  pickupPlaceId: string | null
  pickupName: string
  dropoffPlaceId: string | null
  dropoffName: string
  pickupOn: string | null
  pickupAt: string | null
  dropoffOn: string | null
  dropoffAt: string | null
  vehicleClass: VehicleClass | null
  transmission: Transmission | null
  currency: string
}

/**
 * Normalisierte Provideroption. Suche und Affiliate bleiben getrennt:
 * keine Booking-URL, keine Provisionsfelder.
 *
 * Kommerzielle Provenance (`retrievedAt`, Freshness, Währungsabgleich) liegt
 * nicht in diesem Domänenmodell. Siehe `lib/commercial-provenance`.
 */
export type RentalCarOption = {
  id: string
  provider: string
  externalRef: string
  title: string
  pickupName: string
  dropoffName: string
  pickupPlaceId: string | null
  dropoffPlaceId: string | null
  pickupOn: string | null
  pickupAt: string | null
  dropoffOn: string | null
  dropoffAt: string | null
  vehicleClass: VehicleClass | null
  transmission: Transmission | null
  supplierName: string | null
  preis: number | null
  preisIstGesamt: boolean | null
  preisWaehrung: string | null
  kilometerRegel: string | null
  tankRegel: string | null
  storno: string | null
  kaution: number | null
  kautionWaehrung: string | null
}

export type RentalCarKontext = {
  ortFit: number | null
  zeitraumFit: number | null
  preisFit: number | null
  fahrzeugFit: number | null
  getriebeFit: number | null
  flexibilitaetFit: number | null
  evidenzFit: number | null
}

export type RentalCarKandidat = RentalCarOption & {
  context: RentalCarKontext
}

const RENTAL_MARKEN = ['jetnity', 'best_value', 'flexible', 'same_location'] as const
export type RentalCarMarke = (typeof RENTAL_MARKEN)[number]

export type BewerteteRentalCarOption = RentalCarKandidat & {
  score: number
  labels: RentalCarMarke[]
  reasons: string[]
}

export type RentalCarSuchStatus =
  | 'ok'
  | 'partial'
  | 'empty'
  | 'unavailable'
  | 'timeout'
  | 'error'
  | 'invalid'
  | 'rate_limited'

export type RentalCarEvidenz = {
  hatAbholung: boolean
  hatRueckgabe: boolean
  hatAbholdatum: boolean
  hatRueckgabedatum: boolean
}

export const LEERE_RENTAL_EVIDENZ: RentalCarEvidenz = {
  hatAbholung: false,
  hatRueckgabe: false,
  hatAbholdatum: false,
  hatRueckgabedatum: false,
}

export type RentalCarSuchergebnis = {
  status: RentalCarSuchStatus
  message: string
  coverageNote: string
  evidenz: RentalCarEvidenz
  options: BewerteteRentalCarOption[]
}

export const RENTAL_MARKE_TEXT: Record<RentalCarMarke, string> = {
  jetnity: 'Jetnity empfiehlt',
  best_value: 'Best Value',
  flexible: 'Flexibel',
  same_location: 'Gleiche Station',
}

export const RENTAL_ABDECKUNGSHINWEIS =
  'Die Mietwagensuche zeigt verfügbare Angebote unseres jeweils angebundenen Datenpartners. Ein Mietwagen im Zeitraum ist kein Nachweis, dass eine konkrete Strecke damit gefahren wird. Jetnitys Empfehlung ist keine provisionsgetriebene Rangliste.'
