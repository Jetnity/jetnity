import 'server-only'

import { Resolver } from 'node:dns/promises'
import type { IncomingMessage } from 'node:http'
import https from 'node:https'
import net from 'node:net'
import type { Socket } from 'node:net'
import { bindAtOfficialRetrieval, type AtBindResult, type AtRetrievalInput } from './bind'
import {
  AT_OFFICIAL_MAXIMUM_MILLISECONDS,
  AT_OFFICIAL_PUBLICATIONS,
  atOfficialPublicationById,
  type AtOfficialPublication,
} from './publications'

export type AtTransportReason =
  | 'url_not_pinned'
  | 'dns_failed'
  | 'address_refused'
  | 'http_failed'
  | 'http_status'
  | 'redirect_refused'
  | 'encoding'
  | 'body_limit'
  | 'framing'
  | 'timeout'
  | 'clock'

export type AtTransportResult =
  | Readonly<{ ok: true; retrieval: AtRetrievalInput }>
  | Readonly<{ ok: false; publicationId: string; reason: AtTransportReason }>

export type AtOfficialTransport = (
  publication: AtOfficialPublication,
  signal: AbortSignal,
) => Promise<AtTransportResult>

export function atOfficialAddressAllowed(address: string): boolean {
  const kind = net.isIP(address)
  if (kind === 4) return ipv4Allowed(address)
  if (kind === 6) return ipv6Allowed(address)
  return false
}

function ipv4Allowed(address: string): boolean {
  const numbers = address.split('.').map(part => Number(part))
  if (numbers.length !== 4 || numbers.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false
  const a = numbers[0] ?? 0
  const b = numbers[1] ?? 0
  const c = numbers[2] ?? 0
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && (b === 168 || (b === 0 && c === 2))) return false
  if (a === 198 && b === 51 && c === 100) return false
  if (a === 203 && b === 0 && c === 113) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a >= 224) return false
  return true
}

function ipv6Allowed(address: string): boolean {
  const lower = address.toLowerCase()
  if (lower.includes('.') || lower.includes('ffff') || lower === '::' || lower === '::1') return false
  const first = lower.split(':')[0] ?? ''
  if (first === '' || lower.startsWith('2001:db8')) return false
  const head = Number.parseInt(first, 16)
  return Number.isInteger(head) && head >= 0x2000 && head <= 0x3fff
}

function publicationPinned(publication: AtOfficialPublication): boolean {
  const known = atOfficialPublicationById(publication.id)
  return known !== null && known.url === publication.url && known.hostname === publication.hostname
    && known.path === publication.path && known.expectedTitle === publication.expectedTitle
}

function headerOnce(response: IncomingMessage, name: string): string | null | false {
  const values: string[] = []
  for (let index = 0; index < response.rawHeaders.length; index += 2) {
    if (response.rawHeaders[index]?.toLowerCase() === name) values.push(response.rawHeaders[index + 1] ?? '')
  }
  return values.length > 1 ? false : values[0] ?? null
}

function readBody(publication: AtOfficialPublication, address: string, family: 4 | 6, signal: AbortSignal): Promise<
  Readonly<{ ok: true; body: Uint8Array; contentType: string | null; lastModified: string | null }>
  | Readonly<{ ok: false; reason: AtTransportReason }>
> {
  return new Promise(resolve => {
    const agent = new https.Agent({ keepAlive: false, maxSockets: 1, maxTotalSockets: 1 })
    let settled = false
    const finish = (result: { ok: true; body: Uint8Array; contentType: string | null; lastModified: string | null } | { ok: false; reason: AtTransportReason }) => {
      if (settled) return
      settled = true
      agent.destroy()
      resolve(result)
    }
    const lookup = (hostname: string, options: { all?: boolean }, callback: (error: NodeJS.ErrnoException | null, address?: unknown, family?: number) => void) => {
      if (hostname !== publication.hostname || signal.aborted) {
        callback(Object.assign(new Error('fixed_source_unavailable'), { code: 'ECANCELED' }))
        return
      }
      if (options.all) callback(null, [{ address, family }])
      else callback(null, address, family)
    }
    const request = https.request({
      method: 'GET',
      protocol: 'https:',
      hostname: publication.hostname,
      port: 443,
      path: publication.path,
      servername: publication.hostname,
      rejectUnauthorized: true,
      agent,
      family,
      lookup: lookup as unknown as NonNullable<https.RequestOptions['lookup']>,
      headers: {
        accept: 'text/html',
        'accept-encoding': 'identity',
        'cache-control': 'no-cache',
        connection: 'close',
        'user-agent': 'JetnityAtSourceReader/1',
      },
    }, (incoming) => {
      const chunks: Buffer[] = []
      let received = 0
      const fail = (reason: AtTransportReason) => {
        incoming.destroy()
        request.destroy()
        finish({ ok: false, reason })
      }
      if (signal.aborted) { fail('timeout'); return }
      const status = incoming.statusCode ?? 0
      if (status >= 300 && status < 400) { fail('redirect_refused'); return }
      if (status !== 200) { fail('http_status'); return }
      const encoding = headerOnce(incoming, 'content-encoding')
      const type = headerOnce(incoming, 'content-type')
      const length = headerOnce(incoming, 'content-length')
      const modified = headerOnce(incoming, 'last-modified')
      if (type === false || encoding === false || length === false || modified === false) { fail('framing'); return }
      if (encoding !== null && encoding.trim().toLowerCase() !== 'identity') { fail('encoding'); return }
      if (length !== null && (!/^\d+$/.test(length.trim()) || Number(length) > publication.maximumBytes || Number(length) < 1)) {
        fail('body_limit'); return
      }
      incoming.on('data', (chunk: Buffer) => {
        if (!Buffer.isBuffer(chunk) || received + chunk.length > publication.maximumBytes) { fail('body_limit'); return }
        received += chunk.length
        chunks.push(Buffer.from(chunk))
      })
      incoming.once('aborted', () => fail('framing'))
      incoming.once('error', () => fail('http_failed'))
      incoming.once('end', () => {
        if (!incoming.complete || (length !== null && Number(length) !== received) || received < 1) { fail('framing'); return }
        finish({ ok: true, body: Buffer.concat(chunks, received), contentType: type, lastModified: modified })
      })
    })
    const abort = () => { request.destroy(); finish({ ok: false, reason: 'timeout' }) }
    signal.addEventListener('abort', abort, { once: true })
    request.once('error', () => finish({ ok: false, reason: signal.aborted ? 'timeout' : 'http_failed' }))
    request.once('socket', (socket: Socket) => { socket.setTimeout(AT_OFFICIAL_MAXIMUM_MILLISECONDS, abort) })
    request.end()
  })
}

/** One pinned GET. Redirects, private addresses and unpinned URLs are refused.
 * The body is not retained after the caller binds it. */
export async function readAtOfficialPublicationHttps(publication: AtOfficialPublication, signal: AbortSignal): Promise<AtTransportResult> {
  if (!publicationPinned(publication)) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'url_not_pinned' })
  const startedAt = new Date().toISOString()
  if (signal.aborted) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'timeout' })
  const resolver = new Resolver({ timeout: 2000, tries: 1 })
  const abort = () => resolver.cancel()
  signal.addEventListener('abort', abort, { once: true })
  try {
    const lookedUp = await Promise.allSettled([
      resolver.resolve4(publication.hostname),
      resolver.resolve6(publication.hostname),
    ])
    if (signal.aborted) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'timeout' })
    const candidates = lookedUp.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value.map(address => ({ address, family: (index === 0 ? 4 : 6) as 4 | 6 }))
      : [])
    if (candidates.length < 1 || candidates.length > 64) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'dns_failed' })
    if (candidates.some(candidate => !atOfficialAddressAllowed(candidate.address))) {
      return Object.freeze({ ok: false, publicationId: publication.id, reason: 'address_refused' })
    }
    const chosen = candidates[0]
    if (!chosen) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'dns_failed' })
    const frame = await readBody(publication, chosen.address, chosen.family, signal)
    if (!frame.ok) return Object.freeze({ ok: false, publicationId: publication.id, reason: frame.reason })
    const retrievedAt = new Date().toISOString()
    if (retrievedAt < startedAt) return Object.freeze({ ok: false, publicationId: publication.id, reason: 'clock' })
    return Object.freeze({
      ok: true,
      retrieval: Object.freeze({
        publicationId: publication.id,
        requestUrl: publication.url,
        finalUrl: publication.url,
        redirectCount: 0,
        httpStatus: 200,
        contentType: frame.contentType,
        body: frame.body,
        startedAt,
        retrievedAt,
        lastModifiedHeader: frame.lastModified,
      }),
    })
  } catch {
    return Object.freeze({ ok: false, publicationId: publication.id, reason: signal.aborted ? 'timeout' : 'dns_failed' })
  } finally {
    signal.removeEventListener('abort', abort)
    resolver.cancel()
  }
}

export async function readAtOfficialPackage(transport: AtOfficialTransport, signal: AbortSignal): Promise<readonly AtBindResult[]> {
  const results: AtBindResult[] = []
  for (const publication of AT_OFFICIAL_PUBLICATIONS) {
    if (signal.aborted) {
      results.push(Object.freeze({ status: 'rejected', publicationId: publication.id, reason: 'timeout' }))
      continue
    }
    let reply: AtTransportResult
    try {
      reply = await transport(publication, signal)
    } catch {
      results.push(Object.freeze({ status: 'rejected', publicationId: publication.id, reason: 'http_failed' }))
      continue
    }
    if (!reply.ok) {
      results.push(Object.freeze({ status: 'rejected', publicationId: publication.id, reason: reply.reason }))
      continue
    }
    if (reply.retrieval.publicationId !== publication.id) {
      results.push(Object.freeze({ status: 'rejected', publicationId: publication.id, reason: 'url_mismatch' }))
      continue
    }
    results.push(bindAtOfficialRetrieval(reply.retrieval))
  }
  return Object.freeze(results)
}
