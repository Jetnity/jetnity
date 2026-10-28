import { viatorCacheVerdict } from '@/lib/providers/viator/activities/cache'
import {
  VIATOR_NORMALIZED_SCHEMA,
  isViatorAgeBand,
  type ViatorParseFailure,
  type ViatorScheduleBandPrice,
  type ViatorScheduleHint,
  type ViatorScheduleOption,
  type ViatorScheduleSeason,
} from '@/lib/providers/viator/activities/contracts'
import { asRecord, calendarDate, clockTime } from '@/lib/providers/viator/activities/guard'
import { readViatorCurrency, readViatorCustomerPrice } from '@/lib/providers/viator/activities/money'

const PRODUCT_CODE = /^[A-Za-z0-9]{2,30}$/
const OPTION_CODE = /^[A-Za-z0-9_-]{1,40}$/
const DAYS = new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])

export type ViatorScheduleContext = {
  retrievedAt: string | null
  nowMs: number
  ttlSeconds?: number
}

function readSeason(value: unknown): { season: ViatorScheduleSeason; partial: boolean } | null {
  const record = asRecord(value)
  if (!record) return null
  const startDate = calendarDate(record.startDate)
  if (!startDate) return null
  const endDate = record.endDate == null ? null : calendarDate(record.endDate)
  if (record.endDate != null && endDate == null) return null
  if (endDate && endDate < startDate) return null
  let partial = false
  const startTimes: string[] = []
  const timedEntries: Array<{ startTime: string; unavailableDates: string[]; daysOfWeek: string[] }> = []
  const unavailableDates: string[] = []
  const daysOfWeek: string[] = []
  if (Array.isArray(record.pricingRecords)) {
    for (const pricingRecord of record.pricingRecords) {
      const pricing = asRecord(pricingRecord)
      if (!pricing) {
        partial = true
        continue
      }
      const tage: string[] = []
      if (Array.isArray(pricing.daysOfWeek)) {
        for (const day of pricing.daysOfWeek) {
          if (typeof day === 'string' && DAYS.has(day) && !tage.includes(day)) tage.push(day)
          else partial = true
        }
      }
      for (const tag of tage) {
        if (!daysOfWeek.includes(tag)) daysOfWeek.push(tag)
      }
      if (Array.isArray(pricing.timedEntries)) {
        for (const entry of pricing.timedEntries) {
          const timed = asRecord(entry)
          const startTime = clockTime(timed?.startTime)
          if (!startTime) {
            partial = true
            continue
          }
          if (!startTimes.includes(startTime)) startTimes.push(startTime)
          const eigene: string[] = []
          if (Array.isArray(timed?.unavailableDates)) {
            for (const unavailable of timed.unavailableDates) {
              const item = asRecord(unavailable)
              const date = calendarDate(item?.date)
              if (!date) {
                partial = true
                continue
              }
              if (eigene.length < 100 && !eigene.includes(date)) eigene.push(date)
              if (unavailableDates.length < 100 && !unavailableDates.includes(date)) unavailableDates.push(date)
            }
          }
          timedEntries.push({ startTime, unavailableDates: eigene, daysOfWeek: tage })
        }
      }
    }
  }
  return { season: { startDate, endDate, daysOfWeek, startTimes, unavailableDates, timedEntries }, partial }
}

function readAgeBandPrices(
  seasons: unknown,
  currency: ViatorScheduleHint['supplierCurrency'],
): { prices: ViatorScheduleBandPrice[]; partial: boolean } {
  if (!currency || !Array.isArray(seasons)) return { prices: [], partial: false }
  const prices: ViatorScheduleBandPrice[] = []
  let partial = false
  for (const season of seasons) {
    const seasonRecord = asRecord(season)
    if (!seasonRecord || !Array.isArray(seasonRecord.pricingRecords)) continue
    for (const pricingRecord of seasonRecord.pricingRecords) {
      const pricing = asRecord(pricingRecord)
      if (!pricing || !Array.isArray(pricing.pricingDetails)) continue
      for (const detail of pricing.pricingDetails) {
        const row = asRecord(detail)
        if (!row || typeof row.ageBand !== 'string' || !isViatorAgeBand(row.ageBand)) {
          partial = true
          continue
        }
        if (prices.some((item) => item.ageBand === row.ageBand)) continue
        const price = asRecord(asRecord(row.price)?.original)
        const read = readViatorCustomerPrice({
          amount: price?.recommendedRetailPrice,
          currency,
          priceRole: 'rrp_schedule',
          supplierCurrency: currency,
        })
        if (!read) {
          partial = true
          continue
        }
        prices.push({ ageBand: row.ageBand, price: read })
      }
    }
  }
  return { prices, partial }
}

function readOption(value: unknown, currency: ViatorScheduleHint['supplierCurrency']): { option: ViatorScheduleOption; partial: boolean } | null {
  const record = asRecord(value)
  if (!record || typeof record.productOptionCode !== 'string' || !OPTION_CODE.test(record.productOptionCode)) return null
  const seasons: ViatorScheduleSeason[] = []
  let partial = false
  if (Array.isArray(record.seasons)) {
    for (const season of record.seasons) {
      const read = readSeason(season)
      if (!read) {
        partial = true
        continue
      }
      if (read.partial) partial = true
      seasons.push(read.season)
    }
  }
  const prices = readAgeBandPrices(record.seasons, currency)
  if (prices.partial) partial = true
  return {
    option: { productOptionCode: record.productOptionCode, seasons, ageBandPrices: prices.prices },
    partial,
  }
}

/**
 * Schedule payloads are supplier-currency hints. They never become a live
 * availability claim, even when a date is absent from unavailableDates.
 */
export function parseViatorSchedule(
  body: unknown,
  context: ViatorScheduleContext,
): { ok: true; value: ViatorScheduleHint } | ViatorParseFailure {
  const record = asRecord(body)
  if (!record || typeof record.productCode !== 'string' || !PRODUCT_CODE.test(record.productCode)) {
    return { ok: false, reason: 'malformed_response' }
  }
  const supplierCurrency = readViatorCurrency(record.currency)
  const summary = asRecord(record.summary)
  const fromPrice = supplierCurrency
    ? readViatorCustomerPrice({
        amount: summary?.fromPrice,
        currency: supplierCurrency,
        priceRole: 'rrp_schedule',
        supplierCurrency,
      })
    : null
  const options: ViatorScheduleOption[] = []
  let partial = false
  if (Array.isArray(record.bookableItems)) {
    for (const item of record.bookableItems) {
      const read = readOption(item, supplierCurrency)
      if (!read) {
        partial = true
        continue
      }
      if (read.partial) partial = true
      options.push(read.option)
    }
  } else if (record.bookableItems != null) {
    partial = true
  }
  const ttlSeconds = context.ttlSeconds ?? 3600
  return {
    ok: true,
    value: {
      schema: VIATOR_NORMALIZED_SCHEMA,
      evidenceMode: 'schedule_hint',
      availabilityClaim: false,
      productCode: record.productCode,
      supplierCurrency,
      fromPrice,
      options,
      retrievedAt: context.retrievedAt,
      cache: viatorCacheVerdict({
        evidenceMode: 'schedule_hint',
        ttlSeconds,
        retrievedAt: context.retrievedAt,
        nowMs: context.nowMs,
      }),
      partial,
      uniqueContentOmitted: true,
    },
  }
}
