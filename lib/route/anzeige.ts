// lib/route/anzeige.ts
//
// Menschlich lesbare Route-Texte. Keine Provider-Rohdaten.
//
// Frei von React, Next und Providern.

import { dauerLesbar } from '@/lib/flights/zeit'
import type { FlugOption } from '@/lib/flights/domain'
import type { FlughafenReferenzKarte, RouteFacts, RoutePunkt, RouteVerbindung } from '@/lib/route/domain'
import { itineraryAusFlugOption, segmenteAusItinerary } from '@/lib/route/itinerary'
import { verbindungenAusSegmenten } from '@/lib/route/verbindung'

export type RouteAnzeige = {
  kompakt: string
  sekundaer: string | null
  umstiege: number
  direkt: boolean
  flughafenwechsel: boolean
}

export function punktLesbar(punkt: RoutePunkt, mitCode = true): string {
  if (punkt.city && punkt.airportCode && mitCode) return `${punkt.city} ${punkt.airportCode}`
  if (punkt.city) return punkt.city
  return punkt.airportCode ?? ''
}

export function routeKompakt(facts: RouteFacts): string {
  const punkte = routenpunkte(facts)
  return punkte.map((punkt) => punktLesbar(punkt)).filter(Boolean).join(' → ')
}

export function routeKompaktOhneCode(facts: RouteFacts): string {
  const punkte = routenpunkte(facts)
  return punkte.map((punkt) => punktLesbar(punkt, false) || punkt.airportCode || '').filter(Boolean).join(' → ')
}

export function umstiegLesbar(verbindung: RouteVerbindung): string {
  const ort = verbindung.city || verbindung.airportCode
  const land = verbindung.country
  const dauer = verbindung.durationMinutes !== null ? dauerLesbar(verbindung.durationMinutes) : null
  const teile = [ort && land ? `${ort}, ${land}` : ort, dauer].filter(Boolean)
  return teile.join(' · ')
}

export function routeAnzeigeAusFacts(facts: RouteFacts): RouteAnzeige | null {
  if (facts.quelle === 'none') return null
  const kompakt = routeKompakt(facts)
  if (!kompakt) return null
  const umstiege = facts.connections.length
  const sekundaerTeile: string[] = []
  if (umstiege === 0) {
    sekundaerTeile.push('Direktflug')
  } else {
    sekundaerTeile.push(umstiege === 1 ? '1 Umstieg' : `${umstiege} Umstiege`)
    const erste = facts.connections[0]
    if (erste) {
      const ort = umstiegLesbar(erste)
      if (ort) sekundaerTeile.push(ort)
    }
  }
  return {
    kompakt,
    sekundaer: sekundaerTeile.join(' · '),
    umstiege,
    direkt: umstiege === 0,
    flughafenwechsel: facts.connections.some((eintrag) => eintrag.airportChange === true),
  }
}

export function routeAnzeigeAusOption(
  option: FlugOption,
  refs: FlughafenReferenzKarte = {},
): RouteAnzeige | null {
  const itinerary = itineraryAusFlugOption(option, refs)
  if (!itinerary) return null
  const segments = segmenteAusItinerary(itinerary)
  const facts: RouteFacts = {
    quelle: 'flight_itinerary',
    origin: segments[0]?.origin ?? {
      airportCode: null,
      countryCode: null,
      city: null,
      country: null,
    },
    destination: segments[segments.length - 1]?.destination ?? {
      airportCode: null,
      countryCode: null,
      city: null,
      country: null,
    },
    segments,
    connections: verbindungenAusSegmenten(segments),
    transitCountryCodes: [],
    destinationCountryCodes: [],
    sourceItemIds: [],
    fingerprint: null,
  }
  return routeAnzeigeAusFacts(facts)
}

function routenpunkte(facts: RouteFacts): RoutePunkt[] {
  if (facts.segments.length === 0) return [facts.origin, facts.destination]
  const punkte: RoutePunkt[] = []
  for (const [index, segment] of facts.segments.entries()) {
    if (index === 0) punkte.push(segment.origin)
    punkte.push(segment.destination)
  }
  return punkte.filter((punkt) => punkt.airportCode || punkt.city)
}
