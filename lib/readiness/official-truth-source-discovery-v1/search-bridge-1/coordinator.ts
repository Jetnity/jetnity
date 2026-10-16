// Dormant offline composition. No application entrypoint or default transport.
import { types } from 'node:util'
import { discoverOfficialTruthSourcesOffline } from '../coordinator'
import type { DiscoveryQueryIntent } from '../query-intents'
import type { SearchBridgeOptions, SearchBridgeResult, SearchHit, SearchHitPort } from './port'

type Pair = Readonly<{ sourceId: string; url: string }>
type Failure = 'invalid_search_options' | 'search_transport_unavailable' | 'unsafe_search_transport'
  | 'search_transport_error' | 'invalid_search_response' | 'hit_budget_exceeded'
  | 'search_aborted' | 'search_timeout' | 'initial_candidates_forbidden'
type Received = { ok: true; hits: readonly SearchHit[] } | { ok: false; reason: Failure }

function blocked(reason: Failure): SearchBridgeResult {
  return Object.freeze({ status: 'blocked_invalid', reason, officialResult: 'unknown', sourceQualified: false })
}

/** Reflect only non-proxy plain records, and never invoke a property accessor. */
function dataFields(value: unknown, allowed: readonly string[]): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || types.isProxy(value)
    || Object.getPrototypeOf(value) !== Object.prototype) return null
  const keys = Reflect.ownKeys(value)
  if (keys.length > allowed.length) return null
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    if (typeof key !== 'string' || !allowed.includes(key)) return null
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null
    result[key] = descriptor.value
  }
  return result
}

function readOptions(value: unknown): SearchBridgeOptions | null {
  const fields = dataFields(value, ['signal', 'transport', 'timeoutMs'])
  if (!fields || !fields.signal || typeof fields.signal !== 'object' || types.isProxy(fields.signal)) return null
  // Native brand check, without reading caller-overridden properties/methods.
  try { aborted(fields.signal as AbortSignal) } catch { return null }
  const timeoutMs = fields.timeoutMs === undefined ? 1000 : fields.timeoutMs
  if (typeof timeoutMs !== 'number' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 5000) return null
  return { signal: fields.signal as AbortSignal, timeoutMs, transport: fields.transport as SearchHitPort | undefined }
}

function aborted(signal: AbortSignal): boolean {
  return Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted')!.get!.call(signal)
}

function safeTransport(value: unknown): value is SearchHitPort {
  if (typeof value !== 'function' || types.isProxy(value)) return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Function.prototype && prototype !== Object.getPrototypeOf(async () => {})) return false
  // Arrow/async functions only; no callable proxy, class, bound/native function,
  // generator, attached metadata, getter or user-overridden then/call method.
  return Reflect.ownKeys(value).every(key => key === 'length' || key === 'name')
    && !Function.prototype.toString.call(value).includes('[native code]')
}

/** Data parsing only. URL/authority semantics belong exclusively to V1. */
function readHits(value: unknown, remaining: number): Received {
  if (!value || typeof value !== 'object' || types.isProxy(value) || !Array.isArray(value)
    || Object.getPrototypeOf(value) !== Array.prototype) return { ok: false, reason: 'invalid_search_response' }
  if (value.length > remaining) return { ok: false, reason: 'hit_budget_exceeded' }
  if (Reflect.ownKeys(value).length !== value.length + 1) return { ok: false, reason: 'invalid_search_response' }
  const hits: SearchHit[] = []
  for (let i = 0; i < value.length; i++) {
    const item = Object.getOwnPropertyDescriptor(value, String(i))
    if (!item || !('value' in item) || !item.enumerable) return { ok: false, reason: 'invalid_search_response' }
    const fields = dataFields(item.value, ['url'])
    if (!fields || typeof fields.url !== 'string' || fields.url.length > 4096) return { ok: false, reason: 'invalid_search_response' }
    hits.push(Object.freeze({ url: fields.url }))
  }
  return { ok: true, hits: Object.freeze(hits) }
}

/** Called only synchronously after V1 accepted bounded plain data. */
function snapshot(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(snapshot))
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, snapshot(child)])))
  }
  return value
}

/**
 * At most one in-flight fixture promise. On termination clear the observer cell,
 * so a never-settling/late promise retains no resolver, input, hits or listeners.
 * Both rejection and fulfillment are observed; no unhandled late rejection.
 */
function receive(
  port: SearchHitPort, intent: DiscoveryQueryIntent, signal: AbortSignal,
  remaining: number, cancellation: () => 'search_aborted' | 'search_timeout',
): Promise<Received> {
  return new Promise(resolve => {
    const cell: { finish?: (value: unknown, failed: boolean) => void } = {}
    let finished = false
    const finish = (result: Received) => {
      if (finished) return
      finished = true
      cell.finish = undefined
      EventTarget.prototype.removeEventListener.call(signal, 'abort', onAbort)
      resolve(result)
    }
    const onAbort = () => finish({ ok: false, reason: cancellation() })
    EventTarget.prototype.addEventListener.call(signal, 'abort', onAbort, { once: true })
    if (aborted(signal)) { onAbort(); return }
    cell.finish = (value, failed) => {
      if (aborted(signal)) { onAbort(); return }
      if (failed) { finish({ ok: false, reason: 'search_transport_error' }); return }
      try { finish(readHits(value, remaining)) } catch { finish({ ok: false, reason: 'invalid_search_response' }) }
    }
    try {
      const pending = port(intent, signal)
      // Do not assimilate a caller thenable/proxy or read an overridden .then.
      if (!types.isPromise(pending) || types.isProxy(pending)
        || Object.getPrototypeOf(pending) !== Promise.prototype || Object.hasOwn(pending, 'constructor')) {
        finish({ ok: false, reason: 'unsafe_search_transport' })
        return
      }
      // Node async hooks add symbol fields to native promises. Do not inspect
      // their values. Reject other decorations, but still observe settlement
      // through the intrinsic so an overridden .then getter never runs.
      if (Reflect.ownKeys(pending).some(key => typeof key === 'string')) {
        finish({ ok: false, reason: 'unsafe_search_transport' })
      }
      Promise.prototype.then.call(pending,
        (value: unknown) => cell.finish?.(value, false),
        () => cell.finish?.(undefined, true))
    } catch { finish({ ok: false, reason: 'search_transport_error' }) }
  })
}

/**
 * Accept the exact V1 data envelope with candidates: []. Only V1 can produce
 * intents or validate candidates. Snapshot before the first async boundary;
 * never send registry, scope, coverage, passport identifiers or error text to a port.
 */
export async function discoverOfficialTruthSearchBridgeOffline(
  input: unknown, options?: SearchBridgeOptions,
): Promise<SearchBridgeResult> {
  const planned = discoverOfficialTruthSourcesOffline(input)
  if (planned.status === 'blocked_invalid') return planned
  // A successful V1 call has already closed and validated the complete envelope.
  const initial = input as Record<string, unknown>
  if ((initial.candidates as unknown[]).length !== 0) return blocked('initial_candidates_forbidden')
  if (planned.status === 'no_research') return planned
  if (planned.status === 'gap_unqualified' && planned.reason === 'no_eligible_official_source') {
    return Object.freeze({ ...planned, authorityRegistration: 'independent_registration_required' })
  }
  const envelope = snapshot(initial) as Record<string, unknown>
  const config = readOptions(options)
  if (!config) return blocked('invalid_search_options')
  if (aborted(config.signal)) return blocked('search_aborted')
  if (config.transport === undefined) return blocked('search_transport_unavailable')
  if (!safeTransport(config.transport)) return blocked('unsafe_search_transport')

  const controller = new AbortController()
  let stopped: 'search_aborted' | 'search_timeout' | null = null
  const stop = (reason: 'search_aborted' | 'search_timeout') => {
    if (stopped) return
    stopped = reason
    controller.abort() // Never propagate caller/provider reason or private text.
  }
  const onAbort = () => stop('search_aborted')
  EventTarget.prototype.addEventListener.call(config.signal, 'abort', onAbort, { once: true })
  const timer = setTimeout(() => stop('search_timeout'), config.timeoutMs)
  const pairs: Pair[] = []
  let bytes = 0
  try {
    for (const intent of planned.intents) {
      if (aborted(config.signal)) stop('search_aborted')
      if (stopped) return blocked(stopped)
      const response = await receive(config.transport, intent, controller.signal, 16 - pairs.length, () => stopped ?? 'search_aborted')
      if (stopped) return blocked(stopped)
      if (!response.ok) return blocked(response.reason)
      for (const hit of response.hits) {
        bytes += new TextEncoder().encode(hit.url).length
        if (bytes > 16_384) return blocked('hit_budget_exceeded')
        pairs.push(Object.freeze({ sourceId: intent.sourceId, url: hit.url }))
      }
    }
    if (aborted(config.signal)) return blocked('search_aborted')
    // No deduplication or URL rewriting: canonical duplicates/conflicts fail in V1.
    const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
    pairs.sort((a, b) => compare(a.sourceId, b.sourceId) || compare(a.url, b.url))
    return discoverOfficialTruthSourcesOffline({ ...envelope, candidates: pairs })
  } finally {
    clearTimeout(timer)
    EventTarget.prototype.removeEventListener.call(config.signal, 'abort', onAbort)
    controller.abort()
  }
}
