export type FlightProviderSearchRequest = {
  originIata: string
  destinationIata: string
  departureDate: string
  returnDate?: string | null
  adults: number
  children?: number
  infants?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
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
