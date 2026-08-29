// lib/server/providers/core/domain.ts
//
// Provider-neutral server transport domain.
// Trust is a module/code-path boundary. These types mint no Commercial
// Provenance and expose no caller-controlled trust flags.

import 'server-only'

export const PROVIDER_TRANSPORT_ERROR_KINDS = [
  'invalid_request',
  'invalid_configuration',
  'authentication',
  'authorization',
  'rate_limited',
  'timeout',
  'aborted',
  'network_error',
  'provider_4xx',
  'provider_5xx',
  'malformed_response',
  'retry_exhausted',
] as const

export type ProviderTransportErrorKind = (typeof PROVIDER_TRANSPORT_ERROR_KINDS)[number]

export const PROVIDER_TRANSPORT_EVENT_NAMES = [
  'request_started',
  'request_succeeded',
  'request_failed',
  'request_retry_scheduled',
  'request_rate_limited',
  'request_timeout',
] as const

export type ProviderTransportEventName = (typeof PROVIDER_TRANSPORT_EVENT_NAMES)[number]

export const PROVIDER_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const
export type ProviderHttpMethod = (typeof PROVIDER_HTTP_METHODS)[number]

export const PROVIDER_TRANSPORT_BOUNDS = {
  minAttempts: 1,
  maxAttempts: 8,
  minTimeoutMs: 1,
  maxTimeoutMs: 120_000,
  minDelayMs: 0,
  maxDelayMs: 60_000,
  maxRetryAfterMs: 60_000,
  defaultMaxBodyBytes: 1_048_576,
  maxBodyBytes: 2_097_152,
  maxIdLength: 64,
  maxCorrelationIdLength: 128,
  maxHeaderNameLength: 128,
} as const

export type ProviderTransportUrl = {
  origin: string
  path: string
}

export type ProviderSanitizedRequestMetadata = {
  providerId: string
  operationId: string
  method: ProviderHttpMethod
  url: ProviderTransportUrl
  attempt: number
  maxAttempts: number
  correlationId: string | null
}

export type ProviderTransportResponseMetadata = {
  providerId: string
  operationId: string
  method: ProviderHttpMethod
  url: ProviderTransportUrl
  status: number
  attempt: number
  elapsedMs: number
  correlationId: string | null
}

export type ProviderTransportError = {
  kind: ProviderTransportErrorKind
  causeKind: ProviderTransportErrorKind | null
  message: string
  status: number | null
  attempt: number
  providerId: string
  operationId: string
  correlationId: string | null
}

export type ProviderTimeoutPolicy = {
  timeoutMs: number
}

export type ProviderJitterStrategy = 'none' | 'full' | 'equal'

export type ProviderRetryPolicy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitter?: ProviderJitterStrategy
  retryOn429?: boolean
  retry5xx?: boolean
  retryNetworkErrors?: boolean
  honorRetryAfter?: boolean
  maxRetryAfterMs?: number
  retryableStatuses?: readonly number[]
}

export type ProviderValidatedRetryPolicy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitter: ProviderJitterStrategy
  retryOn429: boolean
  retry5xx: boolean
  retryNetworkErrors: boolean
  honorRetryAfter: boolean
  maxRetryAfterMs: number
  retryableStatuses: ReadonlySet<number>
}

export type ProviderRateLimitOutcome =
  | { kind: 'allowed' }
  | { kind: 'rate_limited'; retryAfterMs: number | null }

export type ProviderRateLimitPolicy = {
  retryOn429?: boolean
  honorRetryAfter?: boolean
  maxRetryAfterMs?: number
  preflight?: (input: {
    providerId: string
    operationId: string
    attempt: number
  }) => Promise<ProviderRateLimitOutcome>
}

export type ProviderParseStrategy = 'json' | 'text' | 'none'

export const PROVIDER_TRANSPORT_EVENT_FIELDS = [
  'name',
  'providerId',
  'operationId',
  'method',
  'origin',
  'path',
  'attempt',
  'maxAttempts',
  'status',
  'elapsedMs',
  'errorKind',
  'causeKind',
  'retryAfterMs',
  'delayMs',
  'correlationId',
  'recordedAt',
] as const

export type ProviderTransportEvent = {
  name: ProviderTransportEventName
  providerId: string
  operationId: string
  method: ProviderHttpMethod
  origin: string
  path: string
  attempt: number
  maxAttempts: number
  status: number | null
  elapsedMs: number
  errorKind: ProviderTransportErrorKind | null
  causeKind: ProviderTransportErrorKind | null
  retryAfterMs: number | null
  delayMs: number | null
  correlationId: string | null
  recordedAt: string
}

export type ProviderTransportObserver = {
  record(event: ProviderTransportEvent): void
}

export type ProviderClock = () => number
export type ProviderSleeper = (ms: number, signal?: AbortSignal) => Promise<void>
export type ProviderRandom = () => number
export type ProviderTimeoutScheduler = (abort: () => void, timeoutMs: number) => () => void

export type ProviderTransportSuccess<T> = {
  ok: true
  value: T
  metadata: ProviderTransportResponseMetadata
}

export type ProviderTransportFailure = {
  ok: false
  error: ProviderTransportError
}

export type ProviderTransportResult<T> = ProviderTransportSuccess<T> | ProviderTransportFailure

export type ProviderHeaderInput = {
  publicHeaders?: Record<string, string>
  secretHeaders?: Record<string, string>
  additionalSensitiveHeaderNames?: readonly string[]
}

export type ProviderHttpRequest = {
  url: string
  method: ProviderHttpMethod
  headers: Record<string, string>
  body?: string
  signal: AbortSignal
}

export type ProviderHttpResponse = {
  status: number
  headers: { get(name: string): string | null }
  body: ReadableStream<Uint8Array> | null
}

export type ProviderHttpClient = (request: ProviderHttpRequest) => Promise<ProviderHttpResponse>

export function istProviderTransportErrorKind(wert: string): wert is ProviderTransportErrorKind {
  return (PROVIDER_TRANSPORT_ERROR_KINDS as readonly string[]).includes(wert)
}

export function istProviderHttpMethod(wert: string): wert is ProviderHttpMethod {
  return (PROVIDER_HTTP_METHODS as readonly string[]).includes(wert)
}

export function createProviderTransportError(
  teil: ProviderTransportError,
): ProviderTransportError {
  return {
    kind: teil.kind,
    causeKind: teil.causeKind,
    message: teil.message,
    status: teil.status,
    attempt: teil.attempt,
    providerId: teil.providerId,
    operationId: teil.operationId,
    correlationId: teil.correlationId,
  }
}

export function createProviderResponseMetadata(
  teil: ProviderTransportResponseMetadata,
): ProviderTransportResponseMetadata {
  return {
    providerId: teil.providerId,
    operationId: teil.operationId,
    method: teil.method,
    url: { origin: teil.url.origin, path: teil.url.path },
    status: teil.status,
    attempt: teil.attempt,
    elapsedMs: teil.elapsedMs,
    correlationId: teil.correlationId,
  }
}

export function createSanitizedRequestMetadata(
  teil: ProviderSanitizedRequestMetadata,
): ProviderSanitizedRequestMetadata {
  return {
    providerId: teil.providerId,
    operationId: teil.operationId,
    method: teil.method,
    url: { origin: teil.url.origin, path: teil.url.path },
    attempt: teil.attempt,
    maxAttempts: teil.maxAttempts,
    correlationId: teil.correlationId,
  }
}
