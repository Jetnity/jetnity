import 'server-only'
import { isIP } from 'node:net'
import { normalizePreview, type KayakSearch, type KayakPreview } from './contract'

const ORIGIN = 'https://sandbox-en-us.kayakaffiliates.com'
const MAX_BYTES = 8 * 1024 * 1024
export class KayakFailure extends Error {
  constructor(readonly status: number, readonly reason: 'unavailable' | 'limited' | 'invalid' = 'unavailable') { super(reason) }
}

export function buildSearch(input: KayakSearch): { query: Record<string, string>; body?: unknown } {
  if (input.kind === 'hotels') {
    const rooms = Array.from({ length: input.rooms }, (_, i) => Math.floor(input.adults / input.rooms) + (i < input.adults % input.rooms ? 1 : 0)).join('|')
    return { query: { destination: `klatlon:${input.latitude},${input.longitude}`, checkin: input.checkIn, checkout: input.checkOut, rooms, languageCode: 'EN', currencyCode: 'USD', searchTimeout: '5000', pageSize: '24', pageIndex: '0', responseOptions: 'toprates,images', includeTaxesInTotal: 'true', includeLocalTaxesInTotal: 'true' } }
  }
  const leg = (origin: string, destination: string, date: string) => ({ origin: { locationType: 'airports', airports: [origin] }, destination: { locationType: 'airports', airports: [destination] }, date, flex: 'exact' })
  return { query: {}, body: { searchStartParameters: { cabin: input.cabin, passengers: Array.from({ length: input.adults }, () => 'ADT'), legs: [leg(input.origin, input.destination, input.departure), ...(input.returnDate ? [leg(input.destination, input.origin, input.returnDate)] : [])] } } }
}

export async function searchKayak(input: KayakSearch, options: { key: string; clientIp: string; userTrackId: string; signal?: AbortSignal; fetcher?: typeof fetch; pause?: (ms: number) => Promise<void>; allowRequest: () => Promise<boolean> }): Promise<KayakPreview> {
  if (!options.key || !isIP(options.clientIp)) throw new KayakFailure(503)
  const cookies = new Map<string, string>()
  let { query, body } = buildSearch(input)
  const totalSignal = AbortSignal.any([AbortSignal.timeout(50000), ...(options.signal ? [options.signal] : [])])
  const fetcher = options.fetcher ?? fetch
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      totalSignal.throwIfAborted()
      if (!(await options.allowRequest())) throw new KayakFailure(429, 'limited')
      const url = new URL(input.kind === 'hotels' ? '/api/3.0/hotels' : '/i/api/affiliate/search/flight/v1/poll', ORIGIN)
      Object.entries({ ...query, apiKey: options.key, userTrackId: options.userTrackId }).forEach(([name, value]) => url.searchParams.set(name, value))
      const response = await fetcher(url, { method: input.kind === 'hotels' ? 'GET' : 'POST', redirect: 'manual', cache: 'no-store', signal: AbortSignal.any([totalSignal, AbortSignal.timeout(12000)]), headers: { accept: 'application/json', 'user-agent': 'Jetnity-KAYAK-Preview/1.0', 'x-original-client-ip': options.clientIp, ...(body ? { 'content-type': 'application/json' } : {}), ...(cookies.size ? { cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
      if (!response.ok) { await response.body?.cancel(); throw new KayakFailure(response.status === 429 ? 429 : 502, response.status === 429 ? 'limited' : 'unavailable') }
      if (Number(response.headers.get('content-length')) > MAX_BYTES || !response.body) { await response.body?.cancel(); throw new KayakFailure(502) }
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';', 1)[0], split = pair.indexOf('=')
        if (split > 0 && pair.length < 8192 && cookies.size < 30) cookies.set(pair.slice(0, split), pair.slice(split + 1))
      }
      const reader = response.body.getReader(), chunks: Uint8Array[] = []
      let bytes = 0
      try {
        for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > MAX_BYTES) throw new KayakFailure(502); chunks.push(value) }
      } finally { await reader.cancel().catch(() => {}) }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
      const normalized = normalizePreview(input.kind, data)
      if (normalized.complete || attempt === 2) return normalized
      if (input.kind === 'flights') {
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(String(data.searchId ?? '')) || !/^\d{1,8}$/.test(String(data.cluster ?? ''))) throw new KayakFailure(502)
        body = { searchId: data.searchId }; query = { cluster: String(data.cluster) }
      }
      if (options.pause) await options.pause(5000)
      else await new Promise<void>((resolve, reject) => {
        if (totalSignal.aborted) { reject(new KayakFailure(503)); return }
        const onAbort = () => { clearTimeout(timer); reject(new KayakFailure(503)) }
        const timer = setTimeout(() => { totalSignal.removeEventListener('abort', onAbort); resolve() }, 5000)
        totalSignal.addEventListener('abort', onAbort, { once: true })
      })
    }
    throw new KayakFailure(502)
  } catch (error) { if (error instanceof KayakFailure) throw error; throw new KayakFailure(502) }
}
