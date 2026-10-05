// lib/rental-cars/manuell-start.ts
//
// Leere Startwerte für die manuelle Erfassung.
// Reise-Origin, Etappen und Gesamtdaten sind keine Mietwagenfakten.
// Frei von React, Next und Providern.

import type { Trip } from '@/types/trips'

export type RentalCarManuellStartwerte = {
  pickupName: string
  dropoffName: string
  pickupOn: string
  pickupAt: string
  dropoffOn: string
  dropoffAt: string
}

export type RentalCarManuellHinweise = {
  pickupName: string
  dropoffName: string
}

export function rentalManuellStartwerte(): RentalCarManuellStartwerte {
  return {
    pickupName: '',
    dropoffName: '',
    pickupOn: '',
    pickupAt: '',
    dropoffOn: '',
    dropoffAt: '',
  }
}

/**
 * Unverbindliche Platzhalter. Niemals als gespeicherter Fakt oder Place-ID.
 * Ein Reiseort in diesem Hinweis ist keine bestätigte Abholung oder Rückgabe.
 */
export function rentalManuellHinweise(
  reise: Pick<Trip, 'origin' | 'stages'>,
): RentalCarManuellHinweise {
  const start = reise.origin?.trim() ?? ''
  const letzte = reise.stages[reise.stages.length - 1]?.name?.trim() ?? ''
  return {
    pickupName: start ? `z. B. ${start}` : 'z. B. Flughafen oder Stadt',
    dropoffName: letzte ? `z. B. ${letzte}` : 'z. B. Flughafen oder Stadt',
  }
}
