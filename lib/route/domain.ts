// lib/route/domain.ts
//
// Provider-neutrale Route- und Transit-Wahrheit.
//
// Eine Route entsteht nur aus strukturierten Flight-/Itinerary-Daten.
// Ortsnamen, Titel und Notizen sind keine Trust Boundary.
//
// Frei von Next, Supabase und `process.env`.

export const ROUTE_FACTS_VERSION = 'route-v1' as const

const ROUTE_QUELLEN = ['none', 'flight_itinerary'] as const
export type RouteQuelle = (typeof ROUTE_QUELLEN)[number]

export type FlughafenReferenz = {
  countryCode: string | null
  city: string | null
  country: string | null
  name: string | null
}

export type FlughafenReferenzKarte = Readonly<Record<string, FlughafenReferenz>>

export type RoutePunkt = {
  airportCode: string | null
  countryCode: string | null
  city: string | null
  country: string | null
}

export type RouteSegment = {
  origin: RoutePunkt
  destination: RoutePunkt
  departureDate: string | null
  departureTime: string | null
  arrivalDate: string | null
  arrivalTime: string | null
}

export type RouteVerbindung = {
  airportCode: string | null
  countryCode: string | null
  city: string | null
  country: string | null
  durationMinutes: number | null
  airportChange: boolean | null
  fromSegmentIndex: number
  toSegmentIndex: number
}

export type FlugRouteItinerary = {
  v: 1
  type: 'flight_route_itinerary'
  legs: { segments: RouteSegment[] }[]
}

export type RouteItineraryMitQuelle = {
  sourceItemId: string | null
  startsOn: string | null
  startsAt: string | null
  itinerary: FlugRouteItinerary
}

export type RouteAirportKontakt = {
  airportCode: string
  countryCode: string | null
  start: string | null
  end: string | null
}

export type RouteFacts = {
  quelle: RouteQuelle
  origin: RoutePunkt
  destination: RoutePunkt
  segments: RouteSegment[]
  connections: RouteVerbindung[]
  airportContacts: RouteAirportKontakt[]
  transitCountryCodes: string[]
  destinationCountryCodes: string[]
  sourceItemIds: string[]
  fingerprint: string | null
}

export const LEERER_ROUTE_PUNKT: RoutePunkt = {
  airportCode: null,
  countryCode: null,
  city: null,
  country: null,
}

export function leereRouteFacts(): RouteFacts {
  return {
    quelle: 'none',
    origin: { ...LEERER_ROUTE_PUNKT },
    destination: { ...LEERER_ROUTE_PUNKT },
    segments: [],
    connections: [],
    airportContacts: [],
    transitCountryCodes: [],
    destinationCountryCodes: [],
    sourceItemIds: [],
    fingerprint: null,
  }
}
