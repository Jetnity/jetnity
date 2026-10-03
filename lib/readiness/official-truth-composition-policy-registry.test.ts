// lib/readiness/official-truth-composition-policy-registry.test.ts
//
// Synthetische Politik- und Extraktorfixtures. Keine Behördenquelle,
// kein Netz, keine Annahme und kein Speicher.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import {
  isOfficialTruthCompositionSeal,
  OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY,
  officialTruthCompositionCitationKey,
  officialTruthCompositionPhaseA,
  officialTruthCompositionPhaseB,
  officialTruthCompositionPreHttpKey,
  officialTruthCompositionProvenanceIdentity,
  officialTruthCompositionRegistriesPruefen,
  officialTruthCompositionSealView,
  officialTruthCompositionZitatePruefen,
  type OfficialTruthCompositionFreeze,
  type OfficialTruthCompositionPolicy,
  type OfficialTruthCompositionSupport,
} from '@/lib/readiness/official-truth-composition-policy-registry'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { regulierungsAusdruckStrukturSchluessel, type RegulierungsAusdruck } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { regelFaktKanonischLesen, regelScopeAusEvidenceScope, type RegelFakt, type RegelScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import type {
  OfficialTruthExtractorBeobachtung,
  OfficialTruthExtractorDefinition,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'

const DATEI = 'lib/readiness/official-truth-composition-policy-registry.ts'
const A = 'example-border-authority'
const B = 'example-interior-authority'
const VA = `ev1_${'a'.repeat(32)}`
const VB = `ev1_${'b'.repeat(32)}`
const VF = `ev1_${'f'.repeat(32)}`
const URL_A = 'https://www.gov.example/effect'
const URL_B = 'https://www.interior.example/effect'
const ZEIT = '2026-10-03T00:00:00.000Z'
const SNAP_A = 'EXAMPLE-BORDER-91f3'
const SNAP_B = 'EXAMPLE-INTERIOR-91f3'
const HASH_A = evidenceQuellenFingerprint(SNAP_A) ?? ''
const HASH_B = evidenceQuellenFingerprint(SNAP_B) ?? ''

type Zaehler = { match: number; extract: number }

function registry(): QuellenRegistry {
  const erzeugt = quellenRegistryErstellen([
    {
      sourceId: A,
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['gov.example'],
    },
    {
      sourceId: B,
      sourceClass: 'official_authority',
      publisherName: 'Example Interior Authority',
      authorityName: 'Example Interior Authority',
      domains: ['interior.example'],
    },
  ])
  assert.equal(erzeugt.ok, true)
  if (!erzeugt.ok) throw new Error('registry')
  return erzeugt.registry
}

function scope(): { scope: RegelScope; key: string } {
  const gelesen = regelScopeAusEvidenceScope({
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH'] },
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: null,
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'health',
    validity: { mode: 'not_applicable' },
  })
  assert.equal(gelesen.ok, true)
  if (!gelesen.ok) throw new Error('scope')
  return { scope: gelesen.scope, key: gelesen.key }
}

function atom(purpose: string, support?: string): RegulierungsAusdruck {
  return support
    ? { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: purpose as 'visitor' }, supportVersionIds: [support] }
    : { op: 'atomic', predicate: { kind: 'travel_purpose', purpose: purpose as 'visitor' } }
}

function politik(teil?: Partial<OfficialTruthCompositionPolicy>): OfficialTruthCompositionPolicy {
  return {
    policyId: 'otp_example_effect',
    policyVersion: 1,
    current: true,
    factKind: 'requirement_effect',
    requirementType: 'health',
    sourceIds: [A, B],
    sourceFamilyId: 'otf_example_effect',
    schemaFamily: 'ots_example_effect',
    applicabilitySchema: null,
    completeness: 'joint_complete_fact',
    assignments: [
      {
        target: { kind: 'fact_field', fieldPath: 'effect' },
        sourceIds: [A],
        relation: 'single_source',
        role: 'complementary_part',
      },
      {
        target: { kind: 'fact_field', fieldPath: 'visaMode' },
        sourceIds: [B],
        relation: 'single_source',
        role: 'complementary_part',
      },
    ],
    ...teil,
  }
}

/**
 * Ein codeeigener Extraktor beschriftet jede Beobachtung mit dem
 * Zielschlüssel der Kompositionsschicht. Der Aufrufer liefert nichts.
 */
function zielSchluessel(fieldPath: string): string {
  return officialTruthCompositionCitationKey({ kind: 'fact_field', fieldPath })
}

function beobachtungenFuer(policy: OfficialTruthCompositionPolicy): OfficialTruthExtractorBeobachtung[] {
  return policy.assignments.flatMap((assignment) =>
    assignment.sourceIds.map((sourceId) => ({
      targetKey: officialTruthCompositionCitationKey(assignment.target),
      sourceId,
      canonical: `kanonisch:${officialTruthCompositionCitationKey(assignment.target)}`,
    })),
  )
}

function extraktor(zaehler: Zaehler = { match: 0, extract: 0 }, teil?: Partial<OfficialTruthExtractorDefinition>): OfficialTruthExtractorDefinition {
  return {
    extractorId: 'otx_example_effect',
    extractorVersion: 1,
    current: true,
    factKind: 'requirement_effect',
    sourceFamilyId: 'otf_example_effect',
    sourceIds: [A, B],
    urlAllowlist: [
      { kind: 'exact', canonicalUrl: URL_A },
      { kind: 'exact', canonicalUrl: URL_B },
    ],
    contentTypes: ['text/plain'],
    schemaFamily: 'ots_example_effect',
    policyId: 'otp_example_effect',
    policyVersion: 1,
    requiredFieldPaths: ['effect', 'visaMode'],
    match: () => {
      zaehler.match += 1
      return { ok: true }
    },
    extract: () => {
      zaehler.extract += 1
      return {
        ok: true,
        fact: { kind: 'requirement_effect', effect: 'required', visaMode: null },
        observations: beobachtungenFuer(politik()),
      }
    },
    ...teil,
  }
}

function stuetzen() {
  return [
    { sourceId: A, canonicalUrl: URL_A },
    { sourceId: B, canonicalUrl: URL_B },
  ]
}

function beweisStuetzen() {
  return [
    { versionId: VA, sourceId: A, canonicalUrl: URL_A, sourceContentHash: HASH_A },
    { versionId: VB, sourceId: B, canonicalUrl: URL_B, sourceContentHash: HASH_B },
  ]
}

function schnappschuss(sourceId: string): string {
  return sourceId === B ? SNAP_B : SNAP_A
}

function laufStuetzen(
  contentType: string | null = 'text/plain',
  proof = beweisStuetzen(),
): OfficialTruthCompositionSupport[] {
  return proof.map((support) => ({
    versionId: support.versionId,
    sourceId: support.sourceId,
    retrieval: {
      status: 'server_owned_official_retrieval' as const,
      sourceId: support.sourceId,
      canonicalUrl: support.canonicalUrl,
      retrievedAt: ZEIT,
      contentType,
      sourceSnapshot: schnappschuss(support.sourceId),
      sourceContentHash: support.sourceContentHash,
      redirectCount: 0,
    },
  }))
}

function phaseA(
  policies: readonly OfficialTruthCompositionPolicy[] = [politik()],
  extractors: readonly OfficialTruthExtractorDefinition[] = [extraktor()],
  supports = stuetzen(),
) {
  return officialTruthCompositionPhaseA({
    factKind: 'requirement_effect',
    requirementType: 'health',
    supports,
    extractors,
    policies,
  })
}

function phaseB(
  freeze: OfficialTruthCompositionFreeze,
  teil?: {
    fact?: unknown
    contentType?: string | null
    /** Nur Fixture-Steuerung: so tut der codeeigene Extraktor, als hätte er dies beobachtet. */
    observed?: readonly OfficialTruthExtractorBeobachtung[] | null
    proof?: ReturnType<typeof beweisStuetzen>
    zaehler?: Zaehler
    supports?: readonly OfficialTruthCompositionSupport[]
  },
) {
  const zelle = scope()
  const zaehler = teil?.zaehler ?? { match: 0, extract: 0 }
  const basis = extraktor(zaehler)
  const beobachtungen = teil?.observed === undefined ? beobachtungenFuer(freeze.policy) : teil.observed
  const definition = {
    ...freeze.extractor,
    match: basis.match,
    extract: () => {
      zaehler.extract += 1
      const fact =
        teil?.fact === undefined ? { kind: 'requirement_effect', effect: 'required', visaMode: null } : teil.fact
      return beobachtungen === null ? { ok: true, fact } : { ok: true, fact, observations: beobachtungen }
    },
  }
  const proof = teil?.proof ?? beweisStuetzen()
  return {
    zaehler,
    ergebnis: officialTruthCompositionPhaseB({
      freeze: { ...freeze, extractor: definition },
      supports: teil?.supports ?? laufStuetzen(teil?.contentType ?? 'text/plain', proof),
      proofSupports: proof,
      acceptedVersionIds: proof.map((eintrag) => eintrag.versionId),
      requirementType: 'health',
      scopeKey: zelle.key,
      scope: zelle.scope,
      registry: registry(),
    }),
  }
}

function grund(ergebnis: { ok: boolean; reason?: string }): string | undefined {
  return ergebnis.ok ? undefined : ergebnis.reason
}

describe('Kompositionspolitik-Fundament', () => {
  test('das Produktionsregister ist leer und eingefroren', () => {
    assert.equal(OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY.length, 0)
    assert.equal(Object.isFrozen(OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY), true)
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
    assert.throws(() => {
      ;(OFFICIAL_TRUTH_COMPOSITION_POLICY_REGISTRY as unknown as unknown[]).push(politik())
    })
    assert.equal(phaseA([], []).ok, false)
    assert.equal(grund(phaseA([], [])), 'composition_policy_unavailable')
  })

  test('Aufruferpolitik, falsche und nicht aktuelle Versionen scheitern vor HTTP', () => {
    assert.equal(grund(phaseA([politik()], [extraktor(undefined, { policyId: 'otp_missing_effect' })])), 'composition_policy_unavailable')
    assert.equal(grund(phaseA([politik({ current: false })])), 'policy_version_mismatch')
    assert.equal(
      grund(phaseA([politik({ sourceFamilyId: 'otf_other_effect', policyId: 'otp_other_effect' })], [extraktor(undefined, { policyId: 'otp_other_effect', sourceFamilyId: 'otf_example_effect' })])),
      'policy_version_mismatch',
    )
  })

  test('keine und mehrdeutige Kandidaten laufen ohne Abruf und ohne Medientyp', () => {
    assert.equal(grund(phaseA([politik()], [])), 'composition_policy_unavailable')
    const html = extraktor({ match: 0, extract: 0 }, { extractorId: 'otx_example_html', contentTypes: ['text/html'] })
    const text = extraktor({ match: 0, extract: 0 }, { contentTypes: ['text/plain'] })
    const mehrdeutig = phaseA([politik()], [text, html])
    assert.equal(grund(mehrdeutig), 'ambiguous_policy')
    const geladen = officialTruthCompositionRegistriesPruefen([politik()], [text, html])
    assert.equal(geladen.ok, false)
    if (geladen.ok) return
    assert.equal(geladen.reason, 'duplicate_extractor_match')
  })

  test('zwei Politiken mit demselben Vor-HTTP-Schlüssel und verschiedenem Schema-Pin sind duplicate_policy_match', () => {
    const erste = politik({ applicabilitySchema: null })
    const zweite = politik({
      policyId: 'otp_example_other',
      applicabilitySchema: 1,
      assignments: [
        {
          target: { kind: 'fact_field', fieldPath: 'effect' },
          sourceIds: [A],
          relation: 'single_source',
          role: 'complementary_part',
        },
        {
          target: { kind: 'fact_field', fieldPath: 'visaMode' },
          sourceIds: [B],
          relation: 'single_source',
          role: 'complementary_part',
        },
      ],
    })
    assert.deepEqual(officialTruthCompositionPreHttpKey(erste), {
      ...officialTruthCompositionPreHttpKey(zweite),
      factKind: erste.factKind,
    })
    const geladen = officialTruthCompositionRegistriesPruefen([erste, zweite], [])
    assert.equal(geladen.ok, false)
    if (geladen.ok) return
    assert.equal(geladen.reason, 'duplicate_policy_match')
  })

  test('eine URL außerhalb der einzigen Allowlist scheitert vor HTTP', () => {
    const ergebnis = phaseA([politik()], [extraktor()], [
      { sourceId: A, canonicalUrl: 'https://www.gov.example/other' },
      { sourceId: B, canonicalUrl: URL_B },
    ])
    assert.equal(grund(ergebnis), 'domain_or_path_not_allowlisted')
  })

  test('Medientyp und Schema wählen keine andere Definition', () => {
    const zaehler = { match: 0, extract: 0 }
    const eingefroren = phaseA()
    assert.equal(eingefroren.ok, true)
    if (!eingefroren.ok) return
    const medien = phaseB(eingefroren.freeze, { contentType: 'text/html', zaehler })
    assert.equal(grund(medien.ergebnis), 'content_type_not_allowlisted')
    assert.equal(medien.ergebnis.ok, false)
    if (medien.ergebnis.ok) return
    assert.equal(medien.ergebnis.policyId, 'otp_example_effect')
    assert.equal(medien.zaehler.match, 0)
    const schema = phaseB(eingefroren.freeze, {
      zaehler,
      fact: {
        kind: 'requirement_effect',
        schema: 1,
        applicability: { schema: 1, kind: 'unconditional' },
        effect: 'required',
        visaMode: null,
      },
    })
    assert.equal(grund(schema.ergebnis), 'schema_mismatch')
    if (schema.ergebnis.ok) return
    assert.equal(schema.ergebnis.policyId, eingefroren.freeze.policyId)
    assert.equal(schema.ergebnis.policyVersion, eingefroren.freeze.policyVersion)
    assert.equal(zaehler.extract, 1)
  })

  test('dieselbe Quelle, Wiederholung und Stütz-Permutation', () => {
    const eingefroren = phaseA()
    assert.equal(eingefroren.ok, true)
    if (!eingefroren.ok) return
    const zaehler = { match: 0, extract: 0 }
    const gleicheQuelle = [
      { versionId: VA, sourceId: A, canonicalUrl: URL_A, sourceContentHash: HASH_A },
      { versionId: VB, sourceId: A, canonicalUrl: URL_A, sourceContentHash: HASH_A },
    ]
    const gleich = phaseB(eingefroren.freeze, { zaehler, proof: gleicheQuelle })
    assert.equal(grund(gleich.ergebnis), 'same_source_composition')
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
    const fakt = regelFaktKanonischLesen(
      'requirement_effect',
      'health',
      { kind: 'requirement_effect', effect: 'required', visaMode: null },
      registry(),
    )
    assert.equal(fakt.ok, true)
    if (!fakt.ok) return
    const wiederholt = officialTruthCompositionZitatePruefen({
      freeze: eingefroren.freeze,
      fact: fakt.fact,
      proofSupports: [
        { versionId: VA, sourceId: A, canonicalUrl: URL_A, sourceContentHash: HASH_A },
        { versionId: VB, sourceId: A, canonicalUrl: URL_A, sourceContentHash: HASH_A },
        { versionId: VF, sourceId: B, canonicalUrl: URL_B, sourceContentHash: HASH_B },
      ],
      acceptedVersionIds: [VA, VB, VF],
      observations: beobachtungenFuer(eingefroren.freeze.policy),
    })
    assert.equal(grund(wiederholt), 'ambiguous_structure')
    const vorwaerts = phaseA()
    const rueckwaerts = phaseA([politik()], [extraktor()], [...stuetzen()].reverse())
    assert.equal(vorwaerts.ok && rueckwaerts.ok, true)
    if (!vorwaerts.ok || !rueckwaerts.ok) return
    assert.equal(vorwaerts.freeze.policyId, rueckwaerts.freeze.policyId)
    assert.equal(vorwaerts.freeze.extractorId, rueckwaerts.freeze.extractorId)
  })

  test('ein erfolgreiches Siegel übersteht kein JSON und kein Plain-Object', () => {
    const eingefroren = phaseA()
    assert.equal(eingefroren.ok, true)
    if (!eingefroren.ok) return
    const lauf = phaseB(eingefroren.freeze)
    assert.equal(lauf.ergebnis.ok, true)
    if (!lauf.ergebnis.ok) return
    const sicht = officialTruthCompositionSealView(lauf.ergebnis.seal)
    assert.ok(sicht)
    if (!sicht) return
    assert.equal(sicht.policyId, 'otp_example_effect')
    assert.equal(sicht.policyVersion, 1)
    assert.deepEqual([...sicht.supportVersionIds], [VA, VB].sort())
    assert.equal(isOfficialTruthCompositionSeal(lauf.ergebnis.seal), true)
    assert.equal(isOfficialTruthCompositionSeal(JSON.parse(JSON.stringify(lauf.ergebnis.seal))), false)
    assert.equal(
      isOfficialTruthCompositionSeal({
        fact: sicht.fact,
        policyId: sicht.policyId,
        policyVersion: sicht.policyVersion,
        supportVersionIds: sicht.supportVersionIds,
      }),
      false,
    )
    assert.equal(officialTruthCompositionSealView({ policyId: sicht.policyId }), null)
    const kopie = lauf.ergebnis.provenance.map((eintrag) => ({ ...eintrag, policyVersion: 2 }))
    assert.notEqual(
      officialTruthCompositionProvenanceIdentity(lauf.ergebnis.provenance, sicht.supportVersionIds),
      officialTruthCompositionProvenanceIdentity(kopie, sicht.supportVersionIds),
    )
  })

  test('fehlende Zuweisung, Konflikt und Doppelwert', () => {
    const unvollstaendig = politik({
      assignments: [
        {
          target: { kind: 'fact_field', fieldPath: 'effect' },
          sourceIds: [A],
          relation: 'single_source',
          role: 'complementary_part',
        },
      ],
    })
    const extractor = extraktor(undefined, { requiredFieldPaths: [] })
    const geladen = officialTruthCompositionRegistriesPruefen([unvollstaendig], [extractor])
    assert.equal(geladen.ok, true)
    if (!geladen.ok) return
    const vorab = phaseA(geladen.policies, [...geladen.extractors])
    assert.equal(vorab.ok, true)
    if (!vorab.ok) return
    assert.equal(grund(phaseB(vorab.freeze).ergebnis), 'policy_field_unassigned')

    const gleich = politik({
      assignments: [
        {
          target: { kind: 'fact_field', fieldPath: 'effect' },
          sourceIds: [A, B],
          relation: 'equal_values',
          role: 'equal_values',
        },
        {
          target: { kind: 'fact_field', fieldPath: 'visaMode' },
          sourceIds: [A],
          relation: 'single_source',
          role: 'complementary_part',
        },
      ],
    })
    const konfliktFreeze = phaseA([gleich], [extraktor(undefined, { requiredFieldPaths: ['effect', 'visaMode'] })])
    assert.equal(konfliktFreeze.ok, true)
    if (!konfliktFreeze.ok) return
    const konflikt = phaseB(konfliktFreeze.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('effect'), sourceId: B, canonical: 'not_required' },
      ],
    })
    assert.equal(grund(konflikt.ergebnis), 'conflicting_value')
    const standard = phaseA()
    assert.equal(standard.ok, true)
    if (!standard.ok) return
    const doppelt = phaseB(standard.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('effect'), sourceId: B, canonical: 'required' },
      ],
    })
    assert.equal(grund(doppelt.ergebnis), 'duplicate_value')
    const wiederholteQuelle = phaseB(standard.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('visaMode'), sourceId: B, canonical: 'none' },
      ],
    })
    assert.equal(grund(wiederholteQuelle.ergebnis), 'duplicate_value')
    const fremdesZiel = phaseB(standard.freeze, {
      observed: [
        {
          targetKey: officialTruthCompositionCitationKey({ kind: 'branch', branchId: 'unassigned' }),
          sourceId: A,
          canonical: 'required',
        },
      ],
    })
    assert.equal(grund(fremdesZiel.ergebnis), 'policy_field_unassigned')
  })

  test('CR-2 ohne quellenbezogene Beobachtungen gibt es keinen Erfolgspfad', () => {
    const eingefroren = phaseA()
    assert.equal(eingefroren.ok, true)
    if (!eingefroren.ok) return
    // Der Extraktor liefert gar kein Beobachtungsfeld.
    assert.equal(grund(phaseB(eingefroren.freeze, { observed: null }).ergebnis), 'fact_incomplete')
    // Leere Beobachtungen sind kein Erfolg.
    assert.equal(grund(phaseB(eingefroren.freeze, { observed: [] }).ergebnis), 'fact_incomplete')
    // Eine benannte Quelle fehlt.
    assert.equal(
      grund(
        phaseB(eingefroren.freeze, {
          observed: [{ targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' }],
        }).ergebnis,
      ),
      'fact_incomplete',
    )
    // Eine Quelle außerhalb dieser Ausführung wird vom Rahmen abgewiesen.
    assert.equal(
      grund(
        phaseB(eingefroren.freeze, {
          observed: [
            { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
            { targetKey: zielSchluessel('visaMode'), sourceId: B, canonical: 'none' },
            { targetKey: zielSchluessel('visaMode'), sourceId: 'example-licensed-provider', canonical: 'none' },
          ],
        }).ergebnis,
      ),
      'source_not_allowlisted',
    )
    // Vollständige, übereinstimmende Beobachtungen tragen den Erfolg.
    const erfolg = phaseB(eingefroren.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('visaMode'), sourceId: B, canonical: 'none' },
      ],
    })
    assert.equal(erfolg.ergebnis.ok, true, grund(erfolg.ergebnis))
  })

  test('CR-2 equal_values verlangt Vollständigkeit und Gleichheit', () => {
    const gleich = politik({
      assignments: [
        {
          target: { kind: 'fact_field', fieldPath: 'effect' },
          sourceIds: [A, B],
          relation: 'equal_values',
          role: 'equal_values',
        },
        {
          target: { kind: 'fact_field', fieldPath: 'visaMode' },
          sourceIds: [A],
          relation: 'single_source',
          role: 'complementary_part',
        },
      ],
    })
    const eingefroren = phaseA([gleich], [extraktor(undefined, { requiredFieldPaths: ['effect', 'visaMode'] })])
    assert.equal(eingefroren.ok, true)
    if (!eingefroren.ok) return
    const fehlend = phaseB(eingefroren.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('visaMode'), sourceId: A, canonical: 'none' },
      ],
    })
    assert.equal(grund(fehlend.ergebnis), 'fact_incomplete')
    const einig = phaseB(eingefroren.freeze, {
      observed: [
        { targetKey: zielSchluessel('effect'), sourceId: A, canonical: 'required' },
        { targetKey: zielSchluessel('effect'), sourceId: B, canonical: 'required' },
        { targetKey: zielSchluessel('visaMode'), sourceId: A, canonical: 'none' },
      ],
    })
    assert.equal(einig.ergebnis.ok, true, grund(einig.ergebnis))
  })

  test('CR-3 der gesiegelte Fakt ist tief unveränderlich', () => {
    const verzweigtesFakt = verzweigt({
      expression: atom('visitor', VA),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
    })
    const lauf = schemaLauf(verzweigtesFakt.policy, verzweigtesFakt.fact)
    assert.equal(lauf.ergebnis.ok, true, grund(lauf.ergebnis))
    if (!lauf.ergebnis.ok) return
    const sicht = officialTruthCompositionSealView(lauf.ergebnis.seal)
    assert.ok(sicht)
    if (!sicht) return
    const fact = sicht.fact as unknown as Record<string, unknown>
    assert.equal(Object.isFrozen(fact), true)
    // Mutation auf oberster Ebene wirft und ändert den gebundenen Fakt nicht.
    assert.throws(() => {
      ;(fact as { kind: string }).kind = 'visa_options'
    })
    assert.equal(officialTruthCompositionSealView(lauf.ergebnis.seal)?.fact.kind, 'requirement_effect')
    // Verschachtelte Objekte und Arrays sind ebenfalls eingefroren.
    const anwendbarkeit = fact.applicability as { kind: string; branches: { id: string }[] }
    assert.equal(Object.isFrozen(anwendbarkeit), true)
    assert.equal(Object.isFrozen(anwendbarkeit.branches), true)
    assert.equal(Object.isFrozen(anwendbarkeit.branches[0]), true)
    assert.throws(() => {
      anwendbarkeit.branches.push({ id: 'injected' })
    })
    assert.throws(() => {
      const zweig = anwendbarkeit.branches[0]
      if (zweig) zweig.id = 'injected'
    })
    assert.equal(anwendbarkeit.branches.length, 2)
    assert.equal(officialTruthCompositionSealView(lauf.ergebnis.seal)?.fact, sicht.fact)
    // Die Siegelsicht selbst ist eingefroren und ersetzt nichts.
    assert.equal(Object.isFrozen(sicht), true)
    assert.throws(() => {
      ;(sicht as unknown as { policyId: string }).policyId = 'otp_foreign'
    })
    assert.equal(isOfficialTruthCompositionSeal(lauf.ergebnis.seal), true)
    assert.equal(isOfficialTruthCompositionSeal({ ...sicht }), false)
    assert.equal(officialTruthCompositionSealView({ ...sicht }), null)
    assert.equal(officialTruthCompositionSealView(true), null)
    assert.equal(officialTruthCompositionSealView('ev1_bearer'), null)
  })

  test('CR-1 die Kompositionsschicht führt keinen zweiten Extraktorstapel', () => {
    const text = readFileSync(join(process.cwd(), DATEI), 'utf8')
    assert.equal(text.includes('officialTruthExtractorEingefroreneAusfuehrung'), true)
    assert.equal(text.includes('regelFaktKanonischLesen'), false)
    assert.equal(text.includes('.match('), false)
    assert.equal(text.includes('.extract('), false)
    assert.equal(text.includes('officialTruthExtractorMedienTyp'), false)
    assert.equal(text.includes('OfficialTruthExtractorKontext'), false)
    assert.equal(text.includes('officialTruthExtractorDefinitionenPruefen('), true)
  })

  test('Schema-1-Locators, Stützen und das Siegel bleiben support-stabil', () => {
    const business = atom('business', VA)
    const visitor = atom('visitor', VB)
    const businessKey = regulierungsAusdruckStrukturSchluessel(business)
    const visitorKey = regulierungsAusdruckStrukturSchluessel(visitor)
    const erster = businessKey < visitorKey ? 'business' : 'visitor'
    const locator = (purpose: string) =>
      `branch:exemption/all:${purpose === erster ? 0 : 1}/atom`
    const fakt = verzweigt({
      expression: { op: 'all', operands: [atom('visitor', VB), atom('business', VA)] },
      atoms: [
        { locator: locator('business'), sourceIds: [A] },
        { locator: locator('visitor'), sourceIds: [B] },
      ],
      branchSupports: [VA, VB],
    })
    const lauf = schemaLauf(fakt.policy, fakt.fact)
    assert.equal(lauf.ergebnis.ok, true, grund(lauf.ergebnis))
    const getauscht = verzweigt({
      expression: { op: 'all', operands: [atom('visitor', VA), atom('business', VB)] },
      atoms: [
        { locator: locator('business'), sourceIds: [B] },
        { locator: locator('visitor'), sourceIds: [A] },
      ],
      branchSupports: [VA, VB],
    })
    const nachTausch = schemaLauf(getauscht.policy, getauscht.fact)
    assert.equal(nachTausch.ergebnis.ok, true, grund(nachTausch.ergebnis))
    if (!lauf.ergebnis.ok || !nachTausch.ergebnis.ok) return
    const locators = (rows: readonly { target: { kind: string; atomLocator?: string } }[]) =>
      rows
        .filter((eintrag) => eintrag.target.kind === 'atom')
        .map((eintrag) => eintrag.target.atomLocator)
        .sort()
    assert.deepEqual(locators(lauf.ergebnis.provenance), locators(nachTausch.ergebnis.provenance))

    const nestedBusiness = { op: 'not' as const, operand: atom('business', VA) }
    const nestedVisitor = { op: 'not' as const, operand: atom('visitor', VB) }
    const nestedErster =
      regulierungsAusdruckStrukturSchluessel(nestedBusiness) < regulierungsAusdruckStrukturSchluessel(nestedVisitor)
        ? 'business'
        : 'visitor'
    const nested = verzweigt({
      expression: { op: 'all', operands: [nestedVisitor, nestedBusiness] },
      atoms: [
        {
          locator: `branch:exemption/all:${nestedErster === 'business' ? 0 : 1}/not:0/atom`,
          sourceIds: [A],
        },
        {
          locator: `branch:exemption/all:${nestedErster === 'visitor' ? 0 : 1}/not:0/atom`,
          sourceIds: [B],
        },
      ],
      branchSupports: [VA, VB],
    })
    const nestedLauf = schemaLauf(nested.policy, nested.fact)
    assert.equal(nestedLauf.ergebnis.ok, true, grund(nestedLauf.ergebnis))
    if (!nestedLauf.ergebnis.ok) return
    assert.equal(
      nestedLauf.ergebnis.provenance.some((eintrag) => eintrag.target.kind === 'atom' && eintrag.target.atomLocator === 'branch:exemption/all:0/not:0/atom'),
      true,
    )

    const tie = verzweigt({
      expression: { op: 'all', operands: [atom('visitor', VA), atom('visitor', VB)] },
      atoms: [
        { locator: 'branch:exemption/all:tie:0:0/atom', sourceIds: [A] },
        { locator: 'branch:exemption/all:tie:0:1/atom', sourceIds: [B] },
      ],
      branchSupports: [VA, VB],
    })
    assert.equal(schemaLauf(tie.policy, tie.fact).ergebnis.ok, true)

    const ausgelassen = verzweigt({
      expression: { op: 'all', operands: [atom('visitor'), atom('visitor', VB)] },
      atoms: [
        { locator: 'branch:exemption/all:tie:0:0/atom', sourceIds: [A] },
        { locator: 'branch:exemption/all:tie:0:1/atom', sourceIds: [B] },
      ],
      branchSupports: [VA, VB],
    })
    assert.equal(grund(schemaLauf(ausgelassen.policy, ausgelassen.fact).ergebnis), 'condition_provenance_ambiguous')

    const behaelter = verzweigt({
      expression: {
        op: 'all',
        operands: [
          { op: 'not', operand: atom('visitor', VA) },
          { op: 'not', operand: atom('visitor', VB) },
        ],
      },
      atoms: [{ locator: 'branch:exemption/all:0/not:0/atom', sourceIds: [A] }],
    })
    assert.equal(grund(schemaLauf(behaelter.policy, behaelter.fact).ergebnis), 'atom_locator_duplicate')
  })

  test('Zitatfehler bleiben geschlossen', () => {
    const leer = verzweigt({
      expression: atom('visitor', VA),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
      branchSupports: [],
      otherwiseSupports: [VA, VB],
    })
    assert.equal(grund(schemaLauf(leer.policy, leer.fact).ergebnis), 'support_mismatch')

    const unvollstaendig = verzweigt({
      expression: atom('visitor', VA),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
      branchSupports: [VA],
      otherwiseSupports: [VA],
    })
    assert.equal(grund(schemaLauf(unvollstaendig.policy, unvollstaendig.fact).ergebnis), 'support_mismatch')

    const ausserhalb = verzweigt({
      expression: atom('visitor', VB),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [B] }],
      branchSupports: [VA],
      otherwiseSupports: [VB],
    })
    assert.equal(grund(schemaLauf(ausserhalb.policy, ausserhalb.fact).ergebnis), 'support_mismatch')

    const fremd = verzweigt({
      expression: atom('visitor', VF),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
      branchSupports: [VF],
      otherwiseSupports: [VB],
    })
    assert.equal(grund(schemaLauf(fremd.policy, fremd.fact).ergebnis), 'support_mismatch')

    const mehrfach = verzweigt({
      expression: atom('visitor'),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
      branchSupports: [VA, VB],
      otherwiseSupports: [VB],
    })
    assert.equal(grund(schemaLauf(mehrfach.policy, mehrfach.fact).ergebnis), 'condition_provenance_ambiguous')

    const fehlt = verzweigt({
      expression: atom('visitor', VA),
      atoms: [],
      branchSupports: [VA],
    })
    assert.equal(grund(schemaLauf(fehlt.policy, fehlt.fact).ergebnis), 'atom_locator_unassigned')

    const alt = verzweigt({
      expression: atom('visitor', VA),
      atoms: [
        { locator: 'branch:exemption/atom', sourceIds: [A] },
        { locator: 'branch:exemption/not:0/atom', sourceIds: [A] },
      ],
      branchSupports: [VA],
    })
    assert.equal(grund(schemaLauf(alt.policy, alt.fact).ergebnis), 'atom_locator_missing')

    const marker = verzweigt({
      expression: atom('visitor', VA),
      atoms: [{ locator: 'branch:exemption/atom', sourceIds: [A] }],
    })
    const mitSchluessel = schemaLauf(marker.policy, { ...marker.fact, atomLocator: 'branch:exemption/atom' })
    assert.equal(grund(mitSchluessel.ergebnis), 'unexpected_fields')
  })

  test('kein Prädikat, keine Annahme, kein Speicher und kein Netz', () => {
    const text = readFileSync(join(process.cwd(), DATEI), 'utf8')
    assert.match(text, /import 'server-only'/)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('official-truth-store'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('supabase'), false)
    assert.equal(text.includes('fetch('), false)
    assert.equal(text.includes('process.env'), false)
    assert.doesNotMatch(text, /openai|anthropic|gov\.uk|ica\.gov/i)
    const mitPraedikat = officialTruthCompositionRegistriesPruefen(
      [{ ...politik(), predicate: { kind: 'travel_purpose', purpose: 'visitor' } }],
      [],
    )
    assert.equal(mitPraedikat.ok, false)
    if (mitPraedikat.ok) return
    assert.equal(mitPraedikat.reason, 'invalid_policy_definition')
  })
})

function bezug(
  sourceIds: readonly string[],
  einzelneRolle: OfficialTruthCompositionPolicy['assignments'][number]['role'],
): Pick<OfficialTruthCompositionPolicy['assignments'][number], 'sourceIds' | 'relation' | 'role'> {
  const ids = [...new Set(sourceIds)].sort()
  if (ids.length >= 2) return { sourceIds: ids, relation: 'equal_values', role: 'equal_values' }
  return { sourceIds: ids.length === 0 ? [A] : ids, relation: 'single_source', role: einzelneRolle }
}

function quelleFuer(id: string): string {
  return id === VB ? B : A
}

function verzweigt(input: {
  expression: RegulierungsAusdruck
  atoms: { locator: string; sourceIds: string[] }[]
  branchSupports?: string[]
  otherwiseSupports?: string[]
}): { policy: OfficialTruthCompositionPolicy; fact: Record<string, unknown> } {
  const branchSupports = input.branchSupports ?? [VA]
  const otherwiseSupports = input.otherwiseSupports ?? [VB]
  const zweigQuellen = [...new Set(branchSupports.map(quelleFuer))]
  const sonstQuellen = [...new Set((otherwiseSupports.length === 0 ? [VB] : otherwiseSupports).map(quelleFuer))]
  const assignments: OfficialTruthCompositionPolicy['assignments'] = [
    {
      target: { kind: 'branch', branchId: 'exemption' },
      ...bezug(zweigQuellen, 'exception'),
    },
    {
      target: { kind: 'branch_outcome', branchId: 'exemption', field: 'effect' },
      ...bezug([zweigQuellen[0] ?? A], 'exception'),
    },
    {
      target: { kind: 'branch_outcome', branchId: 'exemption', field: 'visaMode' },
      ...bezug([zweigQuellen[0] ?? A], 'exception'),
    },
    ...input.atoms.map((eintrag) => ({
      target: { kind: 'atom' as const, branchId: 'exemption', atomLocator: eintrag.locator },
      ...bezug(eintrag.sourceIds, 'exception'),
    })),
    {
      target: { kind: 'otherwise', branchId: 'residual' },
      ...bezug(sonstQuellen, 'general_rule'),
    },
  ]
  const policy = politik({
    applicabilitySchema: 1,
    sourceIds: [A, B],
    assignments,
  })
  const fact = {
    kind: 'requirement_effect',
    schema: 1,
    applicability: {
      schema: 1,
      kind: 'branches',
      branches: [
        {
          id: 'exemption',
          when: { kind: 'expression', expression: input.expression },
          outcome: { effect: 'not_required', visaMode: null },
          supportVersionIds: branchSupports,
        },
        {
          id: 'residual',
          when: { kind: 'otherwise' },
          outcome: { effect: 'required', visaMode: null },
          supportVersionIds: otherwiseSupports,
        },
      ],
    },
  }
  return { policy, fact }
}

function schemaLauf(policy: OfficialTruthCompositionPolicy, fact: Record<string, unknown>) {
  const definition = extraktor({ match: 0, extract: 0 }, { requiredFieldPaths: [], policyVersion: policy.policyVersion, policyId: policy.policyId })
  const geladen = officialTruthCompositionRegistriesPruefen([policy], [definition])
  if (!geladen.ok) assert.fail(geladen.reason)
  const vorab = officialTruthCompositionPhaseA({
    factKind: 'requirement_effect',
    requirementType: 'health',
    supports: stuetzen(),
    extractors: [...geladen.extractors],
    policies: geladen.policies,
  })
  if (!vorab.ok) assert.fail(vorab.reason)
  return phaseB(vorab.freeze, { fact })
}
