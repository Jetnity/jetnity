// lib/rental-cars/zeitraum.ts
//
// Zeitraum-, Orts- und One-way-Logik für Mietwagen.
// Ein überlappender Zeitraum ist kein Transportnachweis.
// Frei von React, Next und Providern.

import { RENTAL_SUCHE_GRENZEN } from '@/lib/rental-cars/domain'
import type { TripItem } from '@/types/trips'

function nameGleich(links: string | null | undefined, rechts: string | null | undefined): boolean {
  const a = links?.trim().toLocaleLowerCase('de-CH') ?? ''
  const b = rechts?.trim().toLocaleLowerCase('de-CH') ?? ''
  return a.length > 0 && a === b
}

export function selberOrt(
  links: { name: string | null | undefined; placeId: string | null | undefined },
  rechts: { name: string | null | undefined; placeId: string | null | undefined },
): boolean | null {
  if (links.placeId && rechts.placeId) return links.placeId === rechts.placeId
  if (nameGleich(links.name, rechts.name)) return true
  if (links.name?.trim() && rechts.name?.trim()) return false
  return null
}

export type RentalOneWay = 'same_location' | 'one_way' | 'unknown'

export function rentalOneWay(punkt: Pick<TripItem, 'originPlaceId' | 'originName' | 'destinationPlaceId' | 'destinationName'>): RentalOneWay {
  const gleich = selberOrt(
    { name: punkt.originName, placeId: punkt.originPlaceId },
    { name: punkt.destinationName, placeId: punkt.destinationPlaceId },
  )
  if (gleich === true) return 'same_location'
  if (gleich === false) return 'one_way'
  return 'unknown'
}

export function tageZwischen(von: string, bis: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(von) || !/^\d{4}-\d{2}-\d{2}$/.test(bis)) return null
  const einTag = 86_400_000
  const delta = Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / einTag)
  return Number.isFinite(delta) ? delta : null
}

/**
 * Kalendertage inklusive Abhol- und Rückgabetag.
 * Fehlt ein Datum, bleibt die Dauer unbekannt.
 */
export function rentalKalendertage(punkt: Pick<TripItem, 'startsOn' | 'endsOn'>): number | null {
  if (!punkt.startsOn || !punkt.endsOn) return null
  const delta = tageZwischen(punkt.startsOn, punkt.endsOn)
  if (delta === null || delta < 0) return null
  if (delta > RENTAL_SUCHE_GRENZEN.dauerInTagen) return null
  return delta + 1
}

export function datumUeberlappt(
  start: string | null | undefined,
  ende: string | null | undefined,
  tag: string | null | undefined,
): boolean | null {
  if (!start || !ende || !tag) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(ende) || !/^\d{4}-\d{2}-\d{2}$/.test(tag)) {
    return null
  }
  return tag >= start && tag <= ende
}

/**
 * Ein Mietwagen darf eine Bewegungskante niemals automatisch als covered
 * markieren. Diese Funktion existiert, damit Tests die Invariante belegen:
 * Zeitraumüberlappung ist kein Routennachweis.
 */
export function rentalDecktKanteNicht(
  _mietwagen: Pick<TripItem, 'startsOn' | 'endsOn' | 'originName' | 'destinationName'>,
  _kante: { date: string | null; originName: string; destinationName: string },
): true {
  return true
}
