// lib/seasonal/route-kontakte.ts
//
// Getrennte Route-/Airport-Zeitkontakte. Kein Min/Max über wiederholte Codes.

import type { RouteFacts } from '@/lib/route/domain'

export type SeasonalZeitkontakt = {
  start: string | null
  end: string | null
}

export function routeKontaktZeit(date: string | null, time: string | null): string | null {
  if (!date) return null
  if (time && /^\d{2}:\d{2}$/.test(time)) return `${date}T${time}`
  return date
}

export function airportKontakte(route: RouteFacts, code: string): SeasonalZeitkontakt[] {
  const segmente = route.segments
  const pairedInbound = new Set<number>()
  const pairedOutbound = new Set<number>()
  const kontakte: SeasonalZeitkontakt[] = []

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

function airportLand(route: RouteFacts, code: string): string | null {
  for (const segment of route.segments) {
    if (segment.origin.airportCode === code && segment.origin.countryCode) return segment.origin.countryCode
    if (segment.destination.airportCode === code && segment.destination.countryCode) {
      return segment.destination.countryCode
    }
  }
  if (route.origin.airportCode === code) return route.origin.countryCode
  if (route.destination.airportCode === code) return route.destination.countryCode
  return null
}

export function providerRouteKontakte(route: RouteFacts): Array<{
  airportCode: string
  countryCode: string | null
  start: string | null
  end: string | null
}> {
  const codes = new Set<string>()
  const add = (code: string | null) => {
    if (code) codes.add(code)
  }
  add(route.origin.airportCode)
  add(route.destination.airportCode)
  for (const segment of route.segments) {
    add(segment.origin.airportCode)
    add(segment.destination.airportCode)
  }
  for (const verbindung of route.connections) add(verbindung.airportCode)

  const liste: Array<{
    airportCode: string
    countryCode: string | null
    start: string | null
    end: string | null
  }> = []
  for (const code of [...codes].sort()) {
    const land = airportLand(route, code)
    for (const kontakt of airportKontakte(route, code)) {
      liste.push({
        airportCode: code,
        countryCode: land,
        start: kontakt.start,
        end: kontakt.end,
      })
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
