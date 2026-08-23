// lib/route/anzeige.ts
//
// Menschlich lesbare Route-Texte. Keine Provider-Rohdaten.
//
// Frei von React, Next und Providern.

import { dauerLesbar } from '@/lib/flights/zeit'
import type { FlugOption } from '@/lib/flights/domain'
import type { FlughafenReferenzKarte, RouteFacts, RoutePunkt, RouteVerbindung } from '@/lib/route/domain'
import { airportZeitkontakteAusItineraries } from '@/lib/route/kontakte'
import { laenderrollenAus } from '@/lib/route/laender'
import { itineraryAusFlugOption, segmenteAusItinerary } from '@/lib/route/itinerary'
import { pfadSchritteAusSegmenten } from '@/lib/route/pfad'
import { verbindungenAusLegs } from '@/lib/route/verbindung'

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
  return routeKompaktAusBeinen(facts, true)
}

export function routeKompaktOhneCode(facts: RouteFacts): string {
  return routeKompaktAusBeinen(facts, false)
}

function umstiegLesbar(verbindung: RouteVerbindung): string {
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
  const laender = laenderrollenAus([{ itinerary }])
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
    legs: itinerary.legs,
    connections: verbindungenAusLegs(itinerary.legs),
    airportContacts: airportZeitkontakteAusItineraries([{ itinerary }]),
    transitCountryCodes: laender.transitCountryCodes,
    destinationCountryCodes: laender.destinationCountryCodes,
    sourceItemIds: [],
    fingerprint: null,
    chronologieBewiesen: true,
  }
  return routeAnzeigeAusFacts(facts)
}

function beinKompakt(segmente: RouteFacts['segments'], mitCode: boolean): string {
  const teile: string[] = []
  for (const schritt of pfadSchritteAusSegmenten(segmente)) {
    const text = mitCode
      ? punktLesbar(schritt.punkt)
      : punktLesbar(schritt.punkt, false) || schritt.punkt.airportCode || ''
    if (!text) continue
    if (teile.length === 0) {
      teile.push(text)
      continue
    }
    teile.push(`${schritt.surfaceChange ? ' ⇢ ' : ' → '}${text}`)
  }
  return teile.join('')
}

function routeKompaktAusBeinen(facts: RouteFacts, mitCode: boolean): string {
  const beine = facts.legs.length > 0 ? facts.legs : [{ segments: facts.segments }]
  const teile = beine.map((bein) => beinKompakt(bein.segments, mitCode)).filter(Boolean)
  if (!facts.chronologieBewiesen && teile.length > 1) {
    return `Reihenfolge unbekannt · ${teile.join(' · ')}`
  }
  return teile.join(' | ')
}
