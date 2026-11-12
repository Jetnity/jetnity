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

// AA revision-probe V1 additions: metadata-only research, closed by Run 0.
import { createHash as aaProbeCreateHash } from 'node:crypto'
import * as aaProbeFs from 'node:fs'
import * as aaProbePath from 'node:path'
import * as aaProbeProcess from 'node:process'
import { performance as aaProbePerformance } from 'node:perf_hooks'
import { setTimeout as aaProbeSetTimeout, clearTimeout as aaProbeClearTimeout } from 'node:timers'
import { AA_REVISION_PROBE_V1_POLICY } from '@/lib/readiness/official-truth-aa-revision-probe-1-policy'
import { chDeAaS1VisaRowResearchFromHtml } from '@/lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server'
// End AA revision-probe V1 imports.

import { contentIdentityBinding, contentIdentityMatches, OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY, type ContentIdentityBinding } from '@/lib/readiness/official-truth-content-identity'
import { officialTruthBoundedResponseBody } from '@/lib/readiness/official-truth-bounded-response-body'
import { quellenInhaltRouten } from '@/lib/readiness/source-router'
import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { officialTruthSourceFingerprintProtocol, officialTruthSourceFingerprintV2 } from '@/lib/readiness/official-truth-source-fingerprint-v2'
import {
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogAbhaengigkeiten,
  type OfficialTruthSourceCatalogTransport,
} from '@/lib/readiness/official-truth-source-catalog-server'
import {
  quellenUrlAufloesen,
  type QuellenRegistry,
  type QuellenUrlFehler,
} from '@/lib/readiness/source-registry'
import {
  officialTruthChDeSourceBudget128k1,
  officialTruthChDeSourceFingerprintV2Allowed,
} from '@/lib/readiness/official-truth-ch-de-source-budget-128k-1'

const TIEFE_MAX = 8
const REDIRECT_MAX = 5
const BODY_MAX = 65_536
const TIMEOUT_MS = 10_000
const UMLEITUNG = new Set([301, 302, 303, 307, 308])
const LIVE_PRIVILEGED_TRANSPORT = Symbol('live-privileged-transport')

const FESTE_HEADER = Object.freeze({
  'accept-encoding': 'identity',
  'cache-control': 'no-cache',
})

/** Reine Tracking-Namen, dieselbe Menge wie das eingereichte Abrufmaterial. `lang` bleibt zulässig. */
const TRACKING_NAMEN = new Set(['gclid', 'dclid', 'fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid'])

const AUTORITAET = new Set([
  'requestUrl',
  'identitySchema', 'contentItemId', 'contentItemVersion', 'representationId', 'representationVersion',
  'identityProfileId', 'identityProfileVersion', 'contentIdentity', 'identityProfiles',
  'registry',
  'sourceClass',
  'source_class',
  'maxBytes',
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

export type OfficialTruthServerOwnedRetrievalErgebnis =
  | (ContentIdentityBinding & {
      readonly identitySchema: 2
      readonly status: 'server_owned_official_retrieval'
      readonly sourceId: string
      /** Validierte Initial-URL dieses Abrufs; keine Autorität für spätere Abrufe. */
      readonly requestUrl: string
      readonly canonicalUrl: string
      readonly retrievedAt: string
      readonly contentType: string
      readonly sourceSnapshot: string
      readonly sourceContentHash: string
      readonly sourceFingerprintProtocol?: 2
      readonly redirectCount: number
    })
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

function inhaltLaenge(wert: string | null): { ok: true; value: number | null } | { ok: false } {
  if (wert == null) return { ok: true, value: null }
  const text = wert.trim()
  if (!/^\d+$/.test(text)) return { ok: false }
  const zahl = Number(text)
  return Number.isSafeInteger(zahl) ? { ok: true, value: zahl } : { ok: false }
}

function textAus(bytes: Uint8Array): { ok: true; text: string } | { ok: false; reason: 'invalid_utf8' | 'empty_body' } {
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

/**
 * Prüft den Vorschlag, liest den Katalog einmal und holt die Antwort selbst.
 * Eine mitgelieferte Registry, Uhr, Adresse oder ein Body ist keine Lesung.
 */
async function decideServerOwnedRetrieval(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthServerOwnedRetrievalAbhaengigkeiten,
  authorization?: typeof LIVE_PRIVILEGED_TRANSPORT,
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

  const content = quellenInhaltRouten(katalog.registry, sourceId, erstesZiel.canonicalUrl)
  if (!content.ok) return blockiert(content.reason)
  const representation = content.representation
  const requestUrl = erstesZiel.canonicalUrl
  const identity = contentIdentityBinding(representation)
  const item = katalog.registry.contentIdentity?.items.find((candidate) => candidate.current
    && candidate.sourceId === identity.sourceId && candidate.contentItemId === identity.contentItemId
    && candidate.contentItemVersion === identity.contentItemVersion)
  const profiles = abhaengigkeiten.catalog?.identityProfiles ?? OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY
  const matches = profiles.filter((profile) => profile.current && profile.identityProfileId === identity.identityProfileId
    && profile.identityProfileVersion === identity.identityProfileVersion)
  if (!item || matches.length !== 1) return blockiert('identity_profile_unavailable')
  const profile = matches[0]!
  const allowedUrls = new Set([...representation.requestUrls, representation.expectedFinalUrl])
  const lookup = officialTruthServerOwnedRetrievalLookup(abhaengigkeiten.resolve)
  const frist = fristMs(abhaengigkeiten.timeoutMs)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), frist)
  const gesehen = new Set<string>()
  let aktuell = requestUrl
  let redirects = 0

  try {
    while (gesehen.size <= REDIRECT_MAX) {
      if (controller.signal.aborted) return blockiert('timeout')
      if (gesehen.has(aktuell)) return blockiert('redirect_loop')
      gesehen.add(aktuell)
      const maxBytesForMediaType = (mediaType: string | null) =>
        authorization === LIVE_PRIVILEGED_TRANSPORT && abhaengigkeiten.catalog == null
          ? officialTruthChDeSourceBudget128k1(identity, item, representation, requestUrl, aktuell, mediaType ?? '', profile) ?? BODY_MAX
          : BODY_MAX
      const hop = await hopLesen(abhaengigkeiten.http, aktuell, lookup, controller.signal, maxBytesForMediaType)
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
        if (!allowedUrls.has(ziel.canonicalUrl)) return blockiert('representation_url_mismatch')
        redirects += 1
        aktuell = ziel.canonicalUrl
        continue
      }
      if (aktuell !== representation.expectedFinalUrl) return blockiert('representation_url_mismatch')
      if (hop.contentType !== representation.expectedMediaType) return blockiert('content_type_mismatch')
      const text = textAus(hop.bytes)
      if (!text.ok) return blockiert(text.reason)
      try {
        const verified = profile.verify(Object.freeze({ item, representation, responseText: text.text,
          finalUrl: aktuell, mediaType: hop.contentType }))
        if (!verified || !verified.ok || !verified.identity || !contentIdentityMatches(verified.identity, identity)
          || Object.keys(verified.identity).length !== Object.keys(identity).length) return blockiert('content_identity_mismatch')
      } catch { return blockiert('content_identity_mismatch') }
      const sourceFingerprintProtocol = officialTruthSourceFingerprintProtocol(text.text, hop.bytes.byteLength)
      if (!sourceFingerprintProtocol) return blockiert('invalid_source_snapshot')
      const fingerprintBinding = { ...identity, canonicalUrl: aktuell, contentType: hop.contentType }
      const hash = sourceFingerprintProtocol === 2
        ? officialTruthChDeSourceFingerprintV2Allowed(katalog.registry, identity, aktuell, hop.contentType)
          ? officialTruthSourceFingerprintV2(text.text, fingerprintBinding)
          : null
        : evidenceQuellenFingerprint(text.text)
      if (!hash) return blockiert('invalid_source_snapshot')
      const retrievedAt = uhrLesen(abhaengigkeiten.now)
      if (!retrievedAt) return blockiert('invalid_retrieval_time')
      return einfrieren({
        ...identity,
        identitySchema: 2,
        status: 'server_owned_official_retrieval',
        sourceId: erstesZiel.sourceId,
        requestUrl,
        canonicalUrl: aktuell,
        retrievedAt,
        contentType: hop.contentType,
        sourceSnapshot: text.text,
        sourceContentHash: hash,
        ...(sourceFingerprintProtocol === 2 ? { sourceFingerprintProtocol: 2 as const } : {}),
        redirectCount: redirects,
      })
    }
    return blockiert('redirect_limit')
  } finally {
    clearTimeout(timer)
  }
}

export async function decideOfficialTruthServerOwnedRetrieval(
  eingabe: unknown,
  abhaengigkeiten: OfficialTruthServerOwnedRetrievalAbhaengigkeiten,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  return decideServerOwnedRetrieval(eingabe, abhaengigkeiten)
}

/**
 * Live-Einstieg. Uhr, Katalog und HTTPS-Verbindung gehören diesem Server.
 * Eine Route kann sie hier nicht einsetzen.
 */
export async function loadOfficialTruthServerOwnedRetrieval(
  eingabe: unknown,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  return decideServerOwnedRetrieval(eingabe, {
    now: serverUhr,
    resolve: serverDns,
    http: serverHttp,
  }, LIVE_PRIVILEGED_TRANSPORT)
}

/**
 * Dieselbe Live-Lesung, mit einem Katalogtransport aus Servercode.
 * Die öffentliche Live-Funktion oben nimmt keinen Transport.
 * Eine Aufrufer-Registry bleibt verboten. Uhr, DNS und HTTPS sind die
 * bestehenden Serverfunktionen und hier nicht austauschbar.
 * Ausserhalb der Tests dieser Datei darf nur
 * official-truth-same-request-extraction-server.ts diese Funktion importieren.
 */
export async function loadOfficialTruthServerOwnedRetrievalWithCatalogTransport(
  eingabe: unknown,
  transport: OfficialTruthSourceCatalogTransport,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  return decideOfficialTruthServerOwnedRetrieval(eingabe, {
    catalog: { transport },
    now: serverUhr,
    resolve: serverDns,
    http: serverHttp,
  })
}

/** Isolated developer-only catalog/profile seam; finite importer guard excludes
 * application roots. Uses the identical server clock, DNS and HTTPS boundary. */
export async function retrieveOfficialTruthIsolatedPilotSource(
  eingabe: unknown,
  catalog: Required<Pick<OfficialTruthSourceCatalogAbhaengigkeiten, 'transport' | 'identityProfiles'>>,
): Promise<OfficialTruthServerOwnedRetrievalErgebnis> {
  return decideOfficialTruthServerOwnedRetrieval(eingabe, {
    catalog, now: serverUhr, resolve: serverDns, http: serverHttp,
  })
}


/**
 * Bern S3 developer RESEARCH only. This path deliberately does NOT call
 * decideServerOwnedRetrieval, any profile/catalog, or issue a trusted receipt.
 * It shares the same private TLS/public-pinned-DNS/HTTPS/stream primitives.
 * Do NOT import from app/api, public routes, cron or an automatic CI runner.
 */
const BERN_RESEARCH_URL = 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474' as const
const BERN_RESEARCH_MAX = 131_072
const BERN_RESEARCH_SOURCE = 'german_embassy_bern_research_candidate' as const

export type OfficialTruthBernRealResearchIndicators = Readonly<{
  html_scripts_present: boolean
  analytics_or_tracking_indicators_present: boolean
  possible_personal_metadata_present: boolean
  embedded_external_asset_indicators_present: boolean
  copyright_or_rights_indicators_present: boolean
  unknown_dynamic_sections: boolean
}>

export type OfficialTruthBernRealResearchOutcome = Readonly<
  | {
      status: 'bern_research_only'
      phase: 'observed_research_only'
      reason: null
      sourceFamily: typeof BERN_RESEARCH_SOURCE
      sourceUrl: typeof BERN_RESEARCH_URL
      networkAttempted: boolean
      fullBodyByteCount: number
      indicators: OfficialTruthBernRealResearchIndicators
    }
  | {
      status: 'bern_research_only'
      phase: 'blocked'
      reason: OfficialTruthServerOwnedRetrievalSperrgrund
        | 'redirect_detected'
        | 'content_length_mismatch'
        | 'framing_unverified'
        | 'attempt_already_consumed'
        | 'live_execution_not_authorized'
      sourceFamily: typeof BERN_RESEARCH_SOURCE
      sourceUrl: typeof BERN_RESEARCH_URL
      networkAttempted: boolean
      fullBodyByteCount: null
      indicators: null
    }
>

type BernResearchPhysicalDependencies = Readonly<{
  resolve: OfficialTruthServerOwnedRetrievalDnsResolver
  http: OfficialTruthServerOwnedRetrievalHttpClient
  /** Only for deterministic offline tests. Live always uses 10000ms. */
  timeoutMs?: number
}>

function bernResearchIndicators(text: string): OfficialTruthBernRealResearchIndicators {
  const scripts = /<script\b|javascript:/i.test(text)
  const analytics = /(matomo|_paq\b|piwik|google-analytics|googletagmanager|gtag\(|analytics|tracking|fbclid|gclid|dclid|msclkid)/i.test(text)
  const personal = /(mailto:|\b(?:e-?mail|telefon|tel:|kontakt|ansprechpartner|impressum|pressestelle)\b|@[a-z0-9.-]+\.[a-z]{2,})/i.test(text)
  const documentUrl = new URL(BERN_RESEARCH_URL)
  const attributes = text.matchAll(/(?:^|[\s<])(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi)
  const external = Array.from(attributes).some(match => {
    const value = (match[1] ?? match[2] ?? match[3] ?? '').trim()
    // Bounded observation, not an HTML parser or absence/rights clearance.
    // Undecoded entities, broken quoting and ambiguous values remain a hint.
    if (match[3] === '' || /[&\\<>"'`\u0000-\u0020\u007f]/.test(value)) return true
    try {
      const resource = new URL(value, documentUrl)
      return !['http:', 'https:'].includes(resource.protocol) || resource.host !== documentUrl.host
    } catch { return true }
  })
  const rights = /(copyright|urheberrecht|rights reserved|alle rechte vorbehalten|©)/i.test(text)
  return Object.freeze({
    html_scripts_present: scripts,
    analytics_or_tracking_indicators_present: analytics,
    possible_personal_metadata_present: personal,
    embedded_external_asset_indicators_present: external,
    copyright_or_rights_indicators_present: rights,
    unknown_dynamic_sections: scripts || /<iframe\b|<template\b|{{|\bwindow\.[a-z0-9_$]+|data-reactroot|ng-[a-z0-9_-]+/i.test(text),
  })
}

function bernResearchBlocked(
  reason: Extract<OfficialTruthBernRealResearchOutcome, { phase: 'blocked' }>['reason'],
  networkAttempted: boolean,
): OfficialTruthBernRealResearchOutcome {
  return Object.freeze({
    status: 'bern_research_only' as const,
    phase: 'blocked' as const,
    reason,
    sourceFamily: BERN_RESEARCH_SOURCE,
    sourceUrl: BERN_RESEARCH_URL,
    networkAttempted,
    fullBodyByteCount: null,
    indicators: null,
  })
}

/** Purely local test seam: injected mocks can never create trusted source results.
 * Production site code must never import it; the real loader below owns transport. */
export async function decideOfficialTruthBernRealResearchForOfflineTests(
  deps: BernResearchPhysicalDependencies,
): Promise<OfficialTruthBernRealResearchOutcome> {
  return bernResearchPhysicalRead(deps)
}

/** R3 code-only hard stop, including direct imports. Read-only GitHub
 * preflight and synthetic claims are NOT execution capabilities. There is no
 * live claim writer or escape hatch in this revision. Separate independent
 * authorization/implementation is required before enabling Phase B. */
export async function retrieveOfficialTruthBernOneShotResearchOnly(): Promise<OfficialTruthBernRealResearchOutcome> {
  return bernResearchBlocked('live_execution_not_authorized', false)
}

async function bernResearchPhysicalRead(
  deps: BernResearchPhysicalDependencies,
): Promise<OfficialTruthBernRealResearchOutcome> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), fristMs(deps.timeoutMs))
  const lookup = officialTruthServerOwnedRetrievalLookup(deps.resolve)
  let attempted = false
  let streamFailure: Extract<OfficialTruthBernRealResearchOutcome, { phase: 'blocked' }>['reason'] | null = null
  let complete = false
  const controlledHttp: OfficialTruthServerOwnedRetrievalHttpClient = async (request) => {
    attempted = true
    const reply = await deps.http(request)
    if (!reply.ok) return reply
    if (reply.status >= 300 && reply.status < 400) {
      streamFailure = 'redirect_detected'
      try { reply.cancel?.() } catch { /* cancellation cannot authorize a follow-up */ }
      return { ok: false, reason: 'http_failed' }
    }
    if (reply.status !== 200 || !reply.body) return reply

    let cancelled = false
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      try { reply.cancel?.() } catch { /* fail closed, no exception or raw response leak */ }
    }
    const encoding = reply.headers.get('content-encoding')
    if (encoding != null && encoding.trim().toLowerCase() !== 'identity') {
      streamFailure = 'http_failed'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    if (medientyp(reply.headers.get('content-type')) !== 'text/html') {
      streamFailure = 'content_type_mismatch'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    const declared = inhaltLaenge(reply.headers.get('content-length'))
    if (!declared.ok) {
      streamFailure = 'http_failed'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    if (declared.value != null && declared.value > BERN_RESEARCH_MAX) {
      streamFailure = 'response_too_large'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    const listener = () => cancel()
    if (request.signal.aborted) {
      cancel()
      streamFailure = 'timeout'
      return { ok: false, reason: 'timeout' }
    }
    request.signal.addEventListener('abort', listener, { once: true })
    let bounded: Awaited<ReturnType<typeof officialTruthBoundedResponseBody>>
    try {
      bounded = await Promise.race([
        officialTruthBoundedResponseBody(
          reply.body, request.signal, declared.value === null
            ? BERN_RESEARCH_MAX : Math.max(1, declared.value), cancel),
        abbruch(request.signal),
      ])
    } finally {
      request.signal.removeEventListener('abort', listener)
    }
    if (!bounded.ok) {
      streamFailure = bounded.reason
      cancel()
      return { ok: false, reason: bounded.reason === 'timeout' ? 'timeout' : 'http_failed' }
    }
    if (request.signal.aborted) {
      streamFailure = 'timeout'
      cancel()
      return { ok: false, reason: 'timeout' }
    }
    if (declared.value != null && bounded.bytes.byteLength !== declared.value) {
      streamFailure = 'content_length_mismatch'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    // Native IncomingMessage.complete proves EOF of chunked framing where no
    // Content-Length exists. Mocks without that witness cannot authorize it.
    if (reply.framingComplete && !reply.framingComplete()) {
      streamFailure = 'framing_unverified'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    if (declared.value === null && (!reply.framingComplete || !reply.framingComplete())) {
      streamFailure = 'framing_unverified'
      cancel()
      return { ok: false, reason: 'http_failed' }
    }
    complete = true
    return {
      ok: true,
      status: reply.status,
      headers: reply.headers,
      body: (async function* () {
        if (bounded.bytes.byteLength > 0) yield bounded.bytes
      })(),
      cancel,
    }
  }
  try {
    const hop = await hopLesen(controlledHttp, BERN_RESEARCH_URL, lookup, controller.signal,
      () => BERN_RESEARCH_MAX)
    if (controller.signal.aborted) return bernResearchBlocked('timeout', attempted)
    if (hop.art === 'redirect') return bernResearchBlocked('redirect_detected', attempted)
    if (hop.art === 'blocked') return bernResearchBlocked(streamFailure ?? hop.reason, attempted)
    if (!complete || hop.contentType !== 'text/html') {
      return bernResearchBlocked(!complete ? 'framing_unverified' : 'content_type_mismatch', attempted)
    }
    const body = textAus(hop.bytes)
    if (!body.ok) return bernResearchBlocked(body.reason, attempted)
    return Object.freeze({
      status: 'bern_research_only' as const,
      phase: 'observed_research_only' as const,
      reason: null,
      sourceFamily: BERN_RESEARCH_SOURCE,
      sourceUrl: BERN_RESEARCH_URL,
      networkAttempted: attempted,
      fullBodyByteCount: hop.bytes.byteLength,
      indicators: bernResearchIndicators(body.text),
    })
  } catch {
    return bernResearchBlocked(controller.signal.aborted ? 'timeout' : 'http_failed', attempted)
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
}


// BEGIN AA_REVISION_PROBE_V1 — no existing retrieval or Bern behavior changes.
type AaProbeCi = Readonly<{
  runId: string
  runNumber: number
  attempt: 1
  pullRequest: number
  headSha: string
  checkoutSha: string
}>
type AaProbeReason =
  | 'unarmed' | 'caller_input_forbidden' | 'ci_not_selected' | 'event_invalid' | 'source_inventory_invalid'
  | 'claim_unavailable' | 'unexpected_failure' | 'redirect_rejected'
  | 'http_status' | 'http_failed' | 'address_not_permitted' | 'dns_failed'
  | 'dns_empty' | 'timeout' | 'response_too_large' | 'content_type_mismatch'
  | 'framing_unverified' | 'invalid_utf8' | 'empty_body'
  | 'protocol_not_v2' | 'fingerprint_refused' | 'invalid_observation_time'
type AaProbeS1 = Readonly<
  | { status: 'recognized'; reason: null }
  | { status: 'refused'; reason:
      'invalid_html' | 'snapshot_over_limit' | 'invalid_document_structure'
      | 'missing_exact_visa_table' | 'ambiguous_visa_table' | 'swiss_row_missing'
      | 'ambiguous_swiss_row' | 'qualified_or_conflicting_swiss_row' }
>
type AaProbeCommon = Readonly<{
  schema: 'jetnity.aa-revision-probe.v1'
  task: 'CH-DE-AA-REVISION-PROBE-1'
  taskVersion: 1
  sourceUrl: typeof AA_REVISION_PROBE_V1_POLICY.url
  reviewedSourceBlob: string
  researchOnly: true
  sourceCustody: 'not_verified'
  legalApplicability: 'not_verified'
  productionAuthority: false
  acceptedEvidence: 0
  acceptedRules: 0
  databaseWrites: 0
  ci: AaProbeCi | null
}>
export type OfficialTruthAaRevisionProbeV1Result = AaProbeCommon & Readonly<
  | {
      phase: 'blocked'; reason: AaProbeReason; networkAttempted: boolean | null
      observedAt: null; contentType: null; fullBodyByteCount: null
      fingerprintProtocol: null; comparison: 'UNKNOWN'; s1: null
    }
  | {
      phase: 'observed'; reason: null; networkAttempted: true
      observedAt: string; contentType: 'text/html'; fullBodyByteCount: number
      fingerprintProtocol: 2; comparison: 'MATCH' | 'MISMATCH'; s1: AaProbeS1 | null
    }
>

const AA_PROBE_SOURCE_PATHS = Object.freeze([
  'lib/readiness/official-truth-server-owned-retrieval.ts',
  'lib/readiness/official-truth-aa-revision-probe-1.test.ts',
  'lib/readiness/official-truth-bounded-response-body.ts',
  'lib/readiness/official-truth-source-fingerprint-v2.ts',
  'lib/readiness/digest.ts',
  'lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts',
  '.github/workflows/ci.yml',
  'package.json',
  'package-lock.json',
  'scripts/server-only-test-register.mjs',
  'scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts',
  'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts',
  'lib/readiness/official-truth-content-identity-r2.test.ts',
] as const)
const AA_PROBE_EVENT_MAX = 262_144
const AA_PROBE_SOURCE_MAX = 1_048_576

function aaProbeCommon(ci: AaProbeCi | null): AaProbeCommon {
  return Object.freeze({
    schema: 'jetnity.aa-revision-probe.v1' as const,
    task: 'CH-DE-AA-REVISION-PROBE-1' as const,
    taskVersion: 1 as const,
    sourceUrl: AA_REVISION_PROBE_V1_POLICY.url,
    reviewedSourceBlob: AA_REVISION_PROBE_V1_POLICY.reviewedSourceBlob,
    researchOnly: true as const,
    sourceCustody: 'not_verified' as const,
    legalApplicability: 'not_verified' as const,
    productionAuthority: false as const,
    acceptedEvidence: 0 as const, acceptedRules: 0 as const, databaseWrites: 0 as const,
    ci,
  })
}
function aaProbeBlocked(reason: AaProbeReason, attempted: boolean | null, ci: AaProbeCi | null):
  OfficialTruthAaRevisionProbeV1Result {
  return Object.freeze({
    ...aaProbeCommon(ci), phase: 'blocked' as const, reason,
    networkAttempted: attempted, observedAt: null, contentType: null,
    fullBodyByteCount: null, fingerprintProtocol: null, comparison: 'UNKNOWN' as const, s1: null,
  })
}
function aaProbeInteger(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,14}$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}
function aaProbeRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype ? value as Record<string, unknown> : null
}
function aaProbeSha(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
}
function aaProbeDirectory(path: string): boolean {
  if (!aaProbePath.isAbsolute(path) || aaProbePath.resolve(path) !== path
    || aaProbeFs.realpathSync(path) !== path) return false
  const stat = aaProbeFs.lstatSync(path)
  return stat.isDirectory() && !stat.isSymbolicLink()
}

/** Bounded reads only; never readFile an event or source after a racy size check. */
function aaProbeReadRegular(root: string, file: string, maximum: number): Buffer {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > AA_PROBE_SOURCE_MAX
    || !aaProbeDirectory(root) || aaProbePath.resolve(file) !== file) throw new Error('aa_probe_input')
  const relative = aaProbePath.relative(root, file)
  const parts = relative.split(aaProbePath.sep)
  if (!relative || aaProbePath.isAbsolute(relative)
    || parts.some(part => !part || part === '.' || part === '..' || !/^[A-Za-z0-9_.-]+$/.test(part))) {
    throw new Error('aa_probe_input')
  }
  let parent = root
  for (const part of parts.slice(0, -1)) {
    parent = aaProbePath.join(parent, part)
    if (!aaProbeDirectory(parent)) throw new Error('aa_probe_input')
  }
  const before = aaProbeFs.lstatSync(file)
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1
    || !Number.isSafeInteger(before.size) || before.size < 1 || before.size > maximum) {
    throw new Error('aa_probe_input')
  }
  const fd = aaProbeFs.openSync(file, aaProbeFs.constants.O_RDONLY | aaProbeFs.constants.O_NOFOLLOW)
  try {
    const opened = aaProbeFs.fstatSync(fd)
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino
      || opened.size !== before.size || opened.mtimeMs !== before.mtimeMs || opened.ctimeMs !== before.ctimeMs) {
      throw new Error('aa_probe_input')
    }
    const buffer = Buffer.alloc(maximum + 1)
    let used = 0
    while (used < buffer.byteLength) {
      const read = aaProbeFs.readSync(fd, buffer, used, buffer.byteLength - used, null)
      if (!Number.isSafeInteger(read) || read < 0 || read > buffer.byteLength - used) throw new Error('aa_probe_input')
      if (read === 0) break
      used += read
    }
    const after = aaProbeFs.fstatSync(fd)
    if (used !== opened.size || used > maximum || !after.isFile() || after.nlink !== 1
      || after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size
      || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) {
      throw new Error('aa_probe_input')
    }
    return Buffer.from(buffer.subarray(0, used))
  } finally {
    aaProbeFs.closeSync(fd)
  }
}

/** JSON.parse supplies grammar validation; this pass rejects duplicate decoded keys. */
function aaProbeEvent(bytes: Buffer): Record<string, unknown> | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return null
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  const stack: (Set<string> | null)[] = []
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '{') stack.push(new Set())
    else if (char === '[') stack.push(null)
    else if (char === '}' || char === ']') stack.pop()
    else if (char === '"') {
      const start = index
      index += 1
      for (; index < text.length; index += 1) {
        if (text[index] === '\\') index += 1
        else if (text[index] === '"') break
      }
      const key: unknown = JSON.parse(text.slice(start, index + 1))
      let next = index + 1
      while (next < text.length && /\s/.test(text[next]!)) next += 1
      if (text[next] === ':') {
        const keys = stack[stack.length - 1]
        if (!keys || typeof key !== 'string' || keys.has(key)) return null
        keys.add(key)
      }
    }
  }
  return aaProbeRecord(JSON.parse(text))
}
function aaProbeRepository(value: unknown): boolean {
  const repo = aaProbeRecord(value)
  return repo?.id === AA_REVISION_PROBE_V1_POLICY.repositoryId
    && repo.full_name === AA_REVISION_PROBE_V1_POLICY.repository
}
type AaProbeSelection =
  | { ok: true; ci: AaProbeCi; runnerTemp: string }
  | { ok: false; reason: AaProbeReason; ci: AaProbeCi | null }

function aaProbeSelect(): AaProbeSelection {
  const policy = AA_REVISION_PROBE_V1_POLICY
  const selectedRun: number = policy.runNumber
  if (!Number.isSafeInteger(selectedRun) || selectedRun <= 0) return { ok: false, reason: 'unarmed', ci: null }
  const env = aaProbeProcess.env
  const run = aaProbeInteger(env.GITHUB_RUN_NUMBER), runId = aaProbeInteger(env.GITHUB_RUN_ID)
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'pull_request'
    || env.GITHUB_JOB !== policy.job || env.GITHUB_RUN_ATTEMPT !== '1'
    || env.GITHUB_REPOSITORY !== policy.repository
    || env.GITHUB_REPOSITORY_ID !== String(policy.repositoryId)
    || env.GITHUB_WORKFLOW !== policy.workflowName || run !== selectedRun || runId === null
    || env.GITHUB_HEAD_REF !== policy.headBranch || env.GITHUB_BASE_REF !== policy.baseBranch
    || !aaProbeSha(env.GITHUB_SHA) || !aaProbeSha(policy.baseSha)) {
    return { ok: false, reason: 'ci_not_selected', ci: null }
  }
  const workspace = env.GITHUB_WORKSPACE, runnerTemp = env.RUNNER_TEMP, eventPath = env.GITHUB_EVENT_PATH
  if (typeof workspace !== 'string' || typeof runnerTemp !== 'string' || typeof eventPath !== 'string'
    || workspace !== aaProbeProcess.cwd()) return { ok: false, reason: 'event_invalid', ci: null }
  let event: Record<string, unknown> | null
  try {
    if (!aaProbeDirectory(workspace) || !aaProbeDirectory(runnerTemp)) return { ok: false, reason: 'event_invalid', ci: null }
    event = aaProbeEvent(aaProbeReadRegular(runnerTemp, eventPath, AA_PROBE_EVENT_MAX))
  } catch { return { ok: false, reason: 'event_invalid', ci: null } }
  const pr = aaProbeRecord(event?.pull_request), head = aaProbeRecord(pr?.head), base = aaProbeRecord(pr?.base)
  const number = event?.number
  if (!event || !pr || !head || !base || typeof number !== 'number' || !Number.isSafeInteger(number) || number < 1
    || pr.number !== number || typeof event.action !== 'string' || !['opened', 'synchronize', 'reopened'].includes(event.action)
    || !aaProbeRepository(event.repository) || !aaProbeRepository(head.repo) || !aaProbeRepository(base.repo)
    || head.ref !== policy.headBranch || base.ref !== policy.baseBranch || base.sha !== policy.baseSha
    || !aaProbeSha(head.sha) || env.GITHUB_REF !== 'refs/pull/' + String(number) + '/merge'
    || env.GITHUB_WORKFLOW_REF !== policy.repository + '/' + policy.workflowPath + '@' + env.GITHUB_REF) {
    return { ok: false, reason: 'event_invalid', ci: null }
  }
  const ci: AaProbeCi = Object.freeze({
    runId: String(runId), runNumber: selectedRun, attempt: 1 as const,
    pullRequest: Number(number), headSha: head.sha, checkoutSha: env.GITHUB_SHA,
  })
  try {
    if (policy.sourceInventory.length !== AA_PROBE_SOURCE_PATHS.length) throw new Error('aa_probe_inventory')
    for (let index = 0; index < AA_PROBE_SOURCE_PATHS.length; index += 1) {
      const pin = policy.sourceInventory[index]
      if (!pin || pin.path !== AA_PROBE_SOURCE_PATHS[index] || !Number.isSafeInteger(pin.bytes)
        || pin.bytes < 1 || pin.bytes > AA_PROBE_SOURCE_MAX || !/^[0-9a-f]{64}$/.test(pin.sha256)) {
        throw new Error('aa_probe_inventory')
      }
      const bytes = aaProbeReadRegular(workspace, aaProbePath.join(workspace, pin.path), pin.bytes)
      if (bytes.byteLength !== pin.bytes || aaProbeCreateHash('sha256').update(bytes).digest('hex') !== pin.sha256) {
        throw new Error('aa_probe_inventory')
      }
    }
  } catch { return { ok: false, reason: 'source_inventory_invalid', ci } }
  return { ok: true, ci, runnerTemp }
}
function aaProbeClaim(runnerTemp: string, ci: AaProbeCi): boolean {
  try {
    if (!aaProbeDirectory(runnerTemp)) return false
    const file = aaProbePath.join(runnerTemp, '.jetnity-aa-revision-probe-v1-' + ci.runId + '-1.claim')
    const fd = aaProbeFs.openSync(file,
      aaProbeFs.constants.O_WRONLY | aaProbeFs.constants.O_CREAT | aaProbeFs.constants.O_EXCL | aaProbeFs.constants.O_NOFOLLOW,
      0o600)
    try {
      const marker = Buffer.from('CH-DE-AA-REVISION-PROBE-1\n' + ci.runId + '\n' + ci.headSha + '\n', 'utf8')
      let written = 0
      while (written < marker.byteLength) {
        const count = aaProbeFs.writeSync(fd, marker, written, marker.byteLength - written)
        if (!Number.isSafeInteger(count) || count <= 0 || count > marker.byteLength - written) return false
        written += count
      }
      aaProbeFs.fsyncSync(fd)
    } finally { aaProbeFs.closeSync(fd) }
    return true
  } catch { return false }
}
function aaProbeHttpReason(reason: OfficialTruthServerOwnedRetrievalSperrgrund): AaProbeReason {
  switch (reason) {
    case 'address_not_permitted': case 'dns_failed': case 'dns_empty': case 'timeout':
    case 'http_failed': case 'http_status': case 'response_too_large': case 'content_type_mismatch':
    case 'invalid_utf8': case 'empty_body': return reason
    default: return 'http_failed'
  }
}
async function aaProbePhysical(ci: AaProbeCi): Promise<OfficialTruthAaRevisionProbeV1Result> {
  const controller = new AbortController()
  const started = aaProbePerformance.now()
  const timer = aaProbeSetTimeout(() => {
    try { controller.abort() } catch { /* no native error text is emitted */ }
  }, AA_REVISION_PROBE_V1_POLICY.timeoutMs)
  const state: {
    attempted: boolean
    reply: Extract<OfficialTruthServerOwnedRetrievalHttpErgebnis, { ok: true }> | null
    failure: AaProbeReason | null
    bytes: Uint8Array | null
  } = { attempted: false, reply: null, failure: null, bytes: null }
  const expired = () => {
    const now = aaProbePerformance.now()
    return controller.signal.aborted || !Number.isFinite(started) || !Number.isFinite(now)
      || now < started || now - started >= AA_REVISION_PROBE_V1_POLICY.timeoutMs
  }
  const physical: OfficialTruthServerOwnedRetrievalHttpClient = async request => {
    if (expired()) return { ok: false, reason: 'timeout' }
    state.attempted = true
    const reply = await serverHttp(request)
    if (!reply.ok) return reply
    state.reply = reply
    if (expired()) {
      try { reply.cancel?.() } catch { /* a late response never starts body processing */ }
      return { ok: false, reason: 'timeout' }
    }
    if (reply.status !== 200) {
      state.failure = reply.status >= 300 && reply.status < 400 ? 'redirect_rejected' : 'http_status'
      try { reply.cancel?.() } catch { /* no follow-up and no untrusted error output */ }
      return { ok: false, reason: 'http_failed' }
    }
    return reply
  }
  try {
    if (expired()) return aaProbeBlocked('timeout', false, ci)
    const hop = await hopLesen(physical, AA_REVISION_PROBE_V1_POLICY.url,
      officialTruthServerOwnedRetrievalLookup(serverDns), controller.signal, () => AA_REVISION_PROBE_V1_POLICY.maxBytes)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    if (hop.art === 'redirect') return aaProbeBlocked('redirect_rejected', state.attempted, ci)
    if (hop.art === 'blocked') return aaProbeBlocked(state.failure ?? aaProbeHttpReason(hop.reason), state.attempted, ci)
    state.bytes = hop.bytes
    if (hop.contentType !== 'text/html') return aaProbeBlocked('content_type_mismatch', state.attempted, ci)
    if (state.reply?.framingComplete?.() !== true) return aaProbeBlocked('framing_unverified', state.attempted, ci)
    const text = textAus(hop.bytes)
    if (!text.ok) return aaProbeBlocked(text.reason, state.attempted, ci)
    if (officialTruthSourceFingerprintProtocol(text.text, hop.bytes.byteLength) !== 2) {
      return aaProbeBlocked('protocol_not_v2', state.attempted, ci)
    }
    const hash = officialTruthSourceFingerprintV2(text.text, AA_REVISION_PROBE_V1_POLICY.binding)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    if (hash === null) return aaProbeBlocked('fingerprint_refused', state.attempted, ci)
    const matches = hash === AA_REVISION_PROBE_V1_POLICY.expectedV2Pin
    let s1: AaProbeS1 | null = null
    if (matches) {
      const observation = chDeAaS1VisaRowResearchFromHtml(text.text)
      s1 = observation.status === 'research_visa_table_observation'
        ? Object.freeze({ status: 'recognized' as const, reason: null })
        : Object.freeze({ status: 'refused' as const, reason: observation.reason })
    }
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    const observedAt = uhrLesen(serverUhr)
    if (observedAt === null) return aaProbeBlocked('invalid_observation_time', state.attempted, ci)
    if (expired()) return aaProbeBlocked('timeout', state.attempted, ci)
    return Object.freeze({
      ...aaProbeCommon(ci), phase: 'observed' as const, reason: null, networkAttempted: true as const,
      observedAt, contentType: 'text/html' as const, fullBodyByteCount: hop.bytes.byteLength,
      fingerprintProtocol: 2 as const, comparison: matches ? 'MATCH' as const : 'MISMATCH' as const, s1,
    })
  } catch {
    return aaProbeBlocked(expired() ? 'timeout' : 'http_failed', state.attempted, ci)
  } finally {
    aaProbeClearTimeout(timer)
    try { controller.abort() } catch { /* never expose native exception text */ }
    try { state.reply?.cancel?.() } catch { /* no retry */ }
    state.bytes?.fill(0)
  }
}

/** One reviewed CI research observation. No production inputs or trusted receipt.
 * Only the single inventoried test caller may consume this entry. Run 0 is closed.
 * The existing DB-backed live retrieval and held Bern entry are unchanged. */
export async function probeOfficialTruthAaReviewedRevisionV1(): Promise<OfficialTruthAaRevisionProbeV1Result> {
  if (arguments.length !== 0) return aaProbeBlocked('caller_input_forbidden', false, null)
  let ci: AaProbeCi | null = null
  let physicalStarted = false
  try {
    const selected = aaProbeSelect()
    if (!selected.ok) return aaProbeBlocked(selected.reason, false, selected.ci)
    ci = selected.ci
    if (!aaProbeClaim(selected.runnerTemp, ci)) return aaProbeBlocked('claim_unavailable', false, ci)
    physicalStarted = true
    return await aaProbePhysical(ci)
  } catch {
    return aaProbeBlocked('unexpected_failure', physicalStarted ? null : false, ci)
  }
}
// END AA_REVISION_PROBE_V1
