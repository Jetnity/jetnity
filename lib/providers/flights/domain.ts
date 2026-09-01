import type { FlugKabine } from '@/lib/flights/domain'

/**
 * One search slice in provider-neutral request order.
 *
 * Calendar date only. This is not an offer segment and must not grow
 * arrival, carrier or flight-number fields.
 */
export type FlightProviderSearchLeg = {
  originIata: string
  destinationIata: string
  date: string
}

/**
 * External-market request context. Not traveller citizenship, residence
 * or ranking context.
 */
export type FlightProviderExternalRequestContext = {
  market: string
  locale: string
}

/**
 * Provider-neutral Flight search request.
 *
 * Route truth is the ordered `legs[]` collection. One-way, return and
 * multi-city share that structure. There is no `returnDate`, top-level
 * origin/destination or ranking-`context` on this shape.
 *
 * Leg limits, passengers, cabin and currency are projections of
 * canonical `FlugSuchanfrage` / `FLUG_SUCHE_GRENZEN`. This type does
 * not define a second provider-specific maximum.
 *
 * `stopPreference` stays off this contract: it is product-search
 * filtering, not a required shared transport field.
 */
export type FlightProviderSearchRequest = {
  legs: FlightProviderSearchLeg[]
  adults: number
  children: number
  infants: number
  cabin: FlugKabine
  currency: string
  market: string
  locale: string
}

export type FlightProviderLeg = {
  originIata: string
  destinationIata: string
  departureAt: string
  arrivalAt: string
  marketingCarrier: string | null
  flightNumber: string | null
}

export type FlightProviderOffer = {
  providerId: string
  externalRef: string
  providerOfferId: string | null
  amount: number
  currency: string
  retrievedAt: string
  deeplink: string | null
  legs: FlightProviderLeg[]
}

/**
 * Offline provider fixtures are test evidence only. This result intentionally
 * has no sourceKind/persistenz/actor field and therefore cannot be passed as a
 * Commercial-Provenance quote without a future server-side live transport.
 */
export type FlightProviderFixtureSearchResult = {
  providerId: string
  evidenceMode: 'fixture'
  offers: FlightProviderOffer[]
}
