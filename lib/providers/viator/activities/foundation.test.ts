import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { readViatorAgeBands } from '@/lib/providers/viator/activities/age'
import { readViatorAffiliateRedirect } from '@/lib/providers/viator/activities/affiliate'
import { viatorCacheVerdict, viatorContextKey } from '@/lib/providers/viator/activities/cache'
import { parseViatorFixture, parseViatorProductDetail, parseViatorSearch } from '@/lib/providers/viator/activities/content'
import {
  VIATOR_ACCEPT_HEADER,
  VIATOR_ACCEPT_LANGUAGES,
  VIATOR_AGE_BANDS,
  VIATOR_API_KEY_HEADER,
  VIATOR_EVIDENCE_MODES,
  VIATOR_FORBIDDEN_OPERATIONS,
  VIATOR_IMAGE_URL_HOSTS,
  VIATOR_LIVE_CHECK_CACHE_SECONDS,
  VIATOR_MAX_CACHE_SECONDS,
  VIATOR_NOINDEX_CONTRACT,
  VIATOR_NORMALIZED_SCHEMA,
  VIATOR_OPERATIONS,
  VIATOR_PRICE_ROLES,
  VIATOR_PRODUCT_URL_HOSTS,
  VIATOR_PRODUCTION_API_ORIGIN,
  VIATOR_PROVIDER_ID,
  VIATOR_REQUEST_TIMEOUT_MS,
  VIATOR_SANDBOX_API_KEY_ENV,
  VIATOR_SANDBOX_CALLS_ENV,
  VIATOR_SANDBOX_ORIGIN,
  VIATOR_SEARCH_CURRENCIES,
  isViatorAcceptLanguage,
  isViatorAgeBand,
  isViatorSearchCurrency,
  viatorNoindexHeaders,
  type ViatorAgeBandRule,
} from '@/lib/providers/viator/activities/contracts'
import { resolveViatorDestination } from '@/lib/providers/viator/activities/destination'
import { parseViatorAvailabilityCheck, validateViatorLiveCheckRequest } from '@/lib/providers/viator/activities/live-check'
import { readViatorCurrency, readViatorCustomerPrice, viatorCheckoutTransfer } from '@/lib/providers/viator/activities/money'
import { buildViatorSandboxCall } from '@/lib/providers/viator/activities/request'
import { parseViatorSchedule } from '@/lib/providers/viator/activities/schedule'
import { validateViatorImageUrl, validateViatorProductUrl } from '@/lib/providers/viator/activities/url'

const NOW = Date.parse('2026-10-28T12:00:00.000Z')
const RETRIEVED = '2026-10-28T12:00:00.000Z'
const PRODUCT_URL = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'
const IMAGE_URL = 'https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/71/ef/dc.jpg'
const UNIQUE = 'UNIQUE CONTENT SHOULD NOT LEAK'
const REVIEW = 'SECRET REVIEW BODY SHOULD NOT LEAK'

const ADULT: ViatorAgeBandRule = {
  ageBand: 'ADULT',
  startAge: 18,
  endAge: 99,
  minTravelersPerBooking: 1,
  maxTravelersPerBooking: 10,
}
const CHILD: ViatorAgeBandRule = {
  ageBand: 'CHILD',
  startAge: 0,
  endAge: 17,
  minTravelersPerBooking: 0,
  maxTravelersPerBooking: 10,
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    productCode: '10001P1',
    title: 'Fixture walking tour',
    description: 'A short fixture description.',
    pricing: { summary: { fromPrice: 40 }, currency: 'EUR' },
    productUrl: PRODUCT_URL,
    destinations: [{ ref: '732', primary: true }],
    duration: { fixedDurationInMinutes: 120 },
    images: [{ isCover: true, variants: [{ url: IMAGE_URL, width: 720, height: 480 }] }],
    reviews: {
      totalReviews: 4,
      combinedAverageRating: 4.5,
      sources: [{ provider: 'VIATOR', text: REVIEW }],
    },
    viatorUniqueContent: { text: UNIQUE },
    ...overrides,
  }
}

describe('Viator contract', () => {
  test('documents sandbox bounds, noindex, and the currency display list', () => {
    assert.equal(VIATOR_PROVIDER_ID, 'viator')
    assert.equal(VIATOR_NORMALIZED_SCHEMA, 'jetnity.viator.activities.normalized.v1')
    assert.equal(VIATOR_MAX_CACHE_SECONDS, 3600)
    assert.equal(VIATOR_LIVE_CHECK_CACHE_SECONDS, 0)
    assert.equal(VIATOR_SANDBOX_ORIGIN, 'https://api.sandbox.viator.com')
    assert.equal(VIATOR_PRODUCTION_API_ORIGIN, 'https://api.viator.com')
    assert.equal(VIATOR_ACCEPT_HEADER, 'application/json;version=2.0')
    assert.equal(VIATOR_API_KEY_HEADER, 'exp-api-key')
    assert.equal(VIATOR_SANDBOX_API_KEY_ENV, 'VIATOR_SANDBOX_API_KEY')
    assert.equal(VIATOR_SANDBOX_CALLS_ENV, 'VIATOR_SANDBOX_CALLS')
    assert.equal(VIATOR_REQUEST_TIMEOUT_MS, 12_000)
    assert.equal(VIATOR_REQUEST_TIMEOUT_MS < 120_000, true)
    assert.ok(VIATOR_SEARCH_CURRENCIES.includes('CHF'))
    assert.ok(VIATOR_SEARCH_CURRENCIES.includes('USD'))
    assert.equal(isViatorSearchCurrency('XXX'), false)
    assert.equal(isViatorSearchCurrency('CHF'), true)
    assert.equal(isViatorAcceptLanguage('pl'), false)
    assert.equal(isViatorAcceptLanguage('zh-CN'), false)
    assert.equal(isViatorAcceptLanguage('de-DE'), true)
    assert.ok(VIATOR_ACCEPT_LANGUAGES.includes('en-US'))
    assert.equal(isViatorAgeBand('ADULT'), true)
    assert.ok(VIATOR_AGE_BANDS.includes('TRAVELER'))
    assert.ok(VIATOR_EVIDENCE_MODES.includes('fixture'))
    assert.ok(VIATOR_EVIDENCE_MODES.includes('live_check'))
    assert.ok(VIATOR_PRICE_ROLES.includes('rrp_from'))
    assert.ok(VIATOR_OPERATIONS.includes('availability_check'))
    assert.ok(VIATOR_FORBIDDEN_OPERATIONS.includes('bookings_book'))
    assert.ok(VIATOR_FORBIDDEN_OPERATIONS.includes('products_modified_since'))
    assert.ok(VIATOR_PRODUCT_URL_HOSTS.includes('shop.live.rc.viator.com'))
    assert.ok(VIATOR_IMAGE_URL_HOSTS.includes('hare-media-cdn.tripadvisor.com'))
    assert.equal(VIATOR_NOINDEX_CONTRACT.value, 'noindex, nofollow')
    assert.equal(VIATOR_NOINDEX_CONTRACT.vendorSentenceScope, 'unique_content')
    assert.equal(VIATOR_NOINDEX_CONTRACT.internalReleaseGate, 'user_visible_provider_content')
    assert.equal(VIATOR_NOINDEX_CONTRACT.jsonLd, false)
    assert.equal(VIATOR_NOINDEX_CONTRACT.reviewBodyInNormalizedPayload, false)
    assert.equal(VIATOR_NOINDEX_CONTRACT.s1PublishesProviderContent, false)
    assert.deepEqual(viatorNoindexHeaders(), { 'X-Robots-Tag': 'noindex, nofollow' })
  })
})

describe('Viator URL validation', () => {
  test('keeps an allowlisted product URL byte for byte', () => {
    const checked = validateViatorProductUrl(PRODUCT_URL)
    assert.equal(checked.ok, true)
    if (checked.ok) assert.equal(checked.url, PRODUCT_URL)
  })

  test('rejects unsafe, spoofed, credentialed, and non-storefront URLs', () => {
    const rejected = [
      'javascript:alert(1)',
      'https://user:pass@www.viator.com/tours/Example',
      'https://www.viator.com.evil.example/tours/Example',
      'https://evil.example/www.viator.com',
      'http://www.viator.com/tours/Example',
      ' https://www.viator.com/tours/Example',
      'https://api.viator.com/partner/products/10001P1',
      'https://api.sandbox.viator.com/partner/products/10001P1',
      'https://www.viator.com:444/tours/Example',
      'data:text/html,hi',
    ]
    for (const url of rejected) {
      assert.equal(validateViatorProductUrl(url).ok, false, url)
    }
    assert.equal(validateViatorImageUrl('https://evil.example/image.jpg').ok, false)
    assert.equal(validateViatorImageUrl(IMAGE_URL).ok, true)
  })
})

describe('Viator content parsers', () => {
  test('search preview omits unique content and does not claim availability', () => {
    const parsed = parseViatorSearch(
      { products: [product()] },
      { source: 'provider_response', retrievedAt: RETRIEVED, nowMs: NOW },
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.evidenceMode, 'content_preview')
    assert.equal(parsed.value.availabilityClaim, false)
    assert.equal(parsed.value.affiliateStatus, 'absent')
    assert.equal(parsed.value.products.length, 1)
    assert.equal(parsed.value.products[0]?.pricing?.amount, 40)
    assert.equal(parsed.value.products[0]?.pricing?.currency, 'EUR')
    assert.equal(parsed.value.products[0]?.pricing?.priceRole, 'rrp_from')
    assert.equal(parsed.value.products[0]?.pricing?.checkoutCurrencyConfirmed, false)
    assert.equal(parsed.value.products[0]?.image?.imageLicenseConfirmed, false)
    assert.equal(parsed.value.affiliateRedirects[0]?.productUrl, PRODUCT_URL)
    assert.equal(parsed.value.affiliateRedirects[0]?.evidenceMode, 'affiliate_redirect')
    const serialized = JSON.stringify(parsed.value)
    assert.equal(serialized.includes(UNIQUE), false)
    assert.equal(serialized.includes(REVIEW), false)
    assert.equal(serialized.includes('viatorUniqueContent'), false)
    assert.equal(parsed.value.cache.reusable, true)
    assert.equal(parsed.value.cache.reason, 'ok')
  })

  test('fixture cannot become live availability or an affiliate redirect', () => {
    const parsed = parseViatorFixture(
      { evidenceMode: 'live_check', sourceKind: 'live_api', products: [product()] },
      NOW,
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.evidenceMode, 'fixture')
    assert.equal(parsed.value.availabilityClaim, false)
    assert.equal(parsed.value.retrievedAt, null)
    assert.deepEqual(parsed.value.affiliateRedirects, [])
    assert.equal(parsed.value.cache.reason, 'fixture_not_reusable')
    assert.equal(readViatorAffiliateRedirect({ source: 'fixture', productCode: '10001P1', productUrl: PRODUCT_URL }), null)
  })

  test('drops unsafe products, duplicate codes, and prices without a currency', () => {
    const parsed = parseViatorSearch(
      {
        products: [
          product({ productCode: '10001P1', title: '<script>alert(1)</script>' }),
          product({ productCode: '10002P2', description: undefined, pricing: { summary: { fromPrice: 10 } }, images: undefined }),
          product({ productCode: '10002P2', title: 'Duplicate' }),
          product({ productCode: '10003P3', pricing: { summary: { fromPrice: -5 }, currency: 'EUR' } }),
          product({ productCode: '10004P4', pricing: { summary: { fromPrice: 12 }, currency: 'XXX' } }),
        ],
      },
      { source: 'provider_response', retrievedAt: RETRIEVED, nowMs: NOW },
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.partial, true)
    assert.deepEqual(
      parsed.value.products.map((item) => item.productCode),
      ['10002P2', '10003P3', '10004P4'],
    )
    assert.equal(parsed.value.products[0]?.description, null)
    assert.equal(parsed.value.products[0]?.pricing, null)
    assert.equal(parsed.value.products[0]?.image, null)
    assert.equal(parsed.value.products[1]?.pricing, null)
    assert.equal(parsed.value.products[2]?.pricing, null)
  })

  test('malformed detail fails closed and optional markup becomes plain text', () => {
    const malformed = parseViatorProductDetail({ products: [] }, { source: 'provider_response', retrievedAt: RETRIEVED, nowMs: NOW })
    assert.deepEqual(malformed, { ok: false, reason: 'malformed_response' })
    const parsed = parseViatorProductDetail(
      product({ description: 'Meet at the gate.<br/>Bring water.', title: 'Plain title' }),
      { source: 'provider_response', retrievedAt: RETRIEVED, nowMs: NOW },
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.products[0]?.description, 'Meet at the gate.\nBring water.')
    assert.equal(parsed.value.products[0]?.description?.includes('<'), false)
  })

  test('CHF display price is not a checkout transfer and is not invented from another currency', () => {
    assert.deepEqual(viatorCheckoutTransfer('CHF'), {
      supported: false,
      reason: 'checkout_currency_not_transferred',
      currency: 'CHF',
    })
    assert.equal(readViatorCurrency('chf'), null)
    assert.equal(
      readViatorCustomerPrice({ amount: 10, currency: 'CHF', priceRole: 'rrp_from', supplierCurrency: 'USD' }),
      null,
    )
    assert.equal(readViatorCustomerPrice({ amount: 10, currency: undefined, priceRole: 'rrp_from' }), null)
    const chf = readViatorCustomerPrice({ amount: 10, currency: 'CHF', priceRole: 'rrp_from', supplierCurrency: 'CHF' })
    assert.equal(chf?.checkoutCurrencyConfirmed, false)
    assert.equal(chf?.amount, 10)
  })
})

describe('Viator schedules, live check, destination, and cache', () => {
  test('a schedule hint is not current availability', () => {
    const parsed = parseViatorSchedule(
      {
        productCode: '10001P1',
        currency: 'USD',
        summary: { fromPrice: 100.02 },
        bookableItems: [
          {
            productOptionCode: 'TG1',
            seasons: [
              {
                startDate: '2026-05-01',
                endDate: '2026-12-31',
                pricingRecords: [
                  {
                    daysOfWeek: ['MONDAY'],
                    timedEntries: [{ startTime: '10:00', unavailableDates: [{ date: '2026-09-16', reason: 'SOLD_OUT' }] }],
                    pricingDetails: [
                      {
                        ageBand: 'ADULT',
                        price: {
                          original: { recommendedRetailPrice: 100.02, partnerNetPrice: 1 },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { retrievedAt: RETRIEVED, nowMs: NOW },
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.evidenceMode, 'schedule_hint')
    assert.equal(parsed.value.availabilityClaim, false)
    assert.equal(parsed.value.supplierCurrency, 'USD')
    assert.equal(parsed.value.fromPrice?.amount, 100.02)
    assert.equal(parsed.value.options[0]?.ageBandPrices[0]?.price.amount, 100.02)
    assert.equal(JSON.stringify(parsed.value).includes('partnerNetPrice'), false)
    assert.equal(parsed.value.options[0]?.seasons[0]?.unavailableDates[0], '2026-09-16')
  })

  test('live check requires an explicit age mix and ignores partner net', () => {
    const totalOnly = validateViatorLiveCheckRequest({ productCode: '10001P1', participants: 2 })
    assert.equal(totalOnly.ok, false)
    if (!totalOnly.ok) assert.equal(totalOnly.reason, 'total_is_not_age_mix')
    const bands = readViatorAgeBands([ADULT])
    assert.equal(bands.ok, true)
    const mismatch = validateViatorLiveCheckRequest({
      productCode: '10001P1',
      productOptionCode: 'TG1',
      travelDate: '2026-11-02',
      paxMix: [
        { ageBand: 'ADULT', numberOfTravelers: 2 },
        { ageBand: 'CHILD', numberOfTravelers: 1 },
      ],
      productAgeBands: [ADULT],
    })
    assert.equal(mismatch.ok, false)
    if (!mismatch.ok) assert.equal(mismatch.reason, 'nonmatching_age_band')
    const mixed = validateViatorLiveCheckRequest({
      productCode: '10001P1',
      productOptionCode: 'TG1',
      travelDate: '2026-11-02',
      paxMix: [
        { ageBand: 'TRAVELER', numberOfTravelers: 1 },
        { ageBand: 'ADULT', numberOfTravelers: 1 },
      ],
      productAgeBands: [ADULT, CHILD],
    })
    assert.equal(mixed.ok, false)
    if (!mixed.ok) assert.equal(mixed.reason, 'unit_pricing_mix')
    const request = validateViatorLiveCheckRequest({
      productCode: '10001P1',
      productOptionCode: 'TG1',
      travelDate: '2026-11-02',
      currency: 'CHF',
      startTime: '10:00',
      paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 2 }],
      productAgeBands: [ADULT, CHILD],
    })
    assert.equal(request.ok, true)
    if (!request.ok) return
    const parsed = parseViatorAvailabilityCheck(
      {
        currency: 'USD',
        productCode: '10001P1',
        travelDate: '2026-11-02',
        bookableItems: [
          {
            productOptionCode: 'TG1',
            startTime: '10:00',
            available: true,
            totalPrice: { price: { recommendedRetailPrice: 80, partnerNetPrice: 1 } },
          },
        ],
      },
      request.value,
      { retrievedAt: RETRIEVED, nowMs: NOW, ttlSeconds: 0 },
    )
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.value.evidenceMode, 'live_check')
    assert.equal(parsed.value.availabilityClaim, true)
    assert.equal(parsed.value.available, true)
    assert.equal(parsed.value.pricing?.currency, 'USD')
    assert.equal(parsed.value.pricing?.amount, 80)
    assert.equal(parsed.value.pricing?.priceRole, 'rrp_check')
    assert.equal(parsed.value.checkoutCurrencyConfirmed, false)
    assert.equal(parsed.value.cache.reusable, false)
    assert.equal(JSON.stringify(parsed.value).includes('partnerNetPrice'), false)
  })

  test('destination resolution does not invent a city', () => {
    const missing = resolveViatorDestination({ jetnityPlaceId: 'place-zurich', bindings: [] })
    assert.equal(missing.ok, false)
    if (!missing.ok) assert.equal(missing.reason, 'unmapped')
    const named = resolveViatorDestination({
      jetnityPlaceId: 'Zurich',
      bindings: [{ jetnityPlaceId: 'place-zurich', destinationId: 732 }],
    })
    assert.equal(named.ok, false)
    if (!named.ok) assert.equal(named.reason, 'unmapped')
    const ambiguous = resolveViatorDestination({
      jetnityPlaceId: 'place-zurich',
      bindings: [
        { jetnityPlaceId: 'place-zurich', destinationId: 732 },
        { jetnityPlaceId: 'place-zurich', destinationId: 733 },
      ],
    })
    assert.equal(ambiguous.ok, false)
    if (!ambiguous.ok) assert.equal(ambiguous.reason, 'ambiguous')
    const resolved = resolveViatorDestination({
      jetnityPlaceId: 'place-zurich',
      bindings: [{ jetnityPlaceId: 'place-zurich', destinationId: 732 }],
      catalog: [{ destinationId: 732, name: 'Zurich' }],
    })
    assert.deepEqual(resolved, { ok: true, destinationId: '732', name: 'Zurich' })
  })

  test('cache expires at 3600 seconds, rejects longer TTLs, and treats context changes as stale', () => {
    const fresh = viatorCacheVerdict({
      evidenceMode: 'content_preview',
      ttlSeconds: 3600,
      retrievedAt: RETRIEVED,
      nowMs: NOW + 3_600_000,
    })
    assert.equal(fresh.fresh, true)
    assert.equal(fresh.reusable, true)
    const expired = viatorCacheVerdict({
      evidenceMode: 'schedule_hint',
      ttlSeconds: 3600,
      retrievedAt: RETRIEVED,
      nowMs: NOW + 3_600_001,
    })
    assert.equal(expired.reason, 'expired')
    assert.equal(expired.reusable, false)
    assert.equal(
      viatorCacheVerdict({ evidenceMode: 'content_preview', ttlSeconds: 3601, retrievedAt: RETRIEVED, nowMs: NOW }).reason,
      'ttl_exceeds_3600',
    )
    const live = viatorCacheVerdict({ evidenceMode: 'live_check', ttlSeconds: 0, retrievedAt: RETRIEVED, nowMs: NOW })
    assert.equal(live.fresh, true)
    assert.equal(live.reusable, false)
    assert.equal(
      viatorCacheVerdict({ evidenceMode: 'live_check', ttlSeconds: 0, retrievedAt: RETRIEVED, nowMs: NOW + 1 }).reason,
      'expired',
    )
    assert.equal(
      viatorCacheVerdict({ evidenceMode: 'live_check', ttlSeconds: 60, retrievedAt: RETRIEVED, nowMs: NOW }).reason,
      'live_check_must_not_cache',
    )
    const bound = viatorContextKey({ travelDate: '2026-11-01', paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 2 }] })
    const current = viatorContextKey({ travelDate: '2026-11-02', paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 2 }] })
    assert.equal(
      viatorCacheVerdict({
        evidenceMode: 'content_preview',
        ttlSeconds: 3600,
        retrievedAt: RETRIEVED,
        nowMs: NOW,
        boundKey: bound,
        currentKey: current,
      }).reason,
      'stale_context',
    )
  })

  test('sandbox requests stay on the sandbox host and refuse booking operations', () => {
    const search = buildViatorSandboxCall('products_search', { destinationId: '732', currency: 'CHF', count: 5 })
    assert.equal(search.ok, true)
    if (!search.ok) return
    assert.equal(search.call.url, 'https://api.sandbox.viator.com/partner/products/search')
    assert.equal(search.call.url.includes('api.viator.com'), false)
    assert.equal(search.call.url.includes('?'), false)
    assert.equal(search.call.body?.includes('"currency":"CHF"'), true)
    assert.equal(search.call.body?.includes('campaign'), false)
    assert.equal(search.call.body?.includes('target-lander'), false)
    const booking = buildViatorSandboxCall('bookings_book')
    assert.equal(booking.ok, false)
    if (!booking.ok) assert.equal(booking.reason, 'forbidden_operation')
    const ingest = buildViatorSandboxCall('products_modified_since')
    assert.equal(ingest.ok, false)
    if (!ingest.ok) assert.equal(ingest.reason, 'forbidden_operation')
    const polish = buildViatorSandboxCall('products_search', { destinationId: '732', acceptLanguage: 'pl' })
    assert.equal(polish.ok, false)
    if (!polish.ok) assert.equal(polish.reason, 'invalid_language')
    const totalOnly = buildViatorSandboxCall('availability_check', { liveCheck: { participants: 2 } })
    assert.equal(totalOnly.ok, false)
    if (!totalOnly.ok) assert.equal(totalOnly.reason, 'total_is_not_age_mix')
    const detail = buildViatorSandboxCall('product_detail', { productCode: '10001P1' })
    assert.equal(detail.ok, true)
    if (detail.ok) assert.equal(detail.call.url, 'https://api.sandbox.viator.com/partner/products/10001P1')
  })
})
