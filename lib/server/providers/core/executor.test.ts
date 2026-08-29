import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  PROVIDER_HTTP_METHODS,
  PROVIDER_TRANSPORT_BOUNDS,
  PROVIDER_TRANSPORT_ERROR_KINDS,
  PROVIDER_TRANSPORT_EVENT_NAMES,
  classifyProviderHttpStatus,
  createFetchProviderHttpClient,
  createProviderResponseMetadata,
  createProviderTransportError,
  createProviderTransportExecutor,
  createSanitizedRequestMetadata,
  headerNamesAreSecretSafe,
  istProviderHttpMethod,
  istProviderTransportErrorKind,
  parseProviderResponseBody,
  readSafeRequestId,
  sanitizeProviderTransportUrl,
  validateBoundedId,
  validateCorrelationId,
  validateMaxBodyBytes,
  type ProviderHttpClient,
  type ProviderHttpRequest,
  type ProviderHttpResponse,
  type ProviderTransportEvent,
  type ProviderTransportObserver,
} from '@/lib/server/providers/core'

const SECRET = 'test-provider-secret-value'
const URL = 'https://provider.test/v1/create?session=keep-out-of-logs'

type FakeStep =
  | { type: 'response'; status: number; body: string; headers?: Record<string, string> }
  | { type: 'network'; message?: string }
  | { type: 'hang' }

function headerBag(headers: Record<string, string> = {}): ProviderHttpResponse['headers'] {
  return {
    get(name: string) {
      const found = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase())
      return found ? headers[found]! : null
    },
  }
}

function bodyFromText(text: string, onCancel?: () => void): ReadableStream<Uint8Array> {
  const encoded = new TextEncoder().encode(text)
  return new ReadableStream({
    start(controller) {
      if (encoded.byteLength > 0) controller.enqueue(encoded)
      controller.close()
    },
    cancel() {
      onCancel?.()
    },
  })
}

function fakeHttp(steps: FakeStep[]): { client: ProviderHttpClient; calls: ProviderHttpRequest[] } {
  const remaining = [...steps]
  const calls: ProviderHttpRequest[] = []
  return {
    calls,
    async client(request) {
      calls.push(request)
      const step = remaining.shift()
      if (!step) throw new Error('unexpected extra HTTP call')
      if (step.type === 'network') throw new Error(step.message ?? 'ECONNRESET')
      if (step.type === 'hang') {
        await new Promise<never>((_, reject) => {
          const fail = () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          }
          if (request.signal.aborted) {
            fail()
            return
          }
          request.signal.addEventListener('abort', fail, { once: true })
        })
        throw new Error('hang resolved unexpectedly')
      }
      if (request.signal.aborted) {
        const error = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }
      return {
        status: step.status,
        headers: headerBag(step.headers),
        body: bodyFromText(step.body),
      }
    },
  }
}

function recordingObserver(): { events: ProviderTransportEvent[]; observer: ProviderTransportObserver } {
  const events: ProviderTransportEvent[] = []
  return {
    events,
    observer: {
      record(event) {
        events.push(event)
      },
    },
  }
}

function recordingSleep() {
  const delays: number[] = []
  return {
    delays,
    async sleep(ms: number, signal?: AbortSignal) {
      delays.push(ms)
      if (signal?.aborted) {
        const error = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }
    },
  }
}

function neverTimeout() {
  return () => () => {}
}

function immediateTimeout() {
  return (abort: () => void) => {
    abort()
    return () => {}
  }
}

function executorFor(
  http: ProviderHttpClient,
  extras: {
    observer?: ProviderTransportObserver
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
    scheduleTimeout?: (abort: () => void, timeoutMs: number) => () => void
    retry?: { maxAttempts?: number; retryOn429?: boolean; retry5xx?: boolean; retryNetworkErrors?: boolean }
    rateLimit?: { preflight?: () => Promise<{ kind: 'allowed' } | { kind: 'rate_limited'; retryAfterMs: number | null }> }
    maxBodyBytes?: number
  } = {},
) {
  return createProviderTransportExecutor({
    http,
    timeout: { timeoutMs: 50 },
    retry: {
      maxAttempts: extras.retry?.maxAttempts ?? 3,
      baseDelayMs: 10,
      maxDelayMs: 40,
      jitter: 'none',
      retryOn429: extras.retry?.retryOn429,
      retry5xx: extras.retry?.retry5xx,
      retryNetworkErrors: extras.retry?.retryNetworkErrors,
    },
    rateLimit: extras.rateLimit,
    observer: extras.observer,
    clock: () => 1_700_000_000_000,
    sleep: extras.sleep ?? recordingSleep().sleep,
    random: () => 0,
    scheduleTimeout: extras.scheduleTimeout ?? neverTimeout(),
    maxBodyBytes: extras.maxBodyBytes,
  })
}

function request(teil: { signal?: AbortSignal; parse?: 'json' | 'text' | 'none'; operationId?: string } = {}) {
  return {
    providerId: 'example',
    operationId: teil.operationId ?? 'search-create',
    method: 'POST' as const,
    url: URL,
    headers: {
      publicHeaders: { accept: 'application/json' },
      secretHeaders: { 'x-api-key': SECRET },
    },
    body: JSON.stringify({ market: 'CH' }),
    parse: teil.parse,
    correlationId: 'corr-1',
    signal: teil.signal,
  }
}

function assertNoSecret(value: unknown) {
  assert.equal(headerNamesAreSecretSafe(value, [SECRET, 'session=keep-out-of-logs']), true)
  const serialized = JSON.stringify(value)
  assert.equal(serialized.includes(SECRET), false)
  assert.equal(serialized.includes('session='), false)
}

describe('provider transport executor', () => {
  test('200 JSON success returns transport evidence without credential headers', async () => {
    const http = fakeHttp([{ type: 'response', status: 200, body: '{"ok":true}', headers: { 'x-request-id': 'req-1' } }])
    const created = executorFor(http.client)
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(result.value, { ok: true })
    assert.equal(result.metadata.status, 200)
    assert.equal(result.metadata.url.origin, 'https://provider.test')
    assert.equal(result.metadata.url.path, '/v1/create')
    assert.equal('headers' in result.metadata, false)
    assert.equal('sourceKind' in result, false)
    assert.equal('trusted' in result, false)
    assert.equal(http.calls[0]?.headers['x-api-key'], SECRET)
    assertNoSecret(result)
  })

  test('malformed JSON is malformed_response and is not retried', async () => {
    const http = fakeHttp([{ type: 'response', status: 200, body: '{not-json' }])
    const created = executorFor(http.client)
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'malformed_response')
    assert.equal(http.calls.length, 1)
    assertNoSecret(result)
  })

  test('400 is invalid_request and never retried', async () => {
    const http = fakeHttp([
      { type: 'response', status: 400, body: '{}' },
      { type: 'response', status: 200, body: '{}' },
    ])
    const created = executorFor(http.client)
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'invalid_request')
    assert.equal(http.calls.length, 1)
  })

  test('401 and 403 are distinct auth failures and never retried', async () => {
    for (const [status, kind] of [
      [401, 'authentication'],
      [403, 'authorization'],
    ] as const) {
      const http = fakeHttp([{ type: 'response', status, body: '{}' }])
      const created = executorFor(http.client)
      assert.equal(created.ok, true)
      if (!created.ok) return
      const result = await created.executor.execute(request())
      assert.equal(result.ok, false)
      if (result.ok) return
      assert.equal(result.error.kind, kind)
      assert.equal(http.calls.length, 1)
    }
  })

  test('429 retries when policy allows and honors Retry-After', async () => {
    const http = fakeHttp([
      { type: 'response', status: 429, body: '{}', headers: { 'retry-after': '1' } },
      { type: 'response', status: 200, body: '{"ready":true}' },
    ])
    const sleep = recordingSleep()
    const observer = recordingObserver()
    const created = executorFor(http.client, { sleep: sleep.sleep, observer: observer.observer })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(result.value, { ready: true })
    assert.equal(http.calls.length, 2)
    assert.ok(sleep.delays[0] === 40)
    assert.deepEqual(
      observer.events.map((event) => event.name),
      [
        'request_started',
        'request_rate_limited',
        'request_retry_scheduled',
        'request_started',
        'request_succeeded',
      ],
    )
    assertNoSecret(observer.events)
  })

  test('429 exhausts retries as retry_exhausted with rate_limited cause', async () => {
    const http = fakeHttp([
      { type: 'response', status: 429, body: '{}' },
      { type: 'response', status: 429, body: '{}' },
    ])
    const created = executorFor(http.client, { retry: { maxAttempts: 2 } })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'retry_exhausted')
    assert.equal(result.error.causeKind, 'rate_limited')
    assert.equal(http.calls.length, 2)
  })

  test('500/502 retry and can succeed on a later attempt', async () => {
    const http = fakeHttp([
      { type: 'response', status: 500, body: '{}' },
      { type: 'response', status: 502, body: '{}' },
      { type: 'response', status: 200, body: '{"ok":1}' },
    ])
    const observer = recordingObserver()
    const created = executorFor(http.client, { observer: observer.observer })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(result.value, { ok: 1 })
    assert.equal(http.calls.length, 3)
    assert.ok(observer.events.some((event) => event.name === 'request_retry_scheduled'))
  })

  test('network errors retry until exhaustion', async () => {
    const http = fakeHttp([{ type: 'network' }, { type: 'network' }])
    const created = executorFor(http.client, { retry: { maxAttempts: 2 } })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'retry_exhausted')
    assert.equal(result.error.causeKind, 'network_error')
    assert.equal(http.calls.length, 2)
    assertNoSecret(result.error)
  })

  test('timeout aborts the in-flight request', async () => {
    const http = fakeHttp([{ type: 'hang' }])
    const observer = recordingObserver()
    const created = executorFor(http.client, {
      observer: observer.observer,
      retry: { maxAttempts: 1 },
      scheduleTimeout: immediateTimeout(),
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'timeout')
    assert.ok(observer.events.some((event) => event.name === 'request_timeout'))
    assert.ok(http.calls[0]?.signal.aborted)
  })

  test('external abort stops the retry loop without sleeping', async () => {
    const controller = new AbortController()
    const http = fakeHttp([
      { type: 'response', status: 500, body: '{}' },
      { type: 'response', status: 200, body: '{}' },
    ])
    const sleep = recordingSleep()
    const created = executorFor(http.client, { sleep: sleep.sleep })
    assert.equal(created.ok, true)
    if (!created.ok) return
    controller.abort()
    const result = await created.executor.execute(request({ signal: controller.signal }))
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'aborted')
    assert.equal(http.calls.length, 0)
    assert.deepEqual(sleep.delays, [])
  })

  test('abort during scheduled retry stops further attempts', async () => {
    const controller = new AbortController()
    const http = fakeHttp([
      { type: 'response', status: 500, body: '{}' },
      { type: 'response', status: 200, body: '{}' },
    ])
    const created = executorFor(http.client, {
      sleep: async (_ms, signal) => {
        controller.abort()
        if (signal?.aborted) {
          const error = new Error('aborted')
          error.name = 'AbortError'
          throw error
        }
      },
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request({ signal: controller.signal }))
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'aborted')
    assert.equal(http.calls.length, 1)
  })

  test('invalid retry configuration is rejected before any HTTP call', () => {
    const http = fakeHttp([])
    const created = createProviderTransportExecutor({
      http: http.client,
      timeout: { timeoutMs: 20 },
      retry: { maxAttempts: 0, baseDelayMs: 10, maxDelayMs: 20 },
    })
    assert.equal(created.ok, false)
    if (created.ok) return
    assert.equal(created.error.kind, 'invalid_configuration')
    assert.equal(http.calls.length, 0)
  })

  test('observer sequence and metadata never include secrets or query strings', async () => {
    const http = fakeHttp([{ type: 'response', status: 200, body: '{"ok":true}' }])
    const observer = recordingObserver()
    const created = executorFor(http.client, { observer: observer.observer })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    assert.deepEqual(
      observer.events.map((event) => event.name),
      ['request_started', 'request_succeeded'],
    )
    assert.equal(observer.events[0]?.origin, 'https://provider.test')
    assert.equal(observer.events[0]?.path, '/v1/create')
    assertNoSecret(observer.events)
    assertNoSecret(result)
  })

  test('Skyscanner-like create then poll stays provider-neutral and secret-safe', async () => {
    const http = fakeHttp([
      { type: 'response', status: 200, body: '{"sessionToken":"sess-1","status":"incomplete"}' },
      { type: 'response', status: 200, body: '{"sessionToken":"sess-1","status":"complete"}' },
    ])
    const created = executorFor(http.client, { retry: { maxAttempts: 1 } })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const create = await created.executor.execute(request({ operationId: 'live-prices-create' }))
    const poll = await created.executor.execute({
      ...request({ operationId: 'live-prices-poll' }),
      method: 'GET',
      url: 'https://provider.test/v1/poll/sess-1',
      body: null,
    })
    assert.equal(create.ok, true)
    assert.equal(poll.ok, true)
    assert.equal(http.calls[0]?.method, 'POST')
    assert.equal(http.calls[1]?.method, 'GET')
    assert.equal(http.calls[0]?.headers['x-api-key'], SECRET)
    assertNoSecret(create)
    assertNoSecret(poll)
  })

  test('injected fetch wrapper omits credentials and does not follow redirects', async () => {
    const seen: Array<RequestInit | undefined> = []
    const client = createFetchProviderHttpClient(async (_url, init) => {
      seen.push(init)
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const created = executorFor(client, { retry: { maxAttempts: 1 } })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    assert.equal(seen[0]?.credentials, 'omit')
    assert.equal(seen[0]?.redirect, 'manual')
    assert.equal(seen[0]?.cache, 'no-store')
  })
})

describe('provider transport helpers', () => {
  test('taxonomy and identifiers stay bounded and provider-neutral', () => {
    assert.ok(PROVIDER_TRANSPORT_ERROR_KINDS.includes('retry_exhausted'))
    assert.ok(PROVIDER_TRANSPORT_EVENT_NAMES.includes('request_rate_limited'))
    assert.ok(PROVIDER_HTTP_METHODS.includes('POST'))
    assert.equal(istProviderTransportErrorKind('timeout'), true)
    assert.equal(istProviderHttpMethod('POST'), true)
    assert.equal(validateBoundedId('skyscanner', PROVIDER_TRANSPORT_BOUNDS.maxIdLength), 'skyscanner')
    assert.equal(validateBoundedId('has space', 64), null)
    assert.equal(validateCorrelationId('corr-1', 128), 'corr-1')
    assert.equal(validateCorrelationId('bad id', 128), undefined)
    assert.equal(readSafeRequestId('req-1'), 'req-1')
    assert.equal(classifyProviderHttpStatus(429), 'rate_limited')
    assert.equal(validateMaxBodyBytes(0), null)
    const url = sanitizeProviderTransportUrl('https://user:pass@provider.test/path?q=1')
    assert.equal(url.ok, false)
    const safe = sanitizeProviderTransportUrl('https://provider.test/path?q=1#frag')
    assert.equal(safe.ok, true)
    if (safe.ok) assert.equal(safe.url.path, '/path')
    const error = createProviderTransportError({
      kind: 'timeout',
      causeKind: null,
      message: 'Provider request timed out.',
      status: null,
      attempt: 1,
      providerId: 'example',
      operationId: 'search',
      correlationId: null,
    })
    assert.equal('sourceKind' in error, false)
    const metadata = createProviderResponseMetadata({
      providerId: 'example',
      operationId: 'search',
      method: 'GET',
      url: { origin: 'https://provider.test', path: '/poll' },
      status: 200,
      attempt: 1,
      elapsedMs: 3,
      correlationId: null,
    })
    assert.equal('headers' in metadata, false)
    const requestMeta = createSanitizedRequestMetadata({
      providerId: 'example',
      operationId: 'search',
      method: 'GET',
      url: { origin: 'https://provider.test', path: '/poll' },
      attempt: 1,
      maxAttempts: 2,
      correlationId: null,
    })
    assert.equal('trusted' in requestMeta, false)
  })

  test('oversized or non-JSON bodies are malformed', async () => {
    const oversized = {
      status: 200,
      headers: headerBag({ 'content-length': '999999' }),
      body: bodyFromText('{"ok":true}'),
    }
    const tooBig = await parseProviderResponseBody(oversized, 'json', 16)
    assert.equal(tooBig.ok, false)
    const html = {
      status: 200,
      headers: headerBag({ 'content-type': 'text/html' }),
      body: bodyFromText('<html></html>'),
    }
    const notJson = await parseProviderResponseBody(html, 'json', 1_000)
    assert.equal(notJson.ok, false)
  })

  test('HTTP 429 stays rate_limited when no retry is allowed', async () => {
    const noRetry = fakeHttp([{ type: 'response', status: 429, body: '{}' }])
    const createdNoRetry = executorFor(noRetry.client, { retry: { maxAttempts: 3, retryOn429: false } })
    assert.equal(createdNoRetry.ok, true)
    if (!createdNoRetry.ok) return
    const noRetryResult = await createdNoRetry.executor.execute(request())
    assert.equal(noRetryResult.ok, false)
    if (noRetryResult.ok) return
    assert.equal(noRetryResult.error.kind, 'rate_limited')
    assert.equal(noRetry.calls.length, 1)

    const oneAttempt = fakeHttp([{ type: 'response', status: 429, body: '{}' }])
    const createdOne = executorFor(oneAttempt.client, { retry: { maxAttempts: 1, retryOn429: true } })
    assert.equal(createdOne.ok, true)
    if (!createdOne.ok) return
    const oneResult = await createdOne.executor.execute(request())
    assert.equal(oneResult.ok, false)
    if (oneResult.ok) return
    assert.equal(oneResult.error.kind, 'rate_limited')
    assert.equal(oneAttempt.calls.length, 1)
  })

  test('preflight 429 stays rate_limited when no retry is allowed', async () => {
    const blocked = {
      preflight: async () => ({ kind: 'rate_limited' as const, retryAfterMs: 4_000 }),
    }

    const noRetryHttp = fakeHttp([])
    const createdNoRetry = executorFor(noRetryHttp.client, {
      retry: { maxAttempts: 3, retryOn429: false },
      rateLimit: blocked,
    })
    assert.equal(createdNoRetry.ok, true)
    if (!createdNoRetry.ok) return
    const noRetryResult = await createdNoRetry.executor.execute(request())
    assert.equal(noRetryResult.ok, false)
    if (noRetryResult.ok) return
    assert.equal(noRetryResult.error.kind, 'rate_limited')
    assert.equal(noRetryHttp.calls.length, 0)

    const oneAttemptHttp = fakeHttp([])
    const createdOne = executorFor(oneAttemptHttp.client, {
      retry: { maxAttempts: 1, retryOn429: true },
      rateLimit: blocked,
    })
    assert.equal(createdOne.ok, true)
    if (!createdOne.ok) return
    const oneResult = await createdOne.executor.execute(request())
    assert.equal(oneResult.ok, false)
    if (oneResult.ok) return
    assert.equal(oneResult.error.kind, 'rate_limited')
    assert.equal(oneAttemptHttp.calls.length, 0)
  })

  test('a later non-retryable failure keeps its own kind after an earlier retry', async () => {
    const auth = fakeHttp([
      { type: 'response', status: 500, body: '{}' },
      { type: 'response', status: 401, body: '{}' },
    ])
    const createdAuth = executorFor(auth.client, { retry: { maxAttempts: 2 } })
    assert.equal(createdAuth.ok, true)
    if (!createdAuth.ok) return
    const authResult = await createdAuth.executor.execute(request())
    assert.equal(authResult.ok, false)
    if (authResult.ok) return
    assert.equal(authResult.error.kind, 'authentication')
    assert.equal(auth.calls.length, 2)

    const limited = fakeHttp([
      { type: 'response', status: 500, body: '{}' },
      { type: 'response', status: 429, body: '{}' },
    ])
    const createdLimited = executorFor(limited.client, {
      retry: { maxAttempts: 3, retryOn429: false },
    })
    assert.equal(createdLimited.ok, true)
    if (!createdLimited.ok) return
    const limitedResult = await createdLimited.executor.execute(request())
    assert.equal(limitedResult.ok, false)
    if (limitedResult.ok) return
    assert.equal(limitedResult.error.kind, 'rate_limited')
    assert.equal(limited.calls.length, 2)
  })

  test('a later disabled preflight 429 stays rate_limited after an earlier retry', async () => {
    const http = fakeHttp([{ type: 'response', status: 500, body: '{}' }])
    let attempt = 0
    const created = executorFor(http.client, {
      retry: { maxAttempts: 3, retryOn429: false },
      rateLimit: {
        preflight: async () => {
          attempt += 1
          if (attempt === 1) return { kind: 'allowed' }
          return { kind: 'rate_limited', retryAfterMs: 10 }
        },
      },
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'rate_limited')
    assert.equal(http.calls.length, 1)
  })

  test('preflight 429 becomes retry_exhausted only after a real retry was used', async () => {
    const http = fakeHttp([])
    const created = executorFor(http.client, {
      retry: { maxAttempts: 2, retryOn429: true },
      rateLimit: {
        preflight: async () => ({ kind: 'rate_limited', retryAfterMs: 10 }),
      },
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.error.kind, 'retry_exhausted')
    assert.equal(result.error.causeKind, 'rate_limited')
    assert.equal(http.calls.length, 0)
  })

  test('observer exceptions do not turn a successful request into a throw', async () => {
    const http = fakeHttp([{ type: 'response', status: 200, body: '{"ok":true}' }])
    const created = executorFor(http.client, {
      observer: {
        record() {
          throw new Error('Authorization: Bearer leaked-token')
        },
      },
    })
    assert.equal(created.ok, true)
    if (!created.ok) return
    const result = await created.executor.execute(request())
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(result.value, { ok: true })
    assertNoSecret(result)
  })

  test('throwing or invalid preflight fail-closes without HTTP or leaked exception text', async () => {
    const throwingHttp = fakeHttp([])
    const observer = recordingObserver()
    const createdThrow = executorFor(throwingHttp.client, {
      observer: observer.observer,
      rateLimit: {
        preflight: async () => {
          throw new Error('secret=sk-live-xyz')
        },
      },
    })
    assert.equal(createdThrow.ok, true)
    if (!createdThrow.ok) return
    const thrownResult = await createdThrow.executor.execute(request())
    assert.equal(thrownResult.ok, false)
    if (thrownResult.ok) return
    assert.equal(thrownResult.error.kind, 'rate_limited')
    assert.equal(thrownResult.error.message, 'Provider rate-limit guard failed.')
    assert.equal(thrownResult.error.message.includes('secret'), false)
    assert.equal(throwingHttp.calls.length, 0)
    assert.equal(observer.events.some((event) => event.name === 'request_failed'), true)
    assertNoSecret(thrownResult)
    assertNoSecret(observer.events)

    const invalidHttp = fakeHttp([])
    const createdInvalid = executorFor(invalidHttp.client, {
      rateLimit: {
        preflight: (async () => ({ kind: 'not-valid' })) as never,
      },
    })
    assert.equal(createdInvalid.ok, true)
    if (!createdInvalid.ok) return
    const invalidResult = await createdInvalid.executor.execute(request())
    assert.equal(invalidResult.ok, false)
    if (invalidResult.ok) return
    assert.equal(invalidResult.error.kind, 'rate_limited')
    assert.equal(invalidResult.error.message, 'Provider rate-limit guard failed.')
    assert.equal(invalidHttp.calls.length, 0)
  })
})

