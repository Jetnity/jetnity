// lib/rental-cars/uebernahme.ts
//
// RentalCarOption → kommerzielle Momentaufnahme `rental_car`.
// bookingUrl bleibt leer: Die Suchschicht erzeugt keinen Deeplink.
//
// Frei von Next und Providern. Kein Schreibweg.

import { rentalCarOptionLesen } from '@/lib/rental-cars/schema'
import type { Transmission, VehicleClass } from '@/types/trips'

export type RentalCarMomentaufnahme = {
  kind: 'rental_car'
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
  rentalSupplier: string | null
  priceAmount: number | null
  priceCurrency: string | null
  provider: string
  externalRef: string
  bookingUrl: null
}

export function alsRentalCarMomentaufnahme(wert: unknown): RentalCarMomentaufnahme | null {
  const option = rentalCarOptionLesen(wert)
  if (!option) return null

  return {
    kind: 'rental_car',
    title: option.title,
    pickupName: option.pickupName,
    dropoffName: option.dropoffName,
    pickupPlaceId: option.pickupPlaceId,
    dropoffPlaceId: option.dropoffPlaceId,
    pickupOn: option.pickupOn,
    pickupAt: option.pickupAt,
    dropoffOn: option.dropoffOn,
    dropoffAt: option.dropoffAt,
    vehicleClass: option.vehicleClass,
    transmission: option.transmission,
    rentalSupplier: option.supplierName,
    priceAmount: option.preis,
    priceCurrency: option.preisWaehrung,
    provider: option.provider,
    externalRef: option.externalRef,
    bookingUrl: null,
  }
}
