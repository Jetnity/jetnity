// lib/server/providers/core/executor.ts
//
// Dependency-injected outbound provider HTTP executor.
// Fail closed. No Commercial Provenance. No forgeable trust flags.

import 'server-only'

import {
  createProviderResponseMetadata,
  createProviderTransportError,
  istProviderHttpMethod,
  PROVIDER_TRANSPORT_BOUNDS,
  type ProviderClock,
  type ProviderHeaderInput,
  type ProviderHttpClient,
  type ProviderHttpMethod,
  type ProviderParseStrategy,
  type ProviderRandom,
  type ProviderRateLimitOutcome,
  type ProviderRateLimitPolicy,
  type ProviderRetryPolicy,
  type ProviderSleeper,
  type ProviderTimeoutPolicy,
  type ProviderTimeoutScheduler,
  type ProviderTransportError,
  type ProviderTransportErrorKind,
  type ProviderTransportEvent,
  type ProviderTransportObserver,
  type ProviderTransportResult,
  type ProviderTransportUrl,
  type ProviderValidatedRetryPolicy,
} from '@/lib/server/providers/core/domain'
import {
  buildProviderRequestHeaders,
  isSensitiveHeaderName,
  resolveRequestIdHeaderName,
} from '@/lib/server/providers/core/headers'
import { createFetchProviderHttpClient } from '@/lib/server/providers/core/http'
import { isoFromClock, providerTransportEvent } from '@/lib/server/providers/core/observability'
import {
  cancelProviderResponseBody,
  classifyProviderHttpStatus,
  parseProviderResponseBody,
  validateMaxBodyBytes,
} from '@/lib/server/providers/core/parse'
import {
  computeProviderRetryDelayMs,
  defaultProviderSleeper,
  isAbortError,
  isRetryableHttpStatus,
  parseRetryAfterHeaderMs,
  sleepWithAbort,
  validateProviderRetryAfterMs,
  validateProviderRetryPolicy,
  validateProviderTimeoutPolicy,
} from '@/lib/server/providers/core/retry'
import {
  readSafeRequestId,
  sanitizeProviderTransportUrl,
  validateBoundedId,
  validateCorrelationId,
} from '@/lib/server/providers/core/url'

export type ProviderTransportRequest = {
  providerId: string
  operationId: string
  method: ProviderHttpMethod
  url: string
  headers?: ProviderHeaderInput
  body?: string | null
  parse?: ProviderParseStrategy
  correlationId?: string | null
  signal?: AbortSignal
}

export type ProviderTransportExecutorConfig = {
  http: ProviderHttpClient
  timeout: ProviderTimeoutPolicy
  retry: ProviderRetryPolicy
  rateLimit?: ProviderRateLimitPolicy
  observer?: ProviderTransportObserver
  clock?: ProviderClock
  sleep?: ProviderSleeper
  random?: ProviderRandom
  scheduleTimeout?: ProviderTimeoutScheduler
  maxBodyBytes?: number
  requestIdHeaderName?: string
}

export type ProviderTransportExecutor = {
  execute<T = unknown>(request: ProviderTransportRequest): Promise<ProviderTransportResult<T>>
}

export type ProviderTransportCreateResult =
  | { ok: true; executor: ProviderTransportExecutor }
  | { ok: false; error: ProviderTransportError }

type AttemptContext = {
  providerId: string
  operationId: string
  method: ProviderHttpMethod
  url: ProviderTransportUrl
  href: string
  outboundHeaders: Record<string, string>
  body?: string
  parse: ProviderParseStrategy
  correlationId: string | null
  maxAttempts: number
  timeoutMs: number
  retry: ProviderValidatedRetryPolicy
  rateLimit: ProviderRateLimitPolicy | undefined
  maxBodyBytes: number
  requestIdHeaderName: string
  externalSignal: AbortSignal | undefined
}

function validateRateLimitPolicy(
  policy: ProviderRateLimitPolicy | undefined,
): { ok: true } | { ok: false; message: string } {
  if (policy == null) return { ok: true }
  for (const key of Object.keys(policy)) {
    if (key !== 'preflight') {
      return {
        ok: false,
        message: 'Rate-limit retry fields belong on ProviderRetryPolicy, not ProviderRateLimitPolicy.',
      }
    }
  }
  if (policy.preflight != null && typeof policy.preflight !== 'function') {
    return { ok: false, message: 'Rate-limit preflight must be a function.' }
  }
  return { ok: true }
}

function configError(message: string): ProviderTransportError {
  return createProviderTransportError({
    kind: 'invalid_configuration',
    causeKind: null,
    message,
    status: null,
    attempt: 0,
    providerId: '',
    operationId: '',
    correlationId: null,
  })
}

function requestError(
  ctx: Pick<AttemptContext, 'providerId' | 'operationId' | 'correlationId'>,
  message: string,
): ProviderTransportError {
  return createProviderTransportError({
    kind: 'invalid_request',
    causeKind: null,
    message,
    status: null,
    attempt: 0,
    providerId: ctx.providerId,
    operationId: ctx.operationId,
    correlationId: ctx.correlationId,
  })
}

export function createProviderTransportExecutor(
  config: ProviderTransportExecutorConfig,
): ProviderTransportCreateResult {
  const timeout = validateProviderTimeoutPolicy(config.timeout)
  if (!timeout.ok) return { ok: false, error: configError(timeout.message) }
  const retry = validateProviderRetryPolicy(config.retry)
  if (!retry.ok) return { ok: false, error: configError(retry.message) }
  const maxBodyBytes = validateMaxBodyBytes(config.maxBodyBytes)
  if (maxBodyBytes == null) {
    return { ok: false, error: configError('maxBodyBytes is outside the allowed bound.') }
  }
  if (typeof config.http !== 'function') {
    return { ok: false, error: configError('An injected HTTP client is required.') }
  }
  const requestIdHeader = resolveRequestIdHeaderName(config.requestIdHeaderName)
  if (!requestIdHeader.ok) {
    return { ok: false, error: configError('requestIdHeaderName is invalid.') }
  }
  const rateLimitPolicy = validateRateLimitPolicy(config.rateLimit)
  if (!rateLimitPolicy.ok) {
    return { ok: false, error: configError(rateLimitPolicy.message) }
  }

  const clock = config.clock ?? Date.now
  const sleep = config.sleep ?? defaultProviderSleeper
  const random = config.random ?? Math.random
  const scheduleTimeout = config.scheduleTimeout ?? defaultScheduleTimeout
  const observer = config.observer
  const requestIdHeaderName = requestIdHeader.name

  const executor: ProviderTransportExecutor = {
    async execute<T>(request: ProviderTransportRequest): Promise<ProviderTransportResult<T>> {
      return runRequest<T>({
        request,
        http: config.http,
        timeoutMs: timeout.value.timeoutMs,
        retry: retry.value,
        rateLimit: config.rateLimit,
        observer,
        clock,
        sleep,
        random,
        scheduleTimeout,
        maxBodyBytes,
        requestIdHeaderName,
      })
    },
  }

  return { ok: true, executor }
}

async function runRequest<T>(opts: {
  request: ProviderTransportRequest
  http: ProviderHttpClient
  timeoutMs: number
  retry: ProviderValidatedRetryPolicy
  rateLimit: ProviderRateLimitPolicy | undefined
  observer: ProviderTransportObserver | undefined
  clock: ProviderClock
  sleep: ProviderSleeper
  random: ProviderRandom
  scheduleTimeout: ProviderTimeoutScheduler
  maxBodyBytes: number
  requestIdHeaderName: string
}): Promise<ProviderTransportResult<T>> {
  const providerId = validateBoundedId(opts.request.providerId, PROVIDER_TRANSPORT_BOUNDS.maxIdLength)
  const operationId = validateBoundedId(opts.request.operationId, PROVIDER_TRANSPORT_BOUNDS.maxIdLength)
  const correlation = validateCorrelationId(
    opts.request.correlationId,
    PROVIDER_TRANSPORT_BOUNDS.maxCorrelationIdLength,
  )
  if (providerId == null || operationId == null) {
    return {
      ok: false,
      error: requestError(
        { providerId: providerId ?? '', operationId: operationId ?? '', correlationId: correlation ?? null },
        'Provider or operation identifier is invalid.',
      ),
    }
  }
  if (correlation === undefined) {
    return {
      ok: false,
      error: requestError(
        { providerId, operationId, correlationId: null },
        'Correlation identifier is invalid.',
      ),
    }
  }
  if (!istProviderHttpMethod(opts.request.method)) {
    return { ok: false, error: requestError({ providerId, operationId, correlationId: correlation }, 'HTTP method is invalid.') }
  }
  const sanitized = sanitizeProviderTransportUrl(opts.request.url)
  if (!sanitized.ok) {
    return { ok: false, error: requestError({ providerId, operationId, correlationId: correlation }, 'Request URL is invalid.') }
  }
  const headers = buildProviderRequestHeaders(opts.request.headers)
  if (!headers.ok) {
    return { ok: false, error: requestError({ providerId, operationId, correlationId: correlation }, 'Request headers are invalid.') }
  }
  if (
    isSensitiveHeaderName(
      opts.requestIdHeaderName,
      opts.request.headers?.additionalSensitiveHeaderNames ?? [],
    )
  ) {
    return {
      ok: false,
      error: requestError(
        { providerId, operationId, correlationId: correlation },
        'Request-id header is registered as sensitive.',
      ),
    }
  }

  const ctx: AttemptContext = {
    providerId,
    operationId,
    method: opts.request.method,
    url: sanitized.url,
    href: sanitized.href,
    outboundHeaders: headers.headers.outbound,
    body: opts.request.body ?? undefined,
    parse: opts.request.parse ?? 'json',
    correlationId: correlation,
    maxAttempts: opts.retry.maxAttempts,
    timeoutMs: opts.timeoutMs,
    retry: opts.retry,
    rateLimit: opts.rateLimit,
    maxBodyBytes: opts.maxBodyBytes,
    requestIdHeaderName: opts.requestIdHeaderName,
    externalSignal: opts.request.signal,
  }

  let lastFailure: ProviderTransportError | null = null

  for (let attempt = 1; attempt <= ctx.maxAttempts; attempt += 1) {
    if (ctx.externalSignal?.aborted) {
      const error = fail(ctx, attempt, 'aborted', 'Provider request was aborted.', null, 0)
      emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, 0, null, error)
      return { ok: false, error }
    }

    if (ctx.rateLimit?.preflight) {
      const guarded = await runPreflight(ctx, attempt)
      if (!guarded.ok) {
        emit(opts.observer, ctx, opts.clock, 'request_rate_limited', attempt, 0, null, guarded.error, null)
        emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, 0, null, guarded.error)
        return { ok: false, error: guarded.error }
      }
      if (guarded.outcome.kind === 'rate_limited') {
        const error = fail(ctx, attempt, 'rate_limited', 'Provider rate limit blocked the request.', null, 0, guarded.outcome.retryAfterMs)
        emit(opts.observer, ctx, opts.clock, 'request_rate_limited', attempt, 0, null, error, guarded.outcome.retryAfterMs)
        const retried = await maybeRetry({
          ctx,
          attempt,
          error,
          retryAfterMs: guarded.outcome.retryAfterMs,
          observer: opts.observer,
          clock: opts.clock,
          sleep: opts.sleep,
          random: opts.random,
          retryable: ctx.retry.retryOn429,
        })
        if (retried === 'aborted') {
          const aborted = fail(ctx, attempt, 'aborted', 'Provider request was aborted.', 'rate_limited', 0)
          emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, 0, null, aborted)
          return { ok: false, error: aborted }
        }
        if (retried === 'retry') {
          lastFailure = error
          continue
        }
        emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, 0, null, error)
        return {
          ok: false,
          error: terminalAfterRetryStop(ctx, attempt, error, lastFailure != null, ctx.retry.retryOn429),
        }
      }
    }

    emit(opts.observer, ctx, opts.clock, 'request_started', attempt, 0, null, null)
    const started = opts.clock()
    const attemptRun = await runAttempt(opts.http, ctx, attempt, started, opts.clock, opts.scheduleTimeout)
    const elapsedMs = Math.max(0, opts.clock() - started)

    if (attemptRun.ok) {
      emit(opts.observer, ctx, opts.clock, 'request_succeeded', attempt, elapsedMs, attemptRun.metadata.status, null)
      return { ok: true, value: attemptRun.value as T, metadata: attemptRun.metadata }
    }

    const error = attemptRun.error
    if (error.kind === 'timeout') {
      emit(opts.observer, ctx, opts.clock, 'request_timeout', attempt, elapsedMs, error.status, error)
    }
    if (error.kind === 'rate_limited') {
      emit(opts.observer, ctx, opts.clock, 'request_rate_limited', attempt, elapsedMs, error.status, error, attemptRun.retryAfterMs)
    }

    const retryable = isAttemptRetryable(error.kind, error.status, ctx.retry)
    const retried = await maybeRetry({
      ctx,
      attempt,
      error,
      retryAfterMs: attemptRun.retryAfterMs,
      observer: opts.observer,
      clock: opts.clock,
      sleep: opts.sleep,
      random: opts.random,
      retryable,
    })
    if (retried === 'aborted') {
      const aborted = fail(ctx, attempt, 'aborted', 'Provider request was aborted.', error.kind, elapsedMs, null, error.status)
      emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, elapsedMs, error.status, aborted)
      return { ok: false, error: aborted }
    }
    if (retried === 'retry') {
      lastFailure = error
      continue
    }

    emit(opts.observer, ctx, opts.clock, 'request_failed', attempt, elapsedMs, error.status, error)
    return {
      ok: false,
      error: terminalAfterRetryStop(ctx, attempt, error, lastFailure != null, retryable),
    }
  }

  if (lastFailure) return { ok: false, error: exhausted(ctx, ctx.maxAttempts, lastFailure) }
  const fallback = fail(ctx, ctx.maxAttempts, 'retry_exhausted', 'Provider request retries were exhausted.', null, 0)
  return { ok: false, error: fallback }
}

async function runPreflight(
  ctx: AttemptContext,
  attempt: number,
): Promise<
  | { ok: true; outcome: ProviderRateLimitOutcome }
  | { ok: false; error: ProviderTransportError }
> {
  try {
    const outcome = await ctx.rateLimit!.preflight!({
      providerId: ctx.providerId,
      operationId: ctx.operationId,
      attempt,
    })
    if (outcome?.kind === 'allowed') {
      return { ok: true, outcome }
    }
    if (outcome?.kind === 'rate_limited') {
      const retryAfter = validateProviderRetryAfterMs(outcome.retryAfterMs, ctx.retry.maxRetryAfterMs)
      if (!retryAfter.ok) {
        return {
          ok: false,
          error: fail(ctx, attempt, 'rate_limited', 'Provider rate-limit guard failed.', null, 0),
        }
      }
      return { ok: true, outcome: { kind: 'rate_limited', retryAfterMs: retryAfter.retryAfterMs } }
    }
  } catch {
    /* fail closed below; never leak the thrown value */
  }
  return {
    ok: false,
    error: fail(ctx, attempt, 'rate_limited', 'Provider rate-limit guard failed.', null, 0),
  }
}

function isAttemptRetryable(
  kind: ProviderTransportErrorKind,
  status: number | null,
  retry: ProviderValidatedRetryPolicy,
): boolean {
  if (kind === 'aborted' || kind === 'invalid_request' || kind === 'invalid_configuration') return false
  if (kind === 'authentication' || kind === 'authorization') return false
  if (kind === 'malformed_response') return false
  if (kind === 'timeout') return false
  if (kind === 'network_error') return retry.retryNetworkErrors
  if (kind === 'rate_limited') return retry.retryOn429
  if (status != null) return isRetryableHttpStatus(status, retry)
  return false
}

async function maybeRetry(input: {
  ctx: AttemptContext
  attempt: number
  error: ProviderTransportError
  retryAfterMs: number | null | undefined
  observer: ProviderTransportObserver | undefined
  clock: ProviderClock
  sleep: ProviderSleeper
  random: ProviderRandom
  retryable: boolean
}): Promise<'retry' | 'stop' | 'aborted'> {
  if (!input.retryable || input.attempt >= input.ctx.maxAttempts) return 'stop'
  if (input.ctx.externalSignal?.aborted) return 'aborted'
  const delayMs = computeProviderRetryDelayMs({
    policy: input.ctx.retry,
    attempt: input.attempt,
    retryAfterMs: input.retryAfterMs,
    random: input.random,
  })
  emit(
    input.observer,
    input.ctx,
    input.clock,
    'request_retry_scheduled',
    input.attempt,
    0,
    input.error.status,
    input.error,
    input.retryAfterMs ?? null,
    delayMs,
  )
  const slept = await sleepWithAbort(input.sleep, delayMs, input.ctx.externalSignal)
  return slept === 'aborted' ? 'aborted' : 'retry'
}

function defaultScheduleTimeout(abort: () => void, timeoutMs: number): () => void {
  const timer = setTimeout(abort, timeoutMs)
  return () => clearTimeout(timer)
}

async function runAttempt(
  http: ProviderHttpClient,
  ctx: AttemptContext,
  attempt: number,
  started: number,
  clock: ProviderClock,
  scheduleTimeout: ProviderTimeoutScheduler,
): Promise<
  | { ok: true; value: unknown; metadata: ReturnType<typeof createProviderResponseMetadata> }
  | { ok: false; error: ProviderTransportError; retryAfterMs?: number | null }
> {
  const timeout = new AbortController()
  const cancelTimeout = scheduleTimeout(() => timeout.abort(), ctx.timeoutMs)
  const signal = ctx.externalSignal ? AbortSignal.any([ctx.externalSignal, timeout.signal]) : timeout.signal

  try {
    const response = await http({
      url: ctx.href,
      method: ctx.method,
      headers: ctx.outboundHeaders,
      body: ctx.body,
      signal,
    })
    const elapsedMs = Math.max(0, clock() - started)
    const statusClass = classifyProviderHttpStatus(response.status)
    const requestId = readSafeRequestId(response.headers.get(ctx.requestIdHeaderName))
    const correlationId = ctx.correlationId ?? requestId

    if (statusClass !== 'success') {
      await cancelProviderResponseBody(response.body)
      const retryAfterMs =
        statusClass === 'rate_limited'
          ? parseRetryAfterHeaderMs(response.headers.get('retry-after'), clock(), ctx.retry.maxRetryAfterMs)
          : null
      return {
        ok: false,
        error: fail(
          { ...ctx, correlationId },
          attempt,
          statusClass,
          messageForKind(statusClass),
          null,
          elapsedMs,
          retryAfterMs,
          response.status,
        ),
        retryAfterMs,
      }
    }

    const parsed = await parseProviderResponseBody(response, ctx.parse, ctx.maxBodyBytes)
    if (!parsed.ok) {
      return {
        ok: false,
        error: fail({ ...ctx, correlationId }, attempt, 'malformed_response', parsed.message, null, elapsedMs, null, response.status),
      }
    }

    return {
      ok: true,
      value: parsed.value,
      metadata: createProviderResponseMetadata({
        providerId: ctx.providerId,
        operationId: ctx.operationId,
        method: ctx.method,
        url: ctx.url,
        status: response.status,
        attempt,
        elapsedMs,
        correlationId,
      }),
    }
  } catch (error) {
    const elapsedMs = Math.max(0, clock() - started)
    if (ctx.externalSignal?.aborted) {
      return { ok: false, error: fail(ctx, attempt, 'aborted', 'Provider request was aborted.', null, elapsedMs) }
    }
    if (timeout.signal.aborted || isAbortError(error)) {
      const kind: ProviderTransportErrorKind = timeout.signal.aborted ? 'timeout' : 'aborted'
      return {
        ok: false,
        error: fail(ctx, attempt, kind, kind === 'timeout' ? 'Provider request timed out.' : 'Provider request was aborted.', null, elapsedMs),
      }
    }
    return { ok: false, error: fail(ctx, attempt, 'network_error', 'Provider network request failed.', null, elapsedMs) }
  } finally {
    cancelTimeout()
  }
}

function fail(
  ctx: Pick<AttemptContext, 'providerId' | 'operationId' | 'correlationId'>,
  attempt: number,
  kind: ProviderTransportErrorKind,
  message: string,
  causeKind: ProviderTransportErrorKind | null,
  _elapsedMs: number,
  _retryAfterMs?: number | null,
  status: number | null = null,
): ProviderTransportError {
  return createProviderTransportError({
    kind,
    causeKind,
    message,
    status,
    attempt,
    providerId: ctx.providerId,
    operationId: ctx.operationId,
    correlationId: ctx.correlationId,
  })
}

function terminalAfterRetryStop(
  ctx: AttemptContext,
  attempt: number,
  error: ProviderTransportError,
  usedRetry: boolean,
  currentRetryable: boolean,
): ProviderTransportError {
  if (usedRetry && currentRetryable) return exhausted(ctx, attempt, error)
  return error
}

function exhausted(ctx: AttemptContext, attempt: number, last: ProviderTransportError): ProviderTransportError {
  return createProviderTransportError({
    kind: 'retry_exhausted',
    causeKind: last.kind === 'retry_exhausted' ? last.causeKind : last.kind,
    message: 'Provider request retries were exhausted.',
    status: last.status,
    attempt,
    providerId: ctx.providerId,
    operationId: ctx.operationId,
    correlationId: ctx.correlationId,
  })
}

function messageForKind(kind: ProviderTransportErrorKind): string {
  if (kind === 'authentication') return 'Provider authentication failed.'
  if (kind === 'authorization') return 'Provider authorization failed.'
  if (kind === 'invalid_request') return 'Provider rejected the request.'
  if (kind === 'rate_limited') return 'Provider rate-limited the request.'
  if (kind === 'provider_4xx') return 'Provider returned a client error.'
  if (kind === 'provider_5xx') return 'Provider returned a server error.'
  if (kind === 'timeout') return 'Provider request timed out.'
  if (kind === 'aborted') return 'Provider request was aborted.'
  if (kind === 'network_error') return 'Provider network request failed.'
  if (kind === 'malformed_response') return 'Provider response was malformed.'
  return 'Provider request failed.'
}

function emit(
  observer: ProviderTransportObserver | undefined,
  ctx: AttemptContext,
  clock: ProviderClock,
  name: ProviderTransportEvent['name'],
  attempt: number,
  elapsedMs: number,
  status: number | null,
  error: ProviderTransportError | null,
  retryAfterMs: number | null = null,
  delayMs: number | null = null,
): void {
  if (!observer) return
  try {
    observer.record(
      providerTransportEvent({
        name,
        providerId: ctx.providerId,
        operationId: ctx.operationId,
        method: ctx.method,
        origin: ctx.url.origin,
        path: ctx.url.path,
        attempt,
        maxAttempts: ctx.maxAttempts,
        status,
        elapsedMs,
        errorKind: error?.kind ?? null,
        causeKind: error?.causeKind ?? null,
        retryAfterMs,
        delayMs,
        correlationId: ctx.correlationId,
        recordedAt: isoFromClock(clock()),
      }),
    )
  } catch {
    /* telemetry must not escape the transport boundary */
  }
}

export { createFetchProviderHttpClient }
