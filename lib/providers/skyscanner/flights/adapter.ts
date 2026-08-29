import type {
  FlightProviderFixtureSearchResult,
  FlightProviderOffer,
} from '@/lib/providers/flights/domain'
import {
  SKYSCANNER_PROVIDER_ID,
  type SkyscannerNormalizedLivePricesResponse,
  type SkyscannerNormalizedOffer,
} from '@/lib/providers/skyscanner/flights/contracts'

function normalizeIata(value: string): string | null {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null
}

function normalizeCurrency(value: string): string | null {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null
}

function validIsoTimestamp(value: string): boolean {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
}

function validHttpsDeeplink(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function normalizeOffer(offer: SkyscannerNormalizedOffer): FlightProviderOffer | null {
  const externalRef = offer.itineraryId.trim()
  const providerOfferId = offer.pricingOptionId?.trim() || null
  const currency = normalizeCurrency(offer.price.currency)
  if (!externalRef || !currency) return null
  if (!Number.isFinite(offer.price.amount) || offer.price.amount < 0) return null
  if (!validIsoTimestamp(offer.retrievedAt)) return null
  if (!Array.isArray(offer.legs) || offer.legs.length === 0) return null

  const legs = offer.legs.map((leg) => {
    const originIata = normalizeIata(leg.originIata)
    const destinationIata = normalizeIata(leg.destinationIata)
    if (!originIata || !destinationIata) return null
    if (!validIsoTimestamp(leg.departureAt) || !validIsoTimestamp(leg.arrivalAt)) return null
    return {
      originIata,
      destinationIata,
      departureAt: leg.departureAt,
      arrivalAt: leg.arrivalAt,
      marketingCarrier: leg.marketingCarrier?.trim() || null,
      flightNumber: leg.flightNumber?.trim() || null,
    }
  })

  if (legs.some((leg) => leg == null)) return null

  return {
    providerId: SKYSCANNER_PROVIDER_ID,
    externalRef,
    providerOfferId,
    amount: offer.price.amount,
    currency,
    retrievedAt: offer.retrievedAt,
    deeplink: validHttpsDeeplink(offer.deeplink),
    legs: legs as FlightProviderOffer['legs'],
  }
}

/**
 * Offline-only adapter foundation. It deliberately returns fixture evidence,
 * not an S5-A commercial quote. There is no trusted/live constructor in this
 * module; that boundary is added only together with the real server transport.
 */
export function skyscannerFixtureNormalisieren(
  response: SkyscannerNormalizedLivePricesResponse,
): FlightProviderFixtureSearchResult {
  if (response.schema !== 'jetnity.skyscanner.live-prices.normalized.v1') {
    return { providerId: SKYSCANNER_PROVIDER_ID, evidenceMode: 'fixture', offers: [] }
  }

  return {
    providerId: SKYSCANNER_PROVIDER_ID,
    evidenceMode: 'fixture',
    offers: response.offers.map(normalizeOffer).filter((offer): offer is FlightProviderOffer => offer != null),
  }
}
