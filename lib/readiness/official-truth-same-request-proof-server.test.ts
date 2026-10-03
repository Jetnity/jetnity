// lib/readiness/official-truth-same-request-proof-server.test.ts
//
// Interner gleicher-Request-Beweis. Synthetische *.example-Quellen.
// Kein Supabase-Client, kein Netz, kein Provider, keine Annahme.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { OFFICIAL_CHECKED_AT_MAX_AGE_MS } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import type { OfficialTruthFactEntryAuthorityResult } from '@/lib/readiness/official-truth-fact-entry-authority-server'
import { decideOfficialTruthAutonomousPreacceptanceWitness } from '@/lib/readiness/official-truth-autonomous-preacceptance-witness-server'
import {
  decideOfficialTruthSameRequestProof,
  loadOfficialTruthSameRequestProof,
  type OfficialTruthSameRequestProofErgebnis,
} from '@/lib/readiness/official-truth-same-request-proof-server'
import {
  officialTruthServerHeldReviewReproof,
  officialTruthServerHeldSameRequestMaterial,
} from '@/lib/readiness/official-truth-server-held-source-registry'
import type { OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const DATEI = 'lib/readiness/official-truth-same-request-proof-server.ts'
const ZEUGEN_DATEI = 'lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts'
const SERVER = 'lib/readiness/official-truth-server-held-source-registry.ts'
const SCHLUESSEL = /^review-packet:v2:[a-f0-9]{64}$/

const JETZT = '2026-10-01T12:00:00.000Z'
const JETZT_MS = Date.parse(JETZT)
const INNERHALB = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS + 1).toISOString()
const GRENZE = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS).toISOString()
const AELTER = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS - 1).toISOString()
const SNAPSHOT = 'official page line\nproof-sentinel'
const REAL = 'example-real-government'
const INTERIOR = 'example-real-interior'
const REAL_URL = 'https://www.real-government.example/rules'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
const ERFOLG_SCHLUESSEL = [
  'capability',
  'evidenceQuality',
  'evidenceVersions',
  'factKind',
  'freshness',
  'grant',
  'kandidat',
  'registry',
  'reviewPacketKey',
  'ruleScopeKey',
  'serverReferenceTime',
  'status',
  'supportVersionIds',
  'supports',
]
const ZEUGEN_SCHLUESSEL = [
  'capability',
  'factKind',
  'freshness',
  'grant',
  'reviewPacketKey',
  'ruleScopeKey',
  'serverReferenceTime',
  'status',
  'supportVersionIds',
]
const PERSONEN = [
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'tripId',
  'trip_id',
  'travellerId',
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'mrz',
  'biometric',
  'biometrics',
  'dateOfBirth',
  'email',
  'fullName',
  'phone',
]

type Aufruf = Record<string, unknown>
type Erfolg = Extract<OfficialTruthSameRequestProofErgebnis, { status: 'same_request_proof' }>

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function uhr(instant: string): () => Date {
  return () => new Date(instant)
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
  return [
    amt(REAL, 'real-government.example', 'Real Government Authority'),
    amt(INTERIOR, 'real-interior.example', 'Real Interior Authority'),
  ]
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
        if (payload.operation !== 'read_registry') throw new Error('register_source darf nicht aufgerufen werden')
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
  extra?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = registry(realeEingaben())
  return {
    request: teil?.request ?? anfrage(),
    descriptors: teil?.descriptors ?? [
      deskriptor(basis, REAL),
      deskriptor(basis, INTERIOR, coverage({ destinationCountryCodes: ['TH'] })),
    ],
    sourceId: teil && 'sourceId' in teil ? teil.sourceId : REAL,
    material: {
      canonicalUrl: REAL_URL,
      retrievedAt: INNERHALB,
      sourceSnapshot: SNAPSHOT,
      ...teil?.material,
    },
    ...teil?.extra,
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

function buendel(
  umschlag: Record<string, unknown> = aufrufer(),
  extraktion: unknown = null,
  instant = INNERHALB,
) {
  return { umschlag, uhr: uhr(instant), extraktion }
}

function eingabe(teil?: {
  umschlag?: Record<string, unknown>
  extraktion?: unknown
  metadata?: Record<string, unknown>
  instant?: string
}) {
  return {
    supports: [buendel(teil?.umschlag ?? aufrufer(), teil?.extraktion ?? null, teil?.instant ?? INNERHALB)],
    metadata: teil?.metadata ?? meta(),
  }
}

function freigabe(): OfficialTruthFactEntryAuthorityResult {
  return { status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }
}

function appTexte(): string {
  const texte: string[] = []
  const stapel = [join(wurzel, 'app')]
  while (stapel.length > 0) {
    const ordner = stapel.pop()
    if (!ordner) break
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name)
      if (eintrag.isDirectory()) stapel.push(pfad)
      else if (eintrag.name.endsWith('.ts') || eintrag.name.endsWith('.tsx')) texte.push(readFileSync(pfad, 'utf8'))
    }
  }
  return texte.join('\n')
}

function personenSchluessel(wert: unknown, tiefe = 0, gesehen = new WeakSet<object>()): string[] {
  if (tiefe > 16 || !wert || typeof wert !== 'object') return []
  if (gesehen.has(wert)) return []
  gesehen.add(wert)
  if (Array.isArray(wert)) return wert.flatMap((eintrag) => personenSchluessel(eintrag, tiefe + 1, gesehen))
  return Object.entries(wert).flatMap(([name, kind]) => [
    ...(PERSONEN.includes(name) ? [name] : []),
    ...personenSchluessel(kind, tiefe + 1, gesehen),
  ])
}

async function beweisen(
  wert: unknown,
  optionen?: {
    authority?: OfficialTruthFactEntryAuthorityResult | Error
    now?: () => string
    catalog?: { transport: OfficialTruthSourceCatalogTransport } | { env: Record<string, string | undefined> }
  },
): Promise<{
  ergebnis: OfficialTruthSameRequestProofErgebnis
  autoritaet: number
  katalog: number
  uhr: number
}> {
  let autoritaet = 0
  let uhrAufrufe = 0
  const eigener = transportFuer(realeEingaben())
  const ergebnis = await decideOfficialTruthSameRequestProof(wert, {
    loadAuthority: async () => {
      autoritaet += 1
      if (optionen?.authority instanceof Error) throw optionen.authority
      return optionen?.authority ?? freigabe()
    },
    now: () => {
      uhrAufrufe += 1
      if (optionen?.now) return optionen.now()
      return JETZT
    },
    catalog: optionen?.catalog ?? { transport: eigener.transport },
  })
  return { ergebnis, autoritaet, katalog: optionen?.catalog ? 0 : eigener.aufrufe.length, uhr: uhrAufrufe }
}

function alsErfolg(ergebnis: OfficialTruthSameRequestProofErgebnis): Erfolg {
  assert.equal(ergebnis.status, 'same_request_proof')
  if (ergebnis.status !== 'same_request_proof') throw new Error('graph')
  return ergebnis
}

function zuweisen(ziel: object, schluessel: string, wert: unknown): void {
  ;(ziel as Record<string, unknown>)[schluessel] = wert
}

function anhaengen(ziel: readonly unknown[], wert: unknown): void {
  ;(ziel as unknown[]).push(wert)
}

function laendercodes(citizenship: { mode: string; countryCodes?: readonly string[] }): readonly string[] {
  assert.equal(citizenship.mode, 'required')
  if (citizenship.mode !== 'required' || !citizenship.countryCodes) throw new Error('citizenship')
  return citizenship.countryCodes
}

describe('Official Truth same-request proof graph', () => {
  test('der Live-Einstieg liest Autorität selbst und gibt den Graphen nicht an eine Route', () => {
    const text = datei(DATEI)
    const zeuge = datei(ZEUGEN_DATEI)
    const live = text.slice(text.indexOf('export async function loadOfficialTruthSameRequestProof'))
    assert.equal(text.includes("import 'server-only'"), true)
    assert.match(live, /loadOfficialTruthFactEntryAuthority/)
    assert.equal(live.includes('catalog'), false)
    assert.equal(text.includes('officialTruthServerHeldSameRequestMaterial('), true)
    assert.equal(text.includes('officialFrische('), true)
    assert.equal(text.includes('maxAgeMs:'), false)
    assert.equal(text.includes('JSON.stringify'), false)
    assert.equal(text.includes('sourceSnapshot'), false)
    assert.equal(text.includes('fetch('), false)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(text.includes('official-truth-store-server'), false)
    assert.equal(text.includes('official-truth-autonomous-preacceptance-witness'), false)
    assert.equal(text.includes('official-truth-review-suggestion'), false)
    assert.equal(zeuge.includes('official-truth-same-request-proof-server'), true)
    const server = datei(SERVER)
    const materialTyp = server.slice(
      server.indexOf('export type OfficialTruthServerHeldSameRequestSupport'),
      server.indexOf('export type OfficialTruthServerHeldRegelErgebnis'),
    )
    const graphTyp = text.slice(
      text.indexOf('export type OfficialTruthSameRequestProofErgebnis'),
      text.indexOf('export type OfficialTruthSameRequestProofAbhaengigkeiten'),
    )
    assert.equal(materialTyp.includes('sourceSnapshot'), false)
    assert.equal(graphTyp.includes('sourceSnapshot'), false)
    assert.equal(server.includes('fetch('), false)
    assert.equal(requirementsProviderAus(), null)
    const oberflaeche = appTexte()
    assert.equal(oberflaeche.includes('official-truth-same-request-proof-server'), false)
    assert.equal(oberflaeche.includes('loadOfficialTruthSameRequestProof'), false)
    assert.equal(oberflaeche.includes('decideOfficialTruthSameRequestProof'), false)
    assert.equal(oberflaeche.includes('officialTruthServerHeldSameRequestMaterial'), false)
    assert.equal(typeof loadOfficialTruthSameRequestProof, 'function')
  })

  test('verweigerte Autorität, Break-Glass und Lookup-Fehler lesen den Katalog nicht', async () => {
    const faelle: OfficialTruthFactEntryAuthorityResult[] = [
      { status: 'access_forbidden' },
      { status: 'access_lookup_failed' },
      { status: 'role_grant_required' },
      { status: 'database_capability_denied' },
      { status: 'database_capability_unavailable' },
      { status: 'database_capability_failed' },
    ]
    for (const authority of faelle) {
      const { ergebnis, autoritaet, katalog } = await beweisen(eingabe(), { authority })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: authority.status })
      assert.equal(autoritaet, 1)
      assert.equal(katalog, 0)
    }
    const bruch = await beweisen(eingabe(), {
      authority: {
        status: 'authorized',
        grant: 'break-glass',
        capability: 'official-truth-freigeben',
      } as unknown as OfficialTruthFactEntryAuthorityResult,
    })
    assert.deepEqual(bruch.ergebnis, { status: 'blocked', reason: 'authority_required' })
    assert.equal(bruch.katalog, 0)
    const geworfen = await beweisen(eingabe(), { authority: new Error('db secret text') })
    assert.deepEqual(geworfen.ergebnis, { status: 'blocked', reason: 'access_lookup_failed' })
    assert.equal(geworfen.katalog, 0)
    assert.equal(JSON.stringify(geworfen.ergebnis).includes('db secret text'), false)
  })

  test('Aufrufer-Autorität, Zeuge, Evidence, Kandidat und Fakt werden vor dem Katalog abgelehnt', async () => {
    const felder = [
      'registry',
      'sourceClass',
      'domains',
      'blockedDomains',
      'role',
      'grant',
      'capability',
      'reviewerId',
      'userId',
      'email',
      'aal',
      'clock',
      'now',
      'maxAgeMs',
      'freshness',
      'witness',
      'reviewPacketKey',
      'supportVersionIds',
      'evidence',
      'evidenceVersions',
      'kandidat',
      'candidate',
      'trustedRuleFact',
    ] as const
    for (const feld of felder) {
      const wert = feld === 'evidenceVersions' ? [] : feld === 'registry' ? { sources: [] } : 'caller-owned'
      const { ergebnis, katalog } = await beweisen({ ...eingabe(), [feld]: wert })
      assert.equal(ergebnis.status, 'blocked', feld)
      if (ergebnis.status !== 'blocked') return
      assert.equal(ergebnis.reason, 'caller_authority_forbidden', feld)
      assert.equal(katalog, 0, feld)
    }
  })

  test('ein mitgelieferter Graph überspringt die Live-Lesung nicht', async () => {
    const { ergebnis } = await beweisen(eingabe())
    const graph = alsErfolg(ergebnis)
    const replay = await beweisen(graph)
    assert.deepEqual(replay.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.equal(replay.autoritaet, 0)
    assert.equal(replay.katalog, 0)
    assert.equal(replay.uhr, 0)
  })

  test('die historische Aufruferuhr wird nicht ausgeführt', async () => {
    let aufrufe = 0
    const aufruferUhr = () => {
      aufrufe += 1
      return new Date('2099-01-01T00:00:00.000Z')
    }
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const zukunft = await beweisen({
      supports: [
        {
          umschlag: aufrufer({
            descriptors: [deskriptor(basis, REAL, gebiet)],
            material: { retrievedAt: '2026-10-02T00:00:00.000Z' },
          }),
          uhr: aufruferUhr,
          extraktion: null,
        },
      ],
      metadata: meta(),
    })
    assert.deepEqual(zukunft.ergebnis, { status: 'blocked', reason: 'retrieved_at_in_future' })
    assert.equal(aufrufe, 0)
    assert.equal(zukunft.katalog, 1)
    assert.equal(zukunft.uhr, 1)

    const werfend = () => {
      aufrufe += 1
      throw new Error('caller clock must not run')
    }
    const aktuell = await beweisen({
      supports: [
        {
          umschlag: aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] }),
          uhr: werfend,
          extraktion: null,
        },
      ],
      metadata: meta(),
    })
    const graph = alsErfolg(aktuell.ergebnis)
    assert.equal(graph.serverReferenceTime, JETZT)
    assert.equal(graph.freshness, 'current')
    assert.equal(aufrufe, 0)
    assert.equal(aktuell.katalog, 1)
    assert.equal(aktuell.uhr, 1)
  })

  test('ein Erfolg liest den Katalog einmal und bindet Evidence, Kandidat und v2 an dieselbe Uhr', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const material = aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] })
    const wert = eingabe({ umschlag: material })
    const { ergebnis, katalog, autoritaet, uhr: uhrAufrufe } = await beweisen(wert)
    const graph = alsErfolg(ergebnis)
    assert.equal(katalog, 1)
    assert.equal(autoritaet, 1)
    assert.equal(uhrAufrufe, 1)
    assert.equal(graph.serverReferenceTime, JETZT)
    assert.equal(graph.freshness, 'current')
    assert.equal(graph.grant, 'role')
    assert.equal(graph.capability, 'official-truth-freigeben')
    assert.match(graph.reviewPacketKey, SCHLUESSEL)
    assert.deepEqual(Object.keys(graph).sort(), ERFOLG_SCHLUESSEL)
    assert.equal(graph.evidenceVersions.length, 1)
    assert.equal(graph.evidenceVersions[0]?.lifecycle, 'accepted')
    assert.equal(graph.evidenceVersions[0]?.validationState, 'valid')
    assert.equal(graph.evidenceVersions[0]?.sourceClass, 'official_authority')
    assert.deepEqual(
      graph.evidenceVersions.map((version) => version.versionId),
      [...graph.supportVersionIds],
    )
    assert.deepEqual(
      graph.supports.map((support) => support.versionId),
      [...graph.supportVersionIds],
    )
    assert.deepEqual(Object.keys(graph.supports[0] ?? {}).sort(), [
      'canonicalUrl',
      'retrievedAt',
      'sourceContentHash',
      'sourceId',
      'validFrom',
      'validUntil',
      'versionId',
    ])
    assert.equal(JSON.stringify(graph).includes('proof-sentinel'), false)
    assert.equal(JSON.stringify(graph).includes('sourceSnapshot'), false)
    assert.equal(graph.kandidat.lifecycle, 'candidate')
    assert.equal(graph.kandidat.validationState, 'pending')
    assert.equal(graph.kandidat.key, graph.ruleScopeKey)
    assert.equal(graph.kandidat.factKind, graph.factKind)
    assert.equal(graph.kandidat.evidenceQuality, graph.evidenceQuality)
    assert.deepEqual([...graph.kandidat.supportVersionIds], [...graph.supportVersionIds])
    assert.deepEqual(graph.kandidat.proposal, VORSCHLAG)
    assert.equal(graph.registry.sources.some((source) => source.sourceId === REAL), true)

    const rekonstruiert = {
      supports: [
        {
          umschlag: { ...material, registry: graph.registry },
          uhr: () => new Date(graph.serverReferenceTime),
          extraktion: null,
        },
      ],
      metadata: wert.metadata,
    }
    const paket = officialTruthRegelReviewPacket(rekonstruiert)
    const finger = officialTruthRegelReviewPacketFingerprint(rekonstruiert)
    const erneut = officialTruthRegelKandidatAusEvidence(graph.evidenceVersions, graph.registry, wert.metadata)
    assert.equal(paket.status, 'rule_review_packet')
    assert.equal(finger.status, 'rule_review_packet_fingerprint')
    assert.equal(erneut.ok, true)
    if (paket.status !== 'rule_review_packet' || finger.status !== 'rule_review_packet_fingerprint' || !erneut.ok) return
    assert.equal(graph.reviewPacketKey, finger.reviewPacketKey)
    assert.equal(graph.ruleScopeKey, paket.kandidat.key)
    assert.equal(graph.ruleScopeKey, finger.ruleScopeKey)
    assert.equal(graph.ruleScopeKey, erneut.kandidat.key)
    assert.deepEqual([...graph.supportVersionIds], [...finger.supportVersionIds])
    assert.deepEqual([...graph.supportVersionIds], [...paket.kandidat.supportVersionIds])
    assert.deepEqual([...graph.evidenceVersions.map((version) => version.versionId)], [...finger.supportVersionIds])
    assert.deepEqual([...erneut.kandidat.supportVersionIds], [...graph.kandidat.supportVersionIds])
    assert.equal(erneut.kandidat.factKind, graph.factKind)
    assert.equal(erneut.kandidat.evidenceQuality, graph.evidenceQuality)
    assert.equal(paket.supports[0]?.sourceSnapshot, SNAPSHOT)
    assert.equal(personenSchluessel(graph).length, 0)

    const zeuge = await decideOfficialTruthAutonomousPreacceptanceWitness(wert, {
      loadAuthority: async () => freigabe(),
      now: () => JETZT,
      catalog: { transport: transportFuer(realeEingaben()).transport },
    })
    assert.equal(zeuge.status, 'authorized_preacceptance_witness')
    if (zeuge.status !== 'authorized_preacceptance_witness') return
    assert.deepEqual(Object.keys(zeuge).sort(), ZEUGEN_SCHLUESSEL)
    assert.equal(zeuge.reviewPacketKey, graph.reviewPacketKey)
    assert.equal(zeuge.serverReferenceTime, graph.serverReferenceTime)
    assert.deepEqual([...zeuge.supportVersionIds], [...graph.supportVersionIds])
    const zeugenText = JSON.stringify(zeuge)
    assert.equal(zeugenText.includes('proof-sentinel'), false)
    assert.equal(zeugenText.includes('electronic_visa'), false)
    assert.equal(zeugenText.includes('registry'), false)
    assert.equal(zeugenText.includes('evidenceVersions'), false)
    assert.equal(zeugenText.includes('kandidat'), false)
    assert.equal(zeugenText.includes('sourceSnapshot'), false)
    assert.equal(zeugenText.includes('trustedRuleFact'), false)
    assert.equal(Object.keys(zeuge).includes('supports'), false)

    const reproof = await officialTruthServerHeldReviewReproof(wert, { transport: transportFuer(realeEingaben()).transport }, () => new Date(JETZT))
    assert.equal(reproof.status, 'server_held_review_reproof')
    if (reproof.status !== 'server_held_review_reproof') return
    assert.equal(JSON.stringify(reproof).includes('sourceSnapshot'), false)
    assert.equal(JSON.stringify(reproof).includes('registry'), false)
    assert.equal(reproof.reviewPacketKey, graph.reviewPacketKey)
  })

  test('Katalogdrift entsteht nicht, weil ein Erfolg nur einmal liest', async () => {
    let lesungen = 0
    const transport: OfficialTruthSourceCatalogTransport = {
      async aufrufen(payload) {
        lesungen += 1
        if (payload.operation !== 'read_registry') throw new Error('register_source')
        const eingaben =
          lesungen === 1
            ? realeEingaben()
            : realeEingaben().map((eintrag) => ({ ...eintrag, authorityName: 'Drifted Authority' }))
        return {
          ok: true,
          antwort: {
            ok: true,
            operation: 'read_registry',
            sources: eingaben.map(katalogZeile),
          },
        }
      },
    }
    const { ergebnis } = await beweisen(eingabe(), { catalog: { transport } })
    const graph = alsErfolg(ergebnis)
    assert.equal(lesungen, 1)
    assert.equal(
      graph.registry.sources.every((source) => source.authorityName === 'Real Government Authority' || source.authorityName === 'Real Interior Authority'),
      true,
    )
    assert.equal(JSON.stringify(graph.registry).includes('Drifted Authority'), false)
  })

  test('umgekehrte Stützreihenfolge bleibt dieselbe review-packet:v2 Identität', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const erste = buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] }))
    const zweite = buendel(
      aufrufer({
        descriptors: [deskriptor(basis, REAL, gebiet), deskriptor(basis, INTERIOR, gebiet)],
        sourceId: INTERIOR,
        material: {
          canonicalUrl: 'https://www.real-interior.example/rules',
          retrievedAt: INNERHALB,
          sourceSnapshot: 'interior proof page',
        },
      }),
    )
    const metadata = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const vorwaerts = await beweisen({ supports: [erste, zweite], metadata })
    const rueckwaerts = await beweisen({ supports: [zweite, erste], metadata })
    const links = alsErfolg(vorwaerts.ergebnis)
    const rechts = alsErfolg(rueckwaerts.ergebnis)
    assert.equal(vorwaerts.katalog, 1)
    assert.equal(rueckwaerts.katalog, 1)
    assert.equal(rechts.reviewPacketKey, links.reviewPacketKey)
    assert.deepEqual([...rechts.supportVersionIds], [...links.supportVersionIds])
    assert.deepEqual(
      rechts.evidenceVersions.map((version) => version.versionId),
      links.evidenceVersions.map((version) => version.versionId),
    )
    assert.equal(links.evidenceVersions.length, 2)
    assert.equal(links.evidenceQuality, 'composed_from_multiple_primary_sources')
    assert.equal(links.kandidat.key, rechts.kandidat.key)
  })

  test('stale, zukünftige und abgelaufene Stützen blockieren', async () => {
    const grenze = await beweisen(eingabe({ umschlag: aufrufer({ material: { retrievedAt: GRENZE } }), instant: GRENZE }))
    assert.deepEqual(grenze.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const aelter = await beweisen(eingabe({ umschlag: aufrufer({ material: { retrievedAt: AELTER } }), instant: AELTER }))
    assert.deepEqual(aelter.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const zukunft = await beweisen(eingabe({ extraktion: { validFrom: '2026-10-02', validUntil: null } }))
    assert.deepEqual(zukunft.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const abgelaufen = await beweisen(
      eingabe({
        umschlag: aufrufer({ material: { retrievedAt: '2026-10-01T11:30:00.000Z' } }),
        instant: '2026-10-01T11:30:00.000Z',
        extraktion: { validFrom: '2026-10-01T11:00:00.000Z', validUntil: '2026-10-01T11:45:00.000Z' },
      }),
    )
    assert.deepEqual(abgelaufen.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
  })

  test('nicht annehmbare Evidence-Qualität blockiert und trägt keine Personenkennung', async () => {
    const luecke = await beweisen(eingabe({ metadata: meta({ evidenceQuality: 'research_gap', proposal: null }) }))
    assert.deepEqual(luecke.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })
    const veraltet = await beweisen(eingabe({ metadata: meta({ evidenceQuality: 'stale_primary_evidence' }) }))
    assert.deepEqual(veraltet.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })
    const konflikt = await beweisen(eingabe({ metadata: meta({ evidenceQuality: 'unresolved_conflict' }) }))
    assert.deepEqual(konflikt.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })
    const person = await beweisen(eingabe({ metadata: meta({ passportNumber: 'X1234567' }) }))
    assert.equal(person.ergebnis.status, 'blocked')
    if (person.ergebnis.status !== 'blocked') return
    assert.equal(person.ergebnis.reason, 'personal_identifier_forbidden')
    assert.equal(JSON.stringify(person.ergebnis).includes('X1234567'), false)
  })

  test('erfundener Seitenrohtext bleibt strukturell belegbar und ist kein Extraktoreingang', async () => {
    const fabrik = 'fabricated-extractor-bait-not-a-government-page'
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const wert = eingabe({
      umschlag: aufrufer({
        descriptors: [deskriptor(basis, REAL, gebiet)],
        material: { sourceSnapshot: fabrik },
      }),
    })
    const { ergebnis, katalog } = await beweisen(wert)
    const graph = alsErfolg(ergebnis)
    const hash = evidenceQuellenFingerprint(fabrik)
    assert.equal(katalog, 1)
    assert.equal(typeof hash, 'string')
    assert.equal(graph.evidenceVersions[0]?.sourceContentHash, hash)
    assert.equal(graph.supports[0]?.sourceContentHash, hash)
    assert.equal(graph.supports[0]?.canonicalUrl, REAL_URL)
    assert.equal(JSON.stringify(graph).includes(fabrik), false)
    assert.equal(JSON.stringify(graph).includes('sourceSnapshot'), false)
    assert.equal(Object.hasOwn(graph.supports[0] ?? {}, 'sourceSnapshot'), false)

    const transport = transportFuer(realeEingaben())
    const material = await officialTruthServerHeldSameRequestMaterial(
      wert,
      { transport: transport.transport },
      () => new Date(JETZT),
    )
    assert.equal(material.status, 'server_held_same_request_material')
    if (material.status !== 'server_held_same_request_material') return
    assert.equal(JSON.stringify(material).includes(fabrik), false)
    assert.equal(JSON.stringify(material).includes('sourceSnapshot'), false)
    assert.equal(Object.hasOwn(material.supports[0] ?? {}, 'sourceSnapshot'), false)
    assert.deepEqual(transport.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const rekonstruiert = {
      supports: wert.supports.map((bund) => ({
        ...bund,
        umschlag: { ...bund.umschlag, registry: graph.registry },
        uhr: () => new Date(JETZT),
      })),
      metadata: wert.metadata,
    }
    const paket = officialTruthRegelReviewPacket(rekonstruiert)
    assert.equal(paket.status, 'rule_review_packet')
    if (paket.status !== 'rule_review_packet') return
    assert.equal(paket.supports[0]?.sourceSnapshot, fabrik)
    assert.equal(Object.hasOwn(paket, 'reviewPacketKey'), false)
    assert.equal(graph.reviewPacketKey.startsWith('review-packet:v2:'), true)

    const zeuge = await decideOfficialTruthAutonomousPreacceptanceWitness(wert, {
      loadAuthority: async () => freigabe(),
      now: () => JETZT,
      catalog: { transport: transportFuer(realeEingaben()).transport },
    })
    assert.equal(zeuge.status, 'authorized_preacceptance_witness')
    if (zeuge.status !== 'authorized_preacceptance_witness') return
    assert.deepEqual(Object.keys(zeuge).sort(), ZEUGEN_SCHLUESSEL)
    assert.equal(JSON.stringify(zeuge).includes(fabrik), false)
    assert.equal(JSON.stringify(zeuge).includes('sourceSnapshot'), false)
  })

  test('Registry, Evidence, Kandidat und Stützen sind nach dem Beweis unveränderlich', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const huelle = aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] })
    const eigenerVorschlag = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' }
    const wert = eingabe({ umschlag: huelle, metadata: meta({ proposal: eigenerVorschlag }) })
    const vorschlag = wert.metadata.proposal as { effect: string }
    const { ergebnis } = await beweisen(wert)
    const graph = alsErfolg(ergebnis)
    const quelle = graph.registry.sources.find((source) => source.sourceId === REAL)
    const version = graph.evidenceVersions[0]
    const stuetze = graph.supports[0]
    const fakt = graph.kandidat.proposal as { effect: string }
    assert.ok(quelle)
    assert.ok(version)
    assert.ok(stuetze)
    assert.equal(fakt.effect, 'required')
    assert.equal(Object.isFrozen(graph), true)
    assert.equal(Object.isFrozen(graph.registry), true)
    assert.equal(Object.isFrozen(graph.registry.sources), true)
    assert.equal(Object.isFrozen(quelle), true)
    assert.equal(Object.isFrozen(quelle.domains), true)
    assert.equal(Object.isFrozen(version), true)
    assert.equal(Object.isFrozen(version.scope), true)
    const codes = laendercodes(version.scope.citizenship)
    assert.equal(Object.isFrozen(version.scope.citizenship), true)
    assert.equal(Object.isFrozen(codes), true)
    assert.equal(Object.isFrozen(graph.kandidat), true)
    assert.equal(Object.isFrozen(graph.kandidat.scope), true)
    assert.equal(Object.isFrozen(graph.kandidat.proposal), true)
    assert.equal(Object.isFrozen(graph.supports), true)
    assert.equal(Object.isFrozen(stuetze), true)
    assert.equal(Object.isFrozen(graph.supportVersionIds), true)
    assert.throws(() => {
      zuweisen(quelle, 'authorityName', 'Changed Authority')
    }, TypeError)
    assert.throws(() => {
      anhaengen(quelle.domains, 'evil.example')
    }, TypeError)
    assert.throws(() => {
      zuweisen(version, 'canonicalUrl', 'https://evil.example/rules')
    }, TypeError)
    assert.throws(() => {
      zuweisen(version.scope, 'destinationCountryCode', 'US')
    }, TypeError)
    assert.throws(() => {
      anhaengen(codes, 'US')
    }, TypeError)
    assert.throws(() => {
      zuweisen(graph.kandidat.scope, 'destinationCountryCode', 'US')
    }, TypeError)
    assert.throws(() => {
      zuweisen(fakt, 'effect', 'not_required')
    }, TypeError)
    assert.throws(() => {
      zuweisen(stuetze, 'retrievedAt', '1999-01-01T00:00:00.000Z')
    }, TypeError)
    assert.throws(() => {
      anhaengen(graph.supportVersionIds, 'extra')
    }, TypeError)
    assert.equal(quelle.authorityName, 'Real Government Authority')
    assert.equal(version.scope.destinationCountryCode, 'JP')
    assert.equal(fakt.effect, 'required')
    assert.equal(stuetze.retrievedAt, INNERHALB)
    vorschlag.effect = 'not_required'
    assert.equal(fakt.effect, 'required')

    const transport = transportFuer(realeEingaben())
    const material = await officialTruthServerHeldSameRequestMaterial(
      eingabe({ umschlag: huelle }),
      { transport: transport.transport },
      () => new Date(JETZT),
    )
    assert.equal(material.status, 'server_held_same_request_material')
    if (material.status !== 'server_held_same_request_material') return
    const amtlich = material.registry.sources[0]
    const belegt = material.evidenceVersions[0]
    const kandidatFakt = material.kandidat.proposal as { effect: string }
    assert.ok(amtlich)
    assert.ok(belegt)
    const materialStuetze = material.supports[0]
    const materialCodes = laendercodes(belegt.scope.citizenship)
    assert.ok(materialStuetze)
    assert.equal(Object.isFrozen(material.registry), true)
    assert.equal(Object.isFrozen(amtlich.domains), true)
    assert.equal(Object.isFrozen(materialCodes), true)
    assert.equal(Object.isFrozen(material.kandidat.scope), true)
    assert.equal(Object.isFrozen(material.kandidat.proposal), true)
    assert.equal(Object.isFrozen(materialStuetze), true)
    assert.throws(() => {
      zuweisen(amtlich, 'authorityName', 'Changed Authority')
    }, TypeError)
    assert.throws(() => {
      zuweisen(belegt.scope, 'destinationCountryCode', 'US')
    }, TypeError)
    assert.throws(() => {
      zuweisen(kandidatFakt, 'effect', 'not_required')
    }, TypeError)
    assert.throws(() => {
      zuweisen(materialStuetze, 'canonicalUrl', 'https://evil.example/rules')
    }, TypeError)
    assert.equal(kandidatFakt.effect, 'required')
    assert.equal(belegt.scope.destinationCountryCode, 'JP')
  })
})
