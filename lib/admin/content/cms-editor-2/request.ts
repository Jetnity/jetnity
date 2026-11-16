import { cmsReference, parseCmsCommand, type CmsCommand } from '../cms/contract'
import type { CmsReadQuery } from './responses'

export const CMS_REQUEST_BYTES = 16_384
export const CMS_RESPONSE_BYTES = 524_288
export type CmsRecoveryMarker = Readonly<{ requestId: string; entryId: string; expectedVersion: string }>
export type CmsHttpRequest = Readonly<{ operation: 'read'; query: CmsReadQuery }>
  | Readonly<{ operation: 'command'; command: CmsCommand }>
  | Readonly<{ operation: 'confirm'; requestId: string }>

function object(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return null
  const result: Record<string, unknown> = Object.create(null)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(input))) {
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null
    result[key] = descriptor.value
  }
  return Reflect.ownKeys(input).length === Object.keys(result).length ? result : null
}

function keys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) {
  return required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => required.includes(key) || optional.includes(key))
}

function positive(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= 9_223_372_036_854_775_807n
}

export function cmsRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)
}

export function parseCmsRecoveryMarker(input: unknown): CmsRecoveryMarker | null {
  try {
    const value = object(input)
    if (!value || !keys(value, ['requestId', 'entryId', 'expectedVersion'])) return null
    const parsed = parseCmsCommand({ ...value, action: 'archive', payload: {} })
    return parsed ? { requestId: parsed.requestId, entryId: parsed.entryId, expectedVersion: parsed.expectedVersion } : null
  } catch { return null }
}

export function parseCmsHttpRequest(input: unknown): CmsHttpRequest | null {
  try {
    const value = object(input)
    if (!value) return null
    if (value.operation === 'command' && keys(value, ['operation', 'command'])) {
      const command = parseCmsCommand(value.command)
      return command ? { operation: 'command', command } : null
    }
    if (value.operation === 'confirm' && keys(value, ['operation', 'requestId']) && cmsRequestId(value.requestId)) {
      return { operation: 'confirm', requestId: value.requestId }
    }
    if (value.operation !== 'read' || !keys(value, ['operation', 'query'])) return null
    const query = object(value.query)
    if (!query || !keys(query, ['entryId'], ['revision', 'beforeRevision', 'limit'])
      || typeof query.entryId !== 'string' || !cmsReference(query.entryId)
      || (Object.hasOwn(query, 'revision') && !positive(query.revision))
      || (Object.hasOwn(query, 'beforeRevision') && !positive(query.beforeRevision))
      || (Object.hasOwn(query, 'limit') && (typeof query.limit !== 'number' || !Number.isInteger(query.limit) || query.limit < 1 || query.limit > 50))) return null
    return { operation: 'read', query: { entryId: query.entryId,
      ...(typeof query.revision === 'string' ? { revision: query.revision } : {}),
      ...(typeof query.beforeRevision === 'string' ? { beforeRevision: query.beforeRevision } : {}),
      ...(typeof query.limit === 'number' ? { limit: query.limit } : {}),
    } }
  } catch { return null }
}

/** Browser requests must stay on their own origin; no Origin-less write API. */
export function cmsRequestHeadersAllowed(request: Request): boolean {
  try {
    const url = new URL(request.url)
    const origin = request.headers.get('origin')
    const type = request.headers.get('content-type')
    const site = request.headers.get('sec-fetch-site')
    return request.method === 'POST' && !url.username && !url.password && !url.search && !url.hash
      && ['https:', 'http:'].includes(url.protocol) && origin === url.origin
      && !!type && /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(type)
      && (site === null || site === 'same-origin')
  } catch { return false }
}

/** Bound even Auth/client construction, whose APIs do not accept a signal.
 * A late completion has no continuation into a database call. */
export async function cmsDuring<T>(work: () => PromiseLike<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new Error('cms deadline')
  let abort = () => {}
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(new Error('cms deadline'))
    signal.addEventListener('abort', abort, { once: true })
  })
  try {
    return await Promise.race([cancelled, Promise.resolve().then(() => {
      if (signal.aborted) throw new Error('cms deadline')
      return work()
    })])
  } finally { signal.removeEventListener('abort', abort) }
}

/** Bounded UTF-8 body reader shared by the request and its HTTP response. */
export async function cmsJsonBody(body: ReadableStream<Uint8Array> | null, maximum: number, signal: AbortSignal, declared: string | null): Promise<unknown> {
  if (!body || signal.aborted || (declared !== null && (!/^(0|[1-9][0-9]{0,6})$/.test(declared) || Number(declared) > maximum))) return null
  const reader = body.getReader(), chunks: Uint8Array[] = []
  let length = 0, complete = false
  const abort = () => { void reader.cancel().catch(() => undefined) }
  signal.addEventListener('abort', abort, { once: true })
  try {
    for (;;) {
      if (signal.aborted) return null
      const next = await reader.read()
      if (signal.aborted) return null
      if (next.done) { complete = true; break }
      length += next.value.byteLength
      if (length > maximum) return null
      chunks.push(next.value)
    }
    if (declared !== null && length !== Number(declared)) return null
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
    return JSON.parse(text) as unknown
  } catch { return null }
  finally {
    signal.removeEventListener('abort', abort)
    if (!complete) void reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
