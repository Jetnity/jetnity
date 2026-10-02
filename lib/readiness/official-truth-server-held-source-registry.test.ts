// lib/readiness/official-truth-server-held-source-registry.test.ts
//
// Servergrenze: die amtliche Registry kommt nur aus dem injizierten Katalog.
// Synthetische *.example-Quellen. Kein Supabase-Client, kein Netz, kein Provider.

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import { officialTruthAbgerufenMaterialPruefen } from '@/lib/readiness/official-truth-retrieved-material'
import { officialTruthRegelReviewPacketFingerprint } from '@/lib/readiness/official-truth-rule-review-fingerprint'
import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import {
  OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY,
  officialTruthServerHeldEvidenceAnnehmen,
  officialTruthServerHeldMaterialPruefen,
  officialTruthServerHeldRegelKandidat,
  officialTruthServerHeldReviewPacket,
  officialTruthServerHeldReviewReproof,
} from '@/lib/readiness/official-truth-server-held-source-registry'
import {
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogAbhaengigkeiten,
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
const SERVER = 'lib/readiness/official-truth-server-held-source-registry.ts'

const UHR = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-10-01T11:00:00.000Z'
const SNAPSHOT = 'official page line\nunchanged'
const REAL = 'example-real-government'
const INTERIOR = 'example-real-interior'
const ANBIETER = 'example-licensed-provider'
const REAL_URL = 'https://www.real-government.example/rules'
const FAKE_URL = 'https://www.not-a-government.example/rules'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const

type Aufruf = Record<string, unknown>

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function uhr(instant = UHR): () => Date {
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

function anbieter(sourceId: string, domain: string): QuellenEingabe {
  return {
    sourceId,
    sourceClass: 'licensed_evidence_provider',
    publisherName: 'Example Licensed Publisher',
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

function abdeckung(teil?: Partial<QuellenAbdeckung>): QuellenAbdeckung {
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
  return abdeckung({
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

function deskriptor(basis: QuellenRegistry, sourceId: string, coverage: QuellenAbdeckung = abdeckung()): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage }
}

function serbisch(): OfficialTruthRechercheAnfrage {
  return anfrage({
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'RS',
      relatedCitizenshipCountryCode: 'RS',
    },
  })
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
        if (payload.operation !== 'read_registry') {
          throw new Error('register_source darf nicht aufgerufen werden')
        }
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
    descriptors: teil?.descriptors ?? [deskriptor(basis, REAL), deskriptor(basis, INTERIOR, abdeckung({ destinationCountryCodes: ['TH'] }))],
    sourceId: teil && 'sourceId' in teil ? teil.sourceId : REAL,
    material: {
      canonicalUrl: REAL_URL,
      retrievedAt: ABGERUFEN,
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
  clock: () => Date = uhr(),
) {
  return { umschlag, uhr: clock, extraktion }
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

describe('Official Truth server-held source registry', () => {
  test('der Live-Einstieg ist die Servergrenze und liest nur den Katalog', () => {
    const text = datei(SERVER)
    assert.equal(OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY, 'server_held_source_registry')
    assert.equal(text.includes("import 'server-only'"), true)
    assert.equal(text.includes('OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY'), true)
    assert.equal(text.includes('quellenKatalogLesen('), true)
    assert.equal(text.includes('officialTruthAbgerufenMaterialPruefen('), true)
    assert.equal(text.includes('officialTruthAkzeptierteEvidenceAusAbruf('), true)
    assert.equal(text.includes('officialTruthRegelKandidatAusEvidence('), true)
    assert.equal(text.includes('officialTruthRegelReviewPacket('), true)
    assert.equal(text.includes('officialTruthRegelReviewPacketFingerprint('), true)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('akzeptierteEvidenceSpeichern'), false)
    assert.equal(text.includes('quellenRegistryErstellen'), false)
    assert.equal(text.includes('quelleRegistrieren'), false)
    assert.equal(text.includes('register_source'), false)
    assert.equal(text.includes('@supabase/supabase-js'), false)
    assert.equal(text.includes('createClient'), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.equal(text.includes('fetch('), false)
    assert.equal(requirementsProviderAus(), null)
    const oberflaeche = appTexte()
    assert.equal(oberflaeche.includes('officialTruthServerHeld'), false)
    assert.equal(oberflaeche.includes('OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY'), false)
  })

  test('eine Aufrufer-Registry mit not-a-government.example macht die URL nicht zulässig', async () => {
    const fake = registry([
      amt('example-fake-government', 'not-a-government.example', 'Not A Government'),
    ])
    const rein = officialTruthAbgerufenMaterialPruefen(
      {
        request: anfrage(),
        registry: fake,
        descriptors: [{ source: fake.sources[0], coverage: abdeckung() }],
        sourceId: 'example-fake-government',
        material: { canonicalUrl: FAKE_URL, retrievedAt: ABGERUFEN, sourceSnapshot: SNAPSHOT },
      },
      uhr(),
    )
    assert.equal(rein.status, 'retrieved_material')
    if (rein.status !== 'retrieved_material') return
    assert.equal(rein.canonicalUrl, FAKE_URL)

    const katalog = transportFuer(realeEingaben())
    const mitRegistry = await officialTruthServerHeldMaterialPruefen(
      aufrufer({
        material: { canonicalUrl: FAKE_URL },
        extra: { registry: fake },
      }),
      uhr(),
      { transport: katalog.transport },
    )
    assert.deepEqual(mitRegistry, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.deepEqual(katalog.aufrufe, [])

    const ohneFeld = transportFuer(realeEingaben())
    const urlAllein = await officialTruthServerHeldMaterialPruefen(
      aufrufer({ material: { canonicalUrl: FAKE_URL } }),
      uhr(),
      { transport: ohneFeld.transport },
    )
    assert.deepEqual(urlAllein, { status: 'blocked', reason: 'unregistered_domain' })
    assert.deepEqual(ohneFeld.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const falscherDeskriptor = transportFuer(realeEingaben())
    const deskriptorAngriff = await officialTruthServerHeldMaterialPruefen(
      aufrufer({
        descriptors: [{ source: fake.sources[0], coverage: abdeckung() }],
        sourceId: 'example-fake-government',
        material: { canonicalUrl: FAKE_URL },
      }),
      uhr(),
      { transport: falscherDeskriptor.transport },
    )
    assert.deepEqual(deskriptorAngriff, { status: 'blocked', reason: 'invalid_source_plan' })
    assert.equal(JSON.stringify(deskriptorAngriff).includes('not-a-government.example'), false)
  })

  test('registry, sourceClass, domains und blockedDomains werden als Autorität abgelehnt', async () => {
    const katalog = transportFuer(realeEingaben())
    const felder = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const
    for (const feld of felder) {
      const wert = feld === 'sourceClass' ? 'official_authority' : feld === 'registry' ? { sources: [] } : ['not-a-government.example']
      const ergebnis = await officialTruthServerHeldMaterialPruefen(
        aufrufer({ extra: { [feld]: wert } }),
        uhr(),
        { transport: katalog.transport },
      )
      assert.deepEqual(ergebnis, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
      const imMaterial = await officialTruthServerHeldMaterialPruefen(
        aufrufer({ material: { [feld]: wert } }),
        uhr(),
        { transport: katalog.transport },
      )
      assert.deepEqual(imMaterial, { status: 'blocked', reason: 'caller_authority_forbidden' }, feld)
    }
    const imReview = await officialTruthServerHeldReviewPacket(
      { supports: [buendel()], metadata: meta(), registry: { sources: [] } },
      { transport: katalog.transport },
    )
    assert.deepEqual(imReview, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.deepEqual(katalog.aufrufe, [])
  })

  test('real-government.example aus dem injizierten Katalog besteht und ist die benutzte Registry', async () => {
    const katalog = transportFuer(realeEingaben())
    const eingabe = aufrufer()
    const vorher = JSON.stringify(eingabe)
    const live = await officialTruthServerHeldMaterialPruefen(eingabe, uhr(), { transport: katalog.transport })
    const gelesen = await quellenKatalogLesen({ transport: transportFuer(realeEingaben()).transport })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const direkt = officialTruthAbgerufenMaterialPruefen(
      { ...eingabe, registry: gelesen.registry },
      uhr(),
    )
    assert.deepEqual(live, direkt)
    assert.equal(live.status, 'retrieved_material')
    if (live.status !== 'retrieved_material') return
    assert.equal(live.canonicalUrl, REAL_URL)
    assert.equal(live.sourceId, REAL)
    assert.equal(live.canonicalUrl.includes('not-a-government.example'), false)
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.deepEqual(katalog.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])
    assert.equal(katalog.aufrufe.some((aufruf) => aufruf.operation === 'register_source'), false)
  })

  test('eine unbekannte Quellenkennung scheitert', async () => {
    const katalog = transportFuer(realeEingaben())
    const ergebnis = await officialTruthServerHeldMaterialPruefen(
      aufrufer({ sourceId: 'example-unknown-authority' }),
      uhr(),
      { transport: katalog.transport },
    )
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'source_not_eligible' })
  })

  test('fehlender und ungültiger Katalog scheitern geschlossen', async () => {
    const sentinel = 'service-role-secret-sentinel'
    const ohneZugang = await officialTruthServerHeldMaterialPruefen(aufrufer(), uhr(), {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: '   ',
        SUPABASE_SERVICE_ROLE_KEY: sentinel,
      },
    })
    assert.deepEqual(ohneZugang, { status: 'blocked', reason: 'catalog_not_configured' })
    assert.equal(JSON.stringify(ohneZugang).includes(sentinel), false)

    const geworfen = await officialTruthServerHeldEvidenceAnnehmen(aufrufer(), uhr(), null, {
      transport: {
        async aufrufen() {
          throw new Error(sentinel)
        },
      },
    })
    assert.deepEqual(geworfen, { status: 'blocked', reason: 'catalog_failed' })
    assert.equal(JSON.stringify(geworfen).includes(sentinel), false)

    const ueberlappend = await officialTruthServerHeldReviewPacket(
      { supports: [buendel()], metadata: meta() },
      {
        transport: {
          async aufrufen(payload) {
            assert.equal(payload.operation, 'read_registry')
            return {
              ok: true,
              antwort: {
                ok: true,
                operation: 'read_registry',
                sources: [
                  katalogZeile(amt(REAL, 'real-government.example', 'Real Government Authority')),
                  katalogZeile(amt(INTERIOR, 'child.real-government.example', 'Real Interior Authority')),
                ],
              },
            }
          },
        },
      },
    )
    assert.deepEqual(ueberlappend, { status: 'blocked', reason: 'catalog_failed' })

    const transportAus = await officialTruthServerHeldRegelKandidat([], meta(), {
      transport: {
        async aufrufen() {
          return { ok: false }
        },
      },
    })
    assert.deepEqual(transportAus, { ok: false, reason: 'catalog_failed' })
  })

  test('ein lizenzierter Anbieter wird durch Aufruferdaten nicht amtlich', async () => {
    const lizenziert = [anbieter(ANBIETER, 'provider.example')]
    const basis = registry(lizenziert)
    const katalog = transportFuer(lizenziert)
    const passend = await officialTruthServerHeldMaterialPruefen(
      aufrufer({
        descriptors: [deskriptor(basis, ANBIETER)],
        sourceId: ANBIETER,
        material: { canonicalUrl: 'https://www.provider.example/rules' },
      }),
      uhr(),
      { transport: katalog.transport },
    )
    assert.deepEqual(passend, { status: 'blocked', reason: 'source_not_official_authority' })

    const umetikettiert = await officialTruthServerHeldMaterialPruefen(
      aufrufer({
        descriptors: [
          {
            source: {
              ...quelle(basis, ANBIETER),
              sourceClass: 'official_authority',
              authorityName: 'Fake Authority',
            },
            coverage: abdeckung(),
          },
        ],
        sourceId: ANBIETER,
        material: { canonicalUrl: 'https://www.provider.example/rules' },
      }),
      uhr(),
      { transport: katalog.transport },
    )
    assert.deepEqual(umetikettiert, { status: 'blocked', reason: 'invalid_source_plan' })
    assert.equal(JSON.stringify(umetikettiert).includes('official_authority'), false)

    const klassenFeld = await officialTruthServerHeldEvidenceAnnehmen(
      aufrufer({ extra: { sourceClass: 'official_authority' } }),
      uhr(),
      null,
      { transport: katalog.transport },
    )
    assert.deepEqual(klassenFeld, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.equal(katalog.aufrufe.some((aufruf) => aufruf.operation === 'register_source'), false)
  })

  test('Prüfpaket und Regel-Kandidat benutzen genau die gelesene Registry', async () => {
    const katalog = transportFuer(realeEingaben())
    const basis = registry(realeEingaben())
    const coverage = abdeckung()
    const erste = buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, coverage), deskriptor(basis, INTERIOR, coverage)] }))
    const zweite = buendel(
      aufrufer({
        descriptors: [deskriptor(basis, REAL, coverage), deskriptor(basis, INTERIOR, coverage)],
        sourceId: INTERIOR,
        material: { canonicalUrl: 'https://www.real-interior.example/rules', sourceSnapshot: 'interior page' },
      }),
    )
    const vorschlag = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const eingabe = { supports: [erste, zweite], metadata: vorschlag }
    const vorher = JSON.stringify(eingabe)
    const live = await officialTruthServerHeldReviewPacket(eingabe, { transport: katalog.transport })
    const gelesen = await quellenKatalogLesen({ transport: transportFuer(realeEingaben()).transport })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const direkt = officialTruthRegelReviewPacket({
      supports: [
        { ...erste, umschlag: { ...erste.umschlag, registry: gelesen.registry } },
        { ...zweite, umschlag: { ...zweite.umschlag, registry: gelesen.registry } },
      ],
      metadata: vorschlag,
    })
    assert.deepEqual(live, direkt)
    assert.equal(live.status, 'rule_review_packet')
    if (live.status !== 'rule_review_packet') return
    assert.equal(live.kandidat.lifecycle, 'candidate')
    assert.equal(live.kandidat.validationState, 'pending')
    assert.equal(new Set(live.supports.map((eintrag) => eintrag.sourceId)).size, 2)
    assert.equal(live.supports.every((eintrag) => eintrag.canonicalUrl.includes('real-')), true)
    assert.equal(JSON.stringify(live).includes('not-a-government.example'), false)
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.deepEqual(katalog.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const evidence = await officialTruthServerHeldEvidenceAnnehmen(erste.umschlag, erste.uhr, null, {
      transport: transportFuer(realeEingaben()).transport,
    })
    assert.equal(evidence.status, 'accepted_evidence')
    if (evidence.status !== 'accepted_evidence') return
    assert.equal(evidence.evidence.sourceClass, 'official_authority')
    assert.equal(evidence.evidence.authorityName, 'Real Government Authority')
    const kandidat = await officialTruthServerHeldRegelKandidat([evidence.evidence], meta(), {
      transport: transportFuer(realeEingaben()).transport,
    })
    assert.equal(kandidat.ok, true)
    if (!kandidat.ok) return
    assert.equal(kandidat.kandidat.lifecycle, 'candidate')
    assert.equal(kandidat.kandidat.validationState, 'pending')
    assert.equal(kandidat.kandidat.factKind, 'requirement_effect')
    assert.deepEqual(kandidat.kandidat.supportVersionIds, [evidence.evidence.versionId])

    const fremdeRegistry = await officialTruthServerHeldRegelKandidat(
      { registry: basis, evidenceVersions: [evidence.evidence] },
      meta(),
      { transport: katalog.transport },
    )
    assert.deepEqual(fremdeRegistry, { ok: false, reason: 'caller_authority_forbidden' })

    const alsAbhaengigkeit = await officialTruthServerHeldMaterialPruefen(
      aufrufer(),
      uhr(),
      basis as unknown as OfficialTruthSourceCatalogAbhaengigkeiten,
    )
    assert.deepEqual(alsAbhaengigkeit, { status: 'blocked', reason: 'caller_authority_forbidden' })
    assert.equal(JSON.stringify(alsAbhaengigkeit).includes('real-government.example'), false)
  })

  test('zwei Credential-Optionen bleiben zwei Zellen', async () => {
    const basis = registry(realeEingaben())
    const coverage = beideDokumente()
    const schweizer = anfrage()
    const serbischeAnfrage = serbisch()
    assert.notEqual(schweizer.ruleScopeKey, serbischeAnfrage.ruleScopeKey)

    const katalog = transportFuer(realeEingaben())
    const schweizerisch = await officialTruthServerHeldMaterialPruefen(
      aufrufer({ request: schweizer, descriptors: [deskriptor(basis, REAL, coverage)] }),
      uhr(),
      { transport: katalog.transport },
    )
    const serbischBeleg = await officialTruthServerHeldMaterialPruefen(
      aufrufer({ request: serbischeAnfrage, descriptors: [deskriptor(basis, REAL, coverage)] }),
      uhr(),
      { transport: katalog.transport },
    )
    assert.equal(schweizerisch.status, 'retrieved_material')
    assert.equal(serbischBeleg.status, 'retrieved_material')
    if (schweizerisch.status !== 'retrieved_material' || serbischBeleg.status !== 'retrieved_material') return
    assert.equal(schweizerisch.ruleScopeKey, schweizer.ruleScopeKey)
    assert.equal(serbischBeleg.ruleScopeKey, serbischeAnfrage.ruleScopeKey)
    assert.notEqual(schweizerisch.ruleScopeKey, serbischBeleg.ruleScopeKey)

    const gemischt = await officialTruthServerHeldReviewPacket(
      {
        supports: [
          buendel(aufrufer({ request: schweizer, descriptors: [deskriptor(basis, REAL, coverage)] })),
          buendel(aufrufer({ request: serbischeAnfrage, descriptors: [deskriptor(basis, REAL, coverage)] })),
        ],
        metadata: meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
      },
      { transport: transportFuer(realeEingaben()).transport },
    )
    assert.equal(gemischt.status, 'blocked')
    if (gemischt.status !== 'blocked') return
    assert.equal(gemischt.reason, 'scope_mismatch')
  })

  test('eine gemeinsame Neubewertung liest den Katalog einmal und trifft review-packet:v2', async () => {
    const katalog = transportFuer(realeEingaben())
    const basis = registry(realeEingaben())
    const coverage = abdeckung()
    const erste = buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, coverage), deskriptor(basis, INTERIOR, coverage)] }))
    const zweite = buendel(
      aufrufer({
        descriptors: [deskriptor(basis, REAL, coverage), deskriptor(basis, INTERIOR, coverage)],
        sourceId: INTERIOR,
        material: { canonicalUrl: 'https://www.real-interior.example/rules', sourceSnapshot: 'interior page' },
      }),
    )
    const vorschlag = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const eingabe = { supports: [erste, zweite], metadata: vorschlag }
    const live = await officialTruthServerHeldReviewReproof(eingabe, { transport: katalog.transport }, () => new Date(UHR))
    assert.equal(live.status, 'server_held_review_reproof')
    if (live.status !== 'server_held_review_reproof') return
    assert.match(live.reviewPacketKey, /^review-packet:v2:[a-f0-9]{64}$/)
    assert.deepEqual(katalog.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const gelesen = await quellenKatalogLesen({ transport: transportFuer(realeEingaben()).transport })
    assert.equal(gelesen.ok, true)
    if (!gelesen.ok) return
    const rekonstruiert = {
      supports: [erste, zweite].map((bund) => ({
        ...bund,
        umschlag: { ...bund.umschlag, registry: gelesen.registry },
      })),
      metadata: vorschlag,
    }
    const paket = officialTruthRegelReviewPacket(rekonstruiert)
    const finger = officialTruthRegelReviewPacketFingerprint(rekonstruiert)
    assert.equal(paket.status, 'rule_review_packet')
    assert.equal(finger.status, 'rule_review_packet_fingerprint')
    if (paket.status !== 'rule_review_packet' || finger.status !== 'rule_review_packet_fingerprint') return
    assert.equal(live.reviewPacketKey, finger.reviewPacketKey)
    assert.equal(live.ruleScopeKey, finger.ruleScopeKey)
    assert.equal(live.ruleScopeKey, paket.kandidat.key)
    assert.deepEqual([...live.supportVersionIds], [...finger.supportVersionIds])
    assert.deepEqual([...live.supportVersionIds], [...paket.kandidat.supportVersionIds])
    assert.deepEqual(
      live.supports.map((support) => support.versionId),
      [...paket.supports.map((support) => support.versionId)],
    )
    const text = JSON.stringify(live)
    assert.equal(text.includes('sourceSnapshot'), false)
    assert.equal(text.includes('proposal'), false)
    assert.equal(text.includes('registry'), false)
    assert.equal(text.includes('interior page'), false)
    assert.equal(text.includes('real-government.example'), false)
    assert.equal(text.includes('blockedDomains'), false)
  })

  test('die Neubewertung führt die Aufruferuhr nicht aus', async () => {
    let aufrufe = 0
    const aufruferUhr = () => {
      aufrufe += 1
      return new Date('2099-01-01T00:00:00.000Z')
    }
    const basis = registry(realeEingaben())
    const coverage = abdeckung()
    const buendelMitUhr = {
      ...buendel(aufrufer({ descriptors: [deskriptor(basis, REAL, coverage)] })),
      uhr: aufruferUhr,
    }
    const katalog = transportFuer(realeEingaben())
    const ohneServeruhr = await officialTruthServerHeldReviewReproof(
      { supports: [buendelMitUhr], metadata: meta() },
      { transport: katalog.transport },
    )
    assert.deepEqual(ohneServeruhr, { status: 'blocked', reason: 'invalid_reference_time' })
    assert.equal(aufrufe, 0)
    assert.deepEqual(katalog.aufrufe, [])

    const zukunft = transportFuer(realeEingaben())
    const kuenftigerAbruf = await officialTruthServerHeldReviewReproof(
      {
        supports: [
          {
            umschlag: aufrufer({
              descriptors: [deskriptor(basis, REAL, coverage)],
              material: { retrievedAt: '2026-10-02T00:00:00.000Z' },
            }),
            uhr: aufruferUhr,
            extraktion: null,
          },
        ],
        metadata: meta(),
      },
      { transport: zukunft.transport },
      () => new Date(UHR),
    )
    assert.deepEqual(kuenftigerAbruf, { status: 'blocked', reason: 'retrieved_at_in_future' })
    assert.equal(aufrufe, 0)
    assert.deepEqual(zukunft.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const unabhaengig = transportFuer(realeEingaben())
    const trotzFrueherUhr = await officialTruthServerHeldReviewReproof(
      { supports: [buendelMitUhr], metadata: meta() },
      { transport: unabhaengig.transport },
      () => new Date(UHR),
    )
    assert.equal(trotzFrueherUhr.status, 'server_held_review_reproof')
    assert.equal(aufrufe, 0)
    assert.deepEqual(unabhaengig.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])
  })
})
