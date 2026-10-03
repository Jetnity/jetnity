// lib/readiness/rule-claims.test.ts
//
// Quellenneutrale Rule Claims. Ein Forschungsvorschlag ist keine akzeptierte Regel.
// Keine zweite Engine, kein Netz, keine neue Anforderungstaxonomie.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  evidenceKandidatAkzeptieren,
  evidenceKandidatAusModell,
  type EvidenceVersion,
} from '@/lib/readiness/evidence'
import { OFFICIAL_VISA_MODES } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  AUFENTHALT_WERT_MAX,
  REGEL_EVIDENCE_QUALITAETEN,
  REGEL_FAKT_ARTEN,
  REGEL_SCOPE_PRAEFIX,
  REGEL_SUPPORT_MAX,
  REGEL_TRANSIT_MINUTEN_MAX,
  regelFaktKanonischLesen,
  regelKandidatAkzeptieren,
  regelKandidatErstellen,
  regelScopeAusEvidenceScope,
  type RegelTransitPfad,
} from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, quellenUrlAufloesen, type QuellenRegistry } from '@/lib/readiness/source-registry'
import { temporalRuleLesen } from '@/lib/readiness/temporal'
import { OFFICIAL_REQUIREMENT_TYPES } from '@/types/trips'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const ABGERUFEN = '2026-10-01T12:00:00.000Z'

const VERBOTENE_ANFORDERUNGSTYPEN = [
  'visa_exemption',
  'electronic_visa',
  'arrival_form',
  'stay_duration',
  'transit_240h',
  'transit_airside',
  'transit_program',
]

function quelle(relativ: string): string {
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
      sourceId: 'example-visa-portal',
      sourceClass: 'official_authority',
      publisherName: 'Example Visa Portal',
      authorityName: 'Example Visa Portal',
      domains: ['visa.example'],
    },
    {
      sourceId: 'example-licensed-provider',
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Licensed Publisher',
      domains: ['provider.example'],
    },
    {
      sourceId: 'example-other-provider',
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Other Publisher',
      domains: ['other-provider.example'],
    },
  ])
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) throw new Error('registry')
  return ergebnis.registry
}

function atom(teil?: Record<string, unknown>) {
  return {
    sourceId: 'example-border-authority',
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

function version(
  basis: QuellenRegistry,
  sourceId: string,
  host: string,
  snapshot: string,
  scope: Record<string, unknown> = atom(),
): EvidenceVersion {
  const erzeugt = evidenceKandidatAusModell(
    { scope: { ...scope, sourceId } },
    {
      canonicalUrl: `https://www.${host}/rules/visa`,
      retrievedAt: ABGERUFEN,
      sourceSnapshot: snapshot,
    },
    basis,
  )
  assert.equal(erzeugt.ok, true)
  if (!erzeugt.ok) throw new Error('kandidat')
  const akzeptiert = evidenceKandidatAkzeptieren(erzeugt.evidence, basis)
  assert.equal(akzeptiert.ok, true)
  if (!akzeptiert.ok) throw new Error('akzeptanz')
  return akzeptiert.evidence
}

function leerPfad(teil?: Partial<RegelTransitPfad>): RegelTransitPfad {
  return {
    crossesBorderControl: null,
    leavesTransitArea: null,
    transitAirportCodes: null,
    maxTransitDurationMinutes: null,
    arrivalMode: null,
    departureMode: null,
    thirdCountryRequired: null,
    sameFlightRequired: null,
    onwardTicketRequired: null,
    ...teil,
  }
}

function aufenthalt(teil: Record<string, unknown>) {
  return {
    kind: 'stay_limit',
    perVisit: null,
    rollingWindow: null,
    initialGrant: null,
    extension: null,
    borderDiscretion: 'fixed',
    ...teil,
  }
}

function annehmen(
  basis: QuellenRegistry,
  scope: Record<string, unknown>,
  factKind: string,
  evidenceQuality: string,
  versionen: readonly EvidenceVersion[],
  trustedRuleFact: unknown,
  proposal: unknown = null,
) {
  const kandidat = regelKandidatErstellen(
    {
      scope,
      factKind,
      evidenceQuality,
      supportVersionIds: versionen.map((eintrag) => eintrag.versionId),
      proposal,
    },
    basis,
  )
  assert.equal(kandidat.ok, true, kandidat.ok ? '' : kandidat.reason)
  if (!kandidat.ok) throw new Error('kandidat')
  return regelKandidatAkzeptieren({
    kandidat: kandidat.kandidat,
    trustedRuleFact,
    evidenceVersions: versionen,
    registry: basis,
  })
}

describe('Official Truth rule claims', () => {
  test('zwei Quellen mit demselben Regelraum teilen den quellenneutralen Schlüssel', () => {
    const basis = registry()
    const links = version(basis, 'example-border-authority', 'gov.example', 'seite alpha')
    const rechts = version(basis, 'example-interior-authority', 'interior.example', 'seite beta', atom({ sourceId: 'example-interior-authority' }))
    assert.notEqual(links.lookupKey, rechts.lookupKey)
    assert.match(links.lookupKey, /^evidence-key:v2:/)
    const a = regelScopeAusEvidenceScope(links.scope)
    const b = regelScopeAusEvidenceScope(rechts.scope)
    assert.equal(a.ok, true)
    assert.equal(b.ok, true)
    if (!a.ok || !b.ok) return
    assert.equal(a.key, b.key)
    assert.match(a.key, new RegExp(`^${REGEL_SCOPE_PRAEFIX}[a-f0-9]{64}$`))
    assert.equal('sourceId' in a.scope, false)
  })

  test('Reihenfolge und abweichende Reisedimensionen', () => {
    const gedreht = regelScopeAusEvidenceScope(atom({ citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] } }))
    const gerade = regelScopeAusEvidenceScope(atom())
    assert.equal(gedreht.ok && gerade.ok, true)
    if (!gedreht.ok || !gerade.ok) return
    assert.equal(gedreht.key, gerade.key)
    assert.deepEqual(
      gedreht.scope.citizenship.mode === 'required' ? gedreht.scope.citizenship.countryCodes : [],
      ['CH', 'RS'],
    )

    const abweichungen = [
      atom({ destinationCountryCode: 'TH' }),
      atom({ transitCountryCode: 'SG' }),
      atom({ citizenship: { mode: 'required', countryCodes: ['CH'] } }),
      atom({
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          relatedCitizenshipCountryCode: 'RS',
        },
      }),
      atom({ residence: { mode: 'required', countryCode: 'CH' } }),
      atom({ validity: { mode: 'travel_date', travelDate: '2026-11-01' } }),
    ]
    for (const eingabe of abweichungen) {
      const andere = regelScopeAusEvidenceScope(eingabe)
      assert.equal(andere.ok, true)
      if (!andere.ok) return
      assert.notEqual(andere.key, gerade.key)
    }
  })

  test('Ausstellerland ist keine Staatsbürgerschaft und kein bevorzugter Pass', () => {
    const unverbunden = regelScopeAusEvidenceScope(
      atom({
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          relatedCitizenshipCountryCode: null,
        },
      }),
    )
    const verbunden = regelScopeAusEvidenceScope(atom())
    const andererPass = regelScopeAusEvidenceScope(
      atom({
        credentialOption: {
          mode: 'option',
          documentType: 'passport',
          issuingCountryCode: 'RS',
          relatedCitizenshipCountryCode: 'RS',
        },
      }),
    )
    assert.equal(unverbunden.ok && verbunden.ok && andererPass.ok, true)
    if (!unverbunden.ok || !verbunden.ok || !andererPass.ok) return
    assert.equal(unverbunden.scope.credentialOption.mode, 'option')
    if (unverbunden.scope.credentialOption.mode !== 'option') return
    assert.equal(unverbunden.scope.credentialOption.issuingCountryCode, 'CH')
    assert.equal(unverbunden.scope.credentialOption.relatedCitizenshipCountryCode, null)
    assert.notEqual(unverbunden.key, verbunden.key)
    assert.notEqual(verbunden.key, andererPass.key)
    assert.equal(quelle('lib/readiness/rule-claims.ts').includes('preferredPassport'), false)
    assert.equal(quelle('lib/readiness/rule-claims.ts').includes('defaultPassport'), false)
  })

  test('explizite Aussage mit einer akzeptierten Quelle wird angenommen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'visa frei')
    const ergebnis = annehmen(
      basis,
      belegt.scope,
      'requirement_effect',
      'explicit_primary_statement',
      [belegt],
      { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.claim.lifecycle, 'accepted')
    assert.equal(ergebnis.claim.validationState, 'valid')
    assert.deepEqual(ergebnis.claim.supportVersionIds, [belegt.versionId])
    assert.equal(ergebnis.claim.evidenceQuality, 'explicit_primary_statement')
  })

  test('zusammengesetzte Aussage braucht zwei verschiedene Quellen', () => {
    const basis = registry()
    const erste = version(basis, 'example-border-authority', 'gov.example', 'seite eins')
    const zweite = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'seite zwei',
      atom({ sourceId: 'example-interior-authority' }),
    )
    const gleich = version(basis, 'example-border-authority', 'gov.example', 'seite drei')
    const fakt = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }
    const gut = annehmen(basis, erste.scope, 'requirement_effect', 'composed_from_multiple_primary_sources', [zweite, erste], fakt)
    assert.equal(gut.ok, true)
    if (gut.ok) assert.deepEqual(gut.claim.supportVersionIds, [erste.versionId, zweite.versionId].sort())
    const gleichQuelle = annehmen(
      basis,
      erste.scope,
      'requirement_effect',
      'composed_from_multiple_primary_sources',
      [erste, gleich],
      fakt,
    )
    assert.deepEqual(gleichQuelle, { ok: false, reason: 'same_source_composition' })
  })

  test('primäre Qualität ist nur Behörden-Evidence', () => {
    const basis = registry()
    const behoerde = version(basis, 'example-border-authority', 'gov.example', 'behoerde')
    const zweite = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'zweite behoerde',
      atom({ sourceId: 'example-interior-authority' }),
    )
    const anbieter = version(
      basis,
      'example-licensed-provider',
      'provider.example',
      'anbieter',
      atom({ sourceId: 'example-licensed-provider' }),
    )
    const anderer = version(
      basis,
      'example-other-provider',
      'other-provider.example',
      'zweiter anbieter',
      atom({ sourceId: 'example-other-provider' }),
    )
    const fakt = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }
    const explizit = annehmen(basis, behoerde.scope, 'requirement_effect', 'explicit_primary_statement', [behoerde], fakt)
    assert.equal(explizit.ok, true)
    const einAnbieter = annehmen(basis, anbieter.scope, 'requirement_effect', 'explicit_primary_statement', [anbieter], fakt)
    assert.deepEqual(einAnbieter, { ok: false, reason: 'primary_source_required' })
    const zweiBehoerden = annehmen(
      basis,
      behoerde.scope,
      'requirement_effect',
      'composed_from_multiple_primary_sources',
      [behoerde, zweite],
      fakt,
    )
    assert.equal(zweiBehoerden.ok, true)
    const zweiAnbieter = annehmen(
      basis,
      anbieter.scope,
      'requirement_effect',
      'composed_from_multiple_primary_sources',
      [anbieter, anderer],
      fakt,
    )
    assert.deepEqual(zweiAnbieter, { ok: false, reason: 'primary_source_required' })
    const gemischt = annehmen(
      basis,
      behoerde.scope,
      'requirement_effect',
      'composed_from_multiple_primary_sources',
      [behoerde, anbieter],
      fakt,
    )
    assert.deepEqual(gemischt, { ok: false, reason: 'primary_source_required' })
  })

  test('stale, Konflikt und Forschungslücke werden nicht angenommen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'alt')
    const trusted = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }
    for (const qualitaet of ['stale_primary_evidence', 'unresolved_conflict', 'research_gap'] as const) {
      const ergebnis = annehmen(basis, belegt.scope, 'requirement_effect', qualitaet, qualitaet === 'research_gap' ? [] : [belegt], trusted)
      assert.equal(ergebnis.ok, false)
      if (ergebnis.ok) return
      assert.equal(ergebnis.reason, 'quality_not_acceptable')
      assert.equal('claim' in ergebnis, false)
      assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
    }
    const luecke = regelKandidatErstellen(
      {
        scope: belegt.scope,
        factKind: 'requirement_effect',
        evidenceQuality: 'research_gap',
        supportVersionIds: [],
        proposal: trusted,
      },
      basis,
    )
    assert.deepEqual(luecke, { ok: false, reason: 'research_gap_proposal_forbidden' })
  })

  test('der Kandidatenvorschlag wird nicht zur akzeptierten Regel', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'vertrauensgrenze')
    const proposal = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' }
    const trusted = { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' }
    const ergebnis = annehmen(
      basis,
      belegt.scope,
      'requirement_effect',
      'explicit_primary_statement',
      [belegt],
      trusted,
      proposal,
    )
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.deepEqual(ergebnis.claim.fact, trusted)
    assert.notDeepEqual(ergebnis.claim.fact, proposal)
    assert.equal(JSON.stringify(ergebnis.claim).includes('electronic_visa'), false)
    const text = quelle('lib/readiness/rule-claims.ts')
    const koerper = text.slice(text.indexOf('export function regelKandidatAkzeptieren'))
    assert.equal(koerper.includes('proposal'), false)
  })

  test('die Anforderungstaxonomie bleibt unverändert', () => {
    assert.deepEqual([...OFFICIAL_REQUIREMENT_TYPES], [
      'visa',
      'electronic_travel_authorization',
      'passport',
      'identity_document',
      'passport_validity',
      'blank_passport_pages',
      'transit',
      'health',
      'vaccination',
      'health_document',
      'entry_form',
      'insurance',
      'onward_or_return_ticket',
      'booking_or_travel_document',
      'financial_means',
      'other_entry_requirement',
    ])
    for (const name of VERBOTENE_ANFORDERUNGSTYPEN) {
      assert.equal((OFFICIAL_REQUIREMENT_TYPES as readonly string[]).includes(name), false)
      assert.equal((REGEL_FAKT_ARTEN as readonly string[]).includes(name), false)
    }
    assert.equal((OFFICIAL_VISA_MODES as readonly string[]).includes('electronic_visa'), true)
    assert.equal(requirementsProviderAus(), null)
    assert.deepEqual([...REGEL_FAKT_ARTEN], [
      'requirement_effect',
      'visa_options',
      'stay_limit',
      'passport_validity',
      'blank_passport_pages',
      'transit_conditions',
      'official_actions',
      'temporal_rule',
    ])
    assert.deepEqual([...REGEL_EVIDENCE_QUALITAETEN], [
      'explicit_primary_statement',
      'composed_from_multiple_primary_sources',
      'stale_primary_evidence',
      'unresolved_conflict',
      'research_gap',
    ])
  })

  test('Visawirkung, eTA und Einreiseformular bleiben in der bestehenden Taxonomie', () => {
    const basis = registry()
    const visum = version(basis, 'example-border-authority', 'gov.example', 'visum')
    const widerspruch = annehmen(basis, visum.scope, 'requirement_effect', 'explicit_primary_statement', [visum], {
      kind: 'requirement_effect',
      effect: 'required',
      visaMode: 'visa_exempt',
    })
    assert.deepEqual(widerspruch, { ok: false, reason: 'visa_contradiction' })
    const anderePflicht = annehmen(basis, visum.scope, 'requirement_effect', 'explicit_primary_statement', [visum], {
      kind: 'requirement_effect',
      effect: 'not_required',
      visaMode: 'electronic_visa',
    })
    assert.deepEqual(anderePflicht, { ok: false, reason: 'visa_contradiction' })

    const eta = version(basis, 'example-border-authority', 'gov.example', 'eta', atom({ requirementType: 'electronic_travel_authorization' }))
    const etaGut = annehmen(basis, eta.scope, 'requirement_effect', 'explicit_primary_statement', [eta], {
      kind: 'requirement_effect',
      effect: 'required',
      visaMode: null,
    })
    assert.equal(etaGut.ok, true)
    if (etaGut.ok) assert.equal(etaGut.claim.scope.requirementType, 'electronic_travel_authorization')
    const etaModus = annehmen(basis, eta.scope, 'requirement_effect', 'explicit_primary_statement', [eta], {
      kind: 'requirement_effect',
      effect: 'required',
      visaMode: 'electronic_visa',
    })
    assert.deepEqual(etaModus, { ok: false, reason: 'visa_mode_forbidden' })

    const formular = version(basis, 'example-border-authority', 'gov.example', 'formular', atom({ requirementType: 'entry_form' }))
    const formularGut = annehmen(basis, formular.scope, 'requirement_effect', 'explicit_primary_statement', [formular], {
      kind: 'requirement_effect',
      effect: 'not_required',
      visaMode: null,
    })
    assert.equal(formularGut.ok, true)
    if (formularGut.ok) assert.equal(formularGut.claim.scope.requirementType, 'entry_form')
  })

  test('eine Visabefreiung kann neben einer nicht verpflichtenden eVisa-Option stehen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'optionen')
    const wirkung = annehmen(basis, belegt.scope, 'requirement_effect', 'explicit_primary_statement', [belegt], {
      kind: 'requirement_effect',
      effect: 'not_required',
      visaMode: 'visa_exempt',
    })
    const optionen = annehmen(basis, belegt.scope, 'visa_options', 'explicit_primary_statement', [belegt], {
      kind: 'visa_options',
      options: [
        { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' },
        { visaMode: 'visa_exempt', eligibility: 'allowed', mandate: 'not_mandatory' },
      ],
    })
    assert.equal(wirkung.ok && optionen.ok, true)
    if (!wirkung.ok || !optionen.ok) return
    assert.equal(wirkung.claim.fact.kind, 'requirement_effect')
    assert.equal(optionen.claim.fact.kind, 'visa_options')
    if (optionen.claim.fact.kind !== 'visa_options') return
    assert.deepEqual(
      optionen.claim.fact.options.map((eintrag) => eintrag.visaMode),
      ['visa_exempt', 'electronic_visa'],
    )
    const fremd = version(basis, 'example-border-authority', 'gov.example', 'formular-option', atom({ requirementType: 'entry_form' }))
    const verboten = annehmen(basis, fremd.scope, 'visa_options', 'explicit_primary_statement', [fremd], {
      kind: 'visa_options',
      options: [{ visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'not_mandatory' }],
    })
    assert.deepEqual(verboten, { ok: false, reason: 'requirement_type_mismatch' })
  })

  test('Aufenthaltsgrenzen behalten ihre Einheit', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'aufenthalt')
    const faelle = [
      aufenthalt({ perVisit: { value: 45, unit: 'days' } }),
      aufenthalt({
        rollingWindow: {
          maximum: { value: 90, unit: 'days' },
          within: { value: 180, unit: 'days' },
        },
      }),
      aufenthalt({
        perVisit: { value: 3, unit: 'months' },
        rollingWindow: {
          maximum: { value: 6, unit: 'months' },
          within: { value: 12, unit: 'months' },
        },
      }),
      aufenthalt({
        initialGrant: { value: 90, unit: 'days' },
        extension: { requiresApplication: true, maximumTotal: { value: 6, unit: 'months' } },
      }),
      aufenthalt({ perVisit: { value: 6, unit: 'months' }, borderDiscretion: 'may_be_shorter' }),
      aufenthalt({ perVisit: { value: 6, unit: 'months' }, borderDiscretion: 'determined_at_border' }),
    ]
    for (const fakt of faelle) {
      const ergebnis = annehmen(basis, belegt.scope, 'stay_limit', 'explicit_primary_statement', [belegt], fakt)
      assert.equal(ergebnis.ok, true)
      if (!ergebnis.ok) return
      assert.deepEqual(ergebnis.claim.fact, fakt)
    }
    const monate = faelle[2]
    assert.equal(JSON.stringify(monate).includes('"unit":"months"'), true)
    assert.equal(JSON.stringify(monate).includes('"value":90'), false)
    const zuGross = annehmen(basis, belegt.scope, 'stay_limit', 'explicit_primary_statement', [belegt], aufenthalt({
      perVisit: { value: AUFENTHALT_WERT_MAX.days + 1, unit: 'days' },
    }))
    assert.deepEqual(zuGross, { ok: false, reason: 'invalid_fact' })
    const leer = annehmen(basis, belegt.scope, 'stay_limit', 'explicit_primary_statement', [belegt], aufenthalt({}))
    assert.deepEqual(leer, { ok: false, reason: 'invalid_fact' })
  })

  test('Passgültigkeit bleibt eine geschlossene Semantik', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'pass', atom({ requirementType: 'passport_validity' }))
    const faelle = [
      { kind: 'passport_validity', semantics: 'valid_on_entry' },
      { kind: 'passport_validity', semantics: 'valid_through_stay' },
      {
        kind: 'passport_validity',
        semantics: 'minimum_remaining_from_entry',
        duration: { value: 6, unit: 'months' },
      },
      {
        kind: 'passport_validity',
        semantics: 'minimum_remaining_from_planned_departure',
        duration: { value: 3, unit: 'months' },
      },
      {
        kind: 'passport_validity',
        semantics: 'minimum_remaining_at_application',
        duration: { value: 6, unit: 'months' },
      },
      {
        kind: 'passport_validity',
        semantics: 'expired_document_exception',
        duration: { value: 5, unit: 'years' },
      },
    ]
    for (const fakt of faelle) {
      const ergebnis = annehmen(basis, belegt.scope, 'passport_validity', 'explicit_primary_statement', [belegt], fakt)
      assert.equal(ergebnis.ok, true)
      if (!ergebnis.ok || ergebnis.claim.fact.kind !== 'passport_validity') return
      if (fakt.semantics === 'valid_on_entry' || fakt.semantics === 'valid_through_stay') {
        assert.equal(ergebnis.claim.fact.duration, null)
      } else {
        assert.deepEqual(ergebnis.claim.fact.duration, 'duration' in fakt ? fakt.duration : null)
      }
    }
    const nullMonate = annehmen(basis, belegt.scope, 'passport_validity', 'explicit_primary_statement', [belegt], {
      kind: 'passport_validity',
      semantics: 'valid_on_entry',
      duration: { value: 0, unit: 'months' },
    })
    assert.deepEqual(nullMonate, { ok: false, reason: 'invalid_fact' })
    const visum = version(basis, 'example-border-authority', 'gov.example', 'pass-visum')
    const falscherTyp = annehmen(basis, visum.scope, 'passport_validity', 'explicit_primary_statement', [visum], {
      kind: 'passport_validity',
      semantics: 'valid_on_entry',
    })
    assert.deepEqual(falscherTyp, { ok: false, reason: 'requirement_type_mismatch' })
  })

  test('leere Passseiten bleiben im technischen Bereich 1 bis 10', () => {
    const basis = registry()
    const belegt = version(
      basis,
      'example-border-authority',
      'gov.example',
      'seiten',
      atom({ requirementType: 'blank_passport_pages' }),
    )
    for (const minimumPages of [1, 10]) {
      const ergebnis = annehmen(basis, belegt.scope, 'blank_passport_pages', 'explicit_primary_statement', [belegt], {
        kind: 'blank_passport_pages',
        minimumPages,
      })
      assert.equal(ergebnis.ok, true)
    }
    for (const minimumPages of [0, 11, 1.5]) {
      const ergebnis = annehmen(basis, belegt.scope, 'blank_passport_pages', 'explicit_primary_statement', [belegt], {
        kind: 'blank_passport_pages',
        minimumPages,
      })
      assert.deepEqual(ergebnis, { ok: false, reason: 'invalid_fact' })
    }
  })

  test('Transitbedingungen bleiben am Typ transit und raten Unbekanntes nicht', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'transit', atom({ requirementType: 'transit' }))
    const spaeter = leerPfad({
      crossesBorderControl: false,
      maxTransitDurationMinutes: 240 * 60,
      arrivalMode: 'air',
      departureMode: 'air',
    })
    const frueher = leerPfad({ transitAirportCodes: ['NRT', 'HND'], leavesTransitArea: true })
    const ergebnis = annehmen(basis, belegt.scope, 'transit_conditions', 'explicit_primary_statement', [belegt], {
      kind: 'transit_conditions',
      paths: [spaeter, frueher, frueher],
    })
    const nochmal = annehmen(basis, belegt.scope, 'transit_conditions', 'explicit_primary_statement', [belegt], {
      kind: 'transit_conditions',
      paths: [frueher, spaeter, spaeter],
    })
    assert.equal(ergebnis.ok && nochmal.ok, true)
    if (!ergebnis.ok || !nochmal.ok) return
    if (ergebnis.claim.fact.kind !== 'transit_conditions' || nochmal.claim.fact.kind !== 'transit_conditions') return
    assert.deepEqual(ergebnis.claim.fact, nochmal.claim.fact)
    assert.equal(ergebnis.claim.scope.requirementType, 'transit')
    assert.equal(ergebnis.claim.fact.paths.length, 2)
    const mitFlughafen = ergebnis.claim.fact.paths.find((pfad) => pfad.transitAirportCodes?.length)
    const mitDauer = ergebnis.claim.fact.paths.find((pfad) => pfad.maxTransitDurationMinutes != null)
    assert.deepEqual(mitFlughafen?.transitAirportCodes, ['HND', 'NRT'])
    assert.equal(mitFlughafen?.arrivalMode, null)
    assert.equal(mitFlughafen?.maxTransitDurationMinutes, null)
    assert.equal(mitDauer?.maxTransitDurationMinutes, 240 * 60)
    assert.ok((mitDauer?.maxTransitDurationMinutes ?? 0) <= REGEL_TRANSIT_MINUTEN_MAX)
    const leer = annehmen(basis, belegt.scope, 'transit_conditions', 'explicit_primary_statement', [belegt], {
      kind: 'transit_conditions',
      paths: [leerPfad()],
    })
    assert.deepEqual(leer, { ok: false, reason: 'invalid_fact' })
    const klein = annehmen(basis, belegt.scope, 'transit_conditions', 'explicit_primary_statement', [belegt], {
      kind: 'transit_conditions',
      paths: [leerPfad({ transitAirportCodes: ['nrt'] })],
    })
    assert.deepEqual(klein, { ok: false, reason: 'invalid_fact' })
    const visum = version(basis, 'example-border-authority', 'gov.example', 'transit-visum')
    const falscherTyp = annehmen(basis, visum.scope, 'transit_conditions', 'explicit_primary_statement', [visum], {
      kind: 'transit_conditions',
      paths: [frueher],
    })
    assert.deepEqual(falscherTyp, { ok: false, reason: 'requirement_type_mismatch' })
  })

  test('Amtshandlungen lösen nur auf eine registrierte Behörde auf', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'aktion')
    const portal = 'https://www.visa.example/apply'
    const aufgeloest = quellenUrlAufloesen(basis, portal)
    assert.equal(aufgeloest.ok, true)
    if (!aufgeloest.ok) return
    const ergebnis = annehmen(basis, belegt.scope, 'official_actions', 'explicit_primary_statement', [belegt], {
      kind: 'official_actions',
      actions: [
        {
          actionSourceId: 'example-visa-portal',
          purpose: 'application',
          href: 'https://WWW.VISA.EXAMPLE/apply',
          visaMode: 'electronic_visa',
        },
      ],
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok || ergebnis.claim.fact.kind !== 'official_actions') return
    assert.equal(ergebnis.claim.fact.actions[0]?.href, aufgeloest.canonicalUrl)
    assert.notEqual(ergebnis.claim.fact.actions[0]?.href, belegt.canonicalUrl)
    assert.equal(ergebnis.claim.fact.actions[0]?.actionSourceId, 'example-visa-portal')

    const anbieter = annehmen(basis, belegt.scope, 'official_actions', 'explicit_primary_statement', [belegt], {
      kind: 'official_actions',
      actions: [
        {
          actionSourceId: 'example-licensed-provider',
          purpose: 'application',
          href: 'https://www.provider.example/apply',
          visaMode: null,
        },
      ],
    })
    assert.deepEqual(anbieter, { ok: false, reason: 'provider_action_forbidden' })
    const fremd = annehmen(basis, belegt.scope, 'official_actions', 'explicit_primary_statement', [belegt], {
      kind: 'official_actions',
      actions: [
        {
          actionSourceId: 'example-border-authority',
          purpose: 'form',
          href: portal,
          visaMode: null,
        },
      ],
    })
    assert.deepEqual(fremd, { ok: false, reason: 'action_source_mismatch' })
    const unsicher = annehmen(basis, belegt.scope, 'official_actions', 'explicit_primary_statement', [belegt], {
      kind: 'official_actions',
      actions: [
        {
          actionSourceId: 'example-visa-portal',
          purpose: 'information',
          href: 'http://www.visa.example/apply',
          visaMode: null,
        },
      ],
    })
    assert.deepEqual(unsicher, { ok: false, reason: 'insecure_scheme' })
    const zugang = annehmen(basis, belegt.scope, 'official_actions', 'explicit_primary_statement', [belegt], {
      kind: 'official_actions',
      actions: [
        {
          actionSourceId: 'example-visa-portal',
          purpose: 'information',
          href: 'https://user:secret@www.visa.example/apply',
          visaMode: null,
        },
      ],
    })
    assert.deepEqual(zugang, { ok: false, reason: 'credentials' })
  })

  test('Zeitregeln benutzen den bestehenden Parser', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'zeit')
    const rule = {
      kind: 'relative_duration',
      availableFrom: null,
      dueBy: {
        anchor: 'trip_departure',
        relation: 'before',
        offsetMinutes: 72 * 60,
        semantics: 'mandatory',
      },
    }
    assert.ok(temporalRuleLesen(rule))
    const ergebnis = annehmen(basis, belegt.scope, 'temporal_rule', 'explicit_primary_statement', [belegt], {
      kind: 'temporal_rule',
      rule,
    })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok || ergebnis.claim.fact.kind !== 'temporal_rule') return
    assert.deepEqual(ergebnis.claim.fact.rule, temporalRuleLesen(rule))
    const gebrochen = annehmen(basis, belegt.scope, 'temporal_rule', 'explicit_primary_statement', [belegt], {
      kind: 'temporal_rule',
      rule: {
        kind: 'relative_duration',
        availableFrom: null,
        dueBy: {
          anchor: 'trip_departure',
          relation: 'before',
          offsetMinutes: 1.5,
          semantics: 'mandatory',
        },
      },
    })
    assert.deepEqual(gebrochen, { ok: false, reason: 'invalid_fact' })
    const text = quelle('lib/readiness/rule-claims.ts')
    assert.equal(text.includes("from '@/lib/readiness/temporal'"), true)
    assert.equal(text.includes('temporalRuleLesen'), true)
    assert.equal(text.includes('function offsetMinutesLesen'), false)
  })

  test('Support, Scope und Personenfelder scheitern geschlossen', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'grenze')
    const andere = version(
      basis,
      'example-interior-authority',
      'interior.example',
      'anderes ziel',
      atom({ sourceId: 'example-interior-authority', destinationCountryCode: 'TH' }),
    )
    const fakt = { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' }
    const scope = annehmen(
      basis,
      belegt.scope,
      'requirement_effect',
      'composed_from_multiple_primary_sources',
      [belegt, andere],
      fakt,
    )
    assert.deepEqual(scope, { ok: false, reason: 'scope_mismatch' })

    const kandidat = evidenceKandidatAusModell(
      { scope: atom() },
      {
        canonicalUrl: 'https://www.gov.example/rules/visa',
        retrievedAt: ABGERUFEN,
        sourceSnapshot: 'noch kandidat',
      },
      basis,
    )
    assert.equal(kandidat.ok, true)
    if (!kandidat.ok) return
    const roh = regelKandidatErstellen(
      {
        scope: belegt.scope,
        factKind: 'requirement_effect',
        evidenceQuality: 'explicit_primary_statement',
        supportVersionIds: [kandidat.evidence.versionId],
        proposal: null,
      },
      basis,
    )
    assert.equal(roh.ok, true)
    if (!roh.ok) return
    const nichtAkzeptiert = regelKandidatAkzeptieren({
      kandidat: roh.kandidat,
      trustedRuleFact: fakt,
      evidenceVersions: [kandidat.evidence],
      registry: basis,
    })
    assert.deepEqual(nichtAkzeptiert, { ok: false, reason: 'evidence_not_accepted' })

    const falschVerbunden = regelKandidatAkzeptieren({
      kandidat: roh.kandidat,
      trustedRuleFact: fakt,
      evidenceVersions: [],
      registry: basis,
    })
    assert.deepEqual(falschVerbunden, { ok: false, reason: 'support_mismatch' })

    const zuViel = regelKandidatErstellen(
      {
        scope: belegt.scope,
        factKind: 'requirement_effect',
        evidenceQuality: 'explicit_primary_statement',
        supportVersionIds: Array.from({ length: REGEL_SUPPORT_MAX + 1 }, () => belegt.versionId),
        proposal: null,
      },
      basis,
    )
    assert.deepEqual(zuViel, { ok: false, reason: 'support_bound_exceeded' })

    const person = regelScopeAusEvidenceScope({ ...atom(), userId: 'person-1' })
    assert.deepEqual(person, { ok: false, reason: 'personal_identifier_forbidden' })
    const gesundheit = annehmen(
      basis,
      version(basis, 'example-border-authority', 'gov.example', 'gesundheit', atom({ requirementType: 'health' })).scope,
      'requirement_effect',
      'explicit_primary_statement',
      [version(basis, 'example-border-authority', 'gov.example', 'gesundheit', atom({ requirementType: 'health' }))],
      { kind: 'requirement_effect', effect: 'required', visaMode: null, healthRecord: 'secret' },
    )
    assert.deepEqual(gesundheit, { ok: false, reason: 'personal_identifier_forbidden' })
    const extra = annehmen(basis, belegt.scope, 'requirement_effect', 'explicit_primary_statement', [belegt], {
      kind: 'requirement_effect',
      effect: 'required',
      visaMode: 'electronic_visa',
      note: 'model payload',
    })
    assert.deepEqual(extra, { ok: false, reason: 'invalid_fact' })
  })

  test('regelFaktKanonischLesen prüft den Fakt und nimmt ihn nicht an', () => {
    const basis = registry()
    const gut = regelFaktKanonischLesen(
      'blank_passport_pages',
      'blank_passport_pages',
      { kind: 'blank_passport_pages', minimumPages: 2 },
      basis,
    )
    assert.deepEqual(gut, { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2 } })
    const schlecht = regelFaktKanonischLesen(
      'blank_passport_pages',
      'blank_passport_pages',
      { kind: 'blank_passport_pages', minimumPages: 2, note: 'x' },
      basis,
    )
    assert.deepEqual(schlecht, { ok: false, reason: 'invalid_fact' })
    const text = quelle('lib/readiness/rule-claims.ts')
    const start = text.indexOf('export function regelFaktKanonischLesen')
    const ende = text.indexOf('function qualitaetLesen', start)
    const koerper = text.slice(start, ende)
    assert.match(koerper, /return regelFaktLesen\(/)
    assert.doesNotMatch(koerper, /regelKandidatAkzeptieren/)
  })

  test('Schema 1 läuft durch denselben Parser und bleibt ohne Traveller-Auswertung', () => {
    const basis = registry()
    const belegt = version(basis, 'example-border-authority', 'gov.example', 'schema-1')
    const legacyPflicht = regelFaktKanonischLesen(
      'requirement_effect',
      'visa',
      { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' },
      basis,
    )
    const legacyFrei = regelFaktKanonischLesen(
      'requirement_effect',
      'visa',
      { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
      basis,
    )
    assert.deepEqual(legacyPflicht, {
      ok: true,
      fact: { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa' },
    })
    assert.deepEqual(legacyFrei, {
      ok: true,
      fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
    })

    const flach = { kind: 'requirement_effect', effect: 'conditional', visaMode: null }
    assert.deepEqual(regelFaktKanonischLesen('requirement_effect', 'visa', flach, basis), {
      ok: false,
      reason: 'legacy_conditional_without_payload',
    })
    const flachAngenommen = annehmen(basis, belegt.scope, 'requirement_effect', 'explicit_primary_statement', [belegt], flach)
    assert.deepEqual(flachAngenommen, { ok: false, reason: 'legacy_conditional_without_payload' })
    assert.equal(JSON.stringify(flachAngenommen).includes('auswertung'), false)

    const unbedingt = {
      kind: 'requirement_effect',
      schema: 1,
      applicability: { schema: 1, kind: 'unconditional' },
      effect: 'not_required',
      visaMode: 'visa_exempt',
    }
    const unbedingtGelesen = regelFaktKanonischLesen('requirement_effect', 'visa', unbedingt, basis)
    assert.deepEqual(unbedingtGelesen, { ok: true, fact: unbedingt })

    const zweig = {
      id: 'ordinary',
      when: {
        kind: 'expression',
        expression: { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } },
      },
      outcome: { effect: 'required', visaMode: null },
      supportVersionIds: [] as string[],
    }
    const verzweigt = {
      kind: 'requirement_effect',
      schema: 1,
      applicability: { schema: 1, kind: 'branches', branches: [zweig] },
    }
    const verzweigtGelesen = regelFaktKanonischLesen('requirement_effect', 'visa', verzweigt, basis)
    assert.equal(verzweigtGelesen.ok, true)
    if (verzweigtGelesen.ok && verzweigtGelesen.fact.kind === 'requirement_effect' && 'applicability' in verzweigtGelesen.fact) {
      assert.equal(verzweigtGelesen.fact.schema, 1)
      assert.equal(verzweigtGelesen.fact.applicability.kind, 'branches')
      assert.equal('effect' in verzweigtGelesen.fact, false)
    }

    const gemischt = regelFaktKanonischLesen(
      'requirement_effect',
      'visa',
      { ...verzweigt, effect: 'required', visaMode: null },
      basis,
    )
    assert.deepEqual(gemischt, { ok: false, reason: 'mixed_outcome' })

    const visaUnbedingt = {
      kind: 'visa_options',
      schema: 1,
      options: [
        {
          visaMode: 'visa_exempt',
          eligibility: 'unknown',
          mandate: 'not_mandatory',
          applicability: { schema: 1, kind: 'unconditional' },
        },
      ],
    }
    assert.deepEqual(regelFaktKanonischLesen('visa_options', 'visa', visaUnbedingt, basis), {
      ok: true,
      fact: visaUnbedingt,
    })

    const visaZweig = {
      kind: 'visa_options',
      schema: 1,
      options: [
        {
          visaMode: 'electronic_visa',
          applicability: {
            schema: 1,
            kind: 'branches',
            branches: [
              {
                id: 'ordinary',
                when: zweig.when,
                outcome: { eligibility: 'allowed', mandate: 'not_mandatory' },
                supportVersionIds: [],
              },
            ],
          },
        },
      ],
    }
    const visaZweigGelesen = regelFaktKanonischLesen('visa_options', 'visa', visaZweig, basis)
    assert.equal(visaZweigGelesen.ok, true)
    if (visaZweigGelesen.ok && visaZweigGelesen.fact.kind === 'visa_options' && 'schema' in visaZweigGelesen.fact) {
      assert.equal(visaZweigGelesen.fact.schema, 1)
      assert.equal('eligibility' in visaZweigGelesen.fact.options[0]!, false)
    }

    const gleich = annehmen(basis, belegt.scope, 'requirement_effect', 'explicit_primary_statement', [belegt], unbedingt)
    assert.equal(gleich.ok && unbedingtGelesen.ok, true)
    if (gleich.ok && unbedingtGelesen.ok) assert.deepEqual(unbedingtGelesen.fact, gleich.claim.fact)
    assert.equal(JSON.stringify(gleich).includes('rule-applicability:v1'), false)
    assert.equal(JSON.stringify(gleich).includes('reg-eval-ctx:v1'), false)

    const herkunft = regelFaktKanonischLesen(
      'requirement_effect',
      'visa',
      { kind: 'requirement_effect', effect: 'required', visaMode: 'electronic_visa', licensed_provider_confirmed: true },
      basis,
    )
    assert.deepEqual(herkunft, { ok: false, reason: 'provenance_not_authorized' })

    let verschachtelt: unknown = { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } }
    for (let tiefe = 0; tiefe < 5; tiefe += 1) verschachtelt = { op: 'not', operand: verschachtelt }
    const zuTief = regelFaktKanonischLesen(
      'requirement_effect',
      'health',
      {
        kind: 'requirement_effect',
        schema: 1,
        applicability: {
          schema: 1,
          kind: 'branches',
          branches: [
            {
              id: 'deep',
              when: { kind: 'expression', expression: verschachtelt },
              outcome: { effect: 'required', visaMode: null },
              supportVersionIds: [],
            },
          ],
        },
      },
      basis,
    )
    assert.deepEqual(zuTief, { ok: false, reason: 'depth_exceeded' })

    const zuVieleZweige = regelFaktKanonischLesen(
      'requirement_effect',
      'health',
      {
        kind: 'requirement_effect',
        schema: 1,
        applicability: {
          schema: 1,
          kind: 'branches',
          branches: Array.from({ length: 9 }, (_, index) => ({
            id: `zweig${index}`,
            when: { kind: 'expression', expression: { op: 'atomic', predicate: { kind: 'document_class', documentClass: 'ordinary' } } },
            outcome: { effect: 'required', visaMode: null },
            supportVersionIds: [],
          })),
        },
      },
      basis,
    )
    assert.deepEqual(zuVieleZweige, { ok: false, reason: 'branch_bound_exceeded' })
    const zuVieleOperanden = regelFaktKanonischLesen(
      'requirement_effect',
      'health',
      {
        kind: 'requirement_effect',
        schema: 1,
        applicability: {
          schema: 1,
          kind: 'branches',
          branches: [
            {
              id: 'wide',
              when: {
                kind: 'expression',
                expression: {
                  op: 'all',
                  operands: Array.from({ length: 9 }, () => ({
                    op: 'atomic',
                    predicate: { kind: 'document_class', documentClass: 'ordinary' },
                  })),
                },
              },
              outcome: { effect: 'required', visaMode: null },
              supportVersionIds: [],
            },
          ],
        },
      },
      basis,
    )
    assert.deepEqual(zuVieleOperanden, { ok: false, reason: 'operand_bound_exceeded' })

    const text = quelle('lib/readiness/rule-claims.ts')
    assert.equal((text.match(/regulierungsAnwendbarkeitWirkungLesen\(/g) ?? []).length, 1)
    assert.equal((text.match(/regulierungsAnwendbarkeitVisaOptionLesen\(/g) ?? []).length, 1)
    assert.equal((text.match(/function regelFaktLesen\(/g) ?? []).length, 1)
    assert.equal((text.match(/export function regelKandidatAkzeptieren\(/g) ?? []).length, 1)
    const annahme = text.slice(text.indexOf('export function regelKandidatAkzeptieren'))
    assert.match(annahme, /regelFaktLesen\(/)
    assert.equal(annahme.includes('regulierungsAnwendbarkeitWirkungLesen'), false)
    assert.equal(annahme.includes('regulierungsAnwendbarkeitVisaOptionLesen'), false)
    for (const name of [
      'regulierungsKontextLesen',
      'regulierungsWirkungAuswerten',
      'regulierungsVisaOptionAuswerten',
      'regulierungsAusdruckAuswerten',
      'regelAnwendbarkeitFingerprint',
    ]) {
      assert.equal(text.includes(name), false, name)
    }
    assert.equal(text.includes('rule-applicability:v1'), false)
    assert.equal(text.includes('reg-eval-ctx:v1'), false)
    assert.equal(text.includes("reason: 'applicability_not_persistable'"), false)
  })
})
