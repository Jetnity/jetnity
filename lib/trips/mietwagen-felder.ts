// lib/trips/mietwagen-felder.ts
//
// Strukturierte Mietwagenfakten eines rental_car-Planpunkts.
// Frei von React, Next und Providern.

import {
  RENTAL_EVIDENCES,
  TRANSMISSIONS,
  VEHICLE_CLASSES,
  type RentalEvidence,
  type Transmission,
  type TripItem,
  type VehicleClass,
} from '@/types/trips'

const LEERE_MIETWAGEN = {
  rentalSupplier: null,
  vehicleClass: null,
  transmission: null,
  rentalEvidence: null,
} as const satisfies Pick<TripItem, 'rentalSupplier' | 'vehicleClass' | 'transmission' | 'rentalEvidence'>

export function leereMietwagen(): typeof LEERE_MIETWAGEN {
  return { ...LEERE_MIETWAGEN }
}

export function vehicleClassLesen(wert: unknown): VehicleClass | null {
  return (VEHICLE_CLASSES as readonly string[]).includes(wert as string)
    ? (wert as VehicleClass)
    : null
}

export function transmissionLesen(wert: unknown): Transmission | null {
  return (TRANSMISSIONS as readonly string[]).includes(wert as string)
    ? (wert as Transmission)
    : null
}

export function rentalEvidenceLesen(wert: unknown): RentalEvidence | null {
  return (RENTAL_EVIDENCES as readonly string[]).includes(wert as string)
    ? (wert as RentalEvidence)
    : null
}

export function istMietwagenpunkt(punkt: Pick<TripItem, 'kind'>): boolean {
  return punkt.kind === 'rental_car'
}

/**
 * Nur `kind = rental_car` darf Mietwagenfakten tragen.
 * Origin/Destination bedeuten dort Abholung/Rückgabe.
 * Altbestand und andere Arten bleiben leer – unbekannt, nicht erfunden.
 */
export function mietwagenNormalisieren(punkt: TripItem): TripItem {
  if (punkt.kind !== 'rental_car') {
    return { ...punkt, ...leereMietwagen() }
  }
  const rentalSupplier = punkt.rentalSupplier?.trim() || null
  const vehicleClass = vehicleClassLesen(punkt.vehicleClass)
  const transmission = transmissionLesen(punkt.transmission)
  const originPlaceId = punkt.originPlaceId?.trim() || null
  const destinationPlaceId = punkt.destinationPlaceId?.trim() || null
  const originName = punkt.originName?.trim() || null
  const destinationName = punkt.destinationName?.trim() || null
  const hatFakt = Boolean(
    rentalSupplier ||
      vehicleClass ||
      transmission ||
      originPlaceId ||
      destinationPlaceId ||
      originName ||
      destinationName ||
      punkt.startsOn ||
      punkt.endsOn,
  )
  return {
    ...punkt,
    originPlaceId,
    destinationPlaceId,
    originName,
    destinationName,
    rentalSupplier,
    vehicleClass,
    transmission,
    rentalEvidence: hatFakt ? 'user' : rentalEvidenceLesen(punkt.rentalEvidence),
  }
}
