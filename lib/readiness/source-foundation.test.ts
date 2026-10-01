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
  evidenceInhaltHash,
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  evidenceKonfliktHalten,
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
  return ergebnis.registry
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
    citizenshipCountryCodes: ['CH', 'RS'],
    residenceCountryCodes: [],
    documents: [],
    ...teil,
  }
}

function deskriptor(basis: QuellenRegistry, sourceId: string, coverage: QuellenAbdeckung): QuellenDeskriptor {
  return { source: quelle(basis, sourceId), coverage }
}

function atom(teil?: Record<string, unknown>) {
  return {
    sourceId: 'example-border-authority',
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCode: 'CH' },
    document: { mode: 'required', documentType: 'passport', issuingCountryCode: 'CH' },
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
    documents: {
      mode: 'required',
      options: [
        { documentType: 'passport', issuingCountryCode: 'RS' },
        { documentType: 'passport', issuingCountryCode: 'CH' },
      ],
    },
    residence: { mode: 'not_applicable' },
    requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-01' },
    ...teil,
  }
}

function kandidat(basis: QuellenRegistry, content = 'synthetic rule text alpha', scope: Record<string, unknown> = atom()) {
  return evidenceKandidatAusModell(
    {
      canonicalUrl: 'https://www.gov.example/rules/visa',
      retrievedAt: ABGERUFEN,
      content,
      scope,
    },
    basis,
  )
}

function angenommen(basis: QuellenRegistry, content = 'synthetic rule text alpha', scope?: Record<string, unknown>): EvidenceVersion {
  const erzeugt = kandidat(basis, content, scope)
  assert.equal(erzeugt.ok, true)
  if (!erzeugt.ok) throw new Error('kandidat')
  const akzeptiert = evidenceKandidatAkzeptieren(erzeugt.evidence, basis)
  assert.equal(akzeptiert.ok, true)
  if (!akzeptiert.ok) throw new Error('akzeptanz')
  return akzeptiert.evidence
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
      {
        canonicalUrl: 'http://gov.example/rules',
        retrievedAt: ABGERUFEN,
        content: 'synthetic rule text',
        scope: atom(),
      },
      basis,
    )
    assert.deepEqual(httpKandidat, { ok: false, reason: 'insecure_scheme' })
    const credentialKandidat = evidenceKandidatAusModell(
      {
        canonicalUrl: 'https://user:pass@gov.example/rules',
        retrievedAt: ABGERUFEN,
        content: 'synthetic rule text',
        scope: atom(),
      },
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
          canonicalUrl: 'https://gov.example/rules',
          retrievedAt: ABGERUFEN,
          content: 'synthetic rule text',
          scope: atom(),
          [feld]: feld === 'result' ? 'not_required' : 'visa_exempt',
        },
        basis,
      )
      assert.equal(abgelehnt.ok, false)
      if (abgelehnt.ok) return
      assert.equal(abgelehnt.reason, 'model_decision_forbidden')
    }
  })

  test('der Suchschlüssel ist reihenfolgenstabil, optionstreu und ohne Personenkennung', () => {
    const hin = evidenceSuchschluesselListe({ ...rahmen(), sourceId: 'example-border-authority' })
    const her = evidenceSuchschluesselListe({
      ...rahmen({
        citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
        documents: {
          mode: 'required',
          options: [
            { documentType: 'passport', issuingCountryCode: 'CH' },
            { documentType: 'passport', issuingCountryCode: 'RS' },
          ],
        },
      }),
      sourceId: 'example-border-authority',
    })
    assert.equal(hin.ok, true)
    assert.equal(her.ok, true)
    if (!hin.ok || !her.ok) return
    assert.equal(hin.entries.length, 4)
    assert.deepEqual(
      hin.entries.map((eintrag) => eintrag.key),
      her.entries.map((eintrag) => eintrag.key),
    )
    const staatsangehoerigkeiten = hin.entries.map((eintrag) => {
      const kanonisch = JSON.parse(eintrag.canonical) as { citizenshipCountryCode: string; issuingCountryCode: string }
      return `${kanonisch.citizenshipCountryCode}:${kanonisch.issuingCountryCode}`
    })
    assert.deepEqual(staatsangehoerigkeiten.sort(), ['CH:CH', 'CH:RS', 'RS:CH', 'RS:RS'])

    const nurErste = evidenceSuchschluesselListe({
      ...rahmen({
        citizenship: { mode: 'required', countryCodes: ['RS'] },
        documents: { mode: 'required', options: [{ documentType: 'passport', issuingCountryCode: 'RS' }] },
      }),
      sourceId: 'example-border-authority',
    })
    assert.equal(nurErste.ok, true)
    if (!nurErste.ok) return
    assert.equal(nurErste.entries.length, 1)
    assert.notDeepEqual(
      hin.entries.map((eintrag) => eintrag.key),
      nurErste.entries.map((eintrag) => eintrag.key),
    )
    assert.equal(
      hin.entries.some((eintrag) => eintrag.key === nurErste.entries[0]?.key),
      true,
    )

    const verboten = evidenceSuchschluesselListe({
      ...rahmen(),
      sourceId: 'example-border-authority',
      userId: 'user-1',
      tripId: 'trip-1',
      travellerClientRef: 'traveller:1',
      passportNumber: 'X123',
    })
    assert.deepEqual(verboten, { ok: false, reason: 'personal_identifier_forbidden' })
    assert.equal(hin.entries.some((eintrag) => /user-1|trip-1|traveller:1|X123/.test(eintrag.canonical)), false)

    const ziel = evidenceSuchschluessel(atom({ destinationCountryCode: 'JP', transitCountryCode: null }))
    const transit = evidenceSuchschluessel(atom({ destinationCountryCode: null, transitCountryCode: 'JP' }))
    const kreuz = evidenceSuchschluessel(atom({ destinationCountryCode: 'SG', transitCountryCode: 'JP' }))
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
    const wohnsitzFehlt = evidenceSuchschluessel(ohneWohnsitz)
    assert.equal(wohnsitzFehlt.ok, false)
    if (wohnsitzFehlt.ok) return
    assert.equal(wohnsitzFehlt.reason, 'missing_relevant_context')
  })

  test('ein geänderter Hash ist eine neue Version und kein behaupteter Regelwechsel', () => {
    const basis = registry()
    const erste = angenommen(basis, 'synthetic rule text alpha')
    const zweite = angenommen(basis, 'synthetic rule text beta')
    assert.notEqual(erste.contentHash, zweite.contentHash)
    assert.equal(erste.contentHash, evidenceInhaltHash('synthetic rule text alpha'))
    assert.notEqual(erste.versionId, zweite.versionId)
    assert.equal(erste.previousVersionId, null)
    assert.equal(zweite.previousVersionId, null)

    const abstand = evidenceVersionenVergleichen(erste, zweite)
    assert.deepEqual(abstand, {
      ok: true,
      contentChanged: true,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: false,
    })
    const gleich = evidenceVersionenVergleichen(erste, { contentHash: erste.contentHash })
    assert.deepEqual(gleich, {
      ok: true,
      contentChanged: false,
      ruleChange: 'not_asserted',
      laterAnalysisShortCircuit: true,
    })
  })

  test('ein Konflikt überschreibt akzeptierte Evidence nicht', () => {
    const basis = registry()
    const erste = angenommen(basis, 'synthetic rule text alpha')
    const zweite = angenommen(basis, 'synthetic rule text beta')
    const vorher = structuredClone(erste)
    const konflikt = evidenceKonfliktHalten(erste, zweite)
    assert.deepEqual(erste, vorher)
    assert.equal(konflikt.ok, true)
    if (!konflikt.ok) return
    assert.equal(konflikt.overwritten, false)
    assert.equal(konflikt.situation, 'conflict_preserved')
    assert.equal(konflikt.ruleChange, 'not_asserted')
    assert.equal(konflikt.kept.lifecycle, 'accepted')
    assert.equal(konflikt.kept.contentHash, erste.contentHash)
    assert.notEqual(konflikt.kept.contentHash, zweite.contentHash)
    assert.equal(konflikt.kept.versionId, erste.versionId)
  })

  test('ohne Quellenabdeckung bleibt der Pfad unbekannt und wird nie not_required', () => {
    const eingabe = rahmen()
    const plan = quellenRouten(leereQuellenRegistry(), [], eingabe)
    assert.equal(plan.status, 'no_eligible_source')
    assert.equal(plan.officialResult, 'unknown')
    assert.equal(plan.evaluation, 'not_performed')
    assert.equal(plan.reason, 'no_source_coverage')
    assert.equal(plan.coverage, 'none')
    assert.equal(plan.cells.length, 4)
    assert.equal(plan.cells.every((zelle) => zelle.status === 'no_eligible_source'), true)
    assert.equal(JSON.stringify(plan).includes('not_required'), false)

    const basis = registry()
    const nurSchweiz = quellenRouten(
      basis,
      [deskriptor(basis, 'example-border-authority', abdeckung({ citizenshipCountryCodes: ['CH'] }))],
      rahmen({
        documents: { mode: 'not_applicable' },
      }),
    )
    assert.equal(nurSchweiz.officialResult, 'unknown')
    assert.equal(nurSchweiz.coverage, 'partial')
    assert.deepEqual(
      nurSchweiz.cells.map((zelle) => ({
        citizenship: zelle.atom.citizenship.mode === 'required' ? zelle.atom.citizenship.countryCode : null,
        status: zelle.status,
      })),
      [
        { citizenship: 'CH', status: 'eligible_sources' },
        { citizenship: 'RS', status: 'no_eligible_source' },
      ],
    )
    const umgekehrt = quellenRouten(
      basis,
      [deskriptor(basis, 'example-border-authority', abdeckung({ citizenshipCountryCodes: ['CH'] }))],
      rahmen({
        citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
        documents: { mode: 'not_applicable' },
      }),
    )
    assert.deepEqual(
      nurSchweiz.cells.map((zelle) => zelle.sourceIds),
      umgekehrt.cells.map((zelle) => zelle.sourceIds),
    )

    const dokumente = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-border-authority',
          abdeckung({
            citizenshipCountryCodes: [],
            documents: [{ documentType: 'passport', issuingCountryCode: 'CH' }],
          }),
        ),
      ],
      rahmen({ citizenship: { mode: 'not_applicable' } }),
    )
    assert.equal(dokumente.cells.length, 2)
    const dokumentStatus = dokumente.cells.map((zelle) => ({
      issuing: zelle.atom.document.mode === 'required' ? zelle.atom.document.issuingCountryCode : null,
      status: zelle.status,
    }))
    assert.deepEqual(dokumentStatus, [
      { issuing: 'CH', status: 'eligible_sources' },
      { issuing: 'RS', status: 'no_eligible_source' },
    ])

    const zielAbdeckung = abdeckung({ citizenshipCountryCodes: [], documents: [] })
    const ziel = quellenRouten(
      basis,
      [deskriptor(basis, 'example-border-authority', zielAbdeckung)],
      rahmen({
        destinationCountryCode: 'JP',
        transitCountryCode: null,
        citizenship: { mode: 'not_applicable' },
        documents: { mode: 'not_applicable' },
      }),
    )
    const transit = quellenRouten(
      basis,
      [deskriptor(basis, 'example-border-authority', zielAbdeckung)],
      rahmen({
        destinationCountryCode: null,
        transitCountryCode: 'JP',
        citizenship: { mode: 'not_applicable' },
        documents: { mode: 'not_applicable' },
      }),
    )
    assert.equal(ziel.status, 'eligible_sources')
    assert.equal(transit.status, 'no_eligible_source')
    assert.equal(transit.officialResult, 'unknown')
    assert.equal(JSON.stringify(transit).includes('not_required'), false)

    const anbieter = quellenRouten(
      basis,
      [
        deskriptor(
          basis,
          'example-licensed-provider',
          abdeckung({
            citizenshipCountryCodes: [],
            documents: [],
          }),
        ),
      ],
      rahmen({
        citizenship: { mode: 'not_applicable' },
        documents: { mode: 'not_applicable' },
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
