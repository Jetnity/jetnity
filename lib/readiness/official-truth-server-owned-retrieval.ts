// lib/readiness/official-truth-server-owned-retrieval.ts
//
// Servereigene HTTPS-Lesung einer amtlichen Quelle.
// Der Aufrufer darf nur sourceId und url vorschlagen. Beides ist keine
// Autorität. Der Katalog bleibt serverseitig. Die TCP-Verbindung benutzt
// genau die Adresse, die dieselbe Lookup-Prüfung freigegeben hat.
// Ein Katalog-Hostname erlaubt nur den Standard-HTTPS-Port 443.
// Fragmente gehören nicht zur HTTP-Anfrage und nicht zur Provenienz.
//
// Das Ergebnis ist flüchtiges Material dieses Aufrufs. Es ist kein
// eingereichtes Abrufmaterial, keine Evidence, kein Regel-Kandidat,
// keine Annahme und keine Bearer-Fähigkeit.
// Der Live-Einstieg ist loadOfficialTruthServerOwnedRetrieval().
// decideOfficialTruthServerOwnedRetrieval ist nur die Testnaht.

import 'server-only'

import { lookup as dnsLookup } from 'node:dns'
import type { IncomingMessage } from 'node:http'
import https from 'node:https'
import net from 'node:net'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import {
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogAbhaengigkeiten,
} from '@/lib/readiness/official-truth-source-catalog-server'
import {
  quellenUrlAufloesen,
  type QuellenRegistry,
  type QuellenUrlFehler,
} from '@/lib/readiness/source-registry'

const TIEFE_MAX = 8
const REDIRECT_MAX = 5
const BODY_MAX = 65_536
const TIMEOUT_MS = 10_000
const UMLEITUNG = new Set([301, 302, 303, 307, 308])

const FESTE_HEADER = Object.freeze({
  'accept-encoding': 'identity',
  'cache-control': 'no-cache',
})

/** Reine Tracking-Namen, dieselbe Menge wie das eingereichte Abrufmaterial. `lang` bleibt zulässig. */
const TRACKING_NAMEN = new Set(['gclid', 'dclid', 'fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid'])

const AUTORITAET = new Set([
  'registry',
  'sourceClass',
  'source_class',
  'domains',
  'blockedDomains',
  'blocked_domains',
  'sourceSnapshot',
  'source_snapshot',
  'body',
  'bytes',
  'response',
  'sourceContentHash',
  'source_content_hash',
  'contentHash',
  'content_hash',
  'content',
  'retrievedAt',
  'retrieved_at',
  'clock',
  'now',
  'contentType',
  'content_type',
  'responseContentType',
  'responseStatus',
  'response_status',
  'status',
  'redirect',
  'redirects',
  'redirectHistory',
  'redirect_history',
  'location',
  'dns',
  'address',
  'addresses',
  'ip',
  'receipt',
  'attestation',
  'retrievalReceipt',
  'evidence',
  'evidenceVersion',
  'evidenceVersions',
  'EvidenceVersion',
  'candidate',
  'kandidat',
  'trustedRuleFact',
  'witness',
  'reviewPacketKey',
  'model',
  'suggestion',
  'reviewSuggestion',
  'decision',
  'credentials',
  'cookie',
  'cookies',
  'authorization',
  'headers',
  'schemaFamily',
  'schema_family',
  'provider',
])

const PERSONEN = new Set([
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'tripId',
  'trip_id',
  'travellerId',
  'travellerClientRef',
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'mrz',
  'biometric',
  'biometrics',
  'dateOfBirth',
  'dob',
  'birthDate',
  'email',
  'fullName',
  'givenName',
  'familyName',
  'phone',
])

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

export type OfficialTruthServerOwnedRetrievalErgebnis =
  | {
      readonly status: 'server_owned_official_retrieval'
      readonly sourceId: string
      readonly canonicalUrl: string
      readonly retrievedAt: string
      readonly contentType: string | null
      readonly sourceSnapshot: string
      readonly sourceContentHash: string
      readonly redirectCount: number
    }
  | {
      readonly status: 'blocked'
      readonly reason: OfficialTruthServerOwnedRetrievalSperrgrund
    }

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
    }
  | { ok: false; reason: 'address_not_permitted' | 'dns_failed' | 'dns_empty' | 'timeout' | 'http_failed' }

export type OfficialTruthServerOwnedRetrievalHttpClient = (anfrage: {
  url: string
  lookup: OfficialTruthServerOwnedRetrievalLookup
  signal: AbortSignal
  headers: Readonly<Record<string, string>>
}) => Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis>

/**
 * Testnaht. Katalog, Uhr, DNS und HTTP sind Einspritzungen.
 * Eine künftige Route darf diese Naht nicht als Autorität aufrufen.
 */
export type OfficialTruthServerOwnedRetrievalAbhaengigkeiten = {
  readonly catalog?: OfficialTruthSourceCatalogAbhaengigkeiten
  readonly now: () => Date
  readonly resolve: OfficialTruthServerOwnedRetrievalDnsResolver
  readonly http: OfficialTruthServerOwnedRetrievalHttpClient
  readonly timeoutMs?: number
}

type Ziel =
  | { ok: true; canonicalUrl: string; sourceId: string }
  | { ok: false; reason: OfficialTruthServerOwnedRetrievalSperrgrund }

function blockiert(reason: OfficialTruthServerOwnedRetrievalSperrgrund): OfficialTruthServerOwnedRetrievalErgebnis {
  return Object.freeze({ status: 'blocked', reason })
}

function tiefEinfrieren<T>(wert: T): T {
  if (!wert || typeof wert !== 'object') return wert
  if (Array.isArray(wert)) {
    for (const eintrag of wert) tiefEinfrieren(eintrag)
    return Object.freeze(wert) as T
  }
  for (const eintrag of Object.values(wert)) tiefEinfrieren(eintrag)
  return Object.freeze(wert) as T
}

function einfrieren<T>(wert: T): T {
  return tiefEinfrieren(structuredClone(wert))
}

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

function knoten(
  wert: unknown,
  tiefe: number,
  gesehen: WeakSet<object>,
): 'clean' | OfficialTruthServerOwnedRetrievalSperrgrund {
  if (tiefe > TIEFE_MAX) return 'unexpected_fields'
  if (!wert || typeof wert !== 'object') return 'clean'
  if (gesehen.has(wert)) return 'unexpected_fields'
  gesehen.add(wert)
  if (Array.isArray(wert)) {
    for (const eintrag of wert) {
      const art = knoten(eintrag, tiefe + 1, gesehen)
      if (art !== 'clean') return art
    }
    return 'clean'
  }
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return 'unexpected_fields'
  for (const [name, kind] of Object.entries(wert)) {
    if (AUTORITAET.has(name)) return 'caller_authority_forbidden'
    if (PERSONEN.has(name)) return 'sensitive_personal_field'
    const art = knoten(kind, tiefe + 1, gesehen)
    if (art !== 'clean') return art
  }
  return 'clean'
}

function eingabeLesen(wert: unknown): { ok: true; sourceId: string; url: string } | { ok: false; reason: OfficialTruthServerOwnedRetrievalSperrgrund } {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return { ok: false, reason: 'unexpected_fields' }
  const prototyp = Object.getPrototypeOf(wert)
  if (prototyp !== Object.prototype && prototyp !== null) return { ok: false, reason: 'unexpected_fields' }
  const art = knoten(wert, 0, new WeakSet())
  if (art !== 'clean') return { ok: false, reason: art }
  const satz = wert as Record<string, unknown>
  const namen = Object.keys(satz)
  if (namen.length !== 2 || !Object.hasOwn(satz, 'sourceId') || !Object.hasOwn(satz, 'url')) {
    return { ok: false, reason: 'unexpected_fields' }
  }
  if (typeof satz.sourceId !== 'string' || typeof satz.url !== 'string') return { ok: false, reason: 'invalid_request' }
  if (!satz.sourceId.trim() || !satz.url.trim()) return { ok: false, reason: 'invalid_request' }
  return { ok: true, sourceId: satz.sourceId, url: satz.url }
}

function hostName(wert: string): string | null {
  try {
    let host = new URL(wert).hostname
    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
    return host.toLowerCase()
  } catch {
    return null
  }
}

/** Ein Katalogeintrag nennt Hostnamen, keine Portfreigabe. Nur 443 ist der HTTPS-Default. */
function fremderHttpsPort(wert: string): boolean {
  try {
    const gelesen = new URL(wert)
    if (gelesen.protocol !== 'https:') return false
    return gelesen.port !== '' && gelesen.port !== '443'
  } catch {
    return false
  }
}

/**
 * Das Fragment wird vor Registry, Tracking, Schleifenidentität und Netz entfernt.
 * Query-Parameter bleiben. Das Fragment ist die einzige Entfernung.
 */
function fragmentEntfernen(wert: string): string {
  try {
    const gelesen = new URL(wert)
    if (!gelesen.hash) return wert.trim()
    gelesen.hash = ''
    return gelesen.toString()
  } catch {
    return wert
  }
}

function trackingName(name: string): boolean {
  const klein = name.toLowerCase()
  return klein.startsWith('utm_') || TRACKING_NAMEN.has(klein)
}

function hatTracking(url: string): boolean {
  let gelesen: URL
  try {
    gelesen = new URL(url)
  } catch {
    return false
  }
  for (const name of gelesen.searchParams.keys()) {
    if (trackingName(name)) return true
  }
  return false
}

function zielPruefen(registry: QuellenRegistry, sourceId: string, url: string, hop: 'initial' | 'redirect'): Ziel {
  const bereinigt = fragmentEntfernen(url)
  const host = hostName(bereinigt)
  const adresseUnsicher = !!host && net.isIP(host) !== 0 && !officialTruthServerOwnedRetrievalAdresseZulaessig(host)
  if (fremderHttpsPort(bereinigt)) return { ok: false, reason: 'non_default_port' }
  const aufgeloest = quellenUrlAufloesen(registry, bereinigt)
  if (adresseUnsicher && (aufgeloest.ok || aufgeloest.reason === 'unregistered_domain' || aufgeloest.reason === 'blocked_domain')) {
    return { ok: false, reason: 'address_not_permitted' }
  }
  if (!aufgeloest.ok) return { ok: false, reason: aufgeloest.reason }
  const canonicalUrl = fragmentEntfernen(aufgeloest.canonicalUrl)
  if (fremderHttpsPort(canonicalUrl)) return { ok: false, reason: 'non_default_port' }
  if (hatTracking(bereinigt) || hatTracking(canonicalUrl)) return { ok: false, reason: 'tracking_parameter' }
  if (aufgeloest.source.sourceId !== sourceId) {
    return { ok: false, reason: hop === 'redirect' ? 'redirect_source_mismatch' : 'url_source_mismatch' }
  }
  if (aufgeloest.source.sourceClass !== 'official_authority') return { ok: false, reason: 'source_not_official_authority' }
  return { ok: true, canonicalUrl, sourceId: aufgeloest.source.sourceId }
}

function medientyp(wert: string | null): string | null {
  if (wert == null) return null
  const roh = wert.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!roh || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(roh)) return null
  return roh
}

function inhaltLaenge(wert: string | null): number | null {
  if (wert == null) return null
  const text = wert.trim()
  if (!/^\d+$/.test(text)) return null
  const zahl = Number(text)
  return Number.isSafeInteger(zahl) ? zahl : null
}

async function koerperLesen(
  body: AsyncIterable<Uint8Array> | null,
  signal: AbortSignal,
  abbrechen?: () => void,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: 'response_too_large' | 'timeout' | 'http_failed' }> {
  if (signal.aborted) return { ok: false, reason: 'timeout' }
  if (!body) return { ok: true, bytes: new Uint8Array() }
  const teile: Uint8Array[] = []
  let gesamt = 0
  try {
    for await (const stueck of body) {
      if (signal.aborted) {
        abbrechen?.()
        return { ok: false, reason: 'timeout' }
      }
      const bytes = stueck instanceof Uint8Array ? stueck : new Uint8Array(stueck)
      if (bytes.byteLength === 0) continue
      if (gesamt + bytes.byteLength > BODY_MAX) {
        abbrechen?.()
        return { ok: false, reason: 'response_too_large' }
      }
      teile.push(bytes)
      gesamt += bytes.byteLength
    }
  } catch {
    abbrechen?.()
    if (signal.aborted) return { ok: false, reason: 'timeout' }
    return { ok: false, reason: 'http_failed' }
  }
  if (signal.aborted) return { ok: false, reason: 'timeout' }
  const alle = new Uint8Array(gesamt)
  let offset = 0
  for (const teil of teile) {
    alle.set(teil, offset)
    offset += teil.byteLength
  }
  return { ok: true, bytes: alle }
}

function textAus(bytes: Uint8Array): { ok: true; text: string } | { ok: false; reason: 'invalid_utf8' | 'empty_body' } {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty_body' }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text) return { ok: false, reason: 'empty_body' }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'invalid_utf8' }
  }
}

function uhrLesen(now: () => Date): string | null {
  let wert: unknown
  try {
    wert = now()
  } catch {
    return null
  }
  if (!(wert instanceof Date) || !Number.isFinite(wert.getTime())) return null
  return wert.toISOString()
}

function fristMs(wert: number | undefined): number {
  if (wert == null) return TIMEOUT_MS
  if (!Number.isInteger(wert) || wert < 1 || wert > TIMEOUT_MS) return TIMEOUT_MS
  return wert
}

function httpGrund(error: NodeJS.ErrnoException): 'address_not_permitted' | 'dns_failed' | 'dns_empty' | 'timeout' | 'http_failed' {
  const code = error.code || error.message
  if (code === 'JETNITY_ADDRESS_NOT_PERMITTED') return 'address_not_permitted'
  if (code === 'JETNITY_DNS_EMPTY') return 'dns_empty'
  if (code === 'JETNITY_DNS_FAILED') return 'dns_failed'
  if (code === 'ABORT_ERR' || error.name === 'AbortError') return 'timeout'
  return 'http_failed'
}

function serverDns(hostname: string): Promise<readonly OfficialTruthServerOwnedRetrievalAdresse[]> {
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

function serverHttp(anfrage: {
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

function serverUhr(): Date {
  return new Date()
}

type HopKörper =
  | { art: 'bytes'; bytes: Uint8Array; contentType: string | null }
  | { art: 'redirect'; location: string | null }
  | { art: 'blocked'; reason: OfficialTruthServerOwnedRetrievalSperrgrund }

function abbruch(signal: AbortSignal): Promise<{ ok: false; reason: 'timeout' }> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve({ ok: false, reason: 'timeout' })
      return
    }
    signal.addEventListener('abort', () => resolve({ ok: false, reason: 'timeout' }), { once: true })
  })
}

async function hopLesen(
  http: OfficialTruthServerOwnedRetrievalHttpClient,
  url: string,
  lookup: OfficialTruthServerOwnedRetrievalLookup,
  signal: AbortSignal,
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
  const laenge = inhaltLaenge(antwort.headers.get('content-length'))
  if (laenge != null && laenge > BODY_MAX) {
    antwort.cancel?.()
    return { art: 'blocked', reason: 'response_too_large' }
  }
  const koerper = await Promise.race([
    koerperLesen(antwort.body, signal, antwort.cancel),
    abbruch(signal),
  ])
  if (!koerper.ok) {
    antwort.cancel?.()
    return { art: 'blocked', reason: koerper.reason }
  }
  return { art: 'bytes', bytes: koerper.bytes, contentType: medientyp(antwort.headers.get('content-type')) }
}

/**
 * Prüft den Vorschlag, liest den Katalog einmal und holt die Antwort selbst.
 * Eine mitgelieferte Registry, Uhr, Adresse oder ein Body ist keine Lesung.
 */
export async function decideOfficialTruthServerOwnedRetrieval(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthServerOwnedRetrievalAbhaengigkeiten,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  const form = eingabeLesen(eingabe)
  if (!form.ok) return blockiert(form.reason)
  const sourceId = form.sourceId
  const url = form.url

  let katalog: Awaited<ReturnType<typeof quellenKatalogLesen>>
  try {
    katalog = await quellenKatalogLesen(abhaengigkeiten.catalog)
  } catch {
    return blockiert('catalog_failed')
  }
  if (!katalog.ok) return blockiert(katalog.reason === 'catalog_not_configured' ? 'catalog_not_configured' : 'catalog_failed')

  const erstesZiel = zielPruefen(katalog.registry, sourceId, url, 'initial')
  if (!erstesZiel.ok) return blockiert(erstesZiel.reason)

  const lookup = officialTruthServerOwnedRetrievalLookup(abhaengigkeiten.resolve)
  const frist = fristMs(abhaengigkeiten.timeoutMs)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), frist)
  const gesehen = new Set<string>()
  let aktuell = erstesZiel.canonicalUrl
  let redirects = 0

  try {
    while (gesehen.size <= REDIRECT_MAX) {
      if (controller.signal.aborted) return blockiert('timeout')
      if (gesehen.has(aktuell)) return blockiert('redirect_loop')
      gesehen.add(aktuell)
      const hop = await hopLesen(abhaengigkeiten.http, aktuell, lookup, controller.signal)
      if (hop.art === 'blocked') return blockiert(hop.reason)
      if (hop.art === 'redirect') {
        if (redirects >= REDIRECT_MAX) return blockiert('redirect_limit')
        if (!hop.location || !hop.location.trim()) return blockiert('redirect_rejected')
        let naechste: string
        try {
          const gelesen = new URL(hop.location.trim(), aktuell)
          gelesen.hash = ''
          naechste = gelesen.toString()
        } catch {
          return blockiert('redirect_rejected')
        }
        const ziel = zielPruefen(katalog.registry, sourceId, naechste, 'redirect')
        if (!ziel.ok) return blockiert(ziel.reason)
        redirects += 1
        aktuell = ziel.canonicalUrl
        continue
      }
      const text = textAus(hop.bytes)
      if (!text.ok) return blockiert(text.reason)
      const hash = evidenceQuellenFingerprint(text.text)
      if (!hash) return blockiert('invalid_source_snapshot')
      const retrievedAt = uhrLesen(abhaengigkeiten.now)
      if (!retrievedAt) return blockiert('invalid_retrieval_time')
      return einfrieren({
        status: 'server_owned_official_retrieval',
        sourceId: erstesZiel.sourceId,
        canonicalUrl: aktuell,
        retrievedAt,
        contentType: hop.contentType,
        sourceSnapshot: text.text,
        sourceContentHash: hash,
        redirectCount: redirects,
      })
    }
    return blockiert('redirect_limit')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Live-Einstieg. Uhr, Katalog und HTTPS-Verbindung gehören diesem Server.
 * Eine Route kann sie hier nicht einsetzen.
 */
export async function loadOfficialTruthServerOwnedRetrieval(
  eingabe: unknown,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  return decideOfficialTruthServerOwnedRetrieval(eingabe, {
    now: serverUhr,
    resolve: serverDns,
    http: serverHttp,
  })
}
