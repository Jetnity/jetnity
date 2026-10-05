export const SKYSCANNER_PROVIDER_ID = 'skyscanner' as const

export type SkyscannerNormalizedLeg = {
  originIata: string
  destinationIata: string
  departureAt: string
  arrivalAt: string
  marketingCarrier?: string | null
  flightNumber?: string | null
}

export type SkyscannerNormalizedOffer = {
  itineraryId: string
  pricingOptionId?: string | null
  price: {
    amount: number
    currency: string
  }
  retrievedAt: string
  deeplink?: string | null
  legs: SkyscannerNormalizedLeg[]
}

export type SkyscannerNormalizedLivePricesResponse = {
  schema: 'jetnity.skyscanner.live-prices.normalized.v1'
  offers: SkyscannerNormalizedOffer[]
}
