// lib/route/ableitung.ts
//
// Route Facts aus dem Reisegraphen. Nur persistierte Itineraries.
// Titel, Notizen und Ortsnamen werden nicht gelesen.
//
// Frei von Next und Providern.

import {
  LEERER_ROUTE_PUNKT,
  leereRouteFacts,
  type RouteFacts,
  type RouteItineraryMitQuelle,
} from '@/lib/route/domain'
import { itinerariesWahrheit } from '@/lib/route/chronologie'
import { routeFingerprintAus } from '@/lib/route/fingerprint'
import { airportZeitkontakteAusItineraries } from '@/lib/route/kontakte'
import { laenderrollenAus } from '@/lib/route/laender'
import { segmenteAusItinerary } from '@/lib/route/itinerary'
import { flugRouteItineraryTrustedLesen } from '@/lib/route/schema'
import { verbindungenAusLegs } from '@/lib/route/verbindung'
import type { Trip, TripItem } from '@/types/trips'

function itinerariesAusReise(reise: Pick<Trip, 'days' | 'ohneTag'>): RouteItineraryMitQuelle[] {
  const punkte = [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
  const itineraries: RouteItineraryMitQuelle[] = []

  for (const punkt of punkte) {
    if (punkt.kind !== 'flight') continue
    const itinerary = flugRouteItineraryTrustedLesen(punkt.routeItinerary ?? null)
    if (!itinerary) continue
    itineraries.push({
      sourceItemId: punkt.id,
      startsOn: punkt.startsOn,
      startsAt: punkt.startsAt,
      itinerary,
    })
  }

  return itineraries
}

function routeFactsAusItineraries(itineraries: readonly RouteItineraryMitQuelle[]): RouteFacts {
  if (itineraries.length === 0) return leereRouteFacts()

  const { wahrheit, bewiesen } = itinerariesWahrheit(itineraries)
  const primaer = wahrheit[0]
  if (!primaer) return leereRouteFacts()

  const segmente = wahrheit.flatMap((eintrag) => segmenteAusItinerary(eintrag.itinerary))
  if (segmente.length === 0) return leereRouteFacts()

  const primaerSegmente = segmenteAusItinerary(primaer.itinerary)
  const letztes = wahrheit[wahrheit.length - 1]
  const letzteSegmente = letztes ? segmenteAusItinerary(letztes.itinerary) : []
  const origin = bewiesen ? (primaerSegmente[0]?.origin ?? { ...LEERER_ROUTE_PUNKT }) : { ...LEERER_ROUTE_PUNKT }
  const destination = bewiesen
    ? (letzteSegmente[letzteSegmente.length - 1]?.destination ?? { ...LEERER_ROUTE_PUNKT })
    : { ...LEERER_ROUTE_PUNKT }
  const laender = laenderrollenAus(wahrheit, bewiesen)
  const legs = wahrheit.flatMap((eintrag) => eintrag.itinerary.legs)

  return {
    quelle: 'flight_itinerary',
    origin,
    destination,
    segments: segmente,
    legs,
    connections: verbindungenAusLegs(legs),
    airportContacts: airportZeitkontakteAusItineraries(wahrheit),
    transitCountryCodes: laender.transitCountryCodes,
    destinationCountryCodes: laender.destinationCountryCodes,
    sourceItemIds: wahrheit
      .map((eintrag) => eintrag.sourceItemId)
      .filter((id): id is string => Boolean(id)),
    fingerprint: routeFingerprintAus(wahrheit),
    chronologieBewiesen: bewiesen,
  }
}

export function routeFactsAusGraph(reise: Pick<Trip, 'days' | 'ohneTag'>): RouteFacts {
  return routeFactsAusItineraries(itinerariesAusReise(reise))
}

export function routeFactsAusItinerary(
  itinerary: NonNullable<TripItem['routeItinerary']>,
  sourceItemId: string | null = null,
): RouteFacts {
  return routeFactsAusItineraries([
    { sourceItemId, startsOn: null, startsAt: null, itinerary },
  ])
}

export function routeFactsFuerPunkt(punkt: TripItem): RouteFacts {
  if (punkt.kind !== 'flight') return leereRouteFacts()
  const itinerary = flugRouteItineraryTrustedLesen(punkt.routeItinerary ?? null)
  if (!itinerary) return leereRouteFacts()
  return routeFactsAusItineraries([
    {
      sourceItemId: punkt.id,
      startsOn: punkt.startsOn,
      startsAt: punkt.startsAt,
      itinerary,
    },
  ])
}

