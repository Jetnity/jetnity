// lib/readiness/official-truth-rule-review-fingerprint.test.ts
//
// Identität nur über ein neu gebautes Prüfpaket.
// Synthetische .example-Quellen. Keine Annahme, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { officialTruthRegelReviewPacket } from '@/lib/readiness/official-truth-rule-review-packet'
import {
  officialTruthRegelReviewPacketFingerprint,
  type OfficialTruthRegelReviewFingerprintErgebnis,
} from '@/lib/readiness/official-truth-rule-review-fingerprint'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
import {
  officialTruthRechercheEntscheiden,
  type OfficialTruthRechercheAnfrage,
  type OfficialTruthRechercheGrund,
} from '@/lib/readiness/official-truth-research-request'
import {
  quellenRegistryErstellen,
  type QuellenEingabe,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const UHR = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-10-01T11:00:00.000Z'
const SNAPSHOT = 'official page line\nunchanged'
const QUELLE = 'example-border-authority'
const ANDERE = 'example-interior-authority'
const ANBIETER = 'example-licensed-provider'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const
const GEHEIM = 'personal-secret-91f3'
const SCHLUESSEL = /^review-packet:v1:[a-f0-9]{64}$/
const AUSGABE = ['status', 'reviewPacketKey', 'ruleScopeKey', 'supportVersionIds']

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
    citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] },
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

function standardRegistry(): QuellenRegistry {
  return registry([
    amt(QUELLE, 'gov.example', 'Example Border Authority'),
    amt(ANDERE, 'interior.example', 'Example Interior Authority'),
    anbieter(ANBIETER, 'provider.example'),
  ])
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

function passAbdeckung(): QuellenAbdeckung {
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

function beideDeskriptoren(basis: QuellenRegistry, coverage: QuellenAbdeckung = abdeckung()): QuellenDeskriptor[] {
  return [deskriptor(basis, QUELLE, coverage), deskriptor(basis, ANDERE, coverage), deskriptor(basis, ANBIETER, coverage)]
}

function huelle(teil?: {
  request?: unknown
  registry?: QuellenRegistry
  descriptors?: QuellenDeskriptor[]
  sourceId?: string
  material?: Record<string, unknown>
}): Record<string, unknown> {
  const basis = teil?.registry ?? standardRegistry()
  return {
    request: teil?.request ?? anfrage(),
    registry: basis,
    descriptors: teil?.descriptors ?? beideDeskriptoren(basis),
    sourceId: teil?.sourceId ?? QUELLE,
    material: {
      canonicalUrl: 'https://www.gov.example/rules',
      retrievedAt: ABGERUFEN,
      sourceSnapshot: SNAPSHOT,
      ...teil?.material,
    },
  }
}

function buendel(
  umschlag: Record<string, unknown> = huelle(),
  extraktion: unknown = null,
  clock: () => Date = uhr(),
): { umschlag: Record<string, unknown>; uhr: () => Date; extraktion: unknown } {
  return { umschlag, uhr: clock, extraktion }
}

function meta(teil?: Record<string, unknown>) {
  return {
    factKind: 'requirement_effect',
    evidenceQuality: 'explicit_primary_statement',
    proposal: VORSCHLAG,
    ...teil,
  }
}

function zweiteStuetze(snapshot: string) {
  const basis = standardRegistry()
  return buendel(
    huelle({
      registry: basis,
      descriptors: beideDeskriptoren(basis),
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: snapshot },
    }),
  )
}

function finger(supports: unknown, metadata: unknown = meta()): OfficialTruthRegelReviewFingerprintErgebnis {
  return officialTruthRegelReviewPacketFingerprint({ supports, metadata })
}

function offen(ergebnis: OfficialTruthRegelReviewFingerprintErgebnis) {
  assert.equal(ergebnis.status, 'rule_review_packet_fingerprint')
  if (ergebnis.status !== 'rule_review_packet_fingerprint') throw new Error('blockiert')
  assert.match(ergebnis.reviewPacketKey, SCHLUESSEL)
  assert.deepEqual(Object.keys(ergebnis), AUSGABE)
  return ergebnis
}

function paketOffen(supports: unknown, metadata: unknown = meta()) {
  const ergebnis = officialTruthRegelReviewPacket({ supports, metadata })
  assert.equal(ergebnis.status, 'rule_review_packet')
  if (ergebnis.status !== 'rule_review_packet') throw new Error('paket')
  return ergebnis
}

function ohneStoff(ergebnis: OfficialTruthRegelReviewFingerprintErgebnis, stoff: readonly string[]) {
  const text = JSON.stringify(ergebnis)
  for (const teil of stoff) assert.equal(text.includes(teil), false, teil)
  assert.equal(text.includes('trustedRuleFact'), false)
  assert.equal(text.includes('"lifecycle"'), false)
  assert.equal(text.includes('sourceSnapshot'), false)
  assert.equal(text.includes('canonicalUrl'), false)
  assert.equal(text.includes('sourceContentHash'), false)
  assert.equal(text.includes('proposal'), false)
}

describe('Official Truth rule review packet fingerprint', () => {
  test('dieselbe kanonische Eingabe ergibt dieselbe Identität', () => {
    const stuetze = buendel()
    const vorschlag = meta()
    const vorher = JSON.stringify({ supports: [stuetze], metadata: vorschlag })
    const erste = offen(finger([stuetze], vorschlag))
    const zweite = offen(finger([stuetze], vorschlag))
    const paket = paketOffen([stuetze], vorschlag)
    assert.equal(erste.reviewPacketKey, zweite.reviewPacketKey)
    assert.equal(erste.ruleScopeKey, paket.kandidat.key)
    assert.equal(erste.ruleScopeKey, zweite.ruleScopeKey)
    assert.deepEqual(erste.supportVersionIds, paket.kandidat.supportVersionIds)
    assert.deepEqual(erste.supportVersionIds, paket.supports.map((eintrag) => eintrag.versionId))
    assert.deepEqual([...erste.supportVersionIds].sort(), [...erste.supportVersionIds])
    ohneStoff(erste, [SNAPSHOT, paket.supports[0]!.canonicalUrl, paket.supports[0]!.sourceContentHash, 'electronic_visa'])
    assert.equal(JSON.stringify({ supports: [stuetze], metadata: vorschlag }), vorher)
    assert.equal(requirementsProviderAus(), null)
  })

  test('die Reihenfolge der Stützen ändert die Identität nicht', () => {
    const linke = buendel(huelle({ material: { sourceSnapshot: 'grenze links' } }))
    const rechte = zweiteStuetze('innere rechts')
    const vorschlag = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const vorwaerts = offen(finger([linke, rechte], vorschlag))
    const rueckwaerts = offen(finger([rechte, linke], vorschlag))
    assert.equal(vorwaerts.reviewPacketKey, rueckwaerts.reviewPacketKey)
    assert.equal(vorwaerts.ruleScopeKey, rueckwaerts.ruleScopeKey)
    assert.deepEqual(vorwaerts.supportVersionIds, rueckwaerts.supportVersionIds)
    assert.equal(vorwaerts.supportVersionIds.length, 2)
    assert.notEqual(vorwaerts.supportVersionIds[0], vorwaerts.supportVersionIds[1])
  })

  test('ein anderer Inhaltshash ändert die Identität und erfindet keinen zweiten Hash', () => {
    const unveraendert = 'official page line\nunchanged'
    const andereSeite = 'official page line\nchanged'
    const basis = offen(finger([buendel(huelle({ material: { sourceSnapshot: unveraendert } }))]))
    const geaendert = offen(finger([buendel(huelle({ material: { sourceSnapshot: andereSeite } }))]))
    const paketBasis = paketOffen([buendel(huelle({ material: { sourceSnapshot: unveraendert } }))])
    const paketNeu = paketOffen([buendel(huelle({ material: { sourceSnapshot: andereSeite } }))])
    assert.equal(paketBasis.supports[0]!.sourceContentHash, evidenceQuellenFingerprint(unveraendert))
    assert.equal(paketNeu.supports[0]!.sourceContentHash, evidenceQuellenFingerprint(andereSeite))
    assert.notEqual(paketBasis.supports[0]!.sourceContentHash, paketNeu.supports[0]!.sourceContentHash)
    assert.notEqual(basis.reviewPacketKey, geaendert.reviewPacketKey)
    assert.notEqual(basis.supportVersionIds[0], geaendert.supportVersionIds[0])
    ohneStoff(basis, [unveraendert, paketBasis.supports[0]!.sourceContentHash])
    ohneStoff(geaendert, [andereSeite, paketNeu.supports[0]!.sourceContentHash])
  })

  test('URL, Abrufzeit, Quelle und Versionskennung ändern die Identität ohne neuen Inhaltshash', () => {
    const basisPaket = paketOffen([buendel()])
    const basis = offen(finger([buendel()]))
    const hash = basisPaket.supports[0]!.sourceContentHash
    const faelle = [
      {
        name: 'url',
        stuetze: buendel(huelle({ material: { canonicalUrl: 'https://www.gov.example/other' } })),
      },
      {
        name: 'zeit',
        stuetze: buendel(huelle({ material: { retrievedAt: '2026-10-01T10:00:00.000Z' } })),
      },
      {
        name: 'quelle',
        stuetze: buendel(
          huelle({
            sourceId: ANDERE,
            material: { canonicalUrl: 'https://www.interior.example/rules' },
          }),
        ),
      },
    ]
    for (const fall of faelle) {
      const paket = paketOffen([fall.stuetze])
      const ergebnis = offen(finger([fall.stuetze]))
      assert.equal(paket.supports[0]!.sourceContentHash, hash, fall.name)
      assert.notEqual(paket.supports[0]!.versionId, basisPaket.supports[0]!.versionId, fall.name)
      assert.notEqual(ergebnis.reviewPacketKey, basis.reviewPacketKey, fall.name)
      assert.notEqual(ergebnis.supportVersionIds[0], basis.supportVersionIds[0], fall.name)
      ohneStoff(ergebnis, [paket.supports[0]!.canonicalUrl, paket.supports[0]!.sourceContentHash, SNAPSHOT])
    }
  })

  test('Vorschlag, Faktart, Qualität und Zelle ändern die Identität', () => {
    const stuetze = buendel()
    const linke = buendel(huelle({ material: { sourceSnapshot: 'qualitaet links' } }))
    const rechte = zweiteStuetze('qualitaet rechts')
    const basis = offen(finger([stuetze]))
    const andererVorschlag = offen(
      finger([stuetze], meta({ proposal: { kind: 'requirement_effect', effect: 'required', visaMode: 'visa_on_arrival' } })),
    )
    const andereArt = offen(
      finger(
        [stuetze],
        meta({
          factKind: 'stay_limit',
          proposal: {
            kind: 'stay_limit',
            perVisit: { value: 30, unit: 'days' },
            rollingWindow: null,
            initialGrant: null,
            extension: null,
            borderDiscretion: 'fixed',
          },
        }),
      ),
    )
    const explizit = offen(finger([linke, rechte], meta()))
    const zusammengesetzt = offen(
      finger([linke, rechte], meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })),
    )
    const luecke = offen(finger([stuetze], meta({ evidenceQuality: 'research_gap', proposal: null })))
    const andereZelle = offen(
      finger([
        buendel(
          huelle({
            request: anfrage({ validity: { mode: 'travel_date', travelDate: '2026-11-01' } }),
          }),
        ),
      ]),
    )
    assert.equal(andererVorschlag.ruleScopeKey, basis.ruleScopeKey)
    assert.deepEqual(andererVorschlag.supportVersionIds, basis.supportVersionIds)
    assert.notEqual(andererVorschlag.reviewPacketKey, basis.reviewPacketKey)
    assert.equal(andereArt.ruleScopeKey, basis.ruleScopeKey)
    assert.notEqual(andereArt.reviewPacketKey, basis.reviewPacketKey)
    assert.equal(zusammengesetzt.ruleScopeKey, explizit.ruleScopeKey)
    assert.deepEqual(zusammengesetzt.supportVersionIds, explizit.supportVersionIds)
    assert.notEqual(zusammengesetzt.reviewPacketKey, explizit.reviewPacketKey)
    assert.notEqual(luecke.reviewPacketKey, basis.reviewPacketKey)
    assert.equal(luecke.ruleScopeKey, basis.ruleScopeKey)
    assert.notEqual(andereZelle.reviewPacketKey, basis.reviewPacketKey)
    assert.notEqual(andereZelle.ruleScopeKey, basis.ruleScopeKey)
    assert.deepEqual(andereZelle.supportVersionIds, basis.supportVersionIds)
    ohneStoff(andererVorschlag, ['visa_on_arrival', 'electronic_visa'])
    ohneStoff(andereArt, ['stay_limit', 'perVisit'])
    ohneStoff(luecke, ['research_gap', 'electronic_visa'])
    ohneStoff(andereZelle, ['2026-11-01'])
  })

  test('normalisierte Schlüsselreihenfolge, Leerraum und Zeilenenden bleiben dieselbe Identität', () => {
    const extraktion = {
      validFrom: '2026-01-01',
      validUntil: '2026-12-31T00:00:00.000Z',
      extractionNote: '  Bounded synthetic extraction note.  ',
    }
    const normal = offen(finger([buendel(huelle(), extraktion)]))
    const vertauschteNotiz = {
      extractionNote: 'Bounded synthetic extraction note.',
      validUntil: '2026-12-31T00:00:00.000Z',
      validFrom: '2026-01-01',
    }
    const vertauschteStuetze = buendel(huelle(), vertauschteNotiz)
    const huelleVertauscht = {
      extraktion: vertauschteStuetze.extraktion,
      uhr: vertauschteStuetze.uhr,
      umschlag: vertauschteStuetze.umschlag,
    }
    const vorschlag: Record<string, unknown> = {}
    vorschlag.proposal = { visaMode: 'electronic_visa', effect: 'required', kind: 'requirement_effect' }
    vorschlag.evidenceQuality = 'explicit_primary_statement'
    vorschlag.factKind = 'requirement_effect'
    const vertauscht = offen(finger([huelleVertauscht], vorschlag))

    const staatsangehoerigkeit = offen(
      finger([
        buendel(
          huelle({
            request: anfrage({
              citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
            }),
          }),
        ),
      ]),
    )
    const zeilenende = offen(finger([buendel(huelle({ material: { sourceSnapshot: 'official page line\r\nunchanged' } }))]))
    const paketZeile = paketOffen([buendel(huelle({ material: { sourceSnapshot: 'official page line\r\nunchanged' } }))])
    const paketBasis = paketOffen([buendel()])

    assert.equal(vertauscht.reviewPacketKey, normal.reviewPacketKey)
    assert.equal(staatsangehoerigkeit.reviewPacketKey, normal.reviewPacketKey)
    assert.equal(staatsangehoerigkeit.ruleScopeKey, normal.ruleScopeKey)
    assert.equal(zeilenende.reviewPacketKey, normal.reviewPacketKey)
    assert.equal(paketZeile.supports[0]!.sourceContentHash, paketBasis.supports[0]!.sourceContentHash)
    assert.equal(paketZeile.supports[0]!.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
  })

  test('ein mitgeliefertes Paket oder ein mitgelieferter Hash wird nicht geglaubt', () => {
    const stuetze = buendel()
    const echt = offen(finger([stuetze]))
    const paket = paketOffen([stuetze])
    const faelle = [
      paket,
      { status: 'rule_review_packet', kandidat: paket.kandidat, supports: paket.supports },
      { supports: [stuetze], metadata: meta(), reviewPacketKey: echt.reviewPacketKey },
      { supports: [stuetze], metadata: meta(), sourceContentHash: paket.supports[0]!.sourceContentHash },
      { supports: [stuetze], metadata: meta(), trustedRuleFact: { marker: 'TRUSTED-MARKER-SHOULD-NOT-ECHO' } },
    ]
    for (const eingabe of faelle) {
      const ergebnis = officialTruthRegelReviewPacketFingerprint(eingabe)
      assert.equal(ergebnis.status, 'blocked')
      assert.equal(JSON.stringify(ergebnis).includes('rule_review_packet_fingerprint'), false)
      assert.equal(JSON.stringify(ergebnis).includes(echt.reviewPacketKey), false)
      assert.equal(JSON.stringify(ergebnis).includes('TRUSTED-MARKER-SHOULD-NOT-ECHO'), false)
      assert.equal(JSON.stringify(ergebnis).includes(paket.supports[0]!.sourceContentHash), false)
    }
    assert.equal(finger([stuetze], meta({ evidenceQuality: 'research_gap', proposal: VORSCHLAG })).status, 'blocked')
  })

  test('eine zweite Credential-Option bleibt eine andere Identität', () => {
    const coverage = passAbdeckung()
    const basis = standardRegistry()
    const schweiz = buendel(
      huelle({
        registry: basis,
        descriptors: beideDeskriptoren(basis, coverage),
        material: { sourceSnapshot: 'pass ch' },
      }),
    )
    const serbien = buendel(
      huelle({
        request: anfrage({
          credentialOption: {
            mode: 'option',
            documentType: 'passport',
            issuingCountryCode: 'RS',
            relatedCitizenshipCountryCode: 'RS',
          },
        }),
        registry: basis,
        descriptors: beideDeskriptoren(basis, coverage),
        sourceId: ANDERE,
        material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: 'pass rs' },
      }),
    )
    const schweizer = offen(finger([schweiz]))
    const serbisch = offen(finger([serbien]))
    assert.notEqual(schweizer.reviewPacketKey, serbisch.reviewPacketKey)
    assert.notEqual(schweizer.ruleScopeKey, serbisch.ruleScopeKey)
    const gemeinsam = finger([schweiz, serbien])
    assert.deepEqual(gemeinsam, { status: 'blocked', reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(gemeinsam).includes('RS'), false)
    assert.equal(JSON.stringify(gemeinsam).includes('CH'), false)
    ohneStoff(schweizer, ['pass ch'])
    ohneStoff(serbisch, ['pass rs'])
  })

  test('persönliche Felder und gesperrte Pakete liefern keine Identität', () => {
    const stuetze = buendel()
    const inMeta = finger([stuetze], meta({ passportNumber: GEHEIM }))
    const imBuendel = finger([{ ...stuetze, passportNumber: GEHEIM }])
    for (const ergebnis of [inMeta, imBuendel, finger([]), officialTruthRegelReviewPacketFingerprint(null)]) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(GEHEIM), false)
      assert.equal(text.includes('passportNumber'), false)
      assert.equal(text.includes('rule_review_packet_fingerprint'), false)
      assert.equal(text.includes(SNAPSHOT), false)
    }
  })

  test('die Identität ruft nur das Prüfpaket und den vorhandenen SHA-256 auf', () => {
    const text = datei('lib/readiness/official-truth-rule-review-fingerprint.ts')
    const importe = [...text.matchAll(/from '([^']+)'/g)].map((treffer) => treffer[1]).sort()
    assert.deepEqual(importe, [
      '@/lib/readiness/digest',
      '@/lib/readiness/official-truth-rule-review-packet',
    ])
    assert.match(text, /officialTruthRegelReviewPacket\(/)
    assert.match(text, /sha256Hex\(/)
    assert.match(text, /review-packet:v1:/)
    assert.doesNotMatch(text, /evidenceQuellenFingerprint|createHash|randomUUID|sourceSnapshot/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|regelKandidatErstellen|trustedRuleFact/)
    assert.doesNotMatch(text, /officialTruthAkzeptierteEvidenceAusAbruf|officialTruthRegelKandidatAusEvidence|officialTruthAbgerufenMaterialPruefen/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/i)
    for (const relativ of [
      'lib/readiness/evidence.ts',
      'lib/readiness/digest.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/official-truth-rule-candidate.ts',
      'lib/readiness/official-truth-rule-review-packet.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-rule-review-fingerprint/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})
