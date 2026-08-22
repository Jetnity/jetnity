// lib/mobility/manuell.ts
//
// Manuelle Mobilität ist eine Nutzerangabe, kein Providerfakt.
// Keine Booking-URL, keine Providerbestätigung aus dem Browser.

import { mobilityManuellSchema, mobilityTitelAus, type MobilityManuellEingabe } from '@/lib/mobility/schema'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import { leereMietwagen } from '@/lib/trips/mietwagen-felder'
import type { Trip, TripItem } from '@/types/trips'

export function mobilityManuellLesen(wert: unknown):
  | { ok: true; eingabe: MobilityManuellEingabe }
  | { ok: false; meldung: string } {
  const geprueft = mobilityManuellSchema.safeParse(wert)
  if (!geprueft.success) {
    return { ok: false, meldung: geprueft.error.issues[0]?.message ?? 'Die Angaben sind unvollständig.' }
  }
  return { ok: true, eingabe: geprueft.data }
}

export function mobilityManuellZuPunkt(
  eingabe: MobilityManuellEingabe,
  ids: { id: string; dayId: string | null; stageId: string | null; position: number },
): TripItem {
  return {
    id: ids.id,
    dayId: ids.dayId,
    stageId: ids.stageId,
    kind: 'transfer',
    title: mobilityTitelAus(eingabe),
    note: eingabe.note,
    position: ids.position,
    startsOn: eingabe.startsOn,
    startsAt: eingabe.startsAt,
    endsOn: eingabe.endsOn,
    endsAt: eingabe.endsAt,
    priceAmount: eingabe.priceAmount,
    priceCurrency: eingabe.priceCurrency,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...unbestaetigteBuchung(),
    mobilityMode: eingabe.mode,
    originPlaceId: eingabe.originPlaceId,
    destinationPlaceId: eingabe.destinationPlaceId,
    originName: eingabe.originName,
    destinationName: eingabe.destinationName,
    connectionRef: eingabe.connectionRef,
    mobilityChanges: eingabe.mobilityChanges,
    mobilityEvidence: 'user',
    ...leereMietwagen(),
  }
}

export function mobilityZugehoerigkeitPruefen(
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
