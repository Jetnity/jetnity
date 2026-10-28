import {
  VIATOR_FORBIDDEN_OPERATIONS,
  VIATOR_OPERATIONS,
  VIATOR_SANDBOX_ORIGIN,
  isViatorAcceptLanguage,
  isViatorSearchCurrency,
  type ViatorAcceptLanguage,
  type ViatorOperation,
  type ViatorSearchCurrency,
} from '@/lib/providers/viator/activities/contracts'
import { validateViatorLiveCheckRequest, type ViatorLiveCheckFailure } from '@/lib/providers/viator/activities/live-check'

const PRODUCT_CODE = /^[A-Za-z0-9]{2,30}$/

export type ViatorSandboxCall = {
  operation: ViatorOperation
  method: 'GET' | 'POST'
  url: string
  body: string | null
  acceptLanguage: ViatorAcceptLanguage
}

export type ViatorSandboxCallResult = { ok: true; call: ViatorSandboxCall } | ViatorLiveCheckFailure

function languageOf(value: string | undefined): ViatorAcceptLanguage | null {
  const language = value ?? 'en-US'
  return isViatorAcceptLanguage(language) ? language : null
}

function sandboxUrl(path: string): string {
  return `${VIATOR_SANDBOX_ORIGIN}${path}`
}

export function buildViatorSandboxCall(
  operation: string,
  input: {
    acceptLanguage?: string
    destinationId?: string
    currency?: string | null
    start?: number
    count?: number
    productCode?: string
    liveCheck?: unknown
  } = {},
): ViatorSandboxCallResult {
  if ((VIATOR_FORBIDDEN_OPERATIONS as readonly string[]).includes(operation) || !(VIATOR_OPERATIONS as readonly string[]).includes(operation)) {
    return { ok: false, reason: 'forbidden_operation' }
  }
  const acceptLanguage = languageOf(input.acceptLanguage)
  if (!acceptLanguage) return { ok: false, reason: 'invalid_language' }

  if (operation === 'products_search') {
    if (typeof input.destinationId !== 'string' || !/^[1-9]\d{0,9}$/.test(input.destinationId)) {
      return { ok: false, reason: 'unmapped_destination' }
    }
    const start = input.start ?? 1
    const count = input.count ?? 5
    if (!Number.isInteger(start) || start < 1 || start > 1000) return { ok: false, reason: 'invalid_pagination' }
    if (!Number.isInteger(count) || count < 1 || count > 20) return { ok: false, reason: 'invalid_pagination' }
    let currency: ViatorSearchCurrency | null = null
    if (input.currency != null) {
      if (!isViatorSearchCurrency(input.currency)) return { ok: false, reason: 'unknown_currency' }
      currency = input.currency
    }
    const payload: {
      filtering: { destination: string }
      pagination: { start: number; count: number }
      currency?: ViatorSearchCurrency
    } = {
      filtering: { destination: input.destinationId },
      pagination: { start, count },
    }
    if (currency) payload.currency = currency
    return {
      ok: true,
      call: {
        operation,
        method: 'POST',
        url: sandboxUrl('/partner/products/search'),
        body: JSON.stringify(payload),
        acceptLanguage,
      },
    }
  }

  if (operation === 'product_detail' || operation === 'availability_schedule') {
    if (typeof input.productCode !== 'string' || !PRODUCT_CODE.test(input.productCode)) {
      return { ok: false, reason: 'missing_product' }
    }
    const path =
      operation === 'product_detail'
        ? `/partner/products/${input.productCode}`
        : `/partner/availability/schedules/${input.productCode}`
    return {
      ok: true,
      call: {
        operation,
        method: 'GET',
        url: sandboxUrl(path),
        body: null,
        acceptLanguage,
      },
    }
  }

  const live = validateViatorLiveCheckRequest(input.liveCheck)
  if (!live.ok) return live
  const payload: {
    productCode: string
    productOptionCode: string
    travelDate: string
    paxMix: ViatorLiveCheckRequestPax[]
    currency?: ViatorSearchCurrency
    startTime?: string
  } = {
    productCode: live.value.productCode,
    productOptionCode: live.value.productOptionCode,
    travelDate: live.value.travelDate,
    paxMix: live.value.paxMix.map((item) => ({ ageBand: item.ageBand, numberOfTravelers: item.numberOfTravelers })),
  }
  if (live.value.currency) payload.currency = live.value.currency
  if (live.value.startTime) payload.startTime = live.value.startTime
  return {
    ok: true,
    call: {
      operation: 'availability_check',
      method: 'POST',
      url: sandboxUrl('/partner/availability/check'),
      body: JSON.stringify(payload),
      acceptLanguage,
    },
  }
}

type ViatorLiveCheckRequestPax = { ageBand: string; numberOfTravelers: number }
