// lib/rental-cars/manuell.ts
//
// Manueller Mietwagen ist eine Nutzerangabe, kein Providerfakt.
// Keine Booking-URL, keine Providerbestätigung aus dem Browser.

import { rentalCarManuellSchema, rentalTitelAus, type RentalCarManuellEingabe } from '@/lib/rental-cars/schema'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMobilitaetModus } from '@/lib/trips/mobilitaet-felder'
import type { Trip, TripItem } from '@/types/trips'

export function rentalCarManuellLesen(wert: unknown):
  | { ok: true; eingabe: RentalCarManuellEingabe }
  | { ok: false; meldung: string } {
  const geprueft = rentalCarManuellSchema.safeParse(wert)
  if (!geprueft.success) {
    return { ok: false, meldung: geprueft.error.issues[0]?.message ?? 'Die Angaben sind unvollständig.' }
  }
  return { ok: true, eingabe: geprueft.data }
}

export function rentalCarManuellZuPunkt(
  eingabe: RentalCarManuellEingabe,
  ids: { id: string; dayId: string | null; stageId: string | null; position: number },
): TripItem {
  return {
    id: ids.id,
    dayId: ids.dayId,
    stageId: ids.stageId,
    kind: 'rental_car',
    title: rentalTitelAus(eingabe),
    note: eingabe.note,
    position: ids.position,
    startsOn: eingabe.pickupOn,
    startsAt: eingabe.pickupAt,
    endsOn: eingabe.dropoffOn,
    endsAt: eingabe.dropoffAt,
    priceAmount: eingabe.priceAmount,
    priceCurrency: eingabe.priceCurrency,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    ...leereMobilitaetModus(),
    originPlaceId: eingabe.pickupPlaceId,
    destinationPlaceId: eingabe.dropoffPlaceId,
    originName: eingabe.pickupName,
    destinationName: eingabe.dropoffName,
    rentalSupplier: eingabe.rentalSupplier,
    vehicleClass: eingabe.vehicleClass,
    transmission: eingabe.transmission,
    rentalEvidence: 'user',
  }
}

export function rentalZugehoerigkeitPruefen(
  reise: Pick<Trip, 'days' | 'stages'>,
  dayId: string | null,
  stageId: string | null,
): { ok: true } | { ok: false; meldung: string } {
  if (dayId && !reise.days.some((tag) => tag.id === dayId)) {
    return { ok: false, meldung: 'Dieser Tag gehört nicht zur Reise.' }
  }
  if (stageId && !reise.stages.some((etappe) => etappe.id === stageId)) {
    return { ok: false, meldung: 'Diese Etappe gehört nicht zur Reise.' }
  }
  return { ok: true }
}
