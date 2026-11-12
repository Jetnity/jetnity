// Internal shared physical implementation. The Reader and AA research probe are the only module consumers.
import 'server-only'

import { lookup as dnsLookup } from 'node:dns'
import type { IncomingMessage } from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { officialTruthBoundedResponseBody } from '@/lib/readiness/official-truth-bounded-response-body'
import type { QuellenUrlFehler } from '@/lib/readiness/source-registry'

const UMLEITUNG = new Set([301, 302, 303, 307, 308])
const FESTE_HEADER = Object.freeze({
  'accept-encoding': 'identity',
  'cache-control': 'no-cache',
})

const IPV4_GESPERRT: readonly (readonly [number, number])[] = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0000200, 24],
  [0xc0586300, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xc6336400, 24],
  [0xcb007100, 24],
  [0xe0000000, 4],
  [0xf0000000, 4],
]

export type OfficialTruthServerOwnedRetrievalSperrgrund =
  | 'content_not_eligible'
  | 'identity_profile_unavailable'
  | 'content_identity_mismatch'
  | 'representation_url_mismatch'
  | 'content_type_mismatch'
  | QuellenUrlFehler
  | 'caller_authority_forbidden'
  | 'sensitive_personal_field'
  | 'unexpected_fields'
  | 'invalid_request'
  | 'catalog_not_configured'
  | 'catalog_failed'
  | 'tracking_parameter'
  | 'url_source_mismatch'
  | 'redirect_source_mismatch'
  | 'source_not_official_authority'
  | 'address_not_permitted'
  | 'non_default_port'
  | 'dns_failed'
  | 'dns_empty'
  | 'redirect_rejected'
  | 'redirect_loop'
  | 'redirect_limit'
  | 'http_status'
  | 'http_failed'
  | 'response_too_large'
  | 'invalid_utf8'
  | 'empty_body'
  | 'timeout'
  | 'invalid_retrieval_time'
  | 'invalid_source_snapshot'

export type OfficialTruthServerOwnedRetrievalAdresse = {
  readonly address: string
  readonly family: 4 | 6
}

export type OfficialTruthServerOwnedRetrievalDnsResolver = (
  hostname: string,
) => Promise<readonly OfficialTruthServerOwnedRetrievalAdresse[]>

export type OfficialTruthServerOwnedRetrievalLookup = (
  hostname: string,
  options: { all?: boolean },
  callback: (
    error: NodeJS.ErrnoException | null,
    address?: string | readonly { address: string; family: number }[],
    family?: number,
  ) => void,
) => void

type HttpKopf = { get(name: string): string | null }

export type OfficialTruthServerOwnedRetrievalHttpErgebnis =
  | {
      ok: true
      status: number
      headers: HttpKopf
      body: AsyncIterable<Uint8Array> | null
      cancel?: () => void
      /** Native HTTP parser framing proof; ignored by existing official retrieval. */
      framingComplete?: () => boolean
    }
  | { ok: false; reason: 'address_not_permitted' | 'dns_failed' | 'dns_empty' | 'timeout' | 'http_failed' }

export type OfficialTruthServerOwnedRetrievalHttpClient = (anfrage: {
  url: string
  lookup: OfficialTruthServerOwnedRetrievalLookup
  signal: AbortSignal
  headers: Readonly<Record<string, string>>
}) => Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis>

function lookupFehler(code: string): NodeJS.ErrnoException {
  const fehler = new Error(code) as NodeJS.ErrnoException
  fehler.code = code
  return fehler
}

function ipv4Zahl(adresse: string): number | null {
  const teile = adresse.split('.')
  if (teile.length !== 4) return null
  let wert = 0
  for (const teil of teile) {
    if (!/^(0|[1-9]\d{0,2})$/.test(teil)) return null
    const zahl = Number(teil)
    if (zahl > 255) return null
    wert = wert * 256 + zahl
  }
  return wert >>> 0
}

function ipv4ImNetz(ip: number, basis: number, bits: number): boolean {
  const maske = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return (ip & maske) === (basis & maske)
}

function ipv4Oeffentlich(adresse: string): boolean {
  const zahl = ipv4Zahl(adresse)
  if (zahl == null) return false
  return !IPV4_GESPERRT.some(([basis, bits]) => ipv4ImNetz(zahl, basis, bits))
}

function ipv6Gruppen(adresse: string): number[] | null {
  let text = adresse.trim().toLowerCase()
  if (!text || text.includes('%')) return null
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1)
  const punkt = text.lastIndexOf('.')
  if (punkt !== -1) {
    const doppelpunkt = text.lastIndexOf(':', punkt)
    if (doppelpunkt === -1) return null
    const zahl = ipv4Zahl(text.slice(doppelpunkt + 1))
    if (zahl == null) return null
    const hoch = ((zahl >>> 16) & 0xffff).toString(16)
    const niedrig = (zahl & 0xffff).toString(16)
    text = `${text.slice(0, doppelpunkt + 1)}${hoch}:${niedrig}`
  }
  const haelften = text.split('::')
  if (haelften.length > 2) return null
  const links = haelften[0] ? haelften[0].split(':') : []
  if (haelften.length === 1) return gruppenAus(links)
  const rechts = haelften[1] ? haelften[1].split(':') : []
  if (links.length + rechts.length > 7) return null
  const mitte = Array<string>(8 - links.length - rechts.length).fill('0')
  return gruppenAus([...links, ...mitte, ...rechts])
}

function gruppenAus(teile: string[]): number[] | null {
  if (teile.length !== 8) return null
  const gruppen: number[] = []
  for (const teil of teile) {
    if (!/^[0-9a-f]{1,4}$/.test(teil)) return null
    gruppen.push(Number.parseInt(teil, 16))
  }
  return gruppen
}

function ipv4AusGruppen(hoch: number, niedrig: number): string {
  const zahl = ((hoch & 0xffff) << 16) | (niedrig & 0xffff)
  return [(zahl >>> 24) & 255, (zahl >>> 16) & 255, (zahl >>> 8) & 255, zahl & 255].join('.')
}

function ipv6Oeffentlich(adresse: string): boolean {
  const gruppen = ipv6Gruppen(adresse)
  if (!gruppen) return false
  const [a, b, c, d, e, f, g, h] = gruppen
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0 && g === 0 && h === 0) return false
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0 && g === 0 && h === 1) return false
  if ((a & 0xfe00) === 0xfc00) return false
  if ((a & 0xffc0) === 0xfe80) return false
  if ((a & 0xffc0) === 0xfec0) return false
  if ((a & 0xff00) === 0xff00) return false
  if (a === 0x2001 && b === 0x0db8) return false
  if (a === 0x0100 && b === 0 && c === 0 && d === 0) return false
  if (a === 0x2001 && b === 0x0002 && c === 0x0000) return false
  if (a === 0x2001 && (b & 0xfff0) === 0x0010) return false
  if (a === 0x2001 && (b & 0xfff0) === 0x0020) return false
  if (a === 0x3ffe) return false
  if (a === 0x2001 && b === 0x0000) return false
  if (a === 0x0064 && b === 0xff9b && c === 0x0001) return false
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0xffff) {
    return ipv4Oeffentlich(ipv4AusGruppen(g, h))
  }
  if (a === 0x2002) return ipv4Oeffentlich(ipv4AusGruppen(b, c))
  if (a === 0x0064 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) {
    return ipv4Oeffentlich(ipv4AusGruppen(g, h))
  }
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && f === 0) return false
  return true
}

/** Öffentliche, routbare Unicast-Adresse. Jede andere Form scheitert geschlossen. */
export function officialTruthServerOwnedRetrievalAdresseZulaessig(adresse: string): boolean {
  if (typeof adresse !== 'string') return false
  const art = net.isIP(adresse)
  if (art === 4) return ipv4Oeffentlich(adresse)
  if (art === 6) return ipv6Oeffentlich(adresse)
  return false
}

function familiePasst(adresse: string, familie: number): familie is 4 | 6 {
  if (familie === 4) return net.isIP(adresse) === 4
  if (familie === 6) return net.isIP(adresse) === 6
  return false
}

function lookupAntwort(
  adressen: readonly OfficialTruthServerOwnedRetrievalAdresse[],
  alle: boolean,
  callback: OfficialTruthServerOwnedRetrievalLookup extends (
    hostname: string,
    options: { all?: boolean },
    callback: infer Rueckruf,
  ) => void
    ? Rueckruf
    : never,
): void {
  if (!Array.isArray(adressen) || adressen.length === 0) {
    callback(lookupFehler('JETNITY_DNS_EMPTY'))
    return
  }
  const geprueft: { address: string; family: 4 | 6 }[] = []
  for (const eintrag of adressen) {
    if (!eintrag || !familiePasst(eintrag.address, eintrag.family)) {
      callback(lookupFehler('JETNITY_DNS_FAILED'))
      return
    }
    if (!officialTruthServerOwnedRetrievalAdresseZulaessig(eintrag.address)) {
      callback(lookupFehler('JETNITY_ADDRESS_NOT_PERMITTED'))
      return
    }
    geprueft.push({ address: eintrag.address, family: eintrag.family })
  }
  if (alle) {
    callback(null, geprueft)
    return
  }
  const erste = geprueft[0]
  if (!erste) {
    callback(lookupFehler('JETNITY_DNS_EMPTY'))
    return
  }
  callback(null, erste.address, erste.family)
}

/**
 * Lookup für genau einen Verbindungsversuch.
 * Eine unerlaubte Adresse in der Antwort wird nicht an den Connector gegeben.
 */
export function officialTruthServerOwnedRetrievalLookup(
  resolve: OfficialTruthServerOwnedRetrievalDnsResolver,
): OfficialTruthServerOwnedRetrievalLookup {
  return (hostname, options, callback) => {
    const rueckruf = typeof options === 'function' ? options : callback
    const alle = typeof options === 'function' ? false : options?.all === true
    if (typeof hostname !== 'string' || !hostname.trim() || typeof rueckruf !== 'function') {
      if (typeof rueckruf === 'function') rueckruf(lookupFehler('JETNITY_DNS_FAILED'))
      return
    }
    const art = net.isIP(hostname)
    if (art === 4 || art === 6) {
      lookupAntwort([{ address: hostname, family: art }], alle, rueckruf)
      return
    }
    void Promise.resolve()
      .then(() => resolve(hostname))
      .then((adressen) => {
        lookupAntwort(adressen, alle, rueckruf)
      })
      .catch(() => {
        rueckruf(lookupFehler('JETNITY_DNS_FAILED'))
      })
  }
}

export function medientyp(wert: string | null): string | null {
  if (wert == null) return null
  if (wert.includes(',')) return null
  const teile = wert.split(';')
  const roh = teile.shift()?.trim().toLowerCase() ?? ''
  if (!roh || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(roh)) return null
  let charset = false
  for (const parameter of teile) {
    const teil = parameter.trim()
    if (/^charset\s*=/i.test(teil)) {
      if (charset || !/^charset\s*=\s*(?:utf-8|"utf-8")$/i.test(teil)) return null
      charset = true
    } else return null
  }
  return roh
}

export function inhaltLaenge(wert: string | null): { ok: true; value: number | null } | { ok: false } {
  if (wert == null) return { ok: true, value: null }
  const text = wert.trim()
  if (!/^\d+$/.test(text)) return { ok: false }
  const zahl = Number(text)
  return Number.isSafeInteger(zahl) ? { ok: true, value: zahl } : { ok: false }
}

export function textAus(bytes: Uint8Array): { ok: true; text: string } | { ok: false; reason: 'invalid_utf8' | 'empty_body' } {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty_body' }
  if (bytes.byteLength >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { ok: false, reason: 'invalid_utf8' }
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text) return { ok: false, reason: 'empty_body' }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'invalid_utf8' }
  }
}

export function uhrLesen(now: () => Date): string | null {
  let wert: unknown
  try {
    wert = now()
  } catch {
    return null
  }
  if (!(wert instanceof Date) || !Number.isFinite(wert.getTime())) return null
  return wert.toISOString()
}

function httpGrund(error: NodeJS.ErrnoException): 'address_not_permitted' | 'dns_failed' | 'dns_empty' | 'timeout' | 'http_failed' {
  const code = error.code || error.message
  if (code === 'JETNITY_ADDRESS_NOT_PERMITTED') return 'address_not_permitted'
  if (code === 'JETNITY_DNS_EMPTY') return 'dns_empty'
  if (code === 'JETNITY_DNS_FAILED') return 'dns_failed'
  if (code === 'ABORT_ERR' || error.name === 'AbortError') return 'timeout'
  return 'http_failed'
}

export function serverDns(hostname: string): Promise<readonly OfficialTruthServerOwnedRetrievalAdresse[]> {
  return new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (error, adressen) => {
      if (error) {
        reject(error)
        return
      }
      resolve(
        adressen.map((eintrag) => ({
          address: eintrag.address,
          family: eintrag.family === 6 ? 6 : 4,
        })),
      )
    })
  })
}

async function* bytesAusAntwort(antwort: IncomingMessage): AsyncGenerator<Uint8Array> {
  for await (const stueck of antwort) {
    yield typeof stueck === 'string' ? Buffer.from(stueck) : stueck
  }
}

export function serverHttp(anfrage: {
  url: string
  lookup: OfficialTruthServerOwnedRetrievalLookup
  signal: AbortSignal
}): Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis> {
  return new Promise((resolve) => {
    let erledigt = false
    const fertig = (wert: OfficialTruthServerOwnedRetrievalHttpErgebnis) => {
      if (erledigt) return
      erledigt = true
      resolve(wert)
    }
    let gelesen: URL
    try {
      gelesen = new URL(anfrage.url)
    } catch {
      fertig({ ok: false, reason: 'http_failed' })
      return
    }
    if (gelesen.protocol !== 'https:' || (gelesen.port !== '' && gelesen.port !== '443')) {
      fertig({ ok: false, reason: 'http_failed' })
      return
    }
    const hostname = gelesen.hostname.startsWith('[') ? gelesen.hostname.slice(1, -1) : gelesen.hostname
    const agent = new https.Agent({ keepAlive: false, maxSockets: 1 })
    const req = https.request(
      {
        method: 'GET',
        protocol: 'https:',
        hostname,
        port: 443,
        path: `${gelesen.pathname}${gelesen.search}`,
        headers: { ...FESTE_HEADER },
        lookup: anfrage.lookup as unknown as NonNullable<https.RequestOptions['lookup']>,
        servername: hostname,
        rejectUnauthorized: true,
        agent,
      },
      (antwort) => {
        fertig({
          ok: true,
          status: antwort.statusCode ?? 0,
          headers: {
            get(name: string) {
              const header = antwort.headers[name.toLowerCase()]
              if (Array.isArray(header)) return header.join(', ')
              return header ?? null
            },
          },
          body: bytesAusAntwort(antwort),
          framingComplete: () => antwort.complete,
          cancel: () => {
            antwort.destroy()
            req.destroy()
          },
        })
      },
    )
    const abbruch = () => {
      req.destroy()
      agent.destroy()
      fertig({ ok: false, reason: 'timeout' })
    }
    if (anfrage.signal.aborted) {
      abbruch()
      return
    }
    anfrage.signal.addEventListener('abort', abbruch, { once: true })
    req.on('error', (error: NodeJS.ErrnoException) => {
      anfrage.signal.removeEventListener('abort', abbruch)
      agent.destroy()
      fertig({ ok: false, reason: httpGrund(error) })
    })
    req.on('close', () => {
      agent.destroy()
    })
    req.end()
  })
}

export function serverUhr(): Date {
  return new Date()
}

type HopKörper =
  | { art: 'bytes'; bytes: Uint8Array; contentType: string | null }
  | { art: 'redirect'; location: string | null }
  | { art: 'blocked'; reason: OfficialTruthServerOwnedRetrievalSperrgrund }

export function abbruch(signal: AbortSignal): Promise<{ ok: false; reason: 'timeout' }> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve({ ok: false, reason: 'timeout' })
      return
    }
    signal.addEventListener('abort', () => resolve({ ok: false, reason: 'timeout' }), { once: true })
  })
}

export async function hopLesen(
  http: OfficialTruthServerOwnedRetrievalHttpClient,
  url: string,
  lookup: OfficialTruthServerOwnedRetrievalLookup,
  signal: AbortSignal,
  maxBytesForMediaType: (mediaType: string | null) => number,
): Promise<HopKörper> {
  let antwort: OfficialTruthServerOwnedRetrievalHttpErgebnis
  try {
    antwort = await Promise.race([
      http({ url, lookup, signal, headers: { ...FESTE_HEADER } }),
      abbruch(signal),
    ])
  } catch {
    return { art: 'blocked', reason: signal.aborted ? 'timeout' : 'http_failed' }
  }
  if (!antwort.ok) return { art: 'blocked', reason: antwort.reason }
  if (signal.aborted) return { art: 'blocked', reason: 'timeout' }
  if (UMLEITUNG.has(antwort.status)) {
    const location = antwort.headers.get('location')
    antwort.cancel?.()
    return { art: 'redirect', location }
  }
  if (antwort.status < 200 || antwort.status >= 300) {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'http_status' }
  }
  const contentEncoding = antwort.headers.get('content-encoding')
  if (contentEncoding != null && contentEncoding.trim().toLowerCase() !== 'identity') {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'http_failed' }
  }
  const contentType = medientyp(antwort.headers.get('content-type'))
  if (contentType == null) {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'content_type_mismatch' }
  }
  const maxBytes = maxBytesForMediaType(contentType)
  const laenge = inhaltLaenge(antwort.headers.get('content-length'))
  if (!laenge.ok) {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'http_failed' }
  }
  if (laenge.value != null && laenge.value > maxBytes) {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'response_too_large' }
  }
  const koerper = await Promise.race([
    officialTruthBoundedResponseBody(antwort.body, signal, maxBytes, antwort.cancel),
    abbruch(signal),
  ])
  if (!koerper.ok) {
    antwort.cancel?.()
    return { art: 'blocked', reason: koerper.reason }
  }
  return { art: 'bytes', bytes: koerper.bytes, contentType }
}

