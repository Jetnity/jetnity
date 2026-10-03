// lib/readiness/official-truth-same-request-extraction-server.test.ts
//
// Gleiche-Request-Bindung von Beweis, Wiedergabe und Extraktor.
// Synthetische *.example-Quellen. DNS, HTTP und Katalog sind Fakes.
// Kein Live-Netz, kein Provider, keine Annahme, kein Speicher.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { OFFICIAL_CHECKED_AT_MAX_AGE_MS } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import type { OfficialTruthFactEntryAuthorityResult } from '@/lib/readiness/official-truth-fact-entry-authority-server'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  decideOfficialTruthSameRequestProof,
  type OfficialTruthSameRequestProofErgebnis,
} from '@/lib/readiness/official-truth-same-request-proof-server'
import {
  decideOfficialTruthSameRequestTrustedFactExtraction,
  loadOfficialTruthSameRequestTrustedFactExtraction,
  type OfficialTruthSameRequestExtractionErgebnis,
} from '@/lib/readiness/official-truth-same-request-extraction-server'
import type { OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import {
  decideOfficialTruthServerOwnedRetrieval,
  type OfficialTruthServerOwnedRetrievalHttpClient,
  type OfficialTruthServerOwnedRetrievalHttpErgebnis,
  type OfficialTruthServerOwnedRetrievalLookup,
} from '@/lib/readiness/official-truth-server-owned-retrieval'
import {
  OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY,
  officialTruthTrustedFactExtrahieren,
  officialTruthTrustedFactExtrahierenMitDefinitionen,
  type OfficialTruthExtractorDefinition,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { quellenRegistryErstellen, type QuellenEingabe, type QuellenRegistry, type RegistrierteQuelle } from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const DATEI = 'lib/readiness/official-truth-same-request-extraction-server.ts'
const ABRUF_DATEI = 'lib/readiness/official-truth-server-owned-retrieval.ts'
const HELFER = 'loadOfficialTruthServerOwnedRetrievalWithCatalogTransport'

const JETZT = '2026-10-01T12:00:00.000Z'
const ABRUF_ZEIT = '2026-10-03T01:00:00.000Z'
const INNERHALB = new Date(Date.parse(JETZT) - OFFICIAL_CHECKED_AT_MAX_AGE_MS + 1).toISOString()
const SNAPSHOT = 'official page line\nproof-sentinel'
const INNEN_TEXT = 'interior proof page'
const REAL = 'example-real-government'
const INTERIOR = 'example-real-interior'
const REAL_URL = 'https://www.real-government.example/rules'
const INNEN_URL = 'https://www.real-interior.example/rules'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
const ERFOLG_SCHLUESSEL = [
  'capability',
  'evidenceQuality',
  'evidenceVersions',
  'extractorId',
  'extractorVersion',
  'factKind',
  'freshness',
  'grant',
  'kandidat',
  'policyId',
  'policyVersion',
  'provenance',
  'registry',
  'retrievals',
  'reviewPacketKey',
  'ruleScopeKey',
  'schemaFamily',
  'serverReferenceTime',
  'status',
  'supportVersionIds',
  'trustedRuleFact',
]
const PROVENIENZ_SCHLUESSEL = [
  'canonicalUrl',
  'contentType',
  'retrievedAt',
  'sourceContentHash',
  'sourceId',
  'versionId',
]

type Aufruf = Record<string, unknown>
type Schritt = { status?: number; body?: string; location?: string; contentType?: string }
type Spur = {
  abrufe: unknown[]
  transporte: OfficialTruthSourceCatalogTransport[]
  katalogOperationen: unknown[]
  extrakt: unknown[]
  http: string[]
}

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function dateienUnter(relativ: string): string[] {
  const start = join(wurzel, relativ)
  const fund: string[] = []
  const stapel = [start]
  while (stapel.length > 0) {
    const ordner = stapel.pop()
    if (!ordner) break
    let eintraege: { name: string; isDirectory(): boolean }[]
    try {
      eintraege = readdirSync(ordner, { withFileTypes: true })
    } catch {
      continue
    }
    for (const eintrag of eintraege) {
      if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue
      const pfad = join(ordner, eintrag.name)
      if (eintrag.isDirectory()) stapel.push(pfad)
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(eintrag.name)) fund.push(pfad)
    }
  }
  return fund
}

function roh(teil?: Record<string, unknown>): Record<string, unknown> {
  return {
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: 'CH',
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
    ...teil,
  }
}

function zelle(teil?: Record<string, unknown>): { scope: RegelScope; key: string } {
  const gelesen = regelScopeAusEvidenceScope(roh(teil))
  assert.equal(gelesen.ok, true)
  if (!gelesen.ok) throw new Error('scope')
  return gelesen
}

function anfrage(
  teil?: Record<string, unknown>,
  factKind: RegelFaktArt = 'requirement_effect',
  grund: OfficialTruthRechercheGrund = { status: 'missing' },
): OfficialTruthRechercheAnfrage {
  const basis = zelle(teil)
  const abdeckung =
    grund.status === 'missing'
      ? { status: 'missing' as const, ruleScopeKey: basis.key, factKind }
      : { status: 'recheck_needed' as const, ruleScopeKey: basis.key, factKind, reason: grund.reason }
  const entscheidung = officialTruthRechercheEntscheiden(abdeckung, basis.scope)
  assert.equal(entscheidung.action, 'research')
  if (entscheidung.action !== 'research') throw new Error('anfrage')
  return entscheidung.request
}

function registry(eingaben: readonly QuellenEingabe[]): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(eingaben)
  if (!ergebnis.ok) throw new Error(ergebnis.reason)
  return ergebnis.registry
}

function amt(sourceId: string, domain: string, name: string): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'official_authority',
    publisherName: name,
    authorityName: name,
    domains: [domain],
  }
}

function realeEingaben(): QuellenEingabe[] {
  return [amt(REAL, 'real-government.example', 'Real Government Authority'), amt(INTERIOR, 'real-interior.example', 'Real Interior Authority')]
}

function quelle(basis: QuellenRegistry, sourceId: string): RegistrierteQuelle {
  const gefunden = basis.sources.find((eintrag) => eintrag.sourceId === sourceId)
  assert.ok(gefunden)
  return gefunden
}

function coverage(teil?: Partial<QuellenAbdeckung>): QuellenAbdeckung {
  return {
    destinationCountryCodes: ['JP'],
    transitCountryCodes: [],
    requirementTypes: ['visa'],
    citizenship: { mode: 'exact', countryCodes: ['CH'] },
    residence: { mode: 'not_applicable' },
    documents: { mode: 'exact', options: [{ documentType: 'passport', issuingCountryCode: 'CH' }] },
    ...teil,
  }
}

function deskriptor(basis: QuellenRegistry, sourceId: string, gebiet: QuellenAbdeckung = coverage()): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage: gebiet }
}

function katalogZeile(eingabe: QuellenEingabe): Aufruf {
  return {
    source_id: eingabe.sourceId,
    source_class: eingabe.sourceClass,
    publisher_name: eingabe.publisherName,
    authority_name: eingabe.authorityName ?? null,
    domains: [...eingabe.domains],
  }
}

function transportFuer(eingaben: readonly QuellenEingabe[]): {
  transport: OfficialTruthSourceCatalogTransport
  aufrufe: Aufruf[]
} {
  const aufrufe: Aufruf[] = []
  return {
    aufrufe,
    transport: {
      async aufrufen(payload) {
        aufrufe.push(payload)
        if (payload.operation !== 'read_registry') return { ok: false }
        return {
          ok: true,
          antwort: { ok: true, operation: 'read_registry', sources: eingaben.map(katalogZeile) },
        }
      },
    },
  }
}

function driftTransport(): { transport: OfficialTruthSourceCatalogTransport; aufrufe: Aufruf[] } {
  const aufrufe: Aufruf[] = []
  return {
    aufrufe,
    transport: {
      async aufrufen(payload) {
        aufrufe.push(payload)
        if (payload.operation !== 'read_registry') return { ok: false }
        const eingaben =
          aufrufe.length === 1
            ? realeEingaben()
            : realeEingaben().map((eintrag) => ({ ...eintrag, domains: ['drift.example'] }))
        return {
          ok: true,
          antwort: { ok: true, operation: 'read_registry', sources: eingaben.map(katalogZeile) },
        }
      },
    },
  }
}

function aufrufer(teil?: {
  request?: unknown
  descriptors?: unknown
  sourceId?: unknown
  material?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = registry(realeEingaben())
  return {
    request: teil?.request ?? anfrage(),
    descriptors: teil?.descriptors ?? [deskriptor(basis, REAL), deskriptor(basis, INTERIOR, coverage({ destinationCountryCodes: ['TH'] }))],
    sourceId: teil && 'sourceId' in teil ? teil.sourceId : REAL,
    material: {
      canonicalUrl: REAL_URL,
      retrievedAt: INNERHALB,
      sourceSnapshot: SNAPSHOT,
      ...teil?.material,
    },
  }
}

function meta(teil?: Record<string, unknown>) {
  return {
    factKind: 'requirement_effect',
    evidenceQuality: 'explicit_primary_statement',
    proposal: VORSCHLAG,
    ...teil,
  }
}

function buendel(umschlag: Record<string, unknown> = aufrufer(), extraktion: unknown = null) {
  return { umschlag, uhr: () => new Date('2099-01-01T00:00:00.000Z'), extraktion }
}

function eingabe(teil?: { umschlag?: Record<string, unknown>; metadata?: Record<string, unknown>; supports?: unknown[] }) {
  return {
    supports: teil?.supports ?? [buendel(teil?.umschlag ?? aufrufer())],
    metadata: teil?.metadata ?? meta(),
  }
}

function zweitesBuendel() {
  const basis = registry(realeEingaben())
  const gebiet = coverage()
  return buendel(
    aufrufer({
      descriptors: [deskriptor(basis, REAL, gebiet), deskriptor(basis, INTERIOR, gebiet)],
      sourceId: INTERIOR,
      material: { canonicalUrl: INNEN_URL, retrievedAt: INNERHALB, sourceSnapshot: INNEN_TEXT },
    }),
  )
}

function erstesBuendel() {
  const basis = registry(realeEingaben())
  return buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, coverage())] }))
}

function freigabe(): OfficialTruthFactEntryAuthorityResult {
  return { status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }
}

function hostAus(url: string): string {
  let host = new URL(url).hostname
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  return host
}

function kopf(werte: Record<string, string>): { get(name: string): string | null } {
  const klein: Record<string, string> = {}
  for (const [name, wert] of Object.entries(werte)) klein[name.toLowerCase()] = wert
  return { get: (name) => klein[name.toLowerCase()] ?? null }
}

function standardAntwort(url: string): Schritt {
  if (url === REAL_URL) return { status: 200, body: SNAPSHOT, contentType: 'text/plain' }
  if (url === INNEN_URL) return { status: 200, body: INNEN_TEXT, contentType: 'text/plain' }
  return { status: 404, body: '', contentType: 'text/plain' }
}

function lookupWarten(lookup: OfficialTruthServerOwnedRetrievalLookup, hostname: string) {
  return new Promise<{ code?: string; address?: unknown; family?: unknown }>((resolve) => {
    lookup(hostname, { all: false }, (error, address, family) => {
      resolve({ code: error?.code, address, family })
    })
  })
}

function httpClient(spur: Spur, antwort: (url: string) => Schritt): OfficialTruthServerOwnedRetrievalHttpClient {
  return async (anfrage): Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis> => {
    const gefunden = await lookupWarten(anfrage.lookup, hostAus(anfrage.url))
    if (gefunden.code === 'JETNITY_ADDRESS_NOT_PERMITTED') return { ok: false, reason: 'address_not_permitted' }
    if (gefunden.code === 'JETNITY_DNS_EMPTY') return { ok: false, reason: 'dns_empty' }
    if (gefunden.code || typeof gefunden.address !== 'string') return { ok: false, reason: 'dns_failed' }
    spur.http.push(anfrage.url)
    const schritt = antwort(anfrage.url)
    const typ = schritt.contentType ?? 'text/plain'
    return {
      ok: true,
      status: schritt.status ?? 200,
      headers: kopf({
        ...(schritt.location ? { location: schritt.location } : {}),
        ...((schritt.status ?? 200) < 300 ? { 'content-type': typ } : {}),
      }),
      body: (async function* () {
        if ((schritt.status ?? 200) >= 300) return
        yield new TextEncoder().encode(schritt.body ?? '')
      })(),
    }
  }
}

async function echtAbrufen(
  anfrage: unknown,
  transport: OfficialTruthSourceCatalogTransport,
  spur: Spur,
  antwort: (url: string) => Schritt,
) {
  return decideOfficialTruthServerOwnedRetrieval(anfrage, {
    catalog: { transport },
    now: () => new Date(ABRUF_ZEIT),
    resolve: async () => [{ address: '8.8.8.8', family: 4 as const }],
    http: httpClient(spur, antwort),
  })
}

function definition(): OfficialTruthExtractorDefinition {
  return {
    extractorId: 'otx_example_effect',
    extractorVersion: 1,
    current: true,
    factKind: 'requirement_effect',
    sourceFamilyId: 'otf_example_effect',
    sourceIds: [REAL],
    urlAllowlist: [{ kind: 'exact', canonicalUrl: REAL_URL }],
    contentTypes: ['text/plain'],
    schemaFamily: 'ots_example_effect',
    policyId: null,
    policyVersion: null,
    requiredFieldPaths: [],
    match: (kontext) => {
      const stuetze = kontext.supports[0]
      if (kontext.supports.length !== 1 || stuetze?.sourceSnapshot !== SNAPSHOT) {
        return { ok: false, reason: 'structure_not_recognized' }
      }
      return { ok: true }
    },
    extract: () => ({ ok: true, fact: { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } }),
  }
}

async function binden(
  wert: unknown,
  optionen?: {
    extern?: { transport: OfficialTruthSourceCatalogTransport; aufrufe: Aufruf[] }
    loadProof?: (eingabe: unknown) => Promise<OfficialTruthSameRequestProofErgebnis>
    retrieve?: (
      eingabe: unknown,
      transport: OfficialTruthSourceCatalogTransport,
    ) => Promise<Awaited<ReturnType<typeof echtAbrufen>>>
    extract?: (eingabe: unknown) => ReturnType<typeof officialTruthTrustedFactExtrahieren>
    antwort?: (url: string) => Schritt
    definitionen?: readonly OfficialTruthExtractorDefinition[]
  },
): Promise<{ ergebnis: OfficialTruthSameRequestExtractionErgebnis; spur: Spur; extern: Aufruf[] }> {
  const extern = optionen?.extern ?? transportFuer(realeEingaben())
  const spur: Spur = { abrufe: [], transporte: [], katalogOperationen: [], extrakt: [], http: [] }
  const antwort = optionen?.antwort ?? standardAntwort
  const ergebnis = await decideOfficialTruthSameRequestTrustedFactExtraction(wert, {
    loadProof:
      optionen?.loadProof ??
      ((eingabe) =>
        decideOfficialTruthSameRequestProof(eingabe, {
          loadAuthority: async () => freigabe(),
          now: () => JETZT,
          catalog: { transport: extern.transport },
        })),
    retrieve: async (anfrage, transport) => {
      spur.abrufe.push(anfrage)
      spur.transporte.push(transport)
      const zaehler: OfficialTruthSourceCatalogTransport = {
        async aufrufen(payload) {
          spur.katalogOperationen.push(payload)
          return transport.aufrufen(payload)
        },
      }
      if (optionen?.retrieve) return optionen.retrieve(anfrage, zaehler)
      return echtAbrufen(anfrage, zaehler, spur, antwort)
    },
    extract: (eingabe) => {
      spur.extrakt.push(eingabe)
      if (optionen?.extract) return optionen.extract(eingabe)
      if (optionen?.definitionen) return officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe, optionen.definitionen)
      return officialTruthTrustedFactExtrahieren(eingabe)
    },
  })
  return { ergebnis, spur, extern: extern.aufrufe }
}

function grund(ergebnis: OfficialTruthSameRequestExtractionErgebnis): string {
  assert.equal(ergebnis.status, 'blocked')
  if (ergebnis.status !== 'blocked') throw new Error('grund')
  return ergebnis.reason
}

function erfolg(ergebnis: OfficialTruthSameRequestExtractionErgebnis) {
  assert.equal(ergebnis.status, 'same_request_trusted_fact_material')
  if (ergebnis.status !== 'same_request_trusted_fact_material') throw new Error('erfolg')
  return ergebnis
}

describe('Official Truth same-request retrieval-to-extractor binding', () => {
  test('1 ein Beweisblock ruft weder Lesung noch Extraktor', async () => {
    const extern = transportFuer(realeEingaben())
    const { ergebnis, spur, extern: aufrufe } = await binden(eingabe(), {
      extern,
      loadProof: (wert) =>
        decideOfficialTruthSameRequestProof(wert, {
          loadAuthority: async () => ({ status: 'access_forbidden' }),
          now: () => JETZT,
          catalog: { transport: extern.transport },
        }),
    })
    assert.equal(grund(ergebnis), 'access_forbidden')
    assert.equal(aufrufe.length, 0)
    assert.equal(spur.abrufe.length, 0)
    assert.equal(spur.http.length, 0)
    assert.equal(spur.extrakt.length, 0)

    const qualitaet = await binden(eingabe({ metadata: meta({ evidenceQuality: 'research_gap', proposal: null }) }))
    assert.equal(grund(qualitaet.ergebnis), 'quality_not_acceptable')
    assert.equal(qualitaet.spur.abrufe.length, 0)
    assert.equal(qualitaet.spur.extrakt.length, 0)
  })

  test('2 Aufrufer-Beweis, Registry, Evidence, Abruf, Fakt, Extraktor und Politik scheitern an den Beweisgrenzen', async () => {
    const felder: Record<string, unknown> = {
      registry: { sources: [], blockedDomains: [] },
      evidence: { versionId: 'ev1_' + 'a'.repeat(32) },
      evidenceVersions: [],
      retrieval: { status: 'retrieved_material', sourceSnapshot: 'old submitted page' },
      sourceSnapshot: 'old submitted page',
      sourceContentHash: 'a'.repeat(64),
      retrievedAt: ABRUF_ZEIT,
      contentType: 'text/html',
      trustedRuleFact: { kind: 'requirement_effect', effect: 'required', visaMode: null },
      extractorId: 'otx_example_effect',
      extractorVersion: 1,
      schemaFamily: 'ots_example_effect',
      policy: { policyId: 'otp_example_effect', policyVersion: 1, assignments: [] },
      grant: 'role',
      capability: 'official-truth-freigeben',
      clock: ABRUF_ZEIT,
      model: 'caller-model',
      suggestion: { effect: 'required' },
    }
    for (const [feld, wert] of Object.entries(felder)) {
      const huelle = { ...eingabe(), [feld]: wert }
      const allein = await decideOfficialTruthSameRequestProof(huelle, {
        loadAuthority: async () => freigabe(),
        now: () => JETZT,
        catalog: { transport: transportFuer(realeEingaben()).transport },
      })
      const { ergebnis, spur } = await binden(huelle)
      assert.equal(ergebnis.status, 'blocked', feld)
      assert.deepEqual(ergebnis, allein, feld)
      assert.equal(spur.abrufe.length, 0, feld)
      assert.equal(spur.http.length, 0, feld)
      assert.equal(spur.extrakt.length, 0, feld)
      assert.equal(JSON.stringify(ergebnis).includes('old submitted page'), false, feld)
    }

    const graph = await decideOfficialTruthSameRequestProof(eingabe(), {
      loadAuthority: async () => freigabe(),
      now: () => JETZT,
      catalog: { transport: transportFuer(realeEingaben()).transport },
    })
    assert.equal(graph.status, 'same_request_proof')
    const replay = await binden(graph)
    assert.equal(grund(replay.ergebnis), 'caller_authority_forbidden')
    assert.equal(replay.spur.abrufe.length, 0)
    assert.equal(replay.spur.extrakt.length, 0)
  })

  test('3 bis 5 eine externe Kataloglesung, dieselbe Registry für jede Stütze, kein Schreibaufruf', async () => {
    const extern = driftTransport()
    const wert = eingabe({
      supports: [erstesBuendel(), zweitesBuendel()],
      metadata: meta(),
    })
    const { ergebnis, spur, extern: aufrufe } = await binden(wert, { extern })
    assert.equal(ergebnis.status, 'blocked')
    assert.equal(aufrufe.length, 1)
    assert.deepEqual(aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])
    assert.equal(spur.abrufe.length, 2)
    assert.equal(spur.transporte.length, 2)
    assert.equal(spur.transporte[0], spur.transporte[1])
    assert.equal(spur.katalogOperationen.length, 2)
    assert.deepEqual(
      spur.katalogOperationen.map((aufruf) => (aufruf as { operation?: string }).operation),
      ['read_registry', 'read_registry'],
    )
    assert.equal(spur.http.length, 2)
    assert.equal(JSON.stringify(ergebnis).includes('drift.example'), false)
    const register = await spur.transporte[0]?.aufrufen({ operation: 'register_source', source: { source_id: REAL } })
    assert.deepEqual(register, { ok: false })
    const fremd = await spur.transporte[0]?.aufrufen({ operation: 'read_registry', note: 'not-a-catalog-field' })
    assert.deepEqual(fremd, { ok: false })
    assert.equal(extern.aufrufe.length, 1)
    assert.equal(spur.abrufe.every((anfrage) => Object.keys(anfrage as object).sort().join() === 'sourceId,url'), true)
  })

  test('6 Quellidentität der frischen Lesung blockiert vor dem Extraktor', async () => {
    const { ergebnis, spur } = await binden(eingabe(), {
      retrieve: async (anfrage, transport) => {
        const echt = await echtAbrufen(anfrage, transport, { abrufe: [], transporte: [], katalogOperationen: [], extrakt: [], http: [] }, standardAntwort)
        if (echt.status !== 'server_owned_official_retrieval') return echt
        return { ...echt, sourceId: INTERIOR }
      },
    })
    assert.equal(grund(ergebnis), 'support_binding_mismatch')
    assert.equal(spur.abrufe.length, 1)
    assert.equal(spur.extrakt.length, 0)
    assert.equal(JSON.stringify(ergebnis).includes(SNAPSHOT), false)
  })

  test('7 eine andere End-URL blockiert vor dem Extraktor', async () => {
    const { ergebnis, spur } = await binden(eingabe(), {
      antwort: (url) => {
        if (url === REAL_URL) return { status: 302, location: 'https://www.real-government.example/rules/moved' }
        if (url === 'https://www.real-government.example/rules/moved') {
          return { status: 200, body: SNAPSHOT, contentType: 'text/plain' }
        }
        return { status: 404, body: '' }
      },
    })
    assert.equal(grund(ergebnis), 'source_url_changed_since_evidence')
    assert.equal(spur.extrakt.length, 0)
    assert.deepEqual(spur.http, [REAL_URL, 'https://www.real-government.example/rules/moved'])
  })

  test('8 ein geänderter Seiteninhalt bleibt die alte Evidence und wird nicht angenommen', async () => {
    const { ergebnis, spur } = await binden(eingabe(), {
      antwort: () => ({ status: 200, body: 'changed official page', contentType: 'text/plain' }),
    })
    assert.equal(grund(ergebnis), 'source_changed_since_evidence')
    assert.equal(spur.extrakt.length, 0)
    assert.equal(spur.http.length, 1)
    assert.equal(JSON.stringify(ergebnis).includes('changed official page'), false)
  })

  test('9 Version und Evidence-Bindung scheitern vor dem Extraktor', async () => {
    const extern = transportFuer(realeEingaben())
    const { ergebnis, spur } = await binden(eingabe(), {
      extern,
      loadProof: async (wert) => {
        const graph = await decideOfficialTruthSameRequestProof(wert, {
          loadAuthority: async () => freigabe(),
          now: () => JETZT,
          catalog: { transport: extern.transport },
        })
        if (graph.status !== 'same_request_proof') return graph
        return {
          ...graph,
          evidenceVersions: graph.evidenceVersions.map((version) => ({
            ...version,
            versionId: `ev1_${'0'.repeat(32)}`,
          })),
        }
      },
    })
    assert.equal(grund(ergebnis), 'support_binding_mismatch')
    assert.equal(spur.abrufe.length, 1)
    assert.equal(spur.extrakt.length, 0)
  })

  test('10 eingereichtes Abrufmaterial ist keine frische Lesung', async () => {
    const oben = await binden({
      ...eingabe(),
      retrieval: { status: 'retrieved_material', sourceSnapshot: 'old submitted page' },
    })
    assert.equal(oben.ergebnis.status, 'blocked')
    assert.equal(oben.spur.abrufe.length, 0)
    assert.equal(oben.spur.extrakt.length, 0)
    assert.equal(JSON.stringify(oben.ergebnis).includes('old submitted page'), false)

    const { ergebnis, spur } = await binden(eingabe(), {
      retrieve: async () =>
        ({ status: 'retrieved_material', sourceSnapshot: 'old submitted page' }) as unknown as Awaited<ReturnType<typeof echtAbrufen>>,
    })
    assert.equal(grund(ergebnis), 'representation_not_eligible')
    assert.equal(spur.abrufe.length, 1)
    assert.equal(spur.extrakt.length, 0)
    assert.equal(JSON.stringify(ergebnis).includes('old submitted page'), false)
  })

  test('11 ein Lesefehler bleibt geschlossen und erreicht den Extraktor nicht', async () => {
    const { ergebnis, spur } = await binden(eingabe(), {
      antwort: () => ({ status: 500, body: 'secret-upstream-body' }),
    })
    assert.equal(grund(ergebnis), 'http_status')
    assert.equal(spur.extrakt.length, 0)
    assert.equal(JSON.stringify(ergebnis).includes('secret-upstream-body'), false)
  })

  test('12 eine ausdrückliche Primärquelle übergibt nur policy null', async () => {
    const { ergebnis, spur } = await binden(eingabe(), { definitionen: [definition()] })
    const wert = erfolg(ergebnis)
    assert.equal(spur.extrakt.length, 1)
    const eingang = spur.extrakt[0] as { policy: unknown; evidenceQuality: string; supports: { retrieval: { retrievedAt: string } }[] }
    assert.equal(eingang.policy, null)
    assert.equal(eingang.evidenceQuality, 'explicit_primary_statement')
    assert.equal(wert.policyId, null)
    assert.equal(wert.policyVersion, null)
    assert.equal(eingang.supports[0]?.retrieval.retrievedAt, ABRUF_ZEIT)
    assert.notEqual(wert.evidenceVersions[0]?.retrievedAt, ABRUF_ZEIT)
    assert.equal(wert.serverReferenceTime, JETZT)
  })

  test('13 zusammengesetzte Qualität scheitert vor HTTP, weil keine Serverpolitik existiert', async () => {
    const { ergebnis, spur, extern } = await binden(
      eingabe({
        supports: [erstesBuendel(), zweitesBuendel()],
        metadata: meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
      }),
    )
    assert.equal(grund(ergebnis), 'composition_policy_unavailable')
    assert.equal(extern.length, 1)
    assert.equal(spur.abrufe.length, 0)
    assert.equal(spur.http.length, 0)
    assert.equal(spur.extrakt.length, 0)
  })

  test('14 bis 18 ein synthetischer Erfolg ist eingefroren, ohne Seitenrohtext, und reihenfolgeunabhängig', async () => {
    const extern = driftTransport()
    const huelle = eingabe()
    const { ergebnis, spur } = await binden(huelle, { extern, definitionen: [definition()] })
    const wert = erfolg(ergebnis)
    assert.equal(extern.aufrufe.length, 1)
    assert.deepEqual(Object.keys(wert).sort(), ERFOLG_SCHLUESSEL)
    assert.equal(wert.freshness, 'current')
    assert.equal(wert.grant, 'role')
    assert.equal(wert.capability, 'official-truth-freigeben')
    assert.equal(wert.extractorId, 'otx_example_effect')
    assert.equal(wert.extractorVersion, 1)
    assert.equal(wert.schemaFamily, 'ots_example_effect')
    assert.equal(wert.trustedRuleFact.kind, 'requirement_effect')
    assert.equal(JSON.stringify(wert).includes(SNAPSHOT), false)
    assert.equal(JSON.stringify(wert).includes('sourceSnapshot'), false)
    assert.deepEqual(Object.keys(wert.retrievals[0] ?? {}).sort(), PROVENIENZ_SCHLUESSEL)
    assert.equal(wert.retrievals[0]?.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
    assert.equal(wert.retrievals[0]?.sourceContentHash, wert.evidenceVersions[0]?.sourceContentHash)
    assert.equal(wert.retrievals[0]?.canonicalUrl, REAL_URL)
    assert.equal(wert.retrievals[0]?.sourceId, REAL)
    assert.equal(wert.retrievals[0]?.retrievedAt, ABRUF_ZEIT)
    assert.equal(wert.retrievals[0]?.contentType, 'text/plain')
    assert.equal(wert.provenance.every((eintrag) => eintrag.versionId === wert.supportVersionIds[0]), true)
    assert.equal(wert.provenance.every((eintrag) => eintrag.sourceId === REAL), true)
    assert.equal(wert.provenance.every((eintrag) => eintrag.policyId === null), true)
    assert.equal(wert.retrievals[0]?.versionId, wert.supportVersionIds[0])
    assert.equal(Object.isFrozen(wert), true)
    assert.equal(Object.isFrozen(wert.registry), true)
    assert.equal(Object.isFrozen(wert.evidenceVersions), true)
    assert.equal(Object.isFrozen(wert.kandidat), true)
    assert.equal(Object.isFrozen(wert.trustedRuleFact), true)
    assert.equal(Object.isFrozen(wert.retrievals), true)
    assert.equal(Object.isFrozen(wert.provenance), true)
    assert.equal(JSON.stringify(wert.registry).includes('drift.example'), false)
    const eingang = spur.extrakt[0] as { supports: { retrieval: { sourceSnapshot?: string; status?: string } }[] }
    assert.equal(eingang.supports[0]?.retrieval.sourceSnapshot, SNAPSHOT)
    assert.equal(eingang.supports[0]?.retrieval.status, 'server_owned_official_retrieval')

    const vorher = JSON.stringify(wert)
    const material = (huelle.supports[0] as { umschlag: { material: { sourceSnapshot: string } } }).umschlag.material
    material.sourceSnapshot = 'mutated after return'
    assert.throws(() => {
      ;(wert as { status: string }).status = 'accepted'
    })
    assert.throws(() => {
      ;(wert.retrievals[0] as { sourceId: string }).sourceId = INTERIOR
    })
    assert.equal(JSON.stringify(wert), vorher)
    assert.equal(JSON.stringify(wert).includes('mutated after return'), false)

    const vorwaerts = await binden(
      eingabe({ supports: [erstesBuendel(), zweitesBuendel()], metadata: meta() }),
    )
    const rueckwaerts = await binden(
      eingabe({ supports: [zweitesBuendel(), erstesBuendel()], metadata: meta() }),
    )
    assert.deepEqual(
      vorwaerts.spur.abrufe.map((anfrage) => (anfrage as { url: string }).url),
      rueckwaerts.spur.abrufe.map((anfrage) => (anfrage as { url: string }).url),
    )
    assert.deepEqual(
      vorwaerts.spur.abrufe.map((anfrage) => (anfrage as { sourceId: string }).sourceId),
      rueckwaerts.spur.abrufe.map((anfrage) => (anfrage as { sourceId: string }).sourceId),
    )
    assert.equal(vorwaerts.spur.abrufe.length, 2)
    assert.notEqual(
      (vorwaerts.spur.abrufe[0] as { url: string }).url,
      (vorwaerts.spur.abrufe[1] as { url: string }).url,
    )
  })

  test('19 und 20 der Live-Pfad benutzt nur das leere Produktionsregister', async () => {
    const text = datei(DATEI)
    const live = text.slice(text.indexOf('export async function loadOfficialTruthSameRequestTrustedFactExtraction'))
    assert.match(live, /loadOfficialTruthSameRequestProof/)
    assert.match(live, /loadOfficialTruthServerOwnedRetrievalWithCatalogTransport/)
    assert.match(live, /officialTruthTrustedFactExtrahieren/)
    assert.doesNotMatch(live, /MitDefinitionen/)
    assert.doesNotMatch(live, /OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY/)
    assert.equal(loadOfficialTruthSameRequestTrustedFactExtraction.length, 1)
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
    assert.equal(text.includes('officialTruthTrustedFactExtrahierenMitDefinitionen'), false)

    const { ergebnis, spur } = await binden(eingabe())
    assert.equal(grund(ergebnis), 'extractor_not_registered')
    assert.equal(spur.http.length, 1)
    assert.equal(spur.extrakt.length, 1)
    assert.equal(JSON.stringify(ergebnis).includes(SNAPSHOT), false)
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)

    for (const feld of ['trustedRuleFact', 'clock', 'model', 'evidenceVersions'] as const) {
      const liveErgebnis = await loadOfficialTruthSameRequestTrustedFactExtraction({
        ...eingabe(),
        [feld]: feld === 'evidenceVersions' ? [] : 'caller-owned',
      })
      assert.equal(liveErgebnis.status, 'blocked', feld)
      if (liveErgebnis.status === 'blocked') assert.equal(liveErgebnis.reason, 'caller_authority_forbidden', feld)
    }
  })

  test('21 nur die Bindung importiert den Katalogtransport-Helfer', () => {
    const treffer: string[] = []
    for (const start of ['lib', 'app', 'components', 'hooks', 'types']) {
      for (const pfad of dateienUnter(start)) {
        if (pfad.endsWith('.test.ts')) continue
        const text = readFileSync(pfad, 'utf8')
        if (text.includes(HELFER)) treffer.push(pfad.slice(wurzel.length + 1))
      }
    }
    assert.deepEqual(treffer.sort(), [ABRUF_DATEI, DATEI].sort())
    assert.match(datei(DATEI), new RegExp(`import[\\s\\S]*${HELFER}`))
    const abruf = datei(ABRUF_DATEI)
    const live = abruf.slice(
      abruf.indexOf('export async function loadOfficialTruthServerOwnedRetrieval('),
      abruf.indexOf(`export async function ${HELFER}`),
    )
    assert.doesNotMatch(live, /catalog:/)
  })

  test('22 bis 28 keine Route, keine Annahme, kein Speicher, kein Modell, kein F8', () => {
    const text = datei(DATEI)
    assert.match(text, /import 'server-only'/)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('official-truth-store-server'), false)
    assert.equal(text.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('supabase'), false)
    assert.equal(text.includes('process.env'), false)
    assert.equal(text.includes('quellenKatalogLesen'), false)
    assert.equal(text.includes('fetch('), false)
    assert.equal(text.includes('@/app/'), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.doesNotMatch(text, /openai|anthropic|sherpa|timatic|gov\.uk|ica\.gov/i)
    assert.equal(text.includes('F8'), false)
    assert.equal(requirementsProviderAus(), null)
    const app = dateienUnter('app')
    for (const pfad of app) {
      const inhalt = readFileSync(pfad, 'utf8')
      assert.equal(inhalt.includes('official-truth-same-request-extraction-server'), false, pfad)
      assert.equal(inhalt.includes(HELFER), false, pfad)
    }
    assert.equal(dateienUnter('supabase').some((pfad) => pfad.includes('same-request-extraction')), false)
  })

  test('eine Registry mit gesperrter Domain wird nicht still verworfen', async () => {
    const extern = transportFuer(realeEingaben())
    const { ergebnis, spur } = await binden(eingabe(), {
      extern,
      loadProof: async (wert) => {
        const graph = await decideOfficialTruthSameRequestProof(wert, {
          loadAuthority: async () => freigabe(),
          now: () => JETZT,
          catalog: { transport: extern.transport },
        })
        if (graph.status !== 'same_request_proof') return graph
        const erzeugt = quellenRegistryErstellen(
          graph.registry.sources.map((source) => ({
            sourceId: source.sourceId,
            sourceClass: source.sourceClass,
            publisherName: source.publisherName,
            authorityName: source.authorityName,
            domains: [...source.domains],
          })),
          { blockedDomains: ['blocked.example'] },
        )
        if (!erzeugt.ok) throw new Error(erzeugt.reason)
        return { ...graph, registry: erzeugt.registry }
      },
    })
    assert.equal(grund(ergebnis), 'blocked_domain_not_replayable')
    assert.equal(spur.abrufe.length, 0)
    assert.equal(spur.http.length, 0)
    assert.equal(spur.extrakt.length, 0)
  })
})
