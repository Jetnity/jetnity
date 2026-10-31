// Viator Full Access Affiliate sandbox foundation.
// Provider-specific contract only. No ActivityProvider registration,
// no booking, and no Production host.

export const VIATOR_PROVIDER_ID = 'viator' as const

export const VIATOR_NORMALIZED_SCHEMA = 'jetnity.viator.activities.normalized.v1' as const

/** Official single-product and search cache ceiling. Never exceed. */
export const VIATOR_MAX_CACHE_SECONDS = 3600

/** Real-time /availability/check is not a cacheable quote. */
export const VIATOR_LIVE_CHECK_CACHE_SECONDS = 0

export const VIATOR_SANDBOX_ORIGIN = 'https://api.sandbox.viator.com' as const

/**
 * Official Production API origin. Selected only by the typed Production binding.
 * Callers cannot pass a different host.
 */
export const VIATOR_PRODUCTION_API_ORIGIN = 'https://api.viator.com' as const

/**
 * Server-only Production credential name. The closed source gate never reads it.
 */
export const VIATOR_PRODUCTION_API_KEY_ENV = 'VIATOR_PRODUCTION_API_KEY' as const

export const VIATOR_ACCEPT_HEADER = 'application/json;version=2.0' as const

export const VIATOR_API_KEY_HEADER = 'exp-api-key' as const

/** Server-only env name. This module never reads the value. */
export const VIATOR_SANDBOX_API_KEY_ENV = 'VIATOR_SANDBOX_API_KEY' as const

/** Must be the exact string `true` before any sandbox call is attempted. */
export const VIATOR_SANDBOX_CALLS_ENV = 'VIATOR_SANDBOX_CALLS' as const

/**
 * Jetnity activities search bound. Viator's 120s note is a booking
 * recommendation, and this slice does not book.
 */
export const VIATOR_REQUEST_TIMEOUT_MS = 12_000

export const VIATOR_AGE_BANDS = ['ADULT', 'CHILD', 'INFANT', 'YOUTH', 'SENIOR', 'TRAVELER'] as const

export type ViatorAgeBand = (typeof VIATOR_AGE_BANDS)[number]

/**
 * Currencies accepted on /products/search as of the 4 Feb 2025 doc update.
 * Presence here is a display/request code, not a checkout or CHF transfer.
 */
export const VIATOR_SEARCH_CURRENCIES = [
  'AED',
  'ARS',
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'DKK',
  'EUR',
  'FJD',
  'GBP',
  'HKD',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PEN',
  'PHP',
  'PLN',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'USD',
  'VND',
  'ZAR',
] as const

export type ViatorSearchCurrency = (typeof VIATOR_SEARCH_CURRENCIES)[number]

/** Affiliate Accept-Language values. Merchant-only codes are excluded. */
export const VIATOR_ACCEPT_LANGUAGES = [
  'en',
  'en-US',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-HK',
  'en-IE',
  'en-IN',
  'en-MY',
  'en-NZ',
  'en-PH',
  'en-SG',
  'en-ZA',
  'da',
  'nl',
  'nl-BE',
  'no',
  'es',
  'es-AR',
  'es-CL',
  'es-CO',
  'es-MX',
  'es-PE',
  'es-VE',
  'sv',
  'fr',
  'fr-BE',
  'fr-CA',
  'fr-CH',
  'it',
  'it-CH',
  'de',
  'de-DE',
  'pt',
  'pt-BR',
  'ja',
] as const

export type ViatorAcceptLanguage = (typeof VIATOR_ACCEPT_LANGUAGES)[number]

export const VIATOR_PRODUCT_URL_HOSTS = ['www.viator.com', 'viator.com', 'shop.live.rc.viator.com'] as const

export const VIATOR_IMAGE_URL_HOSTS = ['hare-media-cdn.tripadvisor.com'] as const

export const VIATOR_EVIDENCE_MODES = [
  'fixture',
  'content_preview',
  'schedule_hint',
  'live_check',
  'affiliate_redirect',
] as const

export type ViatorEvidenceMode = (typeof VIATOR_EVIDENCE_MODES)[number]

export const VIATOR_PRICE_ROLES = ['rrp_from', 'rrp_schedule', 'rrp_check'] as const

export type ViatorPriceRole = (typeof VIATOR_PRICE_ROLES)[number]

export const VIATOR_OPERATIONS = [
  'products_search',
  'product_detail',
  'availability_schedule',
  'availability_check',
  'destinations',
] as const

export type ViatorOperation = (typeof VIATOR_OPERATIONS)[number]

export const VIATOR_FORBIDDEN_OPERATIONS = [
  'products_modified_since',
  'products_bulk',
  'schedules_bulk',
  'schedules_modified_since',
  'bookings_hold',
  'bookings_book',
  'bookings_cancel',
  'bookings_cart_hold',
  'bookings_cart_book',
  'reviews_product',
  'exchange_rates',
] as const

/**
 * The 28 October 2026 vendor email, visually verified by the Technical Lead
 * in issue #1023 comment 6468170303, says Viator unique content must not be
 * indexed. It does not say every Viator field is covered by that sentence.
 * `internalReleaseGate` is Jetnity's broader noindex for user-visible
 * provider content until the technical agreement scope is accepted.
 * S1 itself publishes no provider page, RSC payload, or JSON-LD.
 */
export const VIATOR_NOINDEX_CONTRACT = {
  header: 'X-Robots-Tag',
  value: 'noindex, nofollow',
  vendorSentenceScope: 'unique_content',
  internalReleaseGate: 'user_visible_provider_content',
  jsonLd: false,
  reviewBodyInNormalizedPayload: false,
  viatorUniqueContentInNormalizedPayload: false,
  s1PublishesProviderContent: false,
} as const

export type ViatorPrice = {
  amount: number
  currency: ViatorSearchCurrency
  priceRole: ViatorPriceRole
  checkoutCurrencyConfirmed: false
}

export type ViatorImage = {
  url: string
  width: number
  height: number
  isCover: boolean
  imageLicenseConfirmed: false
}

export type ViatorReviewSummary = {
  combinedAverage: number | null
  totalReviews: number | null
}

export type ViatorCancellation = {
  policyType: 'STANDARD' | 'CUSTOM' | 'ALL_SALES_FINAL' | 'unknown'
  stornierbar: boolean | null
}

export type ViatorContentProduct = {
  productCode: string
  title: string
  description: string | null
  destinationIds: string[]
  primaryDestinationId: string | null
  durationMinutes: number | null
  pricing: ViatorPrice | null
  reviewSummary: ViatorReviewSummary | null
  image: ViatorImage | null
  productOptionCodes: string[]
  productOptions: Array<{ code: string; title: string }>
  /** True when returned option metadata is present but not safely labelled. */
  optionenUnaufgeloest: boolean
  ageBands: ViatorAgeBandRule[]
  cancellation: ViatorCancellation
  flags: string[]
}

export type ViatorAgeBandRule = {
  ageBand: ViatorAgeBand
  startAge: number
  endAge: number
  minTravelersPerBooking: number
  maxTravelersPerBooking: number
}

export type ViatorAffiliateRedirect = {
  schema: typeof VIATOR_NORMALIZED_SCHEMA
  evidenceMode: 'affiliate_redirect'
  productCode: string
  productUrl: string
  attributionIntact: true
  source: 'provider_response'
}

export type ViatorCacheReason =
  | 'ok'
  | 'ttl_exceeds_3600'
  | 'live_check_must_not_cache'
  | 'expired'
  | 'stale_context'
  | 'invalid_timestamp'
  | 'invalid_ttl'
  | 'fixture_not_reusable'
  | 'affiliate_not_cached'

export type ViatorCacheVerdict = {
  acceptedTtl: boolean
  fresh: boolean
  reusable: boolean
  reason: ViatorCacheReason
}

export type ViatorContentPreview = {
  schema: typeof VIATOR_NORMALIZED_SCHEMA
  evidenceMode: 'content_preview' | 'fixture'
  availabilityClaim: false
  affiliateStatus: 'absent'
  retrievedAt: string | null
  cache: ViatorCacheVerdict
  products: ViatorContentProduct[]
  affiliateRedirects: ViatorAffiliateRedirect[]
  partial: boolean
  uniqueContentOmitted: true
  contentLicenseReviewed: false
}

export type ViatorScheduleSeason = {
  startDate: string
  endDate: string | null
  daysOfWeek: string[]
  startTimes: string[]
  unavailableDates: string[]
  timedEntries: Array<{ startTime: string; unavailableDates: string[]; daysOfWeek: string[] }>
}

export type ViatorScheduleBandPrice = {
  ageBand: ViatorAgeBand
  price: ViatorPrice
}

export type ViatorScheduleOption = {
  productOptionCode: string
  seasons: ViatorScheduleSeason[]
  ageBandPrices: ViatorScheduleBandPrice[]
}

export type ViatorScheduleHint = {
  schema: typeof VIATOR_NORMALIZED_SCHEMA
  evidenceMode: 'schedule_hint'
  availabilityClaim: false
  productCode: string
  supplierCurrency: ViatorSearchCurrency | null
  fromPrice: ViatorPrice | null
  options: ViatorScheduleOption[]
  retrievedAt: string | null
  cache: ViatorCacheVerdict
  partial: boolean
  uniqueContentOmitted: true
}

export type ViatorPaxMixItem = {
  ageBand: ViatorAgeBand
  numberOfTravelers: number
}

export type ViatorLiveCheckRequest = {
  productCode: string
  productOptionCode: string | null
  travelDate: string
  paxMix: ViatorPaxMixItem[]
  currency: ViatorSearchCurrency
  startTime: string | null
  productAgeBands: ViatorAgeBandRule[]
}

export type ViatorLiveCheck = {
  schema: typeof VIATOR_NORMALIZED_SCHEMA
  evidenceMode: 'live_check'
  availabilityClaim: true
  productCode: string
  productOptionCode: string | null
  travelDate: string
  startTime: string | null
  available: boolean
  pricing: ViatorPrice | null
  quoteComplete: boolean
  paxMix: ViatorPaxMixItem[]
  retrievedAt: string
  cache: ViatorCacheVerdict
  checkoutCurrencyConfirmed: false
}

export type ViatorParseFailure = {
  ok: false
  reason: 'malformed_response'
}

export function isViatorSearchCurrency(value: string): value is ViatorSearchCurrency {
  return (VIATOR_SEARCH_CURRENCIES as readonly string[]).includes(value)
}

export function isViatorAcceptLanguage(value: string): value is ViatorAcceptLanguage {
  return (VIATOR_ACCEPT_LANGUAGES as readonly string[]).includes(value)
}

export function isViatorAgeBand(value: string): value is ViatorAgeBand {
  return (VIATOR_AGE_BANDS as readonly string[]).includes(value)
}

export function viatorNoindexHeaders(): Record<string, string> {
  return { [VIATOR_NOINDEX_CONTRACT.header]: VIATOR_NOINDEX_CONTRACT.value }
}
