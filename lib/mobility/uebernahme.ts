// lib/mobility/uebernahme.ts
//
// MobilityOption → kommerzielle Momentaufnahme `transfer`.
// bookingUrl bleibt leer: Die Suchschicht erzeugt keinen Deeplink.
//
// Frei von Next und Providern. Kein Schreibweg.

import type { MobilityMode } from '@/lib/mobility/domain'
import { mobilityOptionLesen } from '@/lib/mobility/schema'

export type MobilityMomentaufnahme = {
  kind: 'transfer'
  title: string
  originName: string
  destinationName: string
  originPlaceId: string | null
  destinationPlaceId: string | null
  mobilityMode: MobilityMode
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  priceAmount: number | null
  priceCurrency: string | null
  provider: string
  externalRef: string
  connectionRef: string | null
  mobilityChanges: number | null
  bookingUrl: null
}

export function alsMobilityMomentaufnahme(wert: unknown): MobilityMomentaufnahme | null {
  const option = mobilityOptionLesen(wert)
  if (!option) return null

  return {
    kind: 'transfer',
    title: option.title,
    originName: option.originName,
    destinationName: option.destinationName,
    originPlaceId: option.originPlaceId,
    destinationPlaceId: option.destinationPlaceId,
    mobilityMode: option.mode,
    startsOn: option.startsOn,
    startsAt: option.startsAt,
    endsOn: option.endsOn,
    endsAt: option.endsAt,
    priceAmount: option.preis,
    priceCurrency: option.preisWaehrung,
    provider: option.provider,
    externalRef: option.externalRef,
    connectionRef: option.connectionRef,
    mobilityChanges: option.changes,
    bookingUrl: null,
  }
}
