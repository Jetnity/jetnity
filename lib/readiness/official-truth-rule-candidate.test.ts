import { r2Registry } from './official-truth-content-identity-r2.test'
// lib/readiness/official-truth-rule-candidate.test.ts
//
// Regel-Kandidat nur aus bereits angenommener amtlicher Evidence.
// Synthetische .example-Quellen. Keine Annahme, kein Speicher, kein Netz.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  akzeptierteEvidenceLesen,
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import { officialTruthRegelKandidatAusEvidence } from '@/lib/readiness/official-truth-rule-candidate'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { regelKandidatErstellen, regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const ABGERUFEN = '2026-10-01T12:00:00.000Z'
const VORSCHLAG = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' } as const

const PERSONEN_FELDER = [
  'userId',
  'user_id',
  'accountId',
  'account_id',
  'tripId',
  'trip_id',
  'travellerId',
  'travellerClientRef',
  'traveller_client_ref',
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
  'birth_date',
  'healthRecord',
  'health',
  'diagnosis',
  'email',
  'fullName',
  'givenName',
  'familyName',
  'phone',
  'scan',
  'documentScan',
  'travellerNote',
  'traveller_note',
  'note',
  'comment',
  'freeText',
  'freeform',
] as const

function datei(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function registry(): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen([
    {
      sourceId: 'example-border-authority',
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['gov.example'],
    },
    {
      sourceId: 'example-interior-authority',
      sourceClass: 'official_authority',
      publisherName: 'Example Interior Authority',
      authorityName: 'Example Interior Authority',
      domains: ['interior.example'],
    },
    {
      sourceId: 'example-licensed-provider',
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Licensed Publisher',
      domains: ['provider.example'],
    },
  ])
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) throw new Error('registry')
  return r2Registry(ergebnis.registry, R2_PUBLICATIONS)
}

function atom(teil?: Record<string, unknown>) {
  return {
    sourceId: 'example-border-authority',
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

function rohversion(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
): EvidenceVersion {
  const erzeugt = evidenceKandidatAusModell(
    { scope: { ...scope, sourceId } },
    { contentType: 'text/plain',
      canonicalUrl: `https://www.${host}/rules/visa`,
      retrievedAt: ABGERUFEN,
      sourceSnapshot: snapshot,
    },
    basis,
  )
  assert.equal(erzeugt.ok, true, erzeugt.ok ? '' : erzeugt.reason)
  if (!erzeugt.ok) throw new Error('kandidat')
  return erzeugt.evidence
}

function version(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
): EvidenceVersion {
  const source = basis.sources.find((entry) => entry.sourceId === sourceId)
  if (source?.sourceClass === 'licensed_evidence_provider') {
    const official = version(basis, 'example-border-authority', 'gov.example', snapshot, atom())
    // Deliberately forged provider identity: the R2 reader must reject it.
    return { ...official, ...source, canonicalUrl: `https://www.${host}/rules/visa`, scope: { ...official.scope, sourceId } }
  }

  const evidence = rohversion(basis, sourceId, host, snapshot, scope)
  const akzeptiert = evidenceKandidatAkzeptieren(evidence, basis)
  assert.equal(akzeptiert.ok, true, akzeptiert.ok ? '' : akzeptiert.reason)
  if (!akzeptiert.ok) throw new Error('akzeptanz')
  return akzeptiert.evidence
}

function meta(teil?: Record<string, unknown>) {
  return {
    factKind: 'requirement_effect',
    evidenceQuality: 'explicit_primary_statement',
    proposal: VORSCHLAG,
    ...teil,
  }
}

describe('Official Truth accepted Evidence rule candidate', () => {
  test('eine angenommene amtliche Evidence und ein expliziter Vorschlag bleiben candidate/pending', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'visa seite')
    const zelle = regelScopeAusEvidenceScope(belegt.scope)
    assert.equal(zelle.ok, true)
    if (!zelle.ok) return
    const versionen = Object.freeze([belegt])
    const vorschlag = Object.freeze(meta())
    const vorherVersionen = JSON.stringify(versionen)
    const vorherRegistry = JSON.stringify(basis)
    const vorherMeta = JSON.stringify(vorschlag)

    const ergebnis = officialTruthRegelKandidatAusEvidence(versionen, basis, vorschlag)
    const direkt = regelKandidatErstellen(
      {
        scope: belegt.scope,
        factKind: 'requirement_effect',
        evidenceQuality: 'explicit_primary_statement',
        supportVersionIds: [belegt.versionId],
        proposal: VORSCHLAG,
      },
      basis,
    )

    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok || !direkt.ok) return
    assert.deepEqual(ergebnis, direkt)
    assert.equal(ergebnis.kandidat.lifecycle, 'candidate')
    assert.equal(ergebnis.kandidat.validationState, 'pending')
    assert.equal(ergebnis.kandidat.key, zelle.key)
    assert.deepEqual(ergebnis.kandidat.scope, zelle.scope)
    assert.equal('sourceId' in ergebnis.kandidat.scope, false)
    assert.deepEqual(ergebnis.kandidat.supportVersionIds, [belegt.versionId])
    assert.equal(ergebnis.kandidat.factKind, 'requirement_effect')
    assert.equal(ergebnis.kandidat.evidenceQuality, 'explicit_primary_statement')
    assert.deepEqual(ergebnis.kandidat.proposal, VORSCHLAG)
    assert.deepEqual(
      ergebnis.kandidat.scope.citizenship.mode === 'required' ? ergebnis.kandidat.scope.citizenship.countryCodes : [],
      ['CH', 'RS'],
    )
    assert.equal(ergebnis.kandidat.scope.credentialOption.mode, 'option')
    if (ergebnis.kandidat.scope.credentialOption.mode !== 'option') return
    assert.equal(ergebnis.kandidat.scope.credentialOption.issuingCountryCode, 'CH')
    assert.equal(ergebnis.kandidat.scope.credentialOption.relatedCitizenshipCountryCode, 'CH')
    assert.equal(ergebnis.kandidat.scope.destinationCountryCode, 'JP')
    assert.equal(ergebnis.kandidat.scope.transitCountryCode, null)
    assert.equal(ergebnis.kandidat.scope.residence.mode, 'not_applicable')
    assert.equal(JSON.stringify(versionen), vorherVersionen)
    assert.equal(JSON.stringify(basis), vorherRegistry)
    assert.equal(JSON.stringify(vorschlag), vorherMeta)
    assert.equal(Object.isFrozen(belegt), false)
    assert.equal(Object.isFrozen(vorschlag), true)
  })

  test('zwei amtliche Quellen und ein zusammengesetzter Vorschlag behalten sortierte Stütz-IDs', () => {
    const basis = registry()
    const grenze = version(basis, 'example-border-authority', 'gov.example', 'seite grenze')
    const inneres = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'seite inneres',
      atom({ sourceId: 'example-interior-authority' }),
    )
    assert.notEqual(grenze.sourceId, inneres.sourceId)
    const versionen = [inneres, grenze]
    const vorher = JSON.stringify(versionen)
    const vorschlag = meta({ evidenceQuality: 'composed_from_multiple_primary_sources' })
    const ergebnis = officialTruthRegelKandidatAusEvidence(versionen, basis, vorschlag)
    const erwartet = [grenze.versionId, inneres.versionId].sort()

    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.kandidat.lifecycle, 'candidate')
    assert.equal(ergebnis.kandidat.validationState, 'pending')
    assert.equal(ergebnis.kandidat.evidenceQuality, 'composed_from_multiple_primary_sources')
    assert.deepEqual(ergebnis.kandidat.supportVersionIds, erwartet)
    assert.deepEqual([...versionen].map((eintrag) => eintrag.versionId), [inneres.versionId, grenze.versionId])
    assert.equal(JSON.stringify(versionen), vorher)
    const quellen = new Map(versionen.map((eintrag) => [eintrag.versionId, eintrag.sourceId]))
    assert.deepEqual(
      ergebnis.kandidat.supportVersionIds.map((id) => quellen.get(id)),
      erwartet.map((id) => quellen.get(id)),
    )
    assert.equal(new Set(ergebnis.kandidat.supportVersionIds.map((id) => quellen.get(id))).size, 2)

    const zuWenig = officialTruthRegelKandidatAusEvidence(
      [grenze],
      basis,
      meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    )
    assert.deepEqual(zuWenig, { ok: false, reason: 'insufficient_support' })

    const gleicheQuelle = version(basis, 'example-border-authority', 'gov.example', 'seite nochmal')
    const konstrukt = regelKandidatErstellen(
      {
        scope: grenze.scope,
        factKind: 'requirement_effect',
        evidenceQuality: 'composed_from_multiple_primary_sources',
        supportVersionIds: [grenze.versionId, gleicheQuelle.versionId],
        proposal: VORSCHLAG,
      },
      basis,
    )
    assert.equal(konstrukt.ok, true)
    const gleiche = officialTruthRegelKandidatAusEvidence(
      [grenze, gleicheQuelle],
      basis,
      meta({ evidenceQuality: 'composed_from_multiple_primary_sources' }),
    )
    assert.deepEqual(gleiche, { ok: false, reason: 'same_content_item_composition' })
    assert.equal('kandidat' in gleiche, false)
  })

  test('Evidence im Kandidatenstatus wird nicht zur Stütze', () => {
    const basis = registry()
    const offen = rohversion(basis, 'example-border-authority', 'gov.example', 'noch nicht angenommen')
    assert.equal(offen.lifecycle, 'candidate')
    assert.equal(akzeptierteEvidenceLesen(offen, basis), null)
    const ergebnis = officialTruthRegelKandidatAusEvidence([offen], basis, meta())
    assert.deepEqual(ergebnis, { ok: false, reason: 'evidence_not_accepted' })
  })

  test('lizenzierte Evidence wird nicht zur amtlichen Stütze', () => {
    const basis = registry()
    const anbieter = version(
      basis,
      'example-licensed-provider',
      'provider.example',
      'lizenzierter text',
      atom({ sourceId: 'example-licensed-provider' }),
    )
    assert.equal(anbieter.sourceClass, 'licensed_evidence_provider')
    assert.equal(akzeptierteEvidenceLesen(anbieter, basis), null)
    const ergebnis = officialTruthRegelKandidatAusEvidence([anbieter], basis, meta())
    assert.deepEqual(ergebnis, { ok: false, reason: 'evidence_not_accepted' })
  })

  test('eine andere Credential-Option bleibt eine andere Zelle', () => {
    const basis = registry()
    const schweiz = version(basis, 'example-border-authority', 'gov.example', 'pass ch')
    const serbien = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'pass rs',
      atom({
        sourceId: 'example-interior-authority',
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          relatedCitizenshipCountryCode: 'RS',
        },
      }),
    )
    assert.equal(schweiz.scope.citizenship.mode, 'required')
    assert.equal(serbien.scope.citizenship.mode, 'required')
    if (schweiz.scope.citizenship.mode !== 'required' || serbien.scope.citizenship.mode !== 'required') return
    assert.deepEqual(schweiz.scope.citizenship.countryCodes, ['CH', 'RS'])
    assert.deepEqual(serbien.scope.citizenship.countryCodes, ['CH', 'RS'])
    const ergebnis = officialTruthRegelKandidatAusEvidence([schweiz, serbien], basis, meta())
    assert.deepEqual(ergebnis, { ok: false, reason: 'scope_mismatch' })
    assert.equal(JSON.stringify(ergebnis).includes('RS'), false)
  })

  test('dieselbe Stütze zweimal wird abgelehnt und die Eingabe bleibt unverändert', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'doppelt')
    const versionen = [belegt, belegt]
    const vorher = JSON.stringify(versionen)
    const ergebnis = officialTruthRegelKandidatAusEvidence(versionen, basis, meta())
    assert.deepEqual(ergebnis, { ok: false, reason: 'support_mismatch' })
    assert.equal(JSON.stringify(versionen), vorher)
    assert.deepEqual(officialTruthRegelKandidatAusEvidence([], basis, meta()), { ok: false, reason: 'invalid_support' })
  })

  test('Aufrufer-Scope, Schlüssel, Stützen, Lebenszyklus und trustedRuleFact werden nicht übernommen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'aufrufer')
    const zelle = regelScopeAusEvidenceScope(belegt.scope)
    assert.equal(zelle.ok, true)
    if (!zelle.ok) return
    const marker = 'TRUSTED-MARKER-SHOULD-NOT-ECHO'
    const felder: Record<string, unknown> = {
      scope: belegt.scope,
      key: zelle.key,
      supportVersionIds: [belegt.versionId],
      lifecycle: 'candidate',
      validationState: 'pending',
      trustedRuleFact: { marker, effect: 'not_required' },
    }
    for (const [feld, wert] of Object.entries(felder)) {
      const ergebnis = officialTruthRegelKandidatAusEvidence([belegt], basis, meta({ [feld]: wert }))
      assert.deepEqual(ergebnis, { ok: false, reason: 'unexpected_fields' }, feld)
      assert.equal(JSON.stringify(ergebnis).includes(marker), false, feld)
      assert.equal(JSON.stringify(ergebnis).includes(feld), false, feld)
    }

    const geheim = 'P-SHOULD-NOT-ECHO'
    for (const feld of PERSONEN_FELDER) {
      const ergebnis = officialTruthRegelKandidatAusEvidence([belegt], basis, meta({ [feld]: geheim }))
      assert.deepEqual(ergebnis, { ok: false, reason: 'personal_identifier_forbidden' }, feld)
      assert.equal(JSON.stringify(ergebnis).includes(geheim), false, feld)
      assert.equal(JSON.stringify(ergebnis).includes(feld), false, feld)
    }
    const verschachtelt = officialTruthRegelKandidatAusEvidence(
      [belegt],
      basis,
      meta({ proposal: { ...VORSCHLAG, passportNumber: geheim } }),
    )
    assert.deepEqual(verschachtelt, { ok: false, reason: 'personal_identifier_forbidden' })
    assert.equal(JSON.stringify(verschachtelt).includes(geheim), false)
  })

  test('eine Forschungslücke mit Vorschlag scheitert und erfindet keine Wirkung', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'luecke')
    const ergebnis = officialTruthRegelKandidatAusEvidence(
      [belegt],
      basis,
      meta({ evidenceQuality: 'research_gap', proposal: VORSCHLAG }),
    )
    assert.deepEqual(ergebnis, { ok: false, reason: 'research_gap_proposal_forbidden' })
    assert.equal(JSON.stringify(ergebnis).includes('electronic_visa'), false)
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
  })

  test('stale, Konflikt und Lücke bleiben Kandidaten und werden hier nicht angenommen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'offen')
    const zweite = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'offen zwei',
      atom({ sourceId: 'example-interior-authority' }),
    )
    const faelle = [
      { evidenceQuality: 'stale_primary_evidence', versionen: [belegt], proposal: VORSCHLAG },
      { evidenceQuality: 'unresolved_conflict', versionen: [belegt, zweite], proposal: VORSCHLAG },
      { evidenceQuality: 'research_gap', versionen: [belegt], proposal: null },
    ] as const
    for (const fall of faelle) {
      const ergebnis = officialTruthRegelKandidatAusEvidence(
        fall.versionen,
        basis,
        meta({ evidenceQuality: fall.evidenceQuality, proposal: fall.proposal }),
      )
      assert.equal(ergebnis.ok, true, fall.evidenceQuality)
      if (!ergebnis.ok) return
      assert.equal(ergebnis.kandidat.lifecycle, 'candidate', fall.evidenceQuality)
      assert.equal(ergebnis.kandidat.validationState, 'pending', fall.evidenceQuality)
      assert.equal(ergebnis.kandidat.evidenceQuality, fall.evidenceQuality)
      assert.notEqual(ergebnis.kandidat.evidenceQuality, 'explicit_primary_statement')
      assert.notEqual(ergebnis.kandidat.evidenceQuality, 'composed_from_multiple_primary_sources')
      assert.equal(JSON.stringify(ergebnis).includes('"lifecycle":"accepted"'), false, fall.evidenceQuality)
      if (fall.evidenceQuality === 'research_gap') {
        assert.equal(ergebnis.kandidat.proposal, null)
        assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
        assert.equal(JSON.stringify(ergebnis).includes('electronic_visa'), false)
      }
    }
  })

  test('die Brücke ruft keine Annahme, keinen Speicher und kein Modell auf', () => {
    const text = datei('lib/readiness/official-truth-rule-candidate.ts')
    assert.match(text, /akzeptierteEvidenceLesen\(/)
    assert.match(text, /regelScopeAusEvidenceScope\(/)
    assert.match(text, /regelKandidatErstellen\(/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren/)
    assert.doesNotMatch(text, /evidenceKandidatAkzeptieren|evidenceKandidatAusModell/)
    assert.doesNotMatch(text, /trustedRuleFact\s*:/)
    assert.doesNotMatch(text, /lifecycle\s*:\s*'candidate'|validationState\s*:\s*'pending'/)
    assert.doesNotMatch(text, /not_required/)
    assert.doesNotMatch(text, /official_truth_store_accepted_v1|official_truth_source_catalog_v1/)
    assert.doesNotMatch(text, /requirementsProviderAus/)
    assert.doesNotMatch(
      text,
      /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server|official-truth-source-catalog-server|official-truth-candidate-batch)'/,
    )
    assert.doesNotMatch(text, /supabase|openai|Date\.now|new Date\(|fetch\(|node:fs|node:http|node:net/i)
    for (const relativ of ['lib/readiness/evidence.ts', 'lib/readiness/rule-claims.ts', 'lib/readiness/source-registry.ts']) {
      assert.doesNotMatch(datei(relativ), /official-truth-rule-candidate/, relativ)
    }
    assert.equal(requirementsProviderAus(), null)
  })
})

// Explicit synthetic v2 publications; no production registration.
const R2_PUBLICATIONS = [
  "https://www.gov.example/rules/visa",
  "https://www.interior.example/rules/visa",] as const
