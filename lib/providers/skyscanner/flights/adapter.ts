import type {
  FlightProviderCommercialQuote,
  FlightProviderOffer,
  FlightProviderQuotePromotion,
  FlightProviderSearchRequest,
  FlightProviderSearchResult,
} from '@/lib/providers/flights/domain'
import {
  SKYSCANNER_PROVIDER_ID,
  type SkyscannerNormalizedLivePricesResponse,
  type SkyscannerNormalizedOffer,
} from '@/lib/providers/skyscanner/flights/contracts'

export type SkyscannerExecutionContext =
  | { mode: 'fixture' }
  | { mode: 'live_transport'; trustedTransport: true }

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

export function skyscannerLivePricesNormalisieren(opts: {
  response: SkyscannerNormalizedLivePricesResponse
  executionContext: SkyscannerExecutionContext
}): FlightProviderSearchResult {
  if (opts.response.schema !== 'jetnity.skyscanner.live-prices.normalized.v1') {
    return { providerId: SKYSCANNER_PROVIDER_ID, executionMode: opts.executionContext.mode, offers: [] }
  }

  return {
    providerId: SKYSCANNER_PROVIDER_ID,
    executionMode: opts.executionContext.mode,
    offers: opts.response.offers.map(normalizeOffer).filter((offer): offer is FlightProviderOffer => offer != null),
  }
}

function itineraryComparisonKey(offer: FlightProviderOffer): string {
  const legs = offer.legs
    .map((leg) => `${leg.originIata}-${leg.destinationIata}-${leg.departureAt}-${leg.marketingCarrier ?? ''}-${leg.flightNumber ?? ''}`)
    .join('|')
  return `flight:${legs}`
}

/**
 * Trust boundary: fixture output is intentionally non-promotable. A future
 * server transport must construct the live context internally after an
 * authenticated Skyscanner exchange; untrusted payload data never selects it.
 */
export function skyscannerOfferZuCommercialQuote(opts: {
  request: FlightProviderSearchRequest
  result: FlightProviderSearchResult
  offer: FlightProviderOffer
  executionContext: SkyscannerExecutionContext
}): FlightProviderQuotePromotion {
  if (opts.executionContext.mode !== 'live_transport' || opts.result.executionMode !== 'live_transport') {
    return { ok: false, reason: 'fixture_not_trusted' }
  }
  if (opts.executionContext.trustedTransport !== true) {
    return { ok: false, reason: 'fixture_not_trusted' }
  }
  if (opts.result.providerId !== SKYSCANNER_PROVIDER_ID || opts.offer.providerId !== SKYSCANNER_PROVIDER_ID) {
    return { ok: false, reason: 'invalid_offer' }
  }

  const requestedCurrency = normalizeCurrency(opts.request.currency)
  if (!requestedCurrency || requestedCurrency !== opts.offer.currency) {
    return { ok: false, reason: 'currency_mismatch' }
  }
  if (!opts.offer.externalRef || !validIsoTimestamp(opts.offer.retrievedAt)) {
    return { ok: false, reason: 'invalid_offer' }
  }

  const deeplink = validHttpsDeeplink(opts.offer.deeplink)
  const quote: FlightProviderCommercialQuote = {
    domain: 'flights',
    providerId: SKYSCANNER_PROVIDER_ID,
    sourceKind: 'live_api',
    sourceLabel: 'Skyscanner Flights Live Prices',
    externalRef: opts.offer.externalRef,
    providerOfferId: opts.offer.providerOfferId,
    retrievedAt: opts.offer.retrievedAt,
    observedAt: opts.offer.retrievedAt,
    freshUntil: null,
    requestedCurrency,
    quotedCurrency: opts.offer.currency,
    amount: opts.offer.amount,
    amountStatus: 'quoted',
    persistenz: 'ephemeral',
    availability: 'unknown',
    affiliate: deeplink
      ? { status: 'present', partnerId: SKYSCANNER_PROVIDER_ID, clickId: null, attributionRef: deeplink }
      : { status: 'absent', partnerId: null, clickId: null, attributionRef: null },
    vergleichsschluessel: itineraryComparisonKey(opts.offer),
  }

  return { ok: true, quote }
}
