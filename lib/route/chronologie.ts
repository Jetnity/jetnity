// lib/route/chronologie.ts
//
// Belegte Route-Reihenfolge. Item-Datum+Zeit und Segmentdaten bleiben getrennt.
// Date-only darf eine vorhandene Segmentzeit nicht auf 00:00 degradieren.
// Eine Reihenfolge gilt nur dann als bewiesen, wenn keine Quelle widerspricht
// und mindestens eine Quelle eindeutig ordnet. Das gilt auch innerhalb einer
// Multi-Leg-Itinerary: eindeutige Segmentzeiten sind die Source of Truth,
// nicht die deklarierte Array-Reihenfolge und nicht der lexikalische Pfad.

import type { FlugRouteItinerary, RouteItineraryMitQuelle } from '@/lib/route/domain'
import { pfadAusItinerary } from '@/lib/route/pfad'

type StartKorn = 'datetime' | 'date'

type StartWert = {
  instant: string
  korn: StartKorn
}

type StartKandidaten = {
  item: StartWert | null
  segment: StartWert | null
}

function kalendertag(wert: string | null | undefined): string | null {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const datum = new Date(Date.UTC(jahr ?? 0, (monat ?? 0) - 1, tag ?? 0))
  if (
    datum.getUTCFullYear() !== jahr ||
    datum.getUTCMonth() !== (monat ?? 0) - 1 ||
    datum.getUTCDate() !== tag
  ) {
    return null
  }
  return wert
}

function uhrzeit(wert: string | null | undefined): string | null {
  return wert && /^\d{2}:\d{2}$/.test(wert) ? wert : null
}

function startWert(tag: string | null, zeit: string | null): StartWert | null {
  if (!tag) return null
  if (zeit) return { instant: `${tag}T${zeit}`, korn: 'datetime' }
  return { instant: tag, korn: 'date' }
}

function startKandidaten(eintrag: {
  startsOn?: string | null
  startsAt?: string | null
  itinerary: FlugRouteItinerary
}): StartKandidaten {
  const erstes = eintrag.itinerary.legs[0]?.segments[0]
  return {
    item: startWert(kalendertag(eintrag.startsOn ?? null), uhrzeit(eintrag.startsAt ?? null)),
    segment: startWert(kalendertag(erstes?.departureDate ?? null), uhrzeit(erstes?.departureTime ?? null)),
  }
}

function vergleichStart(links: StartWert | null, rechts: StartWert | null): 'before' | 'after' | 'tie' | 'unknown' {
  if (!links || !rechts) return 'unknown'

  const linksTag = links.instant.slice(0, 10)
  const rechtsTag = rechts.instant.slice(0, 10)

  if (links.korn === 'datetime' && rechts.korn === 'datetime') {
    if (links.instant < rechts.instant) return 'before'
    if (links.instant > rechts.instant) return 'after'
    return 'tie'
  }

  if (linksTag !== rechtsTag) return linksTag < rechtsTag ? 'before' : 'after'
  return 'unknown'
}

function orderAus(
  quelle: 'item' | 'segment',
  links: StartKandidaten,
  rechts: StartKandidaten,
): 'before' | 'after' | 'tie' | 'unknown' {
  return vergleichStart(links[quelle], rechts[quelle])
}

function paarOrdnung(links: StartKandidaten, rechts: StartKandidaten): 'before' | 'after' | 'unknown' {
  const item = orderAus('item', links, rechts)
  const segment = orderAus('segment', links, rechts)
  const itemKlar = item === 'before' || item === 'after'
  const segmentKlar = segment === 'before' || segment === 'after'

  if (itemKlar && segmentKlar && item !== segment) return 'unknown'
  if (itemKlar) return item
  if (segmentKlar) return segment
  return 'unknown'
}

function beinStart(bein: FlugRouteItinerary['legs'][number]): StartWert | null {
  const erstes = bein.segments[0]
  return startWert(kalendertag(erstes?.departureDate ?? null), uhrzeit(erstes?.departureTime ?? null))
}

function beineHabenEindeutigeOrdnung(beine: readonly FlugRouteItinerary['legs'][number][]): boolean {
  if (beine.length <= 1) return true
  const starts = beine.map(beinStart)
  for (let i = 0; i < starts.length; i += 1) {
    for (let j = i + 1; j < starts.length; j += 1) {
      const vergleich = vergleichStart(starts[i] ?? null, starts[j] ?? null)
      if (vergleich === 'unknown' || vergleich === 'tie') return false
    }
  }
  return true
}

function itineraryBeineOrdnen(itinerary: FlugRouteItinerary): FlugRouteItinerary {
  if (!beineHabenEindeutigeOrdnung(itinerary.legs)) return itinerary
  const starts = itinerary.legs.map(beinStart)
  return {
    ...itinerary,
    legs: itinerary.legs
      .map((bein, index) => ({ bein, index }))
      .sort((a, b) => {
        const vergleich = vergleichStart(starts[a.index] ?? null, starts[b.index] ?? null)
        if (vergleich === 'before') return -1
        if (vergleich === 'after') return 1
        return a.index - b.index
      })
      .map((eintrag) => eintrag.bein),
  }
}

export function routeChronologieBewiesen(
  itineraries: readonly { startsOn?: string | null; startsAt?: string | null; itinerary: FlugRouteItinerary }[],
): boolean {
  for (const eintrag of itineraries) {
    if (!beineHabenEindeutigeOrdnung(eintrag.itinerary.legs)) return false
  }
  if (itineraries.length <= 1) return true
  const kandidaten = itineraries.map(startKandidaten)

  for (let i = 0; i < kandidaten.length; i += 1) {
    for (let j = i + 1; j < kandidaten.length; j += 1) {
      if (paarOrdnung(kandidaten[i]!, kandidaten[j]!) === 'unknown') return false
    }
  }
  return true
}

function itinerariesSortieren<
  T extends Pick<RouteItineraryMitQuelle, 'itinerary'> & {
    startsOn?: string | null
    startsAt?: string | null
  },
>(itineraries: readonly T[]): T[] {
  const bewiesen = routeChronologieBewiesen(itineraries)
  const kandidaten = itineraries.map(startKandidaten)
  return itineraries
    .map((eintrag, index) => ({ eintrag, index }))
    .sort((a, b) => {
      if (bewiesen) {
        const ordnung = paarOrdnung(kandidaten[a.index]!, kandidaten[b.index]!)
        if (ordnung === 'before') return -1
        if (ordnung === 'after') return 1
      }
      return pfadAusItinerary(a.eintrag.itinerary).localeCompare(pfadAusItinerary(b.eintrag.itinerary))
    })
    .map((eintrag) => eintrag.eintrag)
}

export function itinerariesFuerWahrheit<
  T extends Pick<RouteItineraryMitQuelle, 'itinerary'> & {
    startsOn?: string | null
    startsAt?: string | null
  },
>(itineraries: readonly T[]): T[] {
  return itinerariesSortieren(
    itineraries.map((eintrag) => ({
      ...eintrag,
      itinerary: itineraryBeineOrdnen(eintrag.itinerary),
    })),
  )
}
