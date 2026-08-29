export const FLIGHT_PROVIDER_EXECUTION_MODES = ['fixture', 'live_transport'] as const
export type FlightProviderExecutionMode = (typeof FLIGHT_PROVIDER_EXECUTION_MODES)[number]

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

export type FlightProviderSearchResult = {
  providerId: string
  executionMode: FlightProviderExecutionMode
  offers: FlightProviderOffer[]
}

export type FlightProviderCommercialQuote = {
  domain: 'flights'
  providerId: string
  sourceKind: 'live_api'
  sourceLabel: string
  externalRef: string
  providerOfferId: string | null
  retrievedAt: string
  observedAt: string
  freshUntil: null
  requestedCurrency: string
  quotedCurrency: string
  amount: number
  amountStatus: 'quoted'
  persistenz: 'ephemeral'
  availability: 'unknown'
  affiliate: {
    status: 'present' | 'absent'
    partnerId: string | null
    clickId: null
    attributionRef: string | null
  }
  vergleichsschluessel: string
}

export type FlightProviderQuotePromotion =
  | { ok: true; quote: FlightProviderCommercialQuote }
  | { ok: false; reason: 'fixture_not_trusted' | 'invalid_offer' | 'currency_mismatch' }
