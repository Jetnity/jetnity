// Server-only Viator sandbox caller.
// Host, timeout, and retry belong to this module plus lib/server/providers/core.
// The API key stays in the request closure and is not copied into results.

import 'server-only'

import {
  createProviderTransportExecutor,
  type ProviderHttpClient,
  type ProviderRateLimitPolicy,
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
import { activityZustand } from '@/lib/activities/zustand'
import { buildViatorSandboxCall, type ViatorCallZiel } from '@/lib/providers/viator/activities/request'
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
  | { ok: false; reason: ViatorSandboxBlockReason | 'network_not_authorized' | 'invalid_configuration' | 'missing_guard' | 'missing_key' | 'inactive' }

type LaufEnv = ViatorSandboxEnv & { JETNITY_ACTIVITY_AKTIV?: string }

function sandboxDarfRufen(env: LaufEnv): boolean {
  if (!activityZustand({ VERCEL_ENV: env.VERCEL_ENV, JETNITY_ACTIVITY_AKTIV: env.JETNITY_ACTIVITY_AKTIV }, true).aktiv) {
    return false
  }
  return viatorSandboxZugang(env).ok
}

export type ViatorVersuchSchutz = {
  pruefen(eingabe: { providerId: string; operationId: string; attempt: number }): Promise<unknown>
}

function viatorPreflight(guard: ViatorVersuchSchutz): ProviderRateLimitPolicy {
  return {
    preflight: async (input) => {
      const outcome = await guard.pruefen(input)
      if (outcome && typeof outcome === 'object' && !Array.isArray(outcome)) {
        const art = (outcome as { kind?: unknown }).kind
        if (art === 'allowed' && Object.keys(outcome).length === 1) return { kind: 'allowed' }
        const retry = (outcome as { retryAfterMs?: unknown }).retryAfterMs
        if (art === 'rate_limited' && typeof retry === 'number' && Number.isInteger(retry) && retry >= 0 && Object.keys(outcome).length === 2) {
          return { kind: 'rate_limited', retryAfterMs: retry }
        }
      }
      throw new Error('viator-guard')
    },
  }
}

export function createViatorSandboxClient(options: {
  env: ViatorSandboxEnv
  umgebungLesen?: () => ViatorSandboxEnv
  http?: ProviderHttpClient
  nowMs?: number
}): Created {
  const lesen = options.umgebungLesen ?? (() => options.env)
  const env = lesen()
  const zugang = viatorSandboxZugang(env)
  if (!zugang.ok) return zugang
  if (!options.http) return { ok: false, reason: 'network_not_authorized' }
  const key = env.VIATOR_SANDBOX_API_KEY
  if (!key) return { ok: false, reason: 'missing_key' }
  return viatorClientBauen({
    ziel: 'sandbox',
    credential: key,
    http: options.http,
    nowMs: options.nowMs,
    guard: null,
    umgebungLesen: lesen,
  })
}

export function createViatorProductionTestClient(options: {
  credential: string
  http?: ProviderHttpClient
  nowMs?: number
  guard?: ViatorVersuchSchutz | null
  aktiv?: () => boolean
}): Created {
  if (!options.http) return { ok: false, reason: 'network_not_authorized' }
  if (!options.guard) return { ok: false, reason: 'missing_guard' }
  if (typeof options.aktiv !== 'function') return { ok: false, reason: 'inactive' }
  return viatorClientBauen({
    ziel: 'production',
    credential: options.credential,
    http: options.http,
    nowMs: options.nowMs,
    guard: options.guard,
    aktiv: options.aktiv,
  })
}

function viatorClientBauen(options: {
  ziel: ViatorCallZiel
  credential: string
  http: ProviderHttpClient
  nowMs?: number
  guard: ViatorVersuchSchutz | null
  umgebungLesen?: () => LaufEnv
  aktiv?: () => boolean
}): Created {
  if (options.ziel === 'production' && !options.guard) return { ok: false, reason: 'missing_guard' }
  if (options.ziel === 'production' && typeof options.aktiv !== 'function') return { ok: false, reason: 'inactive' }
  const key = options.credential
  if (!/^[A-Za-z0-9-]{8,256}$/.test(key)) return { ok: false, reason: 'missing_key' }
  const rateLimit = options.guard ? viatorPreflight(options.guard) : undefined
  const darfRufen = (): boolean => {
    if (options.ziel === 'production') return options.aktiv!()
    return sandboxDarfRufen(options.umgebungLesen?.() ?? {})
  }
  const http: ProviderHttpClient = async (request) => {
    let erlaubt = false
    try {
      erlaubt = darfRufen()
    } catch {
      throw new Error('viator-activation')
    }
    if (!erlaubt) throw new Error('viator-activation')
    return options.http(request)
  }

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
    http,
    timeout: { timeoutMs: VIATOR_REQUEST_TIMEOUT_MS },
    retry: wiederholung,
    rateLimit,
  })
  const ziele = createProviderTransportExecutor({
    http,
    timeout: { timeoutMs: VIATOR_REQUEST_TIMEOUT_MS },
    retry: wiederholung,
    maxBodyBytes: VIATOR_ZIEL_BODY_BYTES,
    rateLimit,
  })
  if (!standard.ok || !ziele.ok) return { ok: false, reason: 'invalid_configuration' }

  const nowMs = () => (options.nowMs == null ? Date.now() : options.nowMs)

  const execute = async (operation: string, input: Parameters<typeof buildViatorSandboxCall>[1]) => {
    let erlaubt = false
    try {
      erlaubt = darfRufen()
    } catch {
      return { ok: false as const, reason: 'disabled' }
    }
    if (!erlaubt) return { ok: false as const, reason: 'disabled' }
    const built = buildViatorSandboxCall(operation, input, options.ziel)
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
