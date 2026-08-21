// lib/rental-cars/client-sicht.ts
//
// Was der Browser von einer Mietwagensuche sehen darf.
// Keine Provider-Rohdaten, keine Provisionsfelder, keine Booking-URLs,
// keine internen Scores.

import {
  RENTAL_ABDECKUNGSHINWEIS,
  RENTAL_MARKE_TEXT,
  type RentalCarEvidenz,
  type RentalCarMarke,
  type RentalCarSuchergebnis,
  type RentalCarSuchStatus,
} from '@/lib/rental-cars/domain'

export type RentalCarOptionSichtbar = {
  id: string
  title: string
  pickupName: string
  dropoffName: string
  pickupOn: string | null
  pickupAt: string | null
  dropoffOn: string | null
  dropoffAt: string | null
  vehicleClass: string | null
  transmission: string | null
  supplierName: string | null
  preis: number | null
  preisIstGesamt: boolean | null
  preisWaehrung: string | null
  labels: string[]
  reasons: string[]
}

export type RentalCarSucheAntwort = {
  status: RentalCarSuchStatus
  message: string
  coverageNote: string
  evidenz: RentalCarEvidenz
  options: RentalCarOptionSichtbar[]
}

export function sucheFuerClient(ergebnis: RentalCarSuchergebnis): RentalCarSucheAntwort {
  return {
    status: ergebnis.status,
    message: ergebnis.message,
    coverageNote: ergebnis.coverageNote || RENTAL_ABDECKUNGSHINWEIS,
    evidenz: ergebnis.evidenz,
    options: ergebnis.options.map((option) => ({
      id: option.id,
      title: option.title,
      pickupName: option.pickupName,
      dropoffName: option.dropoffName,
      pickupOn: option.pickupOn,
      pickupAt: option.pickupAt,
      dropoffOn: option.dropoffOn,
      dropoffAt: option.dropoffAt,
      vehicleClass: option.vehicleClass,
      transmission: option.transmission,
      supplierName: option.supplierName,
      preis: option.preis,
      preisIstGesamt: option.preisIstGesamt,
      preisWaehrung: option.preisWaehrung,
      labels: option.labels.map((marke: RentalCarMarke) => RENTAL_MARKE_TEXT[marke]),
      reasons: [...option.reasons],
    })),
  }
}
