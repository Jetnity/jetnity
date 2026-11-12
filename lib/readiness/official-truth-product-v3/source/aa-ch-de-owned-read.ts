import 'server-only'

import { Resolver } from 'node:dns/promises'
import type { IncomingMessage } from 'node:http'
import https from 'node:https'
import type { Socket } from 'node:net'
import { performance } from 'node:perf_hooks'
import { sha256Hex } from '@/lib/readiness/digest'
import {
  officialTruthServerOwnedRetrievalAdresseZulaessig, medientyp, inhaltLaenge, textAus,
  type OfficialTruthServerOwnedRetrievalLookup,
} from '@/lib/readiness/official-truth-retrieval-physical-internal'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION, type AaChDeSourceRole } from './aa-ch-de-definition'

type FixedPublication = typeof AA_CH_DE_PUBLICATION | typeof BERN_CH_DE_PUBLICATION
export type AaChDeOwnedOriginal = Readonly<{
  role: AaChDeSourceRole; requestUrl: string; finalUrl: string; method: 'GET'; redirectCount: 0; httpStatus: 200;
  contentType: 'text/html'; bodyText: string; bytes: number; rawDigest: string;
  retrievedAt: string; startedAt: string;
}>
type Reason = 'aborted' | 'busy' | 'dns_failed' | 'address_refused' | 'http_failed'
  | 'http_status' | 'redirect_refused' | 'content_type' | 'encoding' | 'framing'
  | 'body_limit' | 'invalid_text' | 'deadline' | 'clock';
export type AaChDeOwnedAttempt = Readonly<{
  role: AaChDeSourceRole; requestUrl: string; startedAt: string; completedAt: string;
  status: 'read' | 'unavailable'; reason: Reason | null;
}>
export type AaChDeOwnedRead = Readonly<{ status: 'read'; receipt: object }>
  | Readonly<{ status: 'unavailable'; reason: Reason; attempt: object | null }>
const originals = new WeakMap<object, AaChDeOwnedOriginal>()
const attempts = new WeakMap<object, AaChDeOwnedAttempt>()
let active = 0 // one shared two-operation limit across both fixed publications
const unavailable = (reason: Reason, attempt: object | null = null): AaChDeOwnedRead =>
  Object.freeze({ status: 'unavailable', reason, attempt })

/** These maps open only actual joined native operations. Copies of an original,
 * an attempt record or a receipt-shaped object cannot acquire private custody. */
export function inspectAaChDeOwnedOriginal(receipt: object): AaChDeOwnedOriginal | null {
  return originals.get(receipt) ?? null
}
export function inspectAaChDeOwnedAttempt(receipt: object): AaChDeOwnedAttempt | null {
  return attempts.get(receipt) ?? null
}

function headerOnce(response: IncomingMessage, name: string): string | null | false {
  const values: string[] = []
  for (let index = 0; index < response.rawHeaders.length; index += 2) {
    if (response.rawHeaders[index]!.toLowerCase() === name) values.push(response.rawHeaders[index + 1]!)
  }
  return values.length > 1 ? false : values[0] ?? null
}

/** No Promise.race: a result is released only after the request, response and
 * socket actually close. DNS has already completed and the lookup is pinned.
 * There is one request, one socket, no redirect/retry and no reusable pool. */
function readFrame(publication: FixedPublication, address: string, family: 4 | 6, signal: AbortSignal, expired: () => boolean): Promise<
  Readonly<{ status: 'body'; bytes: Buffer }> | Readonly<{ status: 'unavailable'; reason: Reason }>
> {
  return new Promise((resolve) => {
    const agent = new https.Agent({ keepAlive: false, maxSockets: 1, maxTotalSockets: 1 })
    let request: ReturnType<typeof https.request> | null = null, response: IncomingMessage | null = null, socket: Socket | null = null
    let requestClosed = false, responseClosed = true, socketClosed = true, ended = false, resolved = false
    let failure: Reason | null = null, received = 0, expected: number | null = null
    const chunks: Buffer[] = []
    const fail = (reason: Reason) => {
      failure ??= reason
      response?.destroy(); request?.destroy(); agent.destroy()
    }
    const finish = () => {
      if (resolved || !requestClosed || !responseClosed || !socketClosed) return
      resolved = true; signal.removeEventListener('abort', abort); agent.destroy()
      if (signal.aborted || expired()) failure ??= 'deadline'
      if (!failure && (!ended || received < 1 || (expected !== null && expected !== received))) failure = 'framing'
      const bytes = failure ? null : Buffer.concat(chunks, received)
      for (const chunk of chunks) chunk.fill(0)
      chunks.length = 0
      resolve(bytes ? { status: 'body', bytes } : { status: 'unavailable', reason: failure ?? 'http_failed' })
    }
    const abort = () => { fail('aborted'); finish() }
    const lookup: OfficialTruthServerOwnedRetrievalLookup = (hostname, options, callback) => {
      if (hostname !== publication.hostname || signal.aborted || expired()) {
        callback(Object.assign(new Error('fixed_source_unavailable'), { code: 'ECANCELED' })); return
      }
      if (options.all) callback(null, [{ address, family }])
      else callback(null, address, family)
    }
    try {
      if (signal.aborted || expired()) { agent.destroy(); resolve({ status: 'unavailable', reason: 'deadline' }); return }
      request = https.request({
        method: 'GET', protocol: 'https:', hostname: publication.hostname, port: 443, path: publication.path,
        servername: publication.hostname, rejectUnauthorized: true, agent, family, autoSelectFamily: false,
        lookup: lookup as unknown as NonNullable<https.RequestOptions['lookup']>,
        headers: { accept: 'text/html', 'accept-encoding': 'identity', 'cache-control': 'no-cache', connection: 'close' },
      }, (incoming) => {
        response = incoming; responseClosed = false
        incoming.once('close', () => { responseClosed = true; finish() })
        incoming.once('aborted', () => fail('framing'))
        incoming.once('error', () => fail('http_failed'))
        if (signal.aborted || expired()) { fail('deadline'); return }
        if (incoming.statusCode !== 200) {
          fail(incoming.statusCode !== undefined && incoming.statusCode >= 300 && incoming.statusCode < 400 ? 'redirect_refused' : 'http_status'); return
        }
        const type = headerOnce(incoming, 'content-type'), encoding = headerOnce(incoming, 'content-encoding')
        const length = headerOnce(incoming, 'content-length'), transfer = headerOnce(incoming, 'transfer-encoding')
        if (type === false || medientyp(type) !== publication.mediaType) { fail('content_type'); return }
        if (encoding === false || (encoding !== null && encoding.trim().toLowerCase() !== 'identity')) { fail('encoding'); return }
        if (length === false || transfer === false || (transfer !== null && transfer.trim().toLowerCase() !== 'chunked')
          || (length !== null && transfer !== null)) { fail('framing'); return }
        const size = inhaltLaenge(length)
        if (!size.ok) { fail('framing'); return }
        expected = size.value
        if (expected !== null && (expected < 1 || expected > publication.maximumBytes)) { fail('body_limit'); return }
        incoming.on('data', (chunk: Buffer) => {
          if (failure) return
          if (signal.aborted || expired()) { fail('deadline'); return }
          if (!Buffer.isBuffer(chunk) || chunks.length >= 1024 || received + chunk.length > publication.maximumBytes) { fail('body_limit'); return }
          received += chunk.length
          chunks.push(Buffer.from(chunk))
        })
        incoming.once('end', () => {
          ended = true
          if (!incoming.complete || (expected !== null && expected !== received)) fail('framing')
          finish()
        })
      })
      request.once('socket', (connected) => {
        socket = connected; socketClosed = false
        connected.once('close', () => { socketClosed = true; finish() })
      })
      request.once('error', () => { failure ??= 'http_failed'; response?.destroy(); agent.destroy() })
      request.once('close', () => {
        requestClosed = true
        if (!ended) failure ??= 'framing'
        response?.destroy(); socket?.destroy(); agent.destroy(); finish()
      })
      signal.addEventListener('abort', abort, { once: true })
      if (signal.aborted || expired()) abort()
      else request.end()
    } catch {
      failure ??= 'http_failed'
      if (request === null) { requestClosed = true; agent.destroy(); finish() }
      else { fail('http_failed'); finish() }
    }
  })
}

/** Only the two exported fixed readers can select this private operation.
 * The host, DNS, TLS, framing, clocks and full resource join remain server-owned. */
async function readOwned(role: AaChDeSourceRole, signal: AbortSignal, parentDeadline: number): Promise<AaChDeOwnedRead> {
  const publication = role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
  const start = performance.now(), startedAt = new Date().toISOString()
  if (!Number.isFinite(start) || !Number.isFinite(parentDeadline) || parentDeadline <= start || signal.aborted) return unavailable('aborted')
  if (active >= AA_CH_DE_PUBLICATION.maximumConcurrentReads) return unavailable('busy')
  active++
  const deadline = Math.min(parentDeadline, start + publication.maximumMilliseconds)
  const controller = new AbortController()
  let resolver: Resolver
  try { resolver = new Resolver({ timeout: 2000, tries: 1 }) }
  catch { active--; return unavailable('dns_failed') }
  const expired = () => { const now = performance.now(); return !Number.isFinite(now) || now < start || now >= deadline }
  const abort = () => { controller.abort(); resolver.cancel() }
  const timer = setTimeout(abort, Math.max(1, Math.ceil(deadline - start)))
  signal.addEventListener('abort', abort, { once: true })
  let bytes: Buffer | null = null, nativeStarted = false
  const attempt = (status: 'read' | 'unavailable', reason: Reason | null, completedAt = new Date().toISOString()): object | null => {
    if (!nativeStarted || completedAt < startedAt) return null
    const receipt = Object.freeze(Object.create(null) as object)
    attempts.set(receipt, Object.freeze({ role, requestUrl: publication.url, startedAt, completedAt, status, reason }))
    return receipt
  }
  const fail = (reason: Reason): AaChDeOwnedRead => unavailable(reason, attempt('unavailable', reason))
  try {
    if (signal.aborted || expired()) { abort(); return unavailable('aborted') }
    // Both requests are started and joined even if either native invocation
    // throws synchronously. Cancellation belongs only to this reader's resolver.
    const addresses = await Promise.allSettled([
      Promise.resolve().then(() => {
        if (controller.signal.aborted || expired()) throw new Error('fixed_source_cancelled')
        nativeStarted = true; return resolver.resolve4(publication.hostname)
      }),
      Promise.resolve().then(() => {
        if (controller.signal.aborted || expired()) throw new Error('fixed_source_cancelled')
        nativeStarted = true; return resolver.resolve6(publication.hostname)
      }),
    ])
    if (controller.signal.aborted || expired()) return fail('deadline')
    const candidates = addresses.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value.map(address => ({ address, family: (index === 0 ? 4 : 6) as 4 | 6 })) : [])
    if (!candidates.length || candidates.length > 64) return fail('dns_failed')
    if (candidates.some(candidate => !officialTruthServerOwnedRetrievalAdresseZulaessig(candidate.address))) return fail('address_refused')
    const chosen = candidates[0]!
    const frame = await readFrame(publication, chosen.address, chosen.family, controller.signal, expired)
    if (frame.status !== 'body') return fail(expired() ? 'deadline' : frame.reason)
    bytes = frame.bytes
    if (controller.signal.aborted || expired()) return fail('deadline')
    const decoded = textAus(bytes)
    if (!decoded.ok) return fail('invalid_text')
    const retrievedAt = new Date().toISOString()
    if (retrievedAt < startedAt || controller.signal.aborted || expired()) return fail('clock')
    const value: AaChDeOwnedOriginal = Object.freeze({ role, requestUrl: publication.url, finalUrl: publication.url,
      method: 'GET', redirectCount: 0, httpStatus: 200, contentType: publication.mediaType,
      bodyText: decoded.text, bytes: bytes.length, rawDigest: sha256Hex(decoded.text), retrievedAt, startedAt })
    const receipt = attempt('read', null, retrievedAt)
    if (!receipt) return unavailable('clock')
    originals.set(receipt, value)
    return Object.freeze({ status: 'read', receipt })
  } catch { return fail(controller.signal.aborted || expired() ? 'deadline' : 'http_failed') }
  finally {
    clearTimeout(timer); signal.removeEventListener('abort', abort)
    resolver.cancel(); bytes?.fill(0); active--
  }
}

export function readAaChDeOwnedSource(signal: AbortSignal, parentDeadline: number): Promise<AaChDeOwnedRead> {
  return readOwned('primary', signal, parentDeadline)
}
export function readBernChDeOwnedSource(signal: AbortSignal, parentDeadline: number): Promise<AaChDeOwnedRead> {
  return readOwned('counter', signal, parentDeadline)
}
/** One bounded attempt per publication. No URL parameter, fallback or retry. */
export async function readAaChDeOwnedSources(signal: AbortSignal, parentDeadline: number): Promise<
  Readonly<{ primary: AaChDeOwnedRead; counter: AaChDeOwnedRead }>
> {
  const results = await Promise.allSettled([
    readAaChDeOwnedSource(signal, parentDeadline), readBernChDeOwnedSource(signal, parentDeadline),
  ])
  return Object.freeze({ primary: results[0].status === 'fulfilled' ? results[0].value : unavailable('http_failed'),
    counter: results[1].status === 'fulfilled' ? results[1].value : unavailable('http_failed') })
}
