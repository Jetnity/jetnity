import { readViatorAgeBands } from '@/lib/providers/viator/activities/age'
import { viatorCacheVerdict } from '@/lib/providers/viator/activities/cache'
import {
  VIATOR_NORMALIZED_SCHEMA,
  type ViatorAffiliateRedirect,
  type ViatorAgeBandRule,
  type ViatorCancellation,
  type ViatorContentPreview,
  type ViatorContentProduct,
  type ViatorImage,
  type ViatorParseFailure,
  type ViatorPrice,
} from '@/lib/providers/viator/activities/contracts'
import { readViatorAffiliateRedirect } from '@/lib/providers/viator/activities/affiliate'
import { asRecord } from '@/lib/providers/viator/activities/guard'
import { readViatorCurrency, readViatorCustomerPrice } from '@/lib/providers/viator/activities/money'
import { istViatorProduktcode } from '@/lib/providers/viator/activities/produktcode'
import { readViatorDescription, readViatorTitle } from '@/lib/providers/viator/activities/text'
import { validateViatorImageUrl } from '@/lib/providers/viator/activities/url'

const OPTION_CODE = /^[A-Za-z0-9_-]{1,40}$/
const DESTINATION_REF = /^[1-9]\d{0,9}$/
const FLAG = /^[A-Z][A-Z0-9_]{0,39}$/

export type ViatorContentSource = 'provider_response' | 'fixture'

export type ViatorContentContext = {
  source: ViatorContentSource
  retrievedAt: string | null
  nowMs: number
  ttlSeconds?: number
}

type ProductRead = { product: ViatorContentProduct; redirect: ViatorAffiliateRedirect | null; partial: boolean } | null

function positiveInt(value: unknown, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > max) return null
  return value
}

function readImage(value: unknown): ViatorImage | null {
  if (!Array.isArray(value)) return null
  const ranked: Array<ViatorImage & { area: number }> = []
  for (const image of value) {
    const record = asRecord(image)
    if (!record || !Array.isArray(record.variants)) continue
    const isCover = record.isCover === true
    for (const variant of record.variants) {
      const item = asRecord(variant)
      if (!item) continue
      const checked = validateViatorImageUrl(item.url)
      const width = positiveInt(item.width, 10_000)
      const height = positiveInt(item.height, 10_000)
      if (!checked.ok || width == null || height == null) continue
      ranked.push({
        url: checked.url,
        width,
        height,
        isCover,
        imageLicenseConfirmed: false,
        area: width * height,
      })
    }
  }
  const covers = ranked.filter((item) => item.isCover)
  const pool = covers.length > 0 ? covers : ranked
  pool.sort((left, right) => right.area - left.area)
  const best = pool[0]
  if (!best) return null
  return {
    url: best.url,
    width: best.width,
    height: best.height,
    isCover: best.isCover,
    imageLicenseConfirmed: false,
  }
}

function readDestinationIds(value: unknown): { ids: string[]; primary: string | null; dropped: boolean } {
  if (value == null) return { ids: [], primary: null, dropped: false }
  if (!Array.isArray(value)) return { ids: [], primary: null, dropped: true }
  const ids: string[] = []
  const primaries: string[] = []
  let dropped = false
  for (const item of value) {
    const record = asRecord(item)
    if (!record) {
      dropped = true
      continue
    }
    const ref = typeof record.ref === 'number' && Number.isSafeInteger(record.ref) ? String(record.ref) : record.ref
    if (typeof ref !== 'string' || !DESTINATION_REF.test(ref)) {
      dropped = true
      continue
    }
    if (!ids.includes(ref)) ids.push(ref)
    if (record.primary === true && !primaries.includes(ref)) primaries.push(ref)
  }
  if (primaries.length > 1) return { ids, primary: null, dropped: true }
  return { ids, primary: primaries[0] ?? null, dropped }
}

function readFlags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const flags: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && FLAG.test(item) && !flags.includes(item) && flags.length < 20) flags.push(item)
  }
  return flags
}

function readReviewSummary(value: unknown): ViatorContentProduct['reviewSummary'] {
  const record = asRecord(value)
  if (!record) return null
  const average = record.combinedAverageRating
  const total = record.totalReviews
  const combinedAverage =
    typeof average === 'number' && Number.isFinite(average) && average >= 0 && average <= 5 ? average : null
  const totalReviews =
    typeof total === 'number' && Number.isInteger(total) && total >= 0 && total <= 10_000_000 ? total : null
  if (combinedAverage == null && totalReviews == null) return null
  return { combinedAverage, totalReviews }
}

function readDuration(value: unknown): number | null {
  const record = asRecord(value)
  if (!record) return null
  return positiveInt(record.fixedDurationInMinutes, 10_080)
}

function readCancellation(value: unknown): ViatorCancellation {
  const record = asRecord(value)
  if (record?.type === 'ALL_SALES_FINAL') return { policyType: 'ALL_SALES_FINAL', stornierbar: false }
  if (record?.type === 'STANDARD' || record?.type === 'CUSTOM') {
    return { policyType: record.type, stornierbar: null }
  }
  return { policyType: 'unknown', stornierbar: null }
}

function readOptionCodes(value: unknown): {
  codes: string[]
  options: Array<{ code: string; title: string }>
  partial: boolean
  unaufgeloest: boolean
} {
  if (value == null) return { codes: [], options: [], partial: false, unaufgeloest: false }
  if (!Array.isArray(value)) return { codes: [], options: [], partial: true, unaufgeloest: true }
  const codes: string[] = []
  const options: Array<{ code: string; title: string }> = []
  let partial = false
  let unaufgeloest = false
  for (const item of value) {
    const record = asRecord(item)
    const code = record?.productOptionCode
    if (typeof code !== 'string' || !OPTION_CODE.test(code)) {
      partial = true
      unaufgeloest = true
      continue
    }
    if (codes.includes(code)) continue
    const title = readViatorTitle(record?.title)
    if (!title) {
      partial = true
      unaufgeloest = true
      continue
    }
    codes.push(code)
    options.push({ code, title })
  }
  return { codes, options, partial, unaufgeloest }
}

function readFromPrice(pricing: unknown): ViatorPrice | null {
  const record = asRecord(pricing)
  if (!record) return null
  const summary = asRecord(record.summary)
  const currency = readViatorCurrency(record.currency)
  if (!summary || !currency) return null
  return readViatorCustomerPrice({
    amount: summary.fromPrice,
    currency,
    priceRole: 'rrp_from',
    supplierCurrency: currency,
  })
}

function readAgeBands(value: unknown): { bands: ViatorAgeBandRule[]; partial: boolean } {
  const pricing = asRecord(value)
  if (!pricing || pricing.ageBands == null) return { bands: [], partial: false }
  const read = readViatorAgeBands(pricing.ageBands)
  if (!read.ok) return { bands: [], partial: true }
  return { bands: read.bands, partial: false }
}

function readProduct(value: unknown, source: ViatorContentSource): ProductRead {
  const record = asRecord(value)
  if (!record || typeof record.productCode !== 'string' || !istViatorProduktcode(record.productCode)) return null
  const title = readViatorTitle(record.title)
  if (!title) return null
  const destinations = readDestinationIds(record.destinations)
  const options = readOptionCodes(record.productOptions)
  const ages = readAgeBands(record.pricingInfo)
  const redirect = readViatorAffiliateRedirect({
    source,
    productCode: record.productCode,
    productUrl: record.productUrl,
  })
  return {
    product: {
      productCode: record.productCode,
      title,
      description: readViatorDescription(record.description),
      destinationIds: destinations.ids,
      primaryDestinationId: destinations.primary,
      durationMinutes: readDuration(record.duration),
      pricing: readFromPrice(record.pricing),
      reviewSummary: readReviewSummary(record.reviews),
      image: readImage(record.images),
      productOptionCodes: options.codes,
      productOptions: options.options,
      optionenUnaufgeloest: options.unaufgeloest,
      ageBands: ages.bands,
      cancellation: readCancellation(record.cancellationPolicy),
      flags: readFlags(record.flags),
    },
    redirect,
    partial: destinations.dropped || options.partial || ages.partial,
  }
}

function finish(products: ViatorContentProduct[], redirects: ViatorAffiliateRedirect[], partial: boolean, context: ViatorContentContext): ViatorContentPreview {
  const fixture = context.source === 'fixture'
  const ttlSeconds = context.ttlSeconds ?? 3600
  return {
    schema: VIATOR_NORMALIZED_SCHEMA,
    evidenceMode: fixture ? 'fixture' : 'content_preview',
    availabilityClaim: false,
    affiliateStatus: 'absent',
    retrievedAt: fixture ? null : context.retrievedAt,
    cache: viatorCacheVerdict({
      evidenceMode: fixture ? 'fixture' : 'content_preview',
      ttlSeconds,
      retrievedAt: fixture ? null : context.retrievedAt,
      nowMs: context.nowMs,
    }),
    products,
    affiliateRedirects: fixture ? [] : redirects,
    partial,
    uniqueContentOmitted: true,
    contentLicenseReviewed: false,
  }
}

export function parseViatorSearch(
  body: unknown,
  context: ViatorContentContext,
): { ok: true; value: ViatorContentPreview } | ViatorParseFailure {
  const record = asRecord(body)
  if (!record || !Array.isArray(record.products)) return { ok: false, reason: 'malformed_response' }
  const products: ViatorContentProduct[] = []
  const redirects: ViatorAffiliateRedirect[] = []
  const seen = new Set<string>()
  let partial = false
  for (const item of record.products) {
    const read = readProduct(item, context.source)
    if (!read) {
      partial = true
      continue
    }
    if (seen.has(read.product.productCode)) {
      partial = true
      continue
    }
    seen.add(read.product.productCode)
    if (read.partial) partial = true
    products.push(read.product)
    if (read.redirect) redirects.push(read.redirect)
  }
  return { ok: true, value: finish(products, redirects, partial, context) }
}

export function parseViatorProductDetail(
  body: unknown,
  context: ViatorContentContext,
): { ok: true; value: ViatorContentPreview } | ViatorParseFailure {
  const record = asRecord(body)
  if (!record || Array.isArray(record.products)) return { ok: false, reason: 'malformed_response' }
  if (typeof record.productCode !== 'string') return { ok: false, reason: 'malformed_response' }
  const read = readProduct(record, context.source)
  if (!read) return { ok: true, value: finish([], [], true, context) }
  return { ok: true, value: finish([read.product], read.redirect ? [read.redirect] : [], read.partial, context) }
}

export function parseViatorFixture(body: unknown, nowMs: number): { ok: true; value: ViatorContentPreview } | ViatorParseFailure {
  const context: ViatorContentContext = { source: 'fixture', retrievedAt: null, nowMs, ttlSeconds: 3600 }
  const record = asRecord(body)
  if (record && Array.isArray(record.products)) return parseViatorSearch(body, context)
  return parseViatorProductDetail(body, context)
}
