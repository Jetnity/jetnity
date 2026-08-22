// lib/readiness/kontext.ts
//
// Vertrauenswürdige Reisetats für Readiness. Kein Raten:
// ein Country-Label ohne Code ist kein Länderkontext.

import { landescodeLesen } from '@/lib/readiness/domain'
import { planpunkteSammeln } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

export type ReadinessReisekontext = {
  startDate: string | null
  endDate: string | null
  travellers: number
  originCountryCode: string | null
  destinationCountries: string[]
  transitCountryCodes: string[]
  unknownCountryStages: number
  rentalCarPresent: boolean
  bookedItems: TripItem[]
}

const BUCHBARE: ReadonlySet<TripItem['kind']> = new Set(['flight', 'stay', 'transfer', 'rental_car', 'activity'])

export function readinessReisekontext(reise: Trip): ReadinessReisekontext {
  const destinationCountries: string[] = []
  let unknownCountryStages = 0

  for (const etappe of reise.stages) {
    const code = landescodeLesen(etappe.countryCode)
    if (code) {
      if (!destinationCountries.includes(code)) destinationCountries.push(code)
    } else {
      unknownCountryStages += 1
    }
  }

  destinationCountries.sort()

  const punkte = planpunkteSammeln(reise, reise.ohneTag)
  const rentalCarPresent = punkte.some((punkt) => punkt.kind === 'rental_car')
  const bookedItems = punkte.filter(
    (punkt) => BUCHBARE.has(punkt.kind) && punkt.bookingStatus === 'booked',
  )

  return {
    startDate: reise.startDate,
    endDate: reise.endDate,
    travellers: reise.travellers,
    originCountryCode: null,
    destinationCountries,
    transitCountryCodes: [],
    unknownCountryStages,
    rentalCarPresent,
    bookedItems,
  }
}

export function punktFuerReadiness(reise: Trip, tripItemId: string | null): TripItem | null {
  if (!tripItemId) return null
  return planpunkteSammeln(reise, reise.ohneTag).find((punkt) => punkt.id === tripItemId) ?? null
}
