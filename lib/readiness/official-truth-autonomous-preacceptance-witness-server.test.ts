import { r2CatalogRows, r2Profiles } from './official-truth-content-identity-r2.test'
import { r2Registry } from './official-truth-content-identity-r2.test'
// lib/readiness/official-truth-autonomous-preacceptance-witness-server.test.ts
//
// Gleicher-Request-Zeuge. Synthetische *.example-Quellen.
// Kein Supabase-Client, kein Netz, kein Provider, keine Annahme.

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { OFFICIAL_CHECKED_AT_MAX_AGE_MS } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import type { OfficialTruthFactEntryAuthorityResult } from '@/lib/readiness/official-truth-fact-entry-authority-server'
import {
  decideOfficialTruthAutonomousPreacceptanceWitness,
  loadOfficialTruthAutonomousPreacceptanceWitness,
} from '@/lib/readiness/official-truth-autonomous-preacceptance-witness-server'
import { officialTruthServerHeldReviewReproof } from '@/lib/readiness/official-truth-server-held-source-registry'
import {
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogTransport,
} from '@/lib/readiness/official-truth-source-catalog-server'
import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const DATEI = 'lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts'
const GRAPH = 'lib/readiness/official-truth-same-request-proof-server.ts'
const SCHLUESSEL = /^review-packet:v3:[a-f0-9]{64}$/

const JETZT = '2026-10-01T12:00:00.000Z'
const JETZT_MS = Date.parse(JETZT)
const INNERHALB = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS + 1).toISOString()
const GRENZE = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS).toISOString()
const AELTER = new Date(JETZT_MS - OFFICIAL_CHECKED_AT_MAX_AGE_MS - 1).toISOString()
const SNAPSHOT = 'official page line\nwitness-sentinel'
const REAL = 'example-real-government'
const INTERIOR = 'example-real-interior'
const REAL_URL = 'https://www.real-government.example/rules'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
const ERFOLG_SCHLUESSEL = [
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

type Aufruf = Record<string, unknown>

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
  return r2Registry(ergebnis.registry, R2_PUBLICATIONS)
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

function beideDokumente(): QuellenAbdeckung {
  return coverage({
    citizenship: { mode: 'exact', countryCodes: ['CH', 'RS'] },
    documents: {
      mode: 'exact',
      options: [
        { documentType: 'passport', issuingCountryCode: 'CH' },
        { documentType: 'passport', issuingCountryCode: 'RS' },
      ],
    },
  })
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
          antwort: { ...r2CatalogRows(eingaben.map(katalogZeile), R2_PUBLICATIONS), ok: true, operation: 'read_registry' },
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
    material: { contentType: 'text/plain',
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

function eingabe(teil?: { umschlag?: Record<string, unknown>; extraktion?: unknown; metadata?: Record<string, unknown>; instant?: string }) {
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

async function entscheiden(
  wert: unknown,
  optionen?: {
    authority?: OfficialTruthFactEntryAuthorityResult | Error
    now?: () => string
    catalog?: { transport: OfficialTruthSourceCatalogTransport } | { env: Record<string, string | undefined> }
  },
): Promise<{
  ergebnis: Awaited<ReturnType<typeof decideOfficialTruthAutonomousPreacceptanceWitness>>
  autoritaet: number
  katalog: number
}> {
  let autoritaet = 0
  const eigener = transportFuer(realeEingaben())
  const ergebnis = await decideOfficialTruthAutonomousPreacceptanceWitness(wert, {
    loadAuthority: async () => {
      autoritaet += 1
      if (optionen?.authority instanceof Error) throw optionen.authority
      return optionen?.authority ?? freigabe()
    },
    now: optionen?.now ?? (() => JETZT),
    catalog: optionen?.catalog ?? { identityProfiles: r2Profiles, transport: eigener.transport },
  })
  return { ergebnis, autoritaet, katalog: optionen?.catalog ? 0 : eigener.aufrufe.length }
}

describe('Official Truth autonomous pre-acceptance witness', () => {
  test('der Live-Einstieg ist der Lader und die Naht ist kein zweiter Einstieg', () => {
    const text = datei(DATEI)
    const graph = datei(GRAPH)
    const live = text.slice(text.indexOf('export async function loadOfficialTruthAutonomousPreacceptanceWitness'))
    const graphLive = graph.slice(graph.indexOf('export async function loadOfficialTruthSameRequestProof'))
    assert.equal(text.includes("import 'server-only'"), true)
    assert.equal(graph.includes("import 'server-only'"), true)
    assert.match(live, /loadOfficialTruthSameRequestProof/)
    assert.equal(live.includes('catalog'), false)
    assert.equal(live.includes('abhaengigkeiten'), false)
    assert.match(graphLive, /loadOfficialTruthFactEntryAuthority/)
    assert.equal(graphLive.includes('catalog'), false)
    assert.equal(text.includes('decideOfficialTruthAutonomousPreacceptanceWitness'), true)
    assert.equal(text.includes('decideOfficialTruthSameRequestProof'), true)
    assert.equal(graph.includes('officialTruthServerHeldSameRequestMaterial('), true)
    assert.equal(graph.includes('officialFrische('), true)
    assert.equal(text.includes('officialFrische('), false)
    assert.equal(text.includes('maxAgeMs:'), false)
    assert.equal(graph.includes('maxAgeMs:'), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.equal(graph.includes('requirementsProviderAus'), false)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(graph.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(graph.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(graph.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(text.includes('official-truth-review-suggestion'), false)
    assert.equal(graph.includes('official-truth-review-suggestion'), false)
    assert.equal(text.includes('officialTruthRegelReviewVorschlag'), false)
    assert.equal(graph.includes('officialTruthRegelReviewVorschlag'), false)
    assert.equal(text.includes('officialTruthRegelReviewEntscheidungsabsicht'), false)
    assert.equal(graph.includes('officialTruthRegelReviewEntscheidungsabsicht'), false)
    assert.equal(text.includes('officialTruthRegelReviewPacket('), false)
    assert.equal(graph.includes('officialTruthRegelReviewPacket('), false)
    assert.equal(text.includes('officialTruthRegelReviewPacketFingerprint('), false)
    assert.equal(graph.includes('officialTruthRegelReviewPacketFingerprint('), false)
    assert.equal(graph.includes('JSON.stringify'), false)
    assert.equal(requirementsProviderAus(), null)
    const oberflaeche = appTexte()
    assert.equal(oberflaeche.includes('loadOfficialTruthAutonomousPreacceptanceWitness'), false)
    assert.equal(oberflaeche.includes('decideOfficialTruthAutonomousPreacceptanceWitness'), false)
    assert.equal(typeof loadOfficialTruthAutonomousPreacceptanceWitness, 'function')
  })

  test('verweigerte Autorität liest den Katalog nicht und liefert keinen Zeugen', async () => {
    const faelle: OfficialTruthFactEntryAuthorityResult[] = [
      { status: 'access_forbidden' },
      { status: 'access_lookup_failed' },
      { status: 'database_capability_denied' },
      { status: 'database_capability_unavailable' },
      { status: 'database_capability_failed' },
    ]
    for (const authority of faelle) {
      const { ergebnis, autoritaet, katalog } = await entscheiden(eingabe(), { authority })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: authority.status })
      assert.equal(autoritaet, 1)
      assert.equal(katalog, 0)
    }
    const geworfen = await entscheiden(eingabe(), { authority: new Error('db secret text') })
    assert.deepEqual(geworfen.ergebnis, { status: 'blocked', reason: 'access_lookup_failed' })
    assert.equal(JSON.stringify(geworfen.ergebnis).includes('db secret text'), false)
    assert.equal(geworfen.katalog, 0)
  })

  test('Break-Glass und eine falsche Freigabe lesen den Katalog nicht', async () => {
    const breakGlass = await entscheiden(eingabe(), { authority: { status: 'role_grant_required' } })
    assert.deepEqual(breakGlass.ergebnis, { status: 'blocked', reason: 'role_grant_required' })
    assert.equal(breakGlass.katalog, 0)

    const mitBruch = {
      status: 'authorized',
      grant: 'break-glass',
      capability: 'official-truth-freigeben',
    } as unknown as OfficialTruthFactEntryAuthorityResult
    const bruch = await entscheiden(eingabe(), { authority: mitBruch })
    assert.deepEqual(bruch.ergebnis, { status: 'blocked', reason: 'authority_required' })
    assert.equal(bruch.katalog, 0)

    const fremdeFaehigkeit = {
      status: 'authorized',
      grant: 'role',
      capability: 'admin',
    } as unknown as OfficialTruthFactEntryAuthorityResult
    const fremd = await entscheiden(eingabe(), { authority: fremdeFaehigkeit })
    assert.deepEqual(fremd.ergebnis, { status: 'blocked', reason: 'authority_required' })
    assert.equal(fremd.katalog, 0)
  })

  test('ein fehlender oder fehlgeschlagener Katalog liefert keinen Zeugen', async () => {
    const sentinel = 'service-role-secret-sentinel'
    const ohne = await entscheiden(eingabe(), {
      catalog: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: '   ',
          SUPABASE_SERVICE_ROLE_KEY: sentinel,
        },
      },
    })
    assert.deepEqual(ohne.ergebnis, { status: 'blocked', reason: 'catalog_not_configured' })
    assert.equal(JSON.stringify(ohne.ergebnis).includes(sentinel), false)

    const gescheitert = await decideOfficialTruthAutonomousPreacceptanceWitness(eingabe(), {
      loadAuthority: async () => freigabe(),
      now: () => JETZT,
      catalog: { identityProfiles: r2Profiles,
        transport: {
          async aufrufen() {
            throw new Error(sentinel)
          },
        },
      },
    })
    assert.deepEqual(gescheitert, { status: 'blocked', reason: 'catalog_failed' })
    assert.equal(JSON.stringify(gescheitert).includes(sentinel), false)
  })

  test('Aufrufer-Registry und Quellenautorität werden vor dem Katalog abgelehnt', async () => {
    const felder = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const
    for (const feld of felder) {
      const wert = feld === 'sourceClass' ? 'official_authority' : feld === 'registry' ? { sources: [] } : ['not-a-government.example']
      const oben = await entscheiden({ ...eingabe(), [feld]: wert })
      assert.deepEqual(oben.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
      assert.equal(oben.katalog, 0, feld)
      const imUmschlag = await entscheiden(eingabe({ umschlag: aufrufer({ extra: { [feld]: wert } }) }))
      assert.deepEqual(imUmschlag.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
      assert.equal(imUmschlag.katalog, 0, feld)
    }
  })

  test('Rolle, Uhr, Schlüssel, Fakt und Vorschlag des Aufrufers werden abgelehnt', async () => {
    const felder = [
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
      'reviewPacketKey',
      'supportVersionIds',
      'trustedRuleFact',
      'acceptedClaim',
      'lifecycle',
      'suggestion',
      'modelAuthority',
      'decision',
    ] as const
    for (const feld of felder) {
      const oben = await entscheiden({ ...eingabe(), [feld]: 'caller-owned' })
      assert.deepEqual(oben.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
      assert.equal(oben.autoritaet, 0, feld)
      assert.equal(oben.katalog, 0, feld)
      const inMeta = await entscheiden(eingabe({ metadata: meta({ [feld]: 'caller-owned' }) }))
      assert.deepEqual(inMeta.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
      assert.equal(inMeta.katalog, 0, feld)
    }
    const clock = uhr(INNERHALB) as (() => Date) & { role?: string }
    clock.role = 'owner'
    const anUhr = await entscheiden({
      supports: [{ umschlag: aufrufer(), uhr: clock, extraktion: null }],
      metadata: meta(),
    })
    assert.deepEqual(anUhr.ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.equal(anUhr.katalog, 0)
  })

  test('eine erfolgreiche Neubewertung liest den Katalog einmal und bindet dieselbe Zelle', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const material = aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] })
    const wert = eingabe({ umschlag: material })
    const { ergebnis, katalog } = await entscheiden(wert)
    assert.equal(ergebnis.status, 'authorized_preacceptance_witness')
    if (ergebnis.status !== 'authorized_preacceptance_witness') return
    assert.equal(katalog, 1)
    assert.match(ergebnis.reviewPacketKey, SCHLUESSEL)
    assert.equal(ergebnis.freshness, 'current')
    assert.equal(ergebnis.serverReferenceTime, JETZT)
    assert.deepEqual(ergebnis.grant, 'role')
    assert.equal(ergebnis.capability, 'official-truth-freigeben')
    assert.deepEqual(Object.keys(ergebnis).sort(), ERFOLG_SCHLUESSEL)

    const gelesen = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport: transportFuer(realeEingaben()).transport })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const rekonstruiert = {
      supports: [{ ...wert.supports[0], umschlag: { ...material, registry: gelesen.registry } }],
      metadata: wert.metadata,
    }
    const paket = officialTruthRegelReviewPacket(rekonstruiert)
    const finger = officialTruthRegelReviewPacketFingerprint(rekonstruiert)
    assert.equal(paket.status, 'rule_review_packet')
    assert.equal(finger.status, 'rule_review_packet_fingerprint')
    if (paket.status !== 'rule_review_packet' || finger.status !== 'rule_review_packet_fingerprint') return
    assert.equal(ergebnis.reviewPacketKey, finger.reviewPacketKey)
    assert.equal(ergebnis.ruleScopeKey, paket.kandidat.key)
    assert.equal(ergebnis.ruleScopeKey, finger.ruleScopeKey)
    assert.deepEqual([...ergebnis.supportVersionIds], [...finger.supportVersionIds])
    assert.deepEqual([...ergebnis.supportVersionIds], [...paket.kandidat.supportVersionIds])
    assert.deepEqual(
      [...ergebnis.supportVersionIds],
      paket.supports.map((support) => support.versionId),
    )
  })

  test('Frische ausserhalb von current scheitert geschlossen', async () => {
    const grenze = await entscheiden(eingabe({ umschlag: aufrufer({ material: { retrievedAt: GRENZE } }), instant: GRENZE }))
    assert.deepEqual(grenze.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const aelter = await entscheiden(eingabe({ umschlag: aufrufer({ material: { retrievedAt: AELTER } }), instant: AELTER }))
    assert.deepEqual(aelter.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const zukunft = await entscheiden(eingabe({ extraktion: { validFrom: '2026-10-02', validUntil: null } }))
    assert.deepEqual(zukunft.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
    const abgelaufen = await entscheiden(
      eingabe({
        umschlag: aufrufer({ material: { retrievedAt: '2026-10-01T11:30:00.000Z' } }),
        instant: '2026-10-01T11:30:00.000Z',
        extraktion: { validFrom: '2026-10-01T11:00:00.000Z', validUntil: '2026-10-01T11:45:00.000Z' },
      }),
    )
    assert.deepEqual(abgelaufen.ergebnis, { status: 'blocked', reason: 'freshness_not_current' })
  })

  test('eine ungültige Serveruhr liest den Katalog nicht', async () => {
    const zeiten = ['not-a-time', '2026-10-01', '2026-10-01T25:00:00.000Z', '', '  2026-10-01T12:00:00.000Z  ']
    for (const zeit of zeiten) {
      const { ergebnis, katalog, autoritaet } = await entscheiden(eingabe(), { now: () => zeit })
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'invalid_reference_time' }, zeit)
      assert.equal(katalog, 0, zeit)
      assert.equal(autoritaet, 1, zeit)
    }
    const geworfen = await entscheiden(eingabe(), {
      now: () => {
        throw new Error('clock secret')
      },
    })
    assert.deepEqual(geworfen.ergebnis, { status: 'blocked', reason: 'invalid_reference_time' })
    assert.equal(JSON.stringify(geworfen.ergebnis).includes('clock secret'), false)
    assert.equal(geworfen.katalog, 0)
  })

  test('nur annehmbare aktuelle Qualität liefert den engen Zeugen', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const erste = buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] }))
    const zweite = buendel(
      aufrufer({
        descriptors: [deskriptor(basis, REAL, gebiet), deskriptor(basis, INTERIOR, gebiet)],
        sourceId: INTERIOR,
        material: { contentType: 'text/plain',
          canonicalUrl: 'https://www.real-interior.example/rules',
          retrievedAt: INNERHALB,
          sourceSnapshot: 'interior witness page',
        },
      }),
    )
    const zusammengesetzt = await entscheiden({
      supports: [erste, zweite],
      metadata: meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    })
    assert.equal(zusammengesetzt.ergebnis.status, 'authorized_preacceptance_witness')
    if (zusammengesetzt.ergebnis.status !== 'authorized_preacceptance_witness') return
    assert.equal(zusammengesetzt.katalog, 1)
    assert.equal(zusammengesetzt.ergebnis.supportVersionIds.length, 2)
    assert.equal(zusammengesetzt.ergebnis.factKind, 'requirement_effect')
    const text = JSON.stringify(zusammengesetzt.ergebnis)
    assert.equal(text.includes('official page line'), false)
    assert.equal(text.includes('interior witness page'), false)
    assert.equal(text.includes('electronic_visa'), false)
    assert.equal(text.includes('proposal'), false)
    assert.equal(text.includes('sourceSnapshot'), false)
    assert.equal(text.includes('trustedRuleFact'), false)
    assert.equal(text.includes('registry'), false)
    assert.equal(text.includes('real-government.example'), false)
    assert.equal(text.includes('reviewer@example.com'), false)
    assert.equal(text.includes('userId'), false)
    assert.equal(text.includes('accepted_claim'), false)
    assert.deepEqual(Object.keys(zusammengesetzt.ergebnis).sort(), ERFOLG_SCHLUESSEL)
    assert.equal(Object.isFrozen(zusammengesetzt.ergebnis), true)
    assert.equal(Object.isFrozen(zusammengesetzt.ergebnis.supportVersionIds), true)
  })

  test('Forschungslücke, veraltete Evidenz und ungelöster Konflikt liefern keinen Zeugen', async () => {
    const luecke = await entscheiden(eingabe({ metadata: meta({ evidenceQuality: 'research_gap', proposal: null }) }))
    assert.deepEqual(luecke.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })
    const veraltet = await entscheiden(eingabe({ metadata: meta({ evidenceQuality: 'stale_primary_evidence' }) }))
    assert.deepEqual(veraltet.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })
    const konflikt = await entscheiden(eingabe({ metadata: meta({ evidenceQuality: 'unresolved_conflict' }) }))
    assert.deepEqual(konflikt.ergebnis, { status: 'blocked', reason: 'quality_not_acceptable' })

    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const gleicheQuelle = await entscheiden({
      supports: [
        buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)], material: { sourceSnapshot: 'page one' } })),
        buendel(
          aufrufer({
            descriptors: [deskriptor(basis, REAL, gebiet)],
            material: { sourceSnapshot: 'page two' },
          }),
        ),
      ],
      metadata: meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    })
    assert.equal(gleicheQuelle.ergebnis.status, 'blocked')
    if (gleicheQuelle.ergebnis.status !== 'blocked') return
    assert.equal(gleicheQuelle.ergebnis.reason, 'same_content_item_composition')
  })

  test('zwei Credential-Optionen bleiben zwei Zellen und werden kein Zeuge', async () => {
    const basis = registry(realeEingaben())
    const gebiet = beideDokumente()
    const serbisch = anfrage({
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const gemischt = await entscheiden({
      supports: [
        buendel(aufrufer({ request: anfrage(), descriptors: [deskriptor(basis, REAL, gebiet)] })),
        buendel(aufrufer({ request: serbisch, descriptors: [deskriptor(basis, REAL, gebiet)] })),
      ],
      metadata: meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    })
    assert.equal(gemischt.ergebnis.status, 'blocked')
    if (gemischt.ergebnis.status !== 'blocked') return
    assert.equal(gemischt.ergebnis.reason, 'scope_mismatch')
    assert.notEqual(anfrage().ruleScopeKey, serbisch.ruleScopeKey)
  })

  test('umgekehrte Stützreihenfolge bleibt dieselbe review-packet:v2 Identität', async () => {
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const erste = buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] }))
    const zweite = buendel(
      aufrufer({
        descriptors: [deskriptor(basis, REAL, gebiet), deskriptor(basis, INTERIOR, gebiet)],
        sourceId: INTERIOR,
        material: { contentType: 'text/plain',
          canonicalUrl: 'https://www.real-interior.example/rules',
          retrievedAt: INNERHALB,
          sourceSnapshot: 'interior reversed page',
        },
      }),
    )
    const metadata = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    assert.deepEqual(
      [erste, zweite].map((bund) => bund.umschlag.sourceId),
      [REAL, INTERIOR],
    )
    assert.deepEqual(
      [zweite, erste].map((bund) => bund.umschlag.sourceId),
      [INTERIOR, REAL],
    )

    const katalogVorwaerts = transportFuer(realeEingaben())
    const katalogRueckwaerts = transportFuer(realeEingaben())
    const serverUhr = () => new Date(JETZT)
    const vorwaerts = await officialTruthServerHeldReviewReproof(
      { supports: [erste, zweite], metadata },
      { identityProfiles: r2Profiles, transport: katalogVorwaerts.transport },
      serverUhr,
    )
    const rueckwaerts = await officialTruthServerHeldReviewReproof(
      { supports: [zweite, erste], metadata },
      { identityProfiles: r2Profiles, transport: katalogRueckwaerts.transport },
      serverUhr,
    )
    assert.equal(vorwaerts.status, 'server_held_review_reproof')
    assert.equal(rueckwaerts.status, 'server_held_review_reproof')
    if (vorwaerts.status !== 'server_held_review_reproof' || rueckwaerts.status !== 'server_held_review_reproof') return
    assert.match(vorwaerts.reviewPacketKey, SCHLUESSEL)
    assert.equal(rueckwaerts.reviewPacketKey, vorwaerts.reviewPacketKey)
    assert.deepEqual([...rueckwaerts.supportVersionIds], [...vorwaerts.supportVersionIds])
    assert.deepEqual([...vorwaerts.supportVersionIds], [...vorwaerts.supportVersionIds].sort())
    assert.equal(vorwaerts.supportVersionIds.length, 2)
    assert.deepEqual(katalogVorwaerts.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])
    assert.deepEqual(katalogRueckwaerts.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const zeuge = await entscheiden({
      supports: [zweite, erste],
      metadata,
    })
    assert.equal(zeuge.ergebnis.status, 'authorized_preacceptance_witness')
    if (zeuge.ergebnis.status !== 'authorized_preacceptance_witness') return
    assert.equal(zeuge.katalog, 1)
    assert.equal(zeuge.ergebnis.reviewPacketKey, vorwaerts.reviewPacketKey)
    assert.deepEqual([...zeuge.ergebnis.supportVersionIds], [...vorwaerts.supportVersionIds])
    assert.equal(zeuge.ergebnis.freshness, 'current')
    assert.equal(zeuge.ergebnis.serverReferenceTime, JETZT)
  })

  test('eine Aufruferuhr macht einen zukünftigen Abruf nicht aktuell', async () => {
    let aufrufe = 0
    const zukunftsUhr = () => {
      aufrufe += 1
      return new Date('2099-01-01T00:00:00.000Z')
    }
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const { ergebnis, katalog } = await entscheiden({
      supports: [
        {
          umschlag: aufrufer({
            descriptors: [deskriptor(basis, REAL, gebiet)],
            material: { retrievedAt: '2026-10-02T00:00:00.000Z' },
          }),
          uhr: zukunftsUhr,
          extraktion: null,
        },
      ],
      metadata: meta(),
    })
    assert.equal(ergebnis.status, 'blocked')
    if (ergebnis.status !== 'blocked') return
    assert.equal(ergebnis.reason, 'retrieved_at_in_future')
    assert.equal(aufrufe, 0)
    assert.equal(katalog, 1)
    assert.equal(JSON.stringify(ergebnis).includes('2099-01-01'), false)
  })

  test('die Aufruferuhr beeinflusst den autonomen Zeugen nicht', async () => {
    let aufrufe = 0
    const frueheUhr = () => {
      aufrufe += 1
      throw new Error('caller clock must not run')
    }
    const basis = registry(realeEingaben())
    const gebiet = coverage()
    const { ergebnis, katalog } = await entscheiden({
      supports: [
        {
          umschlag: aufrufer({ descriptors: [deskriptor(basis, REAL, gebiet)] }),
          uhr: frueheUhr,
          extraktion: null,
        },
      ],
      metadata: meta(),
    })
    assert.equal(ergebnis.status, 'authorized_preacceptance_witness')
    if (ergebnis.status !== 'authorized_preacceptance_witness') return
    assert.equal(ergebnis.serverReferenceTime, JETZT)
    assert.equal(ergebnis.freshness, 'current')
    assert.equal(aufrufe, 0)
    assert.equal(katalog, 1)
    assert.equal(JSON.stringify(ergebnis).includes('caller clock'), false)
  })
})

// Explicit synthetic v2 publications; no production registration.
const R2_PUBLICATIONS = [
  "https://www.real-government.example/rules",
  "https://www.real-interior.example/rules"
] as const
