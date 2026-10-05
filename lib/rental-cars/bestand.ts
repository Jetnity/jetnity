// lib/rental-cars/bestand.ts
//
// Ehrlicher Mietwagenbestand aus dem Reisegraphen.
// Ein vorhandener Mietwagen ist geplant oder gebucht – nicht automatisch
// eine abgedeckte Strecke. Frei von React, Next und Providern.

import { rentalKalendertage, rentalOneWay } from '@/lib/rental-cars/zeitraum'
import { istGebucht } from '@/lib/trips/buchung'
import { datumKurz, zeitraumKurz } from '@/lib/trips/datum-anzeige'
import { istMietwagenpunkt } from '@/lib/trips/mietwagen-felder'
import type { Trip, TripItem } from '@/types/trips'

function allePunkte(reise: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  return [...reise.days.flatMap((tag) => tag.items), ...extra]
}

export type MietwagenBestand = {
  items: TripItem[]
  zusammenfassung: string
  uebersicht: string | null
}

function statusWort(punkt: TripItem): 'gebucht' | 'geplant' {
  return istGebucht(punkt) ? 'gebucht' : 'geplant'
}

function zeitraumWort(punkt: TripItem): string | null {
  if (punkt.startsOn && punkt.endsOn) return zeitraumKurz(punkt.startsOn, punkt.endsOn)
  if (punkt.startsOn) return `ab ${datumKurz(punkt.startsOn)}`
  return null
}

function routeWort(punkt: TripItem): string | null {
  const abholung = punkt.originName?.trim() ?? ''
  const rueckgabe = punkt.destinationName?.trim() ?? ''
  if (!abholung && !rueckgabe) return null
  if (rentalOneWay(punkt) === 'same_location') return abholung || rueckgabe
  if (abholung && rueckgabe) return `${abholung} → ${rueckgabe}`
  return abholung || rueckgabe
}

export function mietwagenZeile(punkt: TripItem): string {
  const teile = ['Mietwagen']
  const zeitraum = zeitraumWort(punkt)
  if (zeitraum) teile.push(zeitraum)
  teile.push(statusWort(punkt))
  return teile.join(' · ')
}

export function mietwagenDetails(punkt: TripItem): string {
  const teile: string[] = []
  const route = routeWort(punkt)
  if (route) teile.push(route)
  const tage = rentalKalendertage(punkt)
  if (tage !== null) {
    teile.push(tage === 1 ? '1 Kalendertag Mietzeitraum' : `${tage} Kalendertage Mietzeitraum`)
  }
  if (punkt.rentalSupplier) teile.push(punkt.rentalSupplier)
  if (teile.length === 0) return 'Als Nutzerangabe erfasst. Keine Providerbestätigung.'
  return `${teile.join(' · ')} · Nutzerangabe`
}

export function mietwagenBestand(reise: Trip, ohneTag: readonly TripItem[] = []): MietwagenBestand {
  const items = allePunkte(reise, ohneTag).filter(istMietwagenpunkt)
  if (items.length === 0) {
    return {
      items,
      zusammenfassung: 'Kein Mietwagen eingetragen.',
      uebersicht: null,
    }
  }

  if (items.length === 1 && items[0]) {
    const zeile = mietwagenZeile(items[0])
    return {
      items,
      zusammenfassung: zeile,
      uebersicht: zeile,
    }
  }

  const gebucht = items.filter(istGebucht).length
  const geplant = items.length - gebucht
  const teile: string[] = []
  if (gebucht) teile.push(gebucht === 1 ? '1 Mietwagen gebucht' : `${gebucht} Mietwagen gebucht`)
  if (geplant) teile.push(geplant === 1 ? '1 Mietwagen geplant' : `${geplant} Mietwagen geplant`)
  const text = teile.join(' · ')
  return { items, zusammenfassung: text, uebersicht: text }
}
