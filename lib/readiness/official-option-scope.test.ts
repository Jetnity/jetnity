// lib/readiness/official-option-scope.test.ts
//
// P1-TA-02: OfficialEvaluation[] bleibt Hard Truth.
// Legacy-`official` darf nicht evaluations[0] als globale Wahrheit verkaufen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  officialAusEvaluations,
  officialFuerItem,
  officialRequirementsPruefen,
} from '@/lib/readiness/anforderungen'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import { readinessAnsicht } from '@/lib/readiness/status'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { TripTraveller } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'
const GESTERN = '2026-08-21T08:00:00.000Z'

function ev(
  teil: Partial<OfficialEvaluation> &
    Pick<OfficialEvaluation, 'travellerClientRef' | 'destinationCountryCode'>,
): OfficialEvaluation {
  return {
    transitCountryCode: null,
    requirementType: 'visa',
    result: 'unknown',
    status: 'unavailable',
    freshness: 'provider_unavailable',
    officialClass: 'unknown',
    missingFacts: [],
    credentialOptionRef: `${teil.travellerClientRef ?? 'traveller:1'}:none`,
    action: null,
    ...teil,
    evidence: {
      provider: 'test',
      authority: null,
      sourceUrl: null,
      checkedAt: null,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: 'off',
      ...(teil.evidence ?? {}),
    },
  }
}

function evidence(authority: string, sourceUrl: string, checkedAt = JETZT) {
  return {
    provider: 'test',
    authority,
    sourceUrl,
    checkedAt,
    validFrom: null,
    validUntil: '2026-12-31' as const,
    ruleReference: authority,
    contextFingerprint: authority,
  }
}

describe('P1-TA-02 Official Option-Scope / Presentation Truth', () => {
  test('1. ein Traveller, eine Citizenship, ein Dokument bleibt korrekt', () => {
    const eine = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-ch',
      destinationCountryCode: 'TH',
      status: 'current',
      freshness: 'current',
      evidence: evidence('Thai Immigration', 'https://immi.example/th'),
    })
    const official = officialAusEvaluations([eine])
    assert.equal(official.result, 'unknown')
    assert.equal(official.status, 'unknown')
    assert.equal(official.destinationCountryCode, 'TH')
    assert.equal(official.authority, 'Thai Immigration')
    assert.equal(official.sourceUrl, 'https://immi.example/th')
    assert.equal(official.checkedAt, JETZT)
  })

  test('2. ein Traveller, zwei Citizenships / Optionen kollabiert nicht auf die erste', () => {
    const ch = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-ch',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-CH', 'https://ch.example/visa'),
    })
    const de = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-de',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-DE', 'https://de.example/visa'),
    })
    const official = officialAusEvaluations([ch, de])
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
    assert.equal(official.checkedAt, null)
    assert.equal(official.validityUntil, null)
    assert.equal(official.destinationCountryCode, 'TH')
    assert.equal(official.status, 'unavailable')
    assert.equal(official.reason, 'insufficient_context')
  })

  test('3. ein Traveller, mehrere Dokumente / Credential-Optionen', () => {
    const pass = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass',
      destinationCountryCode: 'US',
      status: 'insufficient_context',
      missingFacts: ['document_expiry'],
      evidence: evidence('CISA', 'https://cisa.example/visa'),
    })
    const id = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:id',
      destinationCountryCode: 'US',
      status: 'insufficient_context',
      missingFacts: ['document_type'],
      evidence: evidence('CBP', 'https://cbp.example/entry'),
    })
    const official = officialAusEvaluations([pass, id])
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
    assert.equal(official.result, 'unknown')
  })

  test('4. zwei Traveller mit unterschiedlichen Citizenships', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-ch',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-A', 'https://a.example/visa'),
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      credentialOptionRef: 'traveller:2:pass-de',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-B', 'https://b.example/visa'),
    })
    const official = officialAusEvaluations([a, b])
    assert.equal(official.authority, null)
    assert.equal(official.reason, 'multiple_travellers_no_individual_evidence')
    assert.equal(official.destinationCountryCode, 'TH')
    assert.equal(official.result, 'unknown')
  })

  test('5. zwei Traveller mit unterschiedlichen Evaluation-Status', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      status: 'unavailable',
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      destinationCountryCode: 'TH',
      status: 'insufficient_context',
      missingFacts: ['nationality'],
    })
    const official = officialAusEvaluations([a, b])
    assert.equal(official.status, 'insufficient_context')
    assert.equal(official.reason, 'multiple_travellers_no_individual_evidence')
    assert.equal(official.authority, null)
  })

  test('6. zwei Credential-Optionen mit unterschiedlichem Status/Kontext', () => {
    const erlaubt = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-ch',
      destinationCountryCode: 'JP',
      status: 'current',
      freshness: 'current',
      result: 'not_required',
      evidence: evidence('MOJ', 'https://moj.example/visa'),
    })
    const unklar = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:id-ch',
      destinationCountryCode: 'JP',
      status: 'insufficient_context',
      freshness: 'never_checked',
      result: 'unknown',
      missingFacts: ['document_type'],
    })
    const official = officialAusEvaluations([erlaubt, unklar])
    assert.equal(official.result, 'unknown')
    assert.equal(official.status, 'insufficient_context')
    assert.equal(official.authority, null)
    assert.notEqual(official.authority, 'MOJ')
  })

  test('7. mehrere Destination Countries werden nicht auf die erste reduziert', () => {
    const th = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      evidence: evidence('Thai', 'https://th.example/visa'),
    })
    const jp = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'JP',
      evidence: evidence('Japan', 'https://jp.example/visa'),
    })
    const official = officialAusEvaluations([th, jp])
    assert.equal(official.destinationCountryCode, null)
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
  })

  test('8. Transit + Destination bleiben getrennte Scopes', () => {
    const dest = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      transitCountryCode: null,
      evidence: evidence('Thai', 'https://th.example/visa'),
    })
    const transit = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      transitCountryCode: 'QA',
      requirementType: 'transit',
      evidence: evidence('Qatar', 'https://qa.example/transit'),
    })
    const official = officialAusEvaluations([dest, transit])
    assert.equal(official.destinationCountryCode, 'TH')
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
    assert.equal(official.checkedAt, null)
  })

  test('9. fehlende Nationality bleibt fail-closed', () => {
    const official = officialRequirementsPruefen({ destinationCountryCode: 'TH', travellers: 1 })
    assert.equal(official.result, 'unknown')
    assert.ok(official.status === 'unavailable' || official.status === 'insufficient_context')
    assert.equal(official.authority, null)
    const leer = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      status: 'insufficient_context',
      missingFacts: ['nationality'],
    })
    assert.equal(officialAusEvaluations([leer]).reason, 'missing_nationality')
  })

  test('10. fehlendes Dokument erzeugt keine Default-Pass-Wahrheit', () => {
    const traveller: TripTraveller = {
      id: 't1',
      clientRef: 'traveller:1',
      label: 'Alex',
      residenceCountryCode: 'CH',
      citizenships: [{ id: 'c1', clientRef: 'cit:ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT }],
      documents: [],
      createdAt: JETZT,
      updatedAt: JETZT,
    }
    const options = credentialOptionsAus(traveller)
    assert.equal(options.length, 1)
    assert.match(options[0]?.optionRef ?? '', /:none$/)
    const official = officialAusEvaluations([
      ev({
        travellerClientRef: 'traveller:1',
        credentialOptionRef: options[0]?.optionRef ?? 'traveller:1:none',
        destinationCountryCode: 'TH',
        status: 'insufficient_context',
        missingFacts: ['document_type'],
      }),
    ])
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
  })

  test('11. Provider unavailable bleibt unavailable und ohne Authority', () => {
    const official = officialAusEvaluations([
      ev({
        travellerClientRef: 'traveller:1',
        destinationCountryCode: 'TH',
        status: 'unavailable',
        freshness: 'provider_unavailable',
      }),
    ])
    assert.equal(official.status, 'unavailable')
    assert.equal(official.authority, null)
    assert.equal(official.result, 'unknown')
  })

  test('12. stale / current gemischt bleibt fail-closed in der Compatibility-Lage', () => {
    const aktuell = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-ch',
      destinationCountryCode: 'TH',
      status: 'current',
      freshness: 'current',
      evidence: evidence('Thai', 'https://th.example/visa'),
    })
    const alt = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:pass-de',
      destinationCountryCode: 'TH',
      status: 'unknown',
      freshness: 'stale',
      evidence: evidence('Thai-alt', 'https://th.example/old'),
    })
    const official = officialAusEvaluations([aktuell, alt])
    assert.equal(official.authority, null)
    assert.equal(official.status, 'unknown')
    const { summary } = readinessAnsicht(beispielreise({ travellers: 1 }), [aktuell, alt])
    assert.equal(summary.officialFreshness, 'stale')
    assert.equal(summary.officialResult, 'unknown')
  })

  test('13. Reihenfolge A,B und B,A liefert dieselbe Aggregat-Bedeutung', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:a',
      destinationCountryCode: 'TH',
      status: 'unavailable',
      evidence: evidence('Authority-A', 'https://a.example/visa', JETZT),
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      credentialOptionRef: 'traveller:2:b',
      destinationCountryCode: 'JP',
      status: 'insufficient_context',
      missingFacts: ['nationality'],
      evidence: evidence('Authority-B', 'https://b.example/visa', GESTERN),
    })
    assert.deepEqual(officialAusEvaluations([a, b]), officialAusEvaluations([b, a]))
  })

  test('14. kein Evaluations-Eintrag bleibt leer / unavailable', () => {
    const official = officialAusEvaluations([], { destinationCountryCode: 'TH', travellers: 1 })
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
    assert.equal(official.sourceUrl, null)
    assert.equal(official.checkedAt, null)
    assert.ok(official.status === 'unavailable' || official.status === 'insufficient_context')
  })

  test('15. Item für Traveller A erhält nicht Evaluation von Traveller B', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-A', 'https://a.example/visa'),
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-B', 'https://b.example/visa'),
    })
    const fuerA = officialFuerItem([a, b], { countryCode: 'TH', travellerClientRef: 'traveller:1' })
    const fuerB = officialFuerItem([a, b], { countryCode: 'TH', travellerClientRef: 'traveller:2' })
    assert.equal(fuerA.authority, 'Authority-A')
    assert.equal(fuerB.authority, 'Authority-B')
    assert.notEqual(fuerA.authority, fuerB.authority)
  })

  test('16. Item für Destination X erhält nicht Evaluation von Destination Y', () => {
    const th = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      evidence: evidence('Thai', 'https://th.example/visa'),
    })
    const jp = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'JP',
      evidence: evidence('Japan', 'https://jp.example/visa'),
    })
    const fuerTh = officialFuerItem([th, jp], { countryCode: 'TH', travellerClientRef: 'traveller:1' })
    const fuerJp = officialFuerItem([th, jp], { countryCode: 'JP', travellerClientRef: 'traveller:1' })
    assert.equal(fuerTh.authority, 'Thai')
    assert.equal(fuerJp.authority, 'Japan')
    assert.equal(fuerTh.destinationCountryCode, 'TH')
    assert.equal(fuerJp.destinationCountryCode, 'JP')
  })

  test('17. keine erfundene Authority / Source / checkedAt aus fremder Option', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      evidence: evidence('Authority-A', 'https://a.example/visa'),
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      destinationCountryCode: 'JP',
      evidence: evidence('Authority-B', 'https://b.example/visa', GESTERN),
    })
    const basis = beispielreise({ travellers: 2 })
    const { items, summary } = readinessAnsicht(
      beispielreise({
        travellers: 2,
        stages: [
          { ...basis.stages[0], countryCode: 'TH' },
          { ...basis.stages[1], countryCode: 'JP' },
        ],
      }),
      [a, b],
    )
    const t1jp = items.find(
      (item) => item.kind === 'entry_check' && item.countryCode === 'JP' && item.travellerClientRef === 'traveller:1',
    )
    assert.ok(t1jp)
    assert.equal(t1jp?.official.authority, null)
    assert.equal(t1jp?.official.sourceUrl, null)
    assert.equal(t1jp?.official.checkedAt, null)
    assert.notEqual(t1jp?.official.authority, 'Authority-A')
    assert.notEqual(t1jp?.official.authority, 'Authority-B')
    assert.equal(summary.officialResult, 'unknown')
    assert.equal(officialAusEvaluations([a, b]).authority, null)
  })

  test('18. result bleibt fail-closed ohne eindeutige Hard Truth', () => {
    const required = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      result: 'required',
      status: 'current',
      evidence: evidence('Thai', 'https://th.example/visa'),
    })
    const notRequired = ev({
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:other',
      destinationCountryCode: 'TH',
      result: 'not_required',
      status: 'current',
      evidence: evidence('Thai-2', 'https://th.example/other'),
    })
    assert.equal(officialAusEvaluations([required]).result, 'unknown')
    assert.equal(officialAusEvaluations([required, notRequired]).result, 'unknown')
    assert.notEqual(officialAusEvaluations([required, notRequired]).result, 'required')
    assert.notEqual(officialAusEvaluations([required, notRequired]).result, 'not_required')
  })

  test('19. kein documents[0]-Fallback in diesem Slice; kanonischer Option-Pfad bleibt 1:n', () => {
    const traveller: TripTraveller = {
      id: 't1',
      clientRef: 'traveller:1',
      label: 'Alex',
      residenceCountryCode: 'CH',
      citizenships: [
        { id: 'c1', clientRef: 'cit:ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { id: 'c2', clientRef: 'cit:de', countryCode: 'DE', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          id: 'd1',
          clientRef: 'doc:pass',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          citizenshipClientRef: 'cit:ch',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          id: 'd2',
          clientRef: 'doc:id',
          documentType: 'national_id',
          issuingCountryCode: 'DE',
          expiresOn: '2029-01-01',
          citizenshipClientRef: 'cit:de',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    }
    const options = credentialOptionsAus(traveller)
    assert.equal(options.length, 2)
    assert.notEqual(options[0]?.optionRef, options[1]?.optionRef)
    const official = officialAusEvaluations(
      options.map((option, index) =>
        ev({
          travellerClientRef: 'traveller:1',
          credentialOptionRef: option.optionRef,
          destinationCountryCode: 'TH',
          evidence: evidence(`Auth-${index}`, `https://opt${index}.example/visa`),
        }),
      ),
    )
    assert.equal(official.authority, null)
    assert.doesNotMatch(JSON.stringify(official), /documents\[0\]/)
  })

  test('20. Summary und API-Compatibility sind permutationsstabil und nicht first-eval', () => {
    const a = ev({
      travellerClientRef: 'traveller:1',
      destinationCountryCode: 'TH',
      status: 'unavailable',
      evidence: evidence('Authority-A', 'https://a.example/visa'),
    })
    const b = ev({
      travellerClientRef: 'traveller:2',
      destinationCountryCode: 'JP',
      status: 'insufficient_context',
      missingFacts: ['nationality'],
      evidence: evidence('Authority-B', 'https://b.example/visa', GESTERN),
    })
    const basis = beispielreise({ travellers: 2 })
    const reise = beispielreise({
      travellers: 2,
      stages: [
        { ...basis.stages[0], countryCode: 'TH' },
        { ...basis.stages[1], countryCode: 'JP' },
      ],
    })
    const vorwaerts = readinessAnsicht(reise, [a, b])
    const rueckwaerts = readinessAnsicht(reise, [b, a])
    assert.equal(vorwaerts.summary.officialStatus, rueckwaerts.summary.officialStatus)
    assert.equal(vorwaerts.summary.officialReason, rueckwaerts.summary.officialReason)
    assert.equal(vorwaerts.summary.officialResult, 'unknown')
    assert.equal(vorwaerts.summary.officialReason, 'multiple_travellers_no_individual_evidence')
    assert.equal(officialAusEvaluations([a, b]).status, officialAusEvaluations([b, a]).status)
    assert.equal(officialAusEvaluations([a, b]).authority, null)
    assert.equal(vorwaerts.evaluations.length, 2)
  })
})
