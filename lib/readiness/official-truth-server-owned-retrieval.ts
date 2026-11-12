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

import {
  officialTruthServerOwnedRetrievalAdresseZulaessig,
  officialTruthServerOwnedRetrievalLookup,
  serverDns,
  serverHttp,
  serverUhr,
  hopLesen,
  textAus,
  uhrLesen,
  medientyp,
  inhaltLaenge,
  abbruch,
  type OfficialTruthServerOwnedRetrievalDnsResolver,
  type OfficialTruthServerOwnedRetrievalHttpClient,
  type OfficialTruthServerOwnedRetrievalSperrgrund,
} from './official-truth-retrieval-physical-internal'
export {
  officialTruthServerOwnedRetrievalAdresseZulaessig,
  officialTruthServerOwnedRetrievalLookup,
} from './official-truth-retrieval-physical-internal'
export type {
  OfficialTruthServerOwnedRetrievalAdresse,
  OfficialTruthServerOwnedRetrievalDnsResolver,
  OfficialTruthServerOwnedRetrievalHttpClient,
  OfficialTruthServerOwnedRetrievalHttpErgebnis,
  OfficialTruthServerOwnedRetrievalSperrgrund,
} from './official-truth-retrieval-physical-internal'

import net from 'node:net'

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
} from '@/lib/readiness/source-registry'
import {
  officialTruthChDeSourceBudget128k1,
  officialTruthChDeSourceFingerprintV2Allowed,
} from '@/lib/readiness/official-truth-ch-de-source-budget-128k-1'

const TIEFE_MAX = 8
const REDIRECT_MAX = 5
const BODY_MAX = 65_536
const TIMEOUT_MS = 10_000
const LIVE_PRIVILEGED_TRANSPORT = Symbol('live-privileged-transport')

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

function fristMs(wert: number | undefined): number {
  if (wert == null) return TIMEOUT_MS
  if (!Number.isInteger(wert) || wert < 1 || wert > TIMEOUT_MS) return TIMEOUT_MS
  return wert
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
