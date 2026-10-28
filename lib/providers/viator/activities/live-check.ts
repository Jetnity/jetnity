import { ageBandName, paxMatchesAgeBands, readViatorAgeBands } from '@/lib/providers/viator/activities/age'
import { viatorCacheVerdict } from '@/lib/providers/viator/activities/cache'
import {
  VIATOR_LIVE_CHECK_CACHE_SECONDS,
  VIATOR_NORMALIZED_SCHEMA,
  type ViatorLiveCheck,
  type ViatorLiveCheckRequest,
  type ViatorParseFailure,
  type ViatorPaxMixItem,
} from '@/lib/providers/viator/activities/contracts'
import { asRecord, calendarDate, clockTime } from '@/lib/providers/viator/activities/guard'
import { readViatorCurrency, readViatorCustomerPrice } from '@/lib/providers/viator/activities/money'

const PRODUCT_CODE = /^[A-Za-z0-9]{2,30}$/
const OPTION_CODE = /^[A-Za-z0-9_-]{1,40}$/

export type ViatorLiveCheckFailure = { ok: false; reason: string }

export function validateViatorLiveCheckRequest(raw: unknown): { ok: true; value: ViatorLiveCheckRequest } | ViatorLiveCheckFailure {
  const record = asRecord(raw)
  if (!record) return { ok: false, reason: 'malformed_request' }
  if (record.paxMix == null && typeof record.participants === 'number') {
    return { ok: false, reason: 'total_is_not_age_mix' }
  }
  if (typeof record.productCode !== 'string' || !PRODUCT_CODE.test(record.productCode)) {
    return { ok: false, reason: 'missing_product' }
  }
  if (typeof record.productOptionCode !== 'string' || !OPTION_CODE.test(record.productOptionCode)) {
    return { ok: false, reason: 'missing_option' }
  }
  const travelDate = calendarDate(record.travelDate)
  if (!travelDate) return { ok: false, reason: 'missing_date' }
  if (!Array.isArray(record.paxMix) || record.paxMix.length === 0 || record.paxMix.length > 6) {
    return { ok: false, reason: 'missing_pax_mix' }
  }

  const paxMix: ViatorPaxMixItem[] = []
  for (const item of record.paxMix) {
    const row = asRecord(item)
    if (!row || typeof row.ageBand !== 'string') return { ok: false, reason: 'unknown_age_band' }
    const ageBand = ageBandName(row.ageBand)
    if (!ageBand) return { ok: false, reason: 'unknown_age_band' }
    if (typeof row.numberOfTravelers !== 'number' || !Number.isInteger(row.numberOfTravelers) || row.numberOfTravelers < 1 || row.numberOfTravelers > 15) {
      return { ok: false, reason: 'traveler_count' }
    }
    if (paxMix.some((existing) => existing.ageBand === ageBand)) return { ok: false, reason: 'duplicate_age_band' }
    paxMix.push({ ageBand, numberOfTravelers: row.numberOfTravelers })
  }
  const total = paxMix.reduce((sum, item) => sum + item.numberOfTravelers, 0)
  if (total < 1 || total > 20) return { ok: false, reason: 'traveler_count' }

  if (record.productAgeBands == null) return { ok: false, reason: 'missing_product_age_bands' }
  const bands = readViatorAgeBands(record.productAgeBands)
  if (!bands.ok) return { ok: false, reason: bands.reason }
  const matched = paxMatchesAgeBands(paxMix, bands.bands)
  if (!matched.ok) return matched

  const startTimeRequired = record.startTimeRequired === true
  const startTime = record.startTime == null ? null : clockTime(record.startTime)
  if (record.startTime != null && startTime == null) return { ok: false, reason: 'invalid_start_time' }
  if (startTimeRequired && startTime == null) return { ok: false, reason: 'missing_start_time' }

  const currency = record.currency == null ? null : readViatorCurrency(record.currency)
  if (record.currency != null && currency == null) return { ok: false, reason: 'unknown_currency' }

  return {
    ok: true,
    value: {
      productCode: record.productCode,
      productOptionCode: record.productOptionCode,
      travelDate,
      paxMix,
      currency,
      startTime,
      productAgeBands: bands.bands,
    },
  }
}

function recommendedRetail(value: unknown): number | null {
  const total = asRecord(value)
  const price = asRecord(total?.price)
  return typeof price?.recommendedRetailPrice === 'number' ? price.recommendedRetailPrice : null
}

export function parseViatorAvailabilityCheck(
  body: unknown,
  request: ViatorLiveCheckRequest,
  context: { retrievedAt: string; nowMs: number; ttlSeconds?: number },
): { ok: true; value: ViatorLiveCheck } | ViatorParseFailure {
  const record = asRecord(body)
  if (!record || !Array.isArray(record.bookableItems)) return { ok: false, reason: 'malformed_response' }
  if (record.productCode !== request.productCode) return { ok: false, reason: 'malformed_response' }
  if (record.travelDate !== request.travelDate) return { ok: false, reason: 'malformed_response' }
  const responseCurrency = readViatorCurrency(record.currency)

  const matches = record.bookableItems.map(asRecord).filter((candidate) => {
    if (!candidate || candidate.productOptionCode !== request.productOptionCode) return false
    if (typeof candidate.available !== 'boolean') return false
    if (request.startTime == null) return true
    return candidate.startTime === request.startTime
  })
  if (matches.length !== 1) return { ok: false, reason: 'malformed_response' }
  const item = matches[0]!
  if (typeof item.available !== 'boolean') return { ok: false, reason: 'malformed_response' }
  const available = item.available

  const pricing =
    responseCurrency == null
      ? null
      : readViatorCustomerPrice({
          amount: recommendedRetail(item.totalPrice),
          currency: responseCurrency,
          priceRole: 'rrp_check',
          supplierCurrency: responseCurrency,
        })

  const ttlSeconds = context.ttlSeconds ?? VIATOR_LIVE_CHECK_CACHE_SECONDS
  return {
    ok: true,
    value: {
      schema: VIATOR_NORMALIZED_SCHEMA,
      evidenceMode: 'live_check',
      availabilityClaim: true,
      productCode: request.productCode,
      productOptionCode: request.productOptionCode,
      travelDate: request.travelDate,
      startTime: request.startTime,
      available,
      pricing,
      quoteComplete: available === false || pricing != null,
      paxMix: request.paxMix,
      retrievedAt: context.retrievedAt,
      cache: viatorCacheVerdict({
        evidenceMode: 'live_check',
        ttlSeconds,
        retrievedAt: context.retrievedAt,
        nowMs: context.nowMs,
        boundKey: request.productOptionCode + request.travelDate,
        currentKey: request.productOptionCode + request.travelDate,
      }),
      checkoutCurrencyConfirmed: false,
    },
  }
}
