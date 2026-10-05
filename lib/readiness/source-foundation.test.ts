import { r2Registry } from './official-truth-content-identity-r2.test'
// lib/readiness/source-foundation.test.ts
//
// Official Truth source/evidence foundation.
// Keine zweite Engine, kein Netz, kein echter Behördenkatalog.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  EVIDENCE_LIFECYCLES,
  EVIDENCE_VALIDATION_STATES,
  akzeptierteEvidenceLesen,
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  evidenceKonfliktHalten,
  evidenceQuellenFingerprint,
  evidenceSuchschluessel,
  evidenceSuchschluesselListe,
  evidenceVersionenVergleichen,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  QUELLEN_KLASSEN,
  domaeneNormalisieren,
  leereQuellenRegistry,
  quellenRegistryErstellen,
  quellenUrlAufloesen,
  type QuellenRegistry,
  type RegistrierteQuelle,
} from '@/lib/readiness/source-registry'
import { quellenRouten, type QuellenAbdeckung, type QuellenDeskriptor } from '@/lib/readiness/source-router'

const ABGERUFEN = '2026-10-01T12:00:00.000Z'
const QUELLE = 'https://www.gov.example/rules/visa'
const SNAPSHOT = 'synthetic official page alpha'

function registry(): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen([
    {
      sourceId: 'example-border-authority',
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['GOV.EXAMPLE'],
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
    citizenship: { mode: 'independent' },
    residence: { mode: 'independent' },
    documents: { mode: 'independent' },
    ...teil,
  }
}

function deskriptor(basis: QuellenRegistry, sourceId: string, coverage: QuellenAbdeckung): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage }
}

function option(issuingCountryCode: string, relatedCitizenshipCountryCode: string | null) {
  return {
    documentType: 'passport',
    issuingCountryCode,
    relatedCitizenshipCountryCode,
  }
}

function atom(teil?: Record<string, unknown>) {
  return {
    sourceId: 'example-border-authority',
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    credentialOption: { mode: 'option', ...option('CH', 'CH') },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
    ...teil,
  }
}

function rahmen(teil?: Record<string, unknown>) {
  return {
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] },
    credentialOptions: {
      mode: 'required',
      options: [option('CH', 'CH'), option('RS', 'RS')],
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
    ...teil,
  }
}

function modellEingabe(scope: Record<string, unknown> = atom(), extractionNote?: string) {
  return {
    extractionNote,
    scope,
  }
}

function material(teil?: Partial<{ canonicalUrl: string; retrievedAt: string; sourceSnapshot: string }>) {
  return { contentType: 'text/plain',
    canonicalUrl: QUELLE,
    retrievedAt: ABGERUFEN,
    sourceSnapshot: SNAPSHOT,
    ...teil,
  }
}

function kandidat(
  basis: QuellenRegistry,
  sourceSnapshot = SNAPSHOT,
  scope: Record<string, unknown> = atom(),
  extractionNote?: string,
) {
  return evidenceKandidatAusModell(modellEingabe(scope, extractionNote), material({ sourceSnapshot }), basis)
}

function angenommen(
  basis: QuellenRegistry,
  sourceSnapshot = SNAPSHOT,
  scope?: Record<string, unknown>,
  extractionNote?: string,
): EvidenceVersion {
  const erzeugt = kandidat(basis, sourceSnapshot, scope, extractionNote)
  assert.equal(erzeugt.ok, true)
  if (!erzeugt.ok) throw new Error('kandidat')
  const akzeptiert = evidenceKandidatAkzeptieren(erzeugt.evidence, basis)
  assert.equal(akzeptiert.ok, true)
  if (!akzeptiert.ok) throw new Error('akzeptanz')
  return akzeptiert.evidence
}

function paare(entries: readonly { canonical: string }[]) {
  return entries
    .map((eintrag) => {
      const kanonisch = JSON.parse(eintrag.canonical) as {
        citizenshipCountryCodes: string[]
        issuingCountryCode: string | null
        relatedCitizenshipCountryCode: string | null
        relation: string
      }
      return {
        citizenships: kanonisch.citizenshipCountryCodes.join(','),
        pair: `${kanonisch.relatedCitizenshipCountryCode ?? 'unlinked'}:${kanonisch.issuingCountryCode}`,
        relation: kanonisch.relation,
      }
    })
    .sort((links, rechts) => (links.pair < rechts.pair ? -1 : links.pair > rechts.pair ? 1 : 0))
}

describe('Official Truth source/evidence foundation', () => {
  test('Behörden- und Anbieterklasse bleiben getrennt', () => {
    assert.deepEqual([...QUELLEN_KLASSEN], ['official_authority', 'licensed_evidence_provider'])
    assert.deepEqual([...EVIDENCE_LIFECYCLES], ['candidate', 'accepted', 'conflicted', 'superseded'])
    assert.deepEqual([...EVIDENCE_VALIDATION_STATES], ['pending', 'valid', 'rejected'])

    const basis = registry()
    const behoerde = quelle(basis, 'example-border-authority')
    const anbieter = quelle(basis, 'example-licensed-provider')
    assert.equal(behoerde.sourceClass, 'official_authority')
    assert.equal(behoerde.authorityName, 'Example Border Authority')
    assert.equal(anbieter.sourceClass, 'licensed_evidence_provider')
    assert.equal(anbieter.authorityName, null)
    assert.equal(anbieter.publisherName, 'Example Licensed Publisher')
    assert.notEqual(anbieter.publisherName, anbieter.authorityName)

    const mitAuthority = quellenRegistryErstellen([
      {
        sourceId: 'example-licensed-provider',
        sourceClass: 'licensed_evidence_provider',
        publisherName: 'Example Licensed Publisher',
        authorityName: 'Example Border Authority',
        domains: ['provider.example'],
      },
    ])
    assert.deepEqual(mitAuthority, { ok: false, reason: 'provider_is_not_authority' })

    const ohneAuthority = quellenRegistryErstellen([
      {
        sourceId: 'example-border-authority',
        sourceClass: 'official_authority',
        publisherName: 'Example Border Authority',
        domains: ['gov.example'],
      },
    ])
    assert.deepEqual(ohneAuthority, { ok: false, reason: 'authority_required' })
  })

  test('ungültige, unsichere, credential- und unregistrierte URLs scheitern geschlossen', () => {
    assert.equal(domaeneNormalisieren('https://gov.example/path'), null)
    assert.equal(domaeneNormalisieren('GOV.EXAMPLE'), 'gov.example')
    assert.equal(domaeneNormalisieren('user:pass@gov.example'), null)

    const basis = registry()
    assert.equal(quellenUrlAufloesen(basis, 'http://gov.example/rules').ok, false)
    assert.deepEqual(quellenUrlAufloesen(basis, 'http://gov.example/rules'), { ok: false, reason: 'insecure_scheme' })
    assert.deepEqual(quellenUrlAufloesen(basis, 'https://user:pass@gov.example/rules'), { ok: false, reason: 'credentials' })
    assert.deepEqual(quellenUrlAufloesen(basis, 'https://evil.example/rules'), { ok: false, reason: 'unregistered_domain' })
    assert.deepEqual(quellenUrlAufloesen(basis, 'https://notgov.example/rules'), { ok: false, reason: 'unregistered_domain' })
    assert.equal(quellenUrlAufloesen(basis, 'https://www.gov.example/rules').ok, true)

    const gesperrt = quellenRegistryErstellen(
      [
        {
          sourceId: 'example-border-authority',
          sourceClass: 'official_authority',
          publisherName: 'Example Border Authority',
          authorityName: 'Example Border Authority',
          domains: ['gov.example'],
        },
      ],
      { blockedDomains: ['blocked.example'] },
    )
    assert.equal(gesperrt.ok, true)
    if (!gesperrt.ok) return
    assert.deepEqual(quellenUrlAufloesen(gesperrt.registry, 'https://www.blocked.example/rules'), {
      ok: false,
      reason: 'blocked_domain',
    })

    const httpKandidat = evidenceKandidatAusModell(
      modellEingabe(),
      material({ canonicalUrl: 'http://gov.example/rules' }),
      basis,
    )
    assert.deepEqual(httpKandidat, { ok: false, reason: 'insecure_scheme' })
    const credentialKandidat = evidenceKandidatAusModell(
      modellEingabe(),
      material({ canonicalUrl: 'https://user:pass@gov.example/rules' }),
      basis,
    )
    assert.deepEqual(credentialKandidat, { ok: false, reason: 'credentials' })
  })

  test('ein Kandidat ist keine akzeptierte Evidence und Modellentscheidungen werden nicht übernommen', () => {
    const basis = registry()
    const erzeugt = kandidat(basis)
    assert.equal(erzeugt.ok, true)
    if (!erzeugt.ok) return
    assert.equal(erzeugt.evidence.lifecycle, 'candidate')
    assert.equal(erzeugt.evidence.validationState, 'pending')
    assert.equal(akzeptierteEvidenceLesen(erzeugt.evidence, basis), null)
    assert.equal(JSON.stringify(erzeugt.evidence).includes('not_required'), false)

    const nurLifecycle = { ...erzeugt.evidence, lifecycle: 'accepted' as const }
    assert.equal(akzeptierteEvidenceLesen(nurLifecycle, basis), null)

    const akzeptiert = evidenceKandidatAkzeptieren(erzeugt.evidence, basis)
    assert.equal(akzeptiert.ok, true)
    if (!akzeptiert.ok) return
    assert.equal(akzeptiert.evidence.lifecycle, 'accepted')
    assert.equal(akzeptierteEvidenceLesen(akzeptiert.evidence, basis)?.versionId, akzeptiert.evidence.versionId)
    assert.equal(evidenceKandidatAkzeptieren(akzeptiert.evidence, basis).ok, false)

    for (const feld of ['result', 'visaMode', 'optionEligibility', 'optionMandate'] as const) {
      const abgelehnt = evidenceKandidatAusModell(
        {
          extractionNote: undefined,
          scope: atom(),
          [feld]: feld === 'result' ? 'not_required' : 'visa_exempt',
        },
        material(),
        basis,
      )
      assert.equal(abgelehnt.ok, false)
      if (abgelehnt.ok) return
      assert.equal(abgelehnt.reason, 'model_decision_forbidden')
    }
  })

  test('Credential-Optionen bleiben relationsscharf und reihenfolgenstabil', () => {
    const hin = evidenceSuchschluesselListe({ ...rahmen(), sourceId: 'example-border-authority' }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    const her = evidenceSuchschluesselListe({
      ...rahmen({
        citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
        credentialOptions: {
          mode: 'required',
          options: [option('RS', 'RS'), option('CH', 'CH')],
        },
      }),
      sourceId: 'example-border-authority',
    }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(hin.ok, true)
    assert.equal(her.ok, true)
    if (!hin.ok || !her.ok) return
    assert.equal(hin.entries.length, 2)
    assert.deepEqual(
      hin.entries.map((eintrag) => eintrag.key),
      her.entries.map((eintrag) => eintrag.key),
    )
    assert.deepEqual(paare(hin.entries), [
      { citizenships: 'CH,RS', pair: 'CH:CH', relation: 'explicit' },
      { citizenships: 'CH,RS', pair: 'RS:RS', relation: 'explicit' },
    ])
    assert.equal(
      paare(hin.entries).some((eintrag) => eintrag.pair === 'CH:RS' || eintrag.pair === 'RS:CH'),
      false,
    )

    const unlinked = evidenceSuchschluessel(
      atom({
        credentialOption: { mode: 'option', ...option('CH', null) },
      }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' },
    )
    const linked = evidenceSuchschluessel(atom(), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(unlinked.ok && linked.ok, true)
    if (!unlinked.ok || !linked.ok) return
    assert.notEqual(unlinked.key, linked.key)
    const unlinkedKanonisch = JSON.parse(unlinked.canonical) as {
      issuingCountryCode: string
      relatedCitizenshipCountryCode: string | null
      relation: string
    }
    assert.equal(unlinkedKanonisch.issuingCountryCode, 'CH')
    assert.equal(unlinkedKanonisch.relatedCitizenshipCountryCode, null)
    assert.equal(unlinkedKanonisch.relation, 'unlinked')

    const ohneRelation = evidenceSuchschluessel(
      atom({
        credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH' },
      }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' },
    )
    assert.equal(ohneRelation.ok, false)
    if (ohneRelation.ok) return
    assert.equal(ohneRelation.reason, 'missing_relevant_context')

    const ausstellerAlsStaatsbuergerschaft = evidenceSuchschluesselListe({
      ...rahmen({
        credentialOptions: { mode: 'required', options: [option('CH', null)] },
      }),
      sourceId: 'example-border-authority',
    }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(ausstellerAlsStaatsbuergerschaft.ok, true)
    if (!ausstellerAlsStaatsbuergerschaft.ok) return
    assert.deepEqual(paare(ausstellerAlsStaatsbuergerschaft.entries), [
      { citizenships: 'CH,RS', pair: 'unlinked:CH', relation: 'unlinked' },
    ])

    const zuVieleStaaten = evidenceSuchschluesselListe({
      ...rahmen({ citizenship: { mode: 'required', countryCodes: ['CH', 'RS', 'DE', 'AT', 'IT', 'FR', 'ES', 'NL', 'BE'] } }),
      sourceId: 'example-border-authority',
    }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(zuVieleStaaten.ok, false)
    if (zuVieleStaaten.ok) return
    assert.equal(zuVieleStaaten.reason, 'scope_too_wide')

    const doppelt = evidenceSuchschluesselListe({
      ...rahmen({
        credentialOptions: { mode: 'required', options: [option('CH', 'CH'), option('CH', 'CH')] },
      }),
      sourceId: 'example-border-authority',
    }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(doppelt.ok, true)
    if (!doppelt.ok) return
    assert.equal(doppelt.entries.length, 1)

    const fremdeRelation = evidenceSuchschluessel(
      atom({
        credentialOption: { mode: 'option', ...option('CH', 'DE') },
      }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' },
    )
    assert.equal(fremdeRelation.ok, false)
    if (fremdeRelation.ok) return
    assert.equal(fremdeRelation.reason, 'invalid_context')

    const verboten = evidenceSuchschluesselListe({
      ...rahmen(),
      sourceId: 'example-border-authority',
      userId: 'user-1',
      tripId: 'trip-1',
      travellerClientRef: 'traveller:1',
      passportNumber: 'X123',
    }, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.deepEqual(verboten, { ok: false, reason: 'personal_identifier_forbidden' })
    assert.equal(hin.entries.some((eintrag) => /user-1|trip-1|traveller:1|X123/.test(eintrag.canonical)), false)

    const ziel = evidenceSuchschluessel(atom({ destinationCountryCode: 'JP', transitCountryCode: null }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    const transit = evidenceSuchschluessel(atom({ destinationCountryCode: null, transitCountryCode: 'JP' }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    const kreuz = evidenceSuchschluessel(atom({ destinationCountryCode: 'SG', transitCountryCode: 'JP' }), { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(ziel.ok && transit.ok && kreuz.ok, true)
    if (!ziel.ok || !transit.ok || !kreuz.ok) return
    assert.notEqual(ziel.key, transit.key)
    assert.notEqual(ziel.key, kreuz.key)
    assert.equal(JSON.parse(ziel.canonical).destinationCountryCode, 'JP')
    assert.equal(JSON.parse(ziel.canonical).transitCountryCode, null)
    assert.equal(JSON.parse(transit.canonical).destinationCountryCode, null)
    assert.equal(JSON.parse(transit.canonical).transitCountryCode, 'JP')

    const { residence: _wohn, ...ohneWohnsitz } = atom()
    void _wohn
    const wohnsitzFehlt = evidenceSuchschluessel(ohneWohnsitz, { sourceId: 'example-border-authority', contentItemId: 'fixture_lookup_item', representationId: 'fixture_representation' })
    assert.equal(wohnsitzFehlt.ok, false)
    if (wohnsitzFehlt.ok) return
    assert.equal(wohnsitzFehlt.reason, 'missing_relevant_context')
  })

  test('derselbe Quellentext bleibt derselbe Fingerabdruck, auch wenn die Extraktion anders formuliert', () => {
    const basis = registry()
    const erste = angenommen(basis, 'official page line\r\nunchanged', undefined, 'model wording alpha')
    const zweite = angenommen(basis, 'official page line\nunchanged', undefined, 'model wording beta')
    assert.equal(erste.sourceContentHash, zweite.sourceContentHash)
    assert.equal(erste.sourceContentHash, evidenceQuellenFingerprint('official page line\nunchanged'))
    assert.notEqual(erste.extractionNote, zweite.extractionNote)
    assert.equal(erste.versionId, zweite.versionId)
    assert.equal(erste.previousVersionId, null)
    assert.deepEqual(evidenceVersionenVergleichen(erste, zweite), {
      ok: true,
      contentChanged: false,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: true,
    })

    const serbien = angenommen(basis, 'official page line\nunchanged', atom({
      credentialOption: { mode: 'option', ...option('RS', 'RS') },
    }))
    assert.equal(erste.sourceContentHash, serbien.sourceContentHash)
    assert.equal(erste.canonicalUrl, serbien.canonicalUrl)
    assert.equal(erste.retrievedAt, serbien.retrievedAt)
    assert.notEqual(erste.lookupKey, serbien.lookupKey)
    assert.notEqual(erste.versionId, serbien.versionId)
    assert.match(erste.versionId, /^ev2_[a-f0-9]{32}$/)
    assert.match(serbien.versionId, /^ev2_[a-f0-9]{32}$/)

    const pass = angenommen(basis, 'official page line\nunchanged', atom({ requirementType: 'passport_validity' }))
    assert.equal(erste.sourceContentHash, pass.sourceContentHash)
    assert.notEqual(erste.lookupKey, pass.lookupKey)
    assert.notEqual(erste.versionId, pass.versionId)
    assert.notEqual(serbien.versionId, pass.versionId)
    assert.match(pass.versionId, /^ev2_[a-f0-9]{32}$/)

    const geaendert = angenommen(basis, 'official page line\nchanged', undefined, 'model wording alpha')
    assert.notEqual(erste.sourceContentHash, geaendert.sourceContentHash)
    assert.notEqual(erste.versionId, geaendert.versionId)
    assert.equal(geaendert.previousVersionId, null)
    assert.deepEqual(evidenceVersionenVergleichen(erste, geaendert), {
      ok: true,
      contentChanged: true,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: false,
    })

    const vertrauenshash = evidenceQuellenFingerprint('official page line\nunchanged')
    for (const feld of ['sourceSnapshot', 'content', 'contentHash', 'sourceContentHash'] as const) {
      const abgelehnt = evidenceKandidatAusModell(
        {
          ...modellEingabe(atom(), 'model tries to define the hash'),
          [feld]: feld === 'content' || feld === 'sourceSnapshot' ? 'different model prose' : 'a'.repeat(64),
        },
        material({ sourceSnapshot: 'official page line\nunchanged' }),
        basis,
      )
      assert.equal(abgelehnt.ok, false)
      if (abgelehnt.ok) return
      assert.equal(abgelehnt.reason, 'source_fingerprint_override_forbidden')
      assert.equal(JSON.stringify(abgelehnt).includes(vertrauenshash ?? 'missing'), false)
    }

    for (const feld of ['canonicalUrl', 'retrievedAt'] as const) {
      const abgelehnt = evidenceKandidatAusModell(
        {
          ...modellEingabe(),
          [feld]: feld === 'canonicalUrl' ? 'https://provider.example/other' : '2020-01-01T00:00:00.000Z',
        },
        material(),
        basis,
      )
      assert.equal(abgelehnt.ok, false)
      if (abgelehnt.ok) return
      assert.equal(abgelehnt.reason, 'provenance_override_forbidden')
    }

    const gebunden = kandidat(basis)
    assert.equal(gebunden.ok, true)
    if (!gebunden.ok) return
    const aufgeloest = quellenUrlAufloesen(basis, QUELLE)
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) return
    assert.equal(gebunden.evidence.canonicalUrl, aufgeloest.canonicalUrl)
    assert.equal(gebunden.evidence.retrievedAt, ABGERUFEN)
    assert.notEqual(gebunden.evidence.canonicalUrl, 'https://provider.example/other')

    const unregistriert = evidenceKandidatAusModell(modellEingabe(), material({ canonicalUrl: 'https://evil.example/rules' }), basis)
    assert.deepEqual(unregistriert, { ok: false, reason: 'unregistered_domain' })
    const fremdeQuelle = evidenceKandidatAusModell(
      modellEingabe(),
      material({ canonicalUrl: 'https://provider.example/rules' }),
      basis,
    )
    assert.deepEqual(fremdeQuelle, { ok: false, reason: 'content_identity_mismatch' })

    const leer = evidenceKandidatAusModell(modellEingabe(), material({ sourceSnapshot: '' }), basis)
    assert.deepEqual(leer, { ok: false, reason: 'invalid_source_snapshot' })

    const funktionsText = readFileSync(join(process.cwd(), 'lib/readiness/evidence.ts'), 'utf8')
    const anfang = funktionsText.indexOf('export function evidenceKandidatAusModell')
    const ende = funktionsText.indexOf('export function evidenceKandidatAkzeptieren')
    const funktion = funktionsText.slice(anfang, ende)
    assert.match(funktion, /hülle\.sourceSnapshot/)
    assert.match(funktion, /hülle\.canonicalUrl/)
    assert.match(funktion, /hülle\.retrievedAt/)
    assert.doesNotMatch(funktion, /satz\.(sourceSnapshot|canonicalUrl|retrievedAt)/)
    assert.doesNotMatch(funktion, /modell\.(sourceSnapshot|canonicalUrl|retrievedAt)/)
  })

  test('ein Konflikt überschreibt akzeptierte Evidence nicht', () => {
    const basis = registry()
    const erste = angenommen(basis, 'official page alpha')
    const zweite = angenommen(basis, 'official page beta')
    const vorher = structuredClone(erste)
    const konflikt = evidenceKonfliktHalten(erste, zweite)
    assert.deepEqual(erste, vorher)
    assert.equal(konflikt.ok, true)
    if (!konflikt.ok) return
    assert.equal(konflikt.overwritten, false)
    assert.equal(konflikt.situation, 'conflict_preserved')
    assert.equal(konflikt.ruleChange, 'not_asserted')
    assert.equal(konflikt.kept.lifecycle, 'accepted')
    assert.equal(konflikt.kept.sourceContentHash, erste.sourceContentHash)
    assert.notEqual(konflikt.kept.sourceContentHash, zweite.sourceContentHash)
    assert.equal(konflikt.kept.versionId, erste.versionId)
  })

  test('Quellenabdeckung unterscheidet independent, exact und Ziel von Transit', () => {
    const eingabe = rahmen()
    const plan = quellenRouten(leereQuellenRegistry(), [], eingabe)
    assert.equal(plan.status, 'no_eligible_source')
    assert.equal(plan.officialResult, 'unknown')
    assert.equal(plan.evaluation, 'not_performed')
    assert.equal(plan.reason, 'no_source_coverage')
    assert.equal(plan.coverage, 'none')
    assert.equal(plan.cells.length, 2)
    assert.equal(plan.cells.every((zelle) => zelle.status === 'no_eligible_source'), true)
    assert.equal(JSON.stringify(plan).includes('not_required'), false)

    const basis = registry()
    const unabhaengig = quellenRouten(basis, [deskriptor(basis, 'example-border-authority', abdeckung())], eingabe)
    assert.equal(unabhaengig.officialResult, 'unknown')
    assert.equal(unabhaengig.coverage, 'complete')
    assert.equal(unabhaengig.cells.length, 2)
    assert.equal(unabhaengig.cells.every((zelle) => zelle.status === 'eligible_sources'), true)
    assert.deepEqual(
      unabhaengig.cells.map((zelle) =>
        zelle.atom.credentialOption.mode === 'option' ? zelle.atom.credentialOption.relatedCitizenshipCountryCode : null,
      ),
      ['CH', 'RS'],
    )

    const nurSchweiz = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({ citizenship: { mode: 'exact', countryCodes: ['CH'] } }),
        ),
      ],
      eingabe,
    )
    assert.equal(nurSchweiz.officialResult, 'unknown')
    assert.equal(nurSchweiz.coverage, 'partial')
    assert.equal(JSON.stringify(nurSchweiz).includes('not_required'), false)
    assert.deepEqual(
      nurSchweiz.cells.map((zelle) => ({
        related: zelle.atom.credentialOption.mode === 'option' ? zelle.atom.credentialOption.relatedCitizenshipCountryCode : null,
        status: zelle.status,
      })),
      [
        { related: 'CH', status: 'eligible_sources' },
        { related: 'RS', status: 'no_eligible_source' },
      ],
    )

    const teilmenge = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({ citizenship: { mode: 'exact', countryCodes: ['CH', 'RS'] } }),
        ),
      ],
      rahmen({
        citizenship: { mode: 'required', countryCodes: ['CH'] },
        credentialOptions: { mode: 'not_applicable' },
      }),
    )
    assert.equal(teilmenge.cells.length, 1)
    assert.equal(teilmenge.cells[0]?.status, 'eligible_sources')
    const keineTeilmenge = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({ citizenship: { mode: 'exact', countryCodes: ['CH'] } }),
        ),
      ],
      rahmen({
        citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
        credentialOptions: { mode: 'not_applicable' },
      }),
    )
    assert.equal(keineTeilmenge.cells[0]?.status, 'no_eligible_source')

    const unlinked = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({ citizenship: { mode: 'exact', countryCodes: ['CH'] } }),
        ),
      ],
      rahmen({
        credentialOptions: { mode: 'required', options: [option('CH', null)] },
      }),
    )
    assert.equal(unlinked.cells.length, 1)
    assert.equal(unlinked.cells[0]?.status, 'no_eligible_source')

    const leerExact = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({ citizenship: { mode: 'exact', countryCodes: [] } }),
        ),
      ],
      eingabe,
    )
    assert.equal(leerExact.reason, 'invalid_descriptor')
    assert.equal(leerExact.cells.length, 0)

    const zielAbdeckung = abdeckung()
    const transitAbdeckung = abdeckung({ destinationCountryCodes: [], transitCountryCodes: ['JP'] })
    const transitEingabe = rahmen({ destinationCountryCode: null, transitCountryCode: 'JP' })
    const ziel = quellenRouten(basis, [deskriptor(basis, 'example-border-authority', zielAbdeckung)], eingabe)
    const transitAufZiel = quellenRouten(basis, [deskriptor(basis, 'example-border-authority', zielAbdeckung)], transitEingabe)
    const transit = quellenRouten(basis, [deskriptor(basis, 'example-border-authority', transitAbdeckung)], transitEingabe)
    const zielAufTransit = quellenRouten(basis, [deskriptor(basis, 'example-border-authority', transitAbdeckung)], eingabe)
    assert.equal(ziel.status, 'eligible_sources')
    assert.equal(transitAufZiel.status, 'no_eligible_source')
    assert.equal(transit.status, 'eligible_sources')
    assert.equal(zielAufTransit.status, 'no_eligible_source')
    assert.equal(transit.officialResult, 'unknown')
    assert.equal(zielAufTransit.officialResult, 'unknown')
    assert.equal(JSON.stringify(transitAufZiel).includes('not_required'), false)

    const anbieter = quellenRouten(
      basis,
      [deskriptor(basis, 'example-licensed-provider', abdeckung())],
      rahmen({
        citizenship: { mode: 'not_applicable' },
        credentialOptions: { mode: 'not_applicable' },
      }),
    )
    assert.equal(anbieter.sources[0]?.source.sourceClass, 'licensed_evidence_provider')
    assert.equal(anbieter.sources[0]?.source.authorityName, null)
    assert.equal(requirementsProviderAus(), null)
  })

  test('die neue Laufzeit importiert keine Engine, kein Netz und keinen echten Katalog', () => {
    const dateien = ['source-registry.ts', 'source-router.ts', 'evidence.ts']
    const text = dateien.map((name) => readFileSync(join(process.cwd(), 'lib/readiness', name), 'utf8')).join('\n')
    assert.doesNotMatch(text, /readiness\/engine/)
    assert.doesNotMatch(text, /^\s*import\s.+(openai|supabase|node-fetch|undici)/im)
    assert.doesNotMatch(text, /\bfetch\s*\(/)
    assert.doesNotMatch(text, /timatic|sherpa/i)
    assert.doesNotMatch(text, /https?:\/\//i)
    assert.doesNotMatch(text, /\.gov\b|gov\.uk|gc\.ca/i)
  })
})

// Explicit synthetic v2 publications; no production registration.
const R2_PUBLICATIONS = [
  "https://evil.example/rules",
  "https://gov.example/path",
  "https://notgov.example/rules",
  "https://provider.example/other",
  "https://provider.example/rules",
  "https://user:pass@gov.example/rules",
  "https://www.blocked.example/rules",
  "https://www.gov.example/rules",
  "https://www.gov.example/rules/visa"
] as const
