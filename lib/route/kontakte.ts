// lib/route/kontakte.ts
//
// Kanonische Airport-Zeitkontakte. Nur innerhalb eines belegten Legs.
// Getrennte Flight-Items oder Legs werden nicht über den Zielaufenthalt verbunden.

import type { FlugRouteItinerary, RouteAirportKontakt, RouteSegment } from '@/lib/route/domain'
import { iataLesen } from '@/lib/route/referenz'

export function routeKontaktZeit(date: string | null, time: string | null): string | null {
  if (!date) return null
  if (time && /^\d{2}:\d{2}$/.test(time)) return `${date}T${time}`
  return date
}

function airportLand(segmente: readonly RouteSegment[], code: string): string | null {
  for (const segment of segmente) {
    if (segment.origin.airportCode === code && segment.origin.countryCode) return segment.origin.countryCode
    if (segment.destination.airportCode === code && segment.destination.countryCode) {
      return segment.destination.countryCode
    }
  }
  return null
}

function kontakteImBein(segmente: readonly RouteSegment[], code: string): Array<{ start: string | null; end: string | null }> {
  const pairedInbound = new Set<number>()
  const pairedOutbound = new Set<number>()
  const kontakte: Array<{ start: string | null; end: string | null }> = []

  for (let i = 0; i < segmente.length - 1; i += 1) {
    const ankunft = segmente[i]
    const abflug = segmente[i + 1]
    if (ankunft?.destination.airportCode !== code || abflug?.origin.airportCode !== code) continue
    kontakte.push({
      start: routeKontaktZeit(ankunft.arrivalDate, ankunft.arrivalTime),
      end: routeKontaktZeit(abflug.departureDate, abflug.departureTime),
    })
    pairedInbound.add(i)
    pairedOutbound.add(i + 1)
  }

  for (let i = 0; i < segmente.length; i += 1) {
    const segment = segmente[i]
    if (!segment) continue
    if (segment.destination.airportCode === code && !pairedInbound.has(i)) {
      const at = routeKontaktZeit(segment.arrivalDate, segment.arrivalTime)
      kontakte.push({ start: at, end: at })
    }
    if (segment.origin.airportCode === code && !pairedOutbound.has(i)) {
      const at = routeKontaktZeit(segment.departureDate, segment.departureTime)
      kontakte.push({ start: at, end: at })
    }
  }

  return kontakte
}

function codesImItinerary(itinerary: FlugRouteItinerary): string[] {
  const codes = new Set<string>()
  const add = (code: string | null) => {
    const iata = iataLesen(code)
    if (iata) codes.add(iata)
  }
  for (const bein of itinerary.legs) {
    for (const segment of bein.segments) {
      add(segment.origin.airportCode)
      add(segment.destination.airportCode)
    }
  }
  return [...codes]
}

export function airportZeitkontakteAusItineraries(
  itineraries: readonly { itinerary: FlugRouteItinerary }[],
): RouteAirportKontakt[] {
  const liste: RouteAirportKontakt[] = []
  for (const eintrag of itineraries) {
    const alleSegmente = eintrag.itinerary.legs.flatMap((bein) => bein.segments)
    for (const code of codesImItinerary(eintrag.itinerary)) {
      const land = airportLand(alleSegmente, code)
      for (const bein of eintrag.itinerary.legs) {
        for (const kontakt of kontakteImBein(bein.segments, code)) {
          liste.push({
            airportCode: code,
            countryCode: land,
            start: kontakt.start,
            end: kontakt.end,
          })
        }
      }
    }
  }
  return liste.sort(
    (a, b) =>
      a.airportCode.localeCompare(b.airportCode) ||
      (a.start ?? '').localeCompare(b.start ?? '') ||
      (a.end ?? '').localeCompare(b.end ?? '') ||
      (a.countryCode ?? '').localeCompare(b.countryCode ?? ''),
  )
}
