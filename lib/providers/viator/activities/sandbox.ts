// Server-only Viator sandbox caller.
// Host, timeout, and retry belong to this module plus lib/server/providers/core.
// The API key stays in the request closure and is not copied into results.

import 'server-only'

import {
  createProviderTransportExecutor,
  type ProviderHttpClient,
  type ProviderTransportErrorKind,
} from '@/lib/server/providers/core'
import { parseViatorProductDetail, parseViatorSearch } from '@/lib/providers/viator/activities/content'
import {
  VIATOR_ACCEPT_HEADER,
  VIATOR_API_KEY_HEADER,
  VIATOR_PROVIDER_ID,
  VIATOR_REQUEST_TIMEOUT_MS,
  type ViatorContentPreview,
  type ViatorLiveCheck,
  type ViatorScheduleHint,
} from '@/lib/providers/viator/activities/contracts'
import { viatorKatalogLesen } from '@/lib/providers/viator/activities/destination'
import { parseViatorAvailabilityCheck, validateViatorLiveCheckRequest } from '@/lib/providers/viator/activities/live-check'
import { buildViatorSandboxCall } from '@/lib/providers/viator/activities/request'
import { parseViatorSchedule } from '@/lib/providers/viator/activities/schedule'
import { viatorSandboxZugang, type ViatorSandboxBlockReason, type ViatorSandboxEnv } from '@/lib/providers/viator/activities/zugang'

export type ViatorBodyReason =
  | 'size_limit'
  | 'body_unreadable'
  | 'empty_json'
  | 'non_json_media_type'
  | 'invalid_json'
  | 'unknown'

export const VIATOR_BODY_REASONS: readonly ViatorBodyReason[] = [
  'size_limit',
  'body_unreadable',
  'empty_json',
  'non_json_media_type',
  'invalid_json',
  'unknown',
]

const VIATOR_ZIEL_BODY_BYTES = 2_097_152

const VIATOR_BODY_NACHRICHTEN: Record<string, ViatorBodyReason> = {
  'Provider response exceeded the body size limit.': 'size_limit',
  'Provider response body could not be read.': 'body_unreadable',
  'Provider JSON response was empty.': 'empty_json',
  'Provider response was not JSON.': 'non_json_media_type',
  'Provider response was not valid JSON.': 'invalid_json',
}

function viatorBodyReason(message: string): ViatorBodyReason {
  return Object.prototype.hasOwnProperty.call(VIATOR_BODY_NACHRICHTEN, message)
    ? VIATOR_BODY_NACHRICHTEN[message]!
    : 'unknown'
}

export type ViatorSandboxFailure = {
  ok: false
  reason: string
  transportKind?: ProviderTransportErrorKind
  status?: number | null
  bodyReason?: ViatorBodyReason
}

export type ViatorSandboxClient = {
  search(input: {
    destinationId: string
    currency?: string | null
    start?: number
    count?: number
    acceptLanguage?: string
  }): Promise<{ ok: true; value: ViatorContentPreview } | ViatorSandboxFailure>
  detail(input: { productCode: string; acceptLanguage?: string }): Promise<{ ok: true; value: ViatorContentPreview } | ViatorSandboxFailure>
  schedule(input: { productCode: string; acceptLanguage?: string }): Promise<{ ok: true; value: ViatorScheduleHint } | ViatorSandboxFailure>
  check(input: { liveCheck: unknown; acceptLanguage?: string }): Promise<{ ok: true; value: ViatorLiveCheck } | ViatorSandboxFailure>
  destinations(input?: { acceptLanguage?: string }): Promise<{ ok: true; katalog: import('@/lib/providers/viator/activities/destination').ViatorKatalogOrt[] } | ViatorSandboxFailure>
}

type Created =
  | { ok: true; client: ViatorSandboxClient }
  | { ok: false; reason: ViatorSandboxBlockReason | 'network_not_authorized' | 'invalid_configuration' }

export function createViatorSandboxClient(options: {
  env: ViatorSandboxEnv
  http?: ProviderHttpClient
  nowMs?: number
}): Created {
  const zugang = viatorSandboxZugang(options.env)
  if (!zugang.ok) return zugang
  if (!options.http) return { ok: false, reason: 'network_not_authorized' }
  const key = options.env.VIATOR_SANDBOX_API_KEY
  if (!key) return { ok: false, reason: 'missing_key' }

  const wiederholung = {
    maxAttempts: 1,
    baseDelayMs: 0,
    maxDelayMs: 0,
    jitter: 'none' as const,
    retryOn429: false,
    retry5xx: false,
    retryNetworkErrors: false,
  }
  const standard = createProviderTransportExecutor({
    http: options.http,
    timeout: { timeoutMs: VIATOR_REQUEST_TIMEOUT_MS },
    retry: wiederholung,
  })
  const ziele = createProviderTransportExecutor({
    http: options.http,
    timeout: { timeoutMs: VIATOR_REQUEST_TIMEOUT_MS },
    retry: wiederholung,
    maxBodyBytes: VIATOR_ZIEL_BODY_BYTES,
  })
  if (!standard.ok || !ziele.ok) return { ok: false, reason: 'invalid_configuration' }

  const nowMs = () => (options.nowMs == null ? Date.now() : options.nowMs)

  const execute = async (operation: string, input: Parameters<typeof buildViatorSandboxCall>[1]) => {
    const built = buildViatorSandboxCall(operation, input)
    if (!built.ok) return { ok: false as const, reason: built.reason }
    if (built.call.method === 'POST' && !built.call.body) return { ok: false as const, reason: 'malformed_request' }
    const gewaehlt = operation === 'destinations' ? ziele : standard
    const transport = await gewaehlt.executor.execute({
      providerId: VIATOR_PROVIDER_ID,
      operationId: built.call.operation,
      method: built.call.method,
      url: built.call.url,
      body: built.call.body,
      parse: 'json',
      headers: {
        publicHeaders: {
          accept: VIATOR_ACCEPT_HEADER,
          'accept-language': built.call.acceptLanguage,
          ...(built.call.body ? { 'content-type': 'application/json' } : {}),
        },
        secretHeaders: { [VIATOR_API_KEY_HEADER]: key },
        additionalSensitiveHeaderNames: [VIATOR_API_KEY_HEADER],
      },
    })
    if (!transport.ok) {
      const failure: ViatorSandboxFailure = {
        ok: false,
        reason: 'transport',
        transportKind: transport.error.kind,
        status: transport.error.status,
      }
      if (operation === 'destinations' && transport.error.kind === 'malformed_response') {
        failure.bodyReason = viatorBodyReason(transport.error.message)
      }
      return failure
    }
    return { ok: true as const, body: transport.value, retrievedAt: new Date(nowMs()).toISOString(), now: nowMs() }
  }

  return {
    ok: true,
    client: {
      async destinations(input: { acceptLanguage?: string } = {}) {
        const result = await execute('destinations', input)
        if (!result.ok) return result
        const katalog = viatorKatalogLesen(result.body)
        if (!katalog) return { ok: false as const, reason: 'malformed_response' }
        return { ok: true as const, katalog }
      },
      async search(input) {
        const result = await execute('products_search', input)
        if (!result.ok) return result
        const parsed = parseViatorSearch(result.body, {
          source: 'provider_response',
          retrievedAt: result.retrievedAt,
          nowMs: result.now,
        })
        return parsed.ok ? parsed : { ok: false, reason: parsed.reason }
      },
      async detail(input) {
        const result = await execute('product_detail', input)
        if (!result.ok) return result
        const parsed = parseViatorProductDetail(result.body, {
          source: 'provider_response',
          retrievedAt: result.retrievedAt,
          nowMs: result.now,
        })
        return parsed.ok ? parsed : { ok: false, reason: parsed.reason }
      },
      async schedule(input) {
        const result = await execute('availability_schedule', input)
        if (!result.ok) return result
        const parsed = parseViatorSchedule(result.body, { retrievedAt: result.retrievedAt, nowMs: result.now })
        return parsed.ok ? parsed : { ok: false, reason: parsed.reason }
      },
      async check(input) {
        const validated = validateViatorLiveCheckRequest(input.liveCheck)
        if (!validated.ok) return validated
        const result = await execute('availability_check', input)
        if (!result.ok) return result
        const parsed = parseViatorAvailabilityCheck(result.body, validated.value, {
          retrievedAt: result.retrievedAt,
          nowMs: result.now,
          ttlSeconds: 0,
        })
        return parsed.ok ? parsed : { ok: false, reason: parsed.reason }
      },
    },
  }
}
