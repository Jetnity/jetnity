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
import { pfadAusSegmenten, routeFingerprintAus } from '@/lib/route/fingerprint'
import { airportZeitkontakteAusItineraries } from '@/lib/route/kontakte'
import { laenderrollenAus } from '@/lib/route/laender'
import { segmenteAusItinerary } from '@/lib/route/itinerary'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { verbindungenAusSegmenten } from '@/lib/route/verbindung'
import type { Trip, TripItem } from '@/types/trips'

function itinerariesAusReise(reise: Pick<Trip, 'days' | 'ohneTag'>): RouteItineraryMitQuelle[] {
  const punkte = [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
  const itineraries: RouteItineraryMitQuelle[] = []

  for (const punkt of punkte) {
    if (punkt.kind !== 'flight') continue
    const itinerary = flugRouteItineraryLesen(punkt.routeItinerary ?? null)
    if (!itinerary) continue
    itineraries.push({
      sourceItemId: punkt.id,
      startsOn: punkt.startsOn,
      startsAt: punkt.startsAt,
      itinerary,
    })
  }

  return itineraries.sort(fruehesteZuerst)
}

function routeFactsAusItineraries(itineraries: readonly RouteItineraryMitQuelle[]): RouteFacts {
  if (itineraries.length === 0) return leereRouteFacts()

  const primaer = itineraries[0]
  if (!primaer) return leereRouteFacts()

  const segmente = itineraries.flatMap((eintrag) => segmenteAusItinerary(eintrag.itinerary))
  if (segmente.length === 0) return leereRouteFacts()

  const primaerSegmente = segmenteAusItinerary(primaer.itinerary)
  const origin = primaerSegmente[0]?.origin ?? { ...LEERER_ROUTE_PUNKT }
  const destination = primaerSegmente[primaerSegmente.length - 1]?.destination ?? { ...LEERER_ROUTE_PUNKT }
  const laender = laenderrollenAus(itineraries)

  return {
    quelle: 'flight_itinerary',
    origin,
    destination,
    segments: segmente,
    connections: itineraries.flatMap((eintrag) =>
      eintrag.itinerary.legs.flatMap((bein) => verbindungenAusSegmenten(bein.segments)),
    ),
    airportContacts: airportZeitkontakteAusItineraries(itineraries),
    transitCountryCodes: laender.transitCountryCodes,
    destinationCountryCodes: laender.destinationCountryCodes,
    sourceItemIds: itineraries
      .map((eintrag) => eintrag.sourceItemId)
      .filter((id): id is string => Boolean(id)),
    fingerprint: routeFingerprintAus(itineraries),
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
  const itinerary = flugRouteItineraryLesen(punkt.routeItinerary ?? null)
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

function fruehesteZuerst(a: RouteItineraryMitQuelle, b: RouteItineraryMitQuelle): number {
  const aStart = `${a.startsOn ?? ''}T${a.startsAt ?? ''}`
  const bStart = `${b.startsOn ?? ''}T${b.startsAt ?? ''}`
  if (aStart !== bStart) return aStart < bStart ? -1 : 1
  return pfadAusSegmenten(segmenteAusItinerary(a.itinerary)).localeCompare(
    pfadAusSegmenten(segmenteAusItinerary(b.itinerary)),
  )
}
