// lib/readiness/official-truth-rule-review-packet.test.ts
//
// Internes Prüfpaket nur über neu belegte Stützen und den Regel-Kandidaten.
// Synthetische .example-Quellen. Keine Annahme, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import { officialTruthAkzeptierteEvidenceAusAbruf } from '@/lib/readiness/official-truth-accepted-evidence'
import { officialTruthKandidatEvidenceAusAbruf } from '@/lib/readiness/official-truth-retrieved-candidate-evidence'
import { officialTruthAbgerufenMaterialPruefen } from '@/lib/readiness/official-truth-retrieved-material'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import {
  officialTruthRegelReviewPacket,
  type OfficialTruthRegelReviewPacketErgebnis,
} from '@/lib/readiness/official-truth-rule-review-packet'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { REGEL_SUPPORT_MAX, regelScopeAusEvidenceScope, type RegelFaktArt, type RegelScope } from '@/lib/readiness/rule-claims'
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
const MARKER = 'TRUSTED-MARKER-SHOULD-NOT-ECHO'

const PERSONEN = [
  'userId',
  'accountId',
  'tripId',
  'travellerId',
  'passportNumber',
  'documentNumber',
  'mrz',
  'biometric',
  'dateOfBirth',
  'healthRecord',
  'email',
  'fullName',
  'phone',
  'scan',
  'travellerNote',
  'note',
] as const

const SUPPORT_FELDER = [
  'canonicalUrl',
  'retrievedAt',
  'sourceContentHash',
  'sourceId',
  'sourceSnapshot',
  'validFrom',
  'validUntil',
  'versionId',
]

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

function registry(eingaben: readonly QuellenEingabe[], blockedDomains?: readonly string[]): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen(eingaben, blockedDomains ? { blockedDomains } : undefined)
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

function standardRegistry(blockedDomains?: readonly string[]): QuellenRegistry {
  return registry(
    [
      amt(QUELLE, 'gov.example', 'Example Border Authority'),
      amt(ANDERE, 'interior.example', 'Example Interior Authority'),
      anbieter(ANBIETER, 'provider.example'),
    ],
    blockedDomains,
  )
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
  extra?: Record<string, unknown>
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
    ...teil?.extra,
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

function paket(supports: unknown, metadata: unknown = meta()): OfficialTruthRegelReviewPacketErgebnis {
  return officialTruthRegelReviewPacket({ supports, metadata })
}

function offen(ergebnis: OfficialTruthRegelReviewPacketErgebnis) {
  assert.equal(ergebnis.status, 'rule_review_packet')
  if (ergebnis.status !== 'rule_review_packet') throw new Error('blockiert')
  return ergebnis
}

function grenze(snapshot = SNAPSHOT, extraktion: unknown = null) {
  return buendel(huelle({ material: { sourceSnapshot: snapshot } }), extraktion)
}

function inneres(snapshot: string, request: OfficialTruthRechercheAnfrage = anfrage(), coverage: QuellenAbdeckung = abdeckung()) {
  const basis = standardRegistry()
  return buendel(
    huelle({
      request,
      registry: basis,
      descriptors: beideDeskriptoren(basis, coverage),
      sourceId: ANDERE,
      material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: snapshot },
    }),
  )
}

describe('Official Truth rule review packet', () => {
  test('eine neu belegte amtliche Stütze und ein expliziter Kandidat bleiben ein Prüfpaket', () => {
    const clock = uhr()
    const extraktion = {
      validFrom: '2026-01-01',
      validUntil: '2026-12-31T00:00:00.000Z',
      extractionNote: '  Bounded synthetic extraction note.  ',
    }
    const stuetze = buendel(huelle(), extraktion, clock)
    const vorschlag = meta()
    const eingabe = { supports: [stuetze], metadata: vorschlag }
    const vorherUmschlag = JSON.stringify(stuetze.umschlag)
    const vorherExtraktion = JSON.stringify(extraktion)
    const vorherMeta = JSON.stringify(vorschlag)

    const ergebnis = offen(officialTruthRegelReviewPacket(eingabe))
    const direktAkzeptiert = officialTruthAkzeptierteEvidenceAusAbruf(stuetze.umschlag, clock, extraktion)
    const direktBeleg = officialTruthAbgerufenMaterialPruefen(stuetze.umschlag, clock)
    assert.equal(direktAkzeptiert.status, 'accepted_evidence')
    assert.equal(direktBeleg.status, 'retrieved_material')
    if (direktAkzeptiert.status !== 'accepted_evidence' || direktBeleg.status !== 'retrieved_material') return
    const direktKandidat = officialTruthRegelKandidatAusEvidence([direktAkzeptiert.evidence], stuetze.umschlag.registry, vorschlag)

    assert.equal(direktKandidat.ok, true)
    if (!direktKandidat.ok) return
    assert.deepEqual(ergebnis.kandidat, direktKandidat.kandidat)
    assert.equal(ergebnis.kandidat.lifecycle, 'candidate')
    assert.equal(ergebnis.kandidat.validationState, 'pending')
    assert.equal(ergebnis.kandidat.factKind, 'requirement_effect')
    assert.equal(ergebnis.kandidat.evidenceQuality, 'explicit_primary_statement')
    assert.deepEqual(ergebnis.kandidat.proposal, VORSCHLAG)
    assert.equal(ergebnis.kandidat.scope.destinationCountryCode, 'JP')
    assert.equal(ergebnis.kandidat.scope.transitCountryCode, null)
    assert.deepEqual(
      ergebnis.kandidat.scope.citizenship.mode === 'required' ? ergebnis.kandidat.scope.citizenship.countryCodes : [],
      ['CH', 'RS'],
    )
    assert.equal(ergebnis.kandidat.scope.credentialOption.mode, 'option')
    if (ergebnis.kandidat.scope.credentialOption.mode !== 'option') return
    assert.equal(ergebnis.kandidat.scope.credentialOption.issuingCountryCode, 'CH')
    assert.equal(ergebnis.kandidat.scope.credentialOption.relatedCitizenshipCountryCode, 'CH')
    assert.deepEqual(Object.keys(ergebnis).sort(), ['kandidat', 'status', 'supports'])
    assert.equal(ergebnis.supports.length, 1)
    const eintrag = ergebnis.supports[0]
    assert.ok(eintrag)
    assert.deepEqual(Object.keys(eintrag).sort(), SUPPORT_FELDER)
    assert.deepEqual(ergebnis.kandidat.supportVersionIds, [eintrag.versionId])
    assert.equal(eintrag.versionId, direktAkzeptiert.evidence.versionId)
    assert.equal(eintrag.sourceId, direktBeleg.sourceId)
    assert.equal(eintrag.sourceId, direktAkzeptiert.evidence.sourceId)
    assert.equal(eintrag.canonicalUrl, direktBeleg.canonicalUrl)
    assert.equal(eintrag.canonicalUrl, direktAkzeptiert.evidence.canonicalUrl)
    assert.equal(eintrag.retrievedAt, direktBeleg.retrievedAt)
    assert.equal(eintrag.retrievedAt, ABGERUFEN)
    assert.equal(eintrag.sourceContentHash, direktBeleg.sourceContentHash)
    assert.equal(eintrag.sourceContentHash, evidenceQuellenFingerprint(SNAPSHOT))
    assert.equal(eintrag.sourceSnapshot, direktBeleg.material.sourceSnapshot)
    assert.equal(eintrag.sourceSnapshot, SNAPSHOT)
    assert.equal(eintrag.validFrom, direktAkzeptiert.evidence.validFrom)
    assert.equal(eintrag.validFrom, '2026-01-01')
    assert.equal(eintrag.validUntil, direktAkzeptiert.evidence.validUntil)
    assert.equal(eintrag.validUntil, '2026-12-31T00:00:00.000Z')
    assert.equal('extractionNote' in eintrag, false)
    assert.equal(JSON.stringify(ergebnis).includes('Bounded synthetic extraction note'), false)
    assert.equal(direktBeleg.ruleScopeKey, ergebnis.kandidat.key)
    assert.equal(JSON.stringify(ergebnis).includes('"lifecycle":"accepted"'), false)
    assert.equal(JSON.stringify(ergebnis).includes('trustedRuleFact'), false)
    assert.equal(JSON.stringify(stuetze.umschlag), vorherUmschlag)
    assert.equal(JSON.stringify(extraktion), vorherExtraktion)
    assert.equal(JSON.stringify(vorschlag), vorherMeta)
    assert.equal(stuetze.uhr, clock)
    assert.equal(Object.isFrozen(stuetze), false)
    assert.equal(Object.isFrozen(ergebnis), true)
    assert.equal(Object.isFrozen(eintrag), true)
  })

  test('zwei amtliche Stützen ergeben unabhängig von der Reihenfolge dasselbe Prüfpaket', () => {
    const erste = grenze('seite grenze')
    const zweite = inneres('seite inneres')
    const vorschlag = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const vorwaerts = offen(paket([erste, zweite], vorschlag))
    const rueckwaerts = offen(paket([zweite, erste], vorschlag))
    const erwartet = [...vorwaerts.supports.map((eintrag) => eintrag.versionId)].sort()

    assert.deepEqual(vorwaerts, rueckwaerts)
    assert.equal(vorwaerts.kandidat.lifecycle, 'candidate')
    assert.equal(vorwaerts.kandidat.validationState, 'pending')
    assert.equal(vorwaerts.kandidat.evidenceQuality, 'composed_from_multiple_primary_sources')
    assert.deepEqual(vorwaerts.kandidat.supportVersionIds, erwartet)
    assert.deepEqual(
      vorwaerts.supports.map((eintrag) => eintrag.versionId),
      vorwaerts.kandidat.supportVersionIds,
    )
    assert.deepEqual(
      vorwaerts.supports.map((eintrag) => eintrag.sourceId),
      erwartet.map((id) => vorwaerts.supports.find((eintrag) => eintrag.versionId === id)?.sourceId),
    )
    assert.equal(new Set(vorwaerts.supports.map((eintrag) => eintrag.sourceId)).size, 2)
    for (const eintrag of vorwaerts.supports) {
      assert.equal(eintrag.sourceContentHash, evidenceQuellenFingerprint(eintrag.sourceSnapshot))
      assert.equal(eintrag.retrievedAt, ABGERUFEN)
    }
    const text = JSON.stringify(vorwaerts)
    assert.equal(text.includes('"lifecycle":"accepted"'), false)
    assert.equal(text.includes('trustedRuleFact'), false)
  })

  test('Aufrufer-Evidence, Kandidat, Beleg, Stütz-IDs und Wahrheitsfakt werden nicht übernommen', () => {
    const stuetze = grenze()
    const akzeptiert = officialTruthAkzeptierteEvidenceAusAbruf(stuetze.umschlag, stuetze.uhr, null)
    assert.equal(akzeptiert.status, 'accepted_evidence')
    if (akzeptiert.status !== 'accepted_evidence') return
    const beleg = officialTruthAbgerufenMaterialPruefen(stuetze.umschlag, stuetze.uhr)
    assert.equal(beleg.status, 'retrieved_material')
    const felder: Record<string, unknown> = {
      evidence: akzeptiert.evidence,
      kandidat: { lifecycle: 'candidate', validationState: 'pending', proposal: VORSCHLAG },
      claim: { lifecycle: 'accepted', fact: VORSCHLAG },
      receipt: beleg,
      supportVersionIds: [akzeptiert.evidence.versionId],
      trustedRuleFact: { marker: MARKER, effect: 'not_required' },
    }
    for (const [feld, wert] of Object.entries(felder)) {
      const oben = officialTruthRegelReviewPacket({ supports: [stuetze], metadata: meta(), [feld]: wert })
      const imBuendel = paket([{ ...stuetze, [feld]: wert }])
      const inMeta = paket([stuetze], meta({ [feld]: wert }))
      for (const ergebnis of [oben, imBuendel, inMeta]) {
        assert.equal(ergebnis.status, 'blocked', feld)
        assert.equal(JSON.stringify(ergebnis).includes(MARKER), false, feld)
        assert.equal(JSON.stringify(ergebnis).includes('not_required'), false, feld)
        assert.equal(JSON.stringify(ergebnis).includes('rule_review_packet'), false, feld)
        assert.equal(JSON.stringify(ergebnis).includes(akzeptiert.evidence.versionId), false, feld)
      }
    }
  })

  test('Kandidat, lizenzierte Quelle und verfälschter Umschlag scheitern über die Brücken', () => {
    const offenEvidence = officialTruthKandidatEvidenceAusAbruf(huelle(), uhr(), null)
    assert.equal(offenEvidence.status, 'candidate_evidence')
    if (offenEvidence.status !== 'candidate_evidence') return
    const hash = evidenceQuellenFingerprint(SNAPSHOT)
    assert.ok(hash)
    const faelle: { name: string; umschlag: unknown; extraktion: unknown; clock: unknown }[] = [
      { name: 'kandidat', umschlag: offenEvidence.evidence, extraktion: null, clock: uhr() },
      {
        name: 'beleg',
        umschlag: {
          status: 'retrieved_material',
          sourceId: QUELLE,
          canonicalUrl: 'https://www.gov.example/rules',
          retrievedAt: ABGERUFEN,
          sourceContentHash: hash,
          sourceSnapshot: SNAPSHOT,
        },
        extraktion: null,
        clock: uhr(),
      },
      {
        name: 'lizenziert',
        umschlag: huelle({ sourceId: ANBIETER, material: { canonicalUrl: 'https://www.provider.example/rules' } }),
        extraktion: null,
        clock: uhr(),
      },
      { name: 'hash', umschlag: huelle({ extra: { sourceContentHash: hash } }), extraktion: null, clock: uhr() },
      { name: 'snapshot', umschlag: huelle({ material: { sourceSnapshot: '' } }), extraktion: null, clock: uhr() },
      {
        name: 'zukunft',
        umschlag: huelle({ material: { retrievedAt: '2026-10-01T12:00:00.001Z' } }),
        extraktion: null,
        clock: uhr(),
      },
    ]
    for (const fall of faelle) {
      const ergebnis = paket([buendel(fall.umschlag as Record<string, unknown>, fall.extraktion, fall.clock as () => Date)])
      const annahme = officialTruthAkzeptierteEvidenceAusAbruf(fall.umschlag, fall.clock, fall.extraktion)
      const abruf = officialTruthAbgerufenMaterialPruefen(fall.umschlag, fall.clock)
      assert.equal(ergebnis.status, 'blocked', fall.name)
      assert.equal(annahme.status, 'blocked', fall.name)
      assert.equal(abruf.status, 'blocked', fall.name)
      if (ergebnis.status !== 'blocked' || annahme.status !== 'blocked') return
      assert.equal(ergebnis.reason, annahme.reason, fall.name)
      assert.equal(JSON.stringify(ergebnis).includes('rule_review_packet'), false, fall.name)
      assert.equal(JSON.stringify(ergebnis).includes(String(hash)), false, fall.name)
    }
  })

  test('eine andere Credential-Option bleibt eine andere Zelle', () => {
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
    assert.equal(offen(paket([schweiz])).kandidat.scope.credentialOption.mode, 'option')
    assert.equal(offen(paket([serbien])).kandidat.scope.credentialOption.mode, 'option')
    const ergebnis = paket([schweiz, serbien])
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(ergebnis).includes('RS'), false)
    assert.equal(JSON.stringify(ergebnis).includes('CH'), false)
  })

  test('dieselbe Stütze zweimal scheitert und die Eingabe bleibt unverändert', () => {
    const stuetze = grenze('doppelt')
    const supports = [stuetze, stuetze]
    const vorher = JSON.stringify(supports)
    const ergebnis = paket(supports)
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'support_mismatch' })
    assert.equal(JSON.stringify(supports), vorher)
    assert.deepEqual(paket([]), { status: 'blocked', reason: 'invalid_support' })
    const zuViele = Array.from({ length: REGEL_SUPPORT_MAX + 1 }, () => grenze('zu viele'))
    const vorherViele = JSON.stringify(zuViele)
    assert.deepEqual(paket(zuViele), { status: 'blocked', reason: 'support_bound_exceeded' })
    assert.equal(JSON.stringify(zuViele), vorherViele)
  })

  test('eine Forschungslücke mit leerem Vorschlag bleibt ein nicht annehmbares Prüfpaket', () => {
    const stuetze = grenze('luecke')
    const vorschlag = meta({ evidenceQuality: 'research_gap', proposal: null })
    const ergebnis = offen(paket([stuetze], vorschlag))
    assert.equal(ergebnis.kandidat.lifecycle, 'candidate')
    assert.equal(ergebnis.kandidat.validationState, 'pending')
    assert.equal(ergebnis.kandidat.evidenceQuality, 'research_gap')
    assert.equal(ergebnis.kandidat.proposal, null)
    assert.notEqual(ergebnis.kandidat.evidenceQuality, 'explicit_primary_statement')
    assert.notEqual(ergebnis.kandidat.evidenceQuality, 'composed_from_multiple_primary_sources')
    assert.equal(ergebnis.supports.length, 1)
    assert.deepEqual(ergebnis.kandidat.supportVersionIds, ergebnis.supports.map((eintrag) => eintrag.versionId))
    assert.equal(JSON.stringify(ergebnis).includes('"lifecycle":"accepted"'), false)
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
    assert.equal(JSON.stringify(ergebnis).includes('electronic_visa'), false)

    const verboten = paket([stuetze], meta({ evidenceQuality: 'research_gap', proposal: VORSCHLAG }))
    assert.deepEqual(verboten, { status: 'blocked', reason: 'research_gap_proposal_forbidden' })
    assert.equal(JSON.stringify(verboten).includes('electronic_visa'), false)
    assert.equal(JSON.stringify(verboten).includes('rule_review_packet'), false)
  })

  test('persönliche Felder scheitern ohne Echo', () => {
    const stuetze = grenze()
    for (const feld of PERSONEN) {
      const inMeta = paket([stuetze], meta({ [feld]: GEHEIM }))
      const imUmschlag = paket([buendel(huelle({ extra: { [feld]: GEHEIM } }))])
      const inExtraktion = paket([buendel(huelle(), { [feld]: GEHEIM })])
      const imBuendel = paket([{ ...stuetze, [feld]: GEHEIM }])
      for (const ergebnis of [inMeta, imUmschlag, inExtraktion, imBuendel]) {
        assert.equal(ergebnis.status, 'blocked', feld)
        const text = JSON.stringify(ergebnis)
        assert.equal(text.includes(GEHEIM), false, feld)
        assert.equal(text.includes(feld), false, feld)
        assert.equal(text.includes('rule_review_packet'), false, feld)
      }
    }
    const verschachtelt = paket([stuetze], meta({ proposal: { ...VORSCHLAG, passportNumber: GEHEIM } }))
    assert.equal(verschachtelt.status, 'blocked')
    assert.equal(JSON.stringify(verschachtelt).includes(GEHEIM), false)
  })

  test('zwei Registries und dieselbe Quelle als Zusammensetzung scheitern geschlossen', () => {
    const linke = grenze('registry links')
    const basis = standardRegistry(['blocked.example'])
    const rechte = buendel(
      huelle({
        registry: basis,
        descriptors: beideDeskriptoren(basis),
        sourceId: ANDERE,
        material: { canonicalUrl: 'https://www.interior.example/rules', sourceSnapshot: 'registry rechts' },
      }),
    )
    const registries = paket([linke, rechte], meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }))
    assert.deepEqual(registries, { status: 'blocked', reason: 'invalid_source_plan' })

    const gleicheQuelle = buendel(huelle({ material: { sourceSnapshot: 'seite nochmal' } }))
    const zusammengesetzt = paket(
      [grenze('seite grenze'), gleicheQuelle],
      meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    )
    assert.deepEqual(zusammengesetzt, { status: 'blocked', reason: 'same_source_composition' })
    assert.equal('kandidat' in zusammengesetzt, false)
  })

  test('die Eingabe bleibt bei Erfolg und bei Sperre unverändert', () => {
    const stuetze = grenze('unverändert')
    const vorschlag = meta()
    const supports = [stuetze]
    const vorherSupports = JSON.stringify(supports)
    const vorherMeta = JSON.stringify(vorschlag)
    const erfolg = offen(paket(supports, vorschlag))
    assert.equal(erfolg.supports[0]?.sourceSnapshot, 'unverändert')
    assert.equal(JSON.stringify(supports), vorherSupports)
    assert.equal(JSON.stringify(vorschlag), vorherMeta)

    const gesperrt = buendel(huelle({ extra: { passportNumber: GEHEIM } }))
    const liste = [gesperrt]
    const vorherGesperrt = JSON.stringify(liste)
    const ergebnis = paket(liste, { proposal: { passportNumber: GEHEIM } })
    assert.equal(ergebnis.status, 'blocked')
    assert.equal(JSON.stringify(liste), vorherGesperrt)
    assert.equal(JSON.stringify(ergebnis).includes(GEHEIM), false)
  })

  test('angenommene Gültigkeit wird übernommen und eine abgelehnte Rohzeile nicht', () => {
    const seite = 'gleiche seite'
    const rohFenster = { validFrom: '  2026-06-15  ', validUntil: '  2026-12-31T00:00:00.000Z  ' }
    const normalFenster = { validFrom: '2026-06-15', validUntil: '2026-12-31T00:00:00.000Z' }
    const rohPaket = offen(paket([grenze(seite, rohFenster)]))
    const normalPaket = offen(paket([grenze(seite, normalFenster)]))
    const leer = offen(paket([grenze(seite)]))
    const explizitLeer = offen(paket([grenze(seite, { validFrom: null, validUntil: null })]))
    assert.equal(rohPaket.supports[0]?.validFrom, '2026-06-15')
    assert.equal(rohPaket.supports[0]?.validUntil, '2026-12-31T00:00:00.000Z')
    assert.deepEqual(
      rohPaket.supports.map((eintrag) => [eintrag.validFrom, eintrag.validUntil]),
      normalPaket.supports.map((eintrag) => [eintrag.validFrom, eintrag.validUntil]),
    )
    assert.equal(leer.supports[0]?.validFrom, null)
    assert.equal(leer.supports[0]?.validUntil, null)
    assert.deepEqual(
      leer.supports.map((eintrag) => [eintrag.validFrom, eintrag.validUntil, eintrag.versionId]),
      explizitLeer.supports.map((eintrag) => [eintrag.validFrom, eintrag.validUntil, eintrag.versionId]),
    )
    assert.equal(rohPaket.supports[0]?.versionId, leer.supports[0]?.versionId)
    assert.equal('extractionNote' in (rohPaket.supports[0] ?? {}), false)

    const notiz = 'Bounded synthetic extraction note.'
    const mitNotiz = offen(paket([grenze('notiz', { validFrom: '2026-06-15', extractionNote: `  ${notiz}  ` })]))
    assert.equal(mitNotiz.supports[0]?.validFrom, '2026-06-15')
    assert.equal(mitNotiz.supports[0]?.validUntil, null)
    assert.equal(JSON.stringify(mitNotiz).includes(notiz), false)
    assert.equal(JSON.stringify(mitNotiz).includes('extractionNote'), false)

    const ungueltig = 'not-a-real-validity-91f3'
    const verkehrt = paket([grenze('ungueltig', { validFrom: ungueltig, validUntil: null })])
    const reihenfolge = paket([grenze('reihenfolge', { validFrom: '2026-12-31', validUntil: '2026-01-01' })])
    for (const ergebnis of [verkehrt, reihenfolge]) {
      assert.equal(ergebnis.status, 'blocked')
      const text = JSON.stringify(ergebnis)
      assert.equal(text.includes(ungueltig), false)
      assert.equal(text.includes('2026-12-31'), false)
      assert.equal(text.includes('2026-01-01'), false)
      assert.equal(text.includes('rule_review_packet'), false)
      assert.equal('supports' in ergebnis, false)
    }
  })

  test('das Paket ruft keine Annahme, keinen Speicher und kein Modell auf', () => {
    const text = datei('lib/readiness/official-truth-rule-review-packet.ts')
    assert.match(text, /officialTruthAkzeptierteEvidenceAusAbruf\(/)
    assert.match(text, /officialTruthAbgerufenMaterialPruefen\(/)
    assert.match(text, /officialTruthRegelKandidatAusEvidence\(/)
    assert.match(text, /validFrom: belegt\.evidence\.validFrom/)
    assert.match(text, /validUntil: belegt\.evidence\.validUntil/)
    assert.doesNotMatch(text, /extractionNote/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren/)
    assert.doesNotMatch(text, /regelKandidatErstellen/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|evidenceKandidatAusModell|akzeptierteEvidenceLesen/)
    assert.doesNotMatch(text, /trustedRuleFact/)
    assert.doesNotMatch(text, /lifecycle\s*:\s*'candidate'|validationState\s*:\s*'pending'/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(
      text,
      /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|evidence)'/,
    )
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/i)
    for (const relativ of [
      'lib/readiness/evidence.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts',
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/official-truth-rule-candidate.ts',
    ]) {
      assert.doesNotMatch(datei(relativ), /official-truth-rule-review-packet/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})
