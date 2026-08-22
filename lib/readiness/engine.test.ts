// lib/readiness/engine.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialRequirementsPruefen, requirementsEvaluationsPruefen } from '@/lib/readiness/anforderungen'
import { officialFingerprint, requirementsAuswerten, requirementsFuerReise, travellerGeloeschtPruefen } from '@/lib/readiness/engine'
import {
  officialAktionAusQuelle,
  officialEvidenceVertrauenswuerdig,
  officialFrische,
  quelleUrlLesen,
} from '@/lib/readiness/official'
import { fehlendeFaktenFuerReise, slotMissingFactsErgaenzen, travellerSlots } from '@/lib/readiness/party'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { RequirementsProvider } from '@/lib/readiness/provider'
import type { TripTraveller } from '@/types/trips'

const JETZT = '2026-08-22T08:00:00.000Z'

function reisende(teil: Partial<TripTraveller> & Pick<TripTraveller, 'clientRef'>): TripTraveller {
  return {
    id: teil.clientRef,
    label: teil.label ?? null,
    nationalityCountryCode: null,
    residenceCountryCode: null,
    documentType: null,
    documentIssuingCountryCode: null,
    documentExpiresOn: null,
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

const testProvider: RequirementsProvider = {
  name: 'test-double',
  evaluate(anfrage) {
    return anfrage.travellers.flatMap((traveller) =>
      anfrage.destinationCountryCodes.map((destination) => ({
        travellerClientRef: traveller.clientRef,
        destinationCountryCode: destination,
        requirementType: 'visa' as const,
        result:
          traveller.nationalityCountryCode === 'CH' && destination === 'TH'
            ? ('required' as const)
            : traveller.nationalityCountryCode === 'DE' && destination === 'TH'
              ? ('not_required' as const)
              : ('conditional' as const),
        officialClass: 'requirement' as const,
        authority: 'Test',
        sourceUrl: 'https://example.test/visa',
        checkedAt: JETZT,
        validUntil: '2026-12-31',
      })),
    )
  },
}

describe('Travel Requirements Engine', () => {
  test('ohne Provider keine Visa-/Passbehauptung', () => {
    const evaluations = requirementsFuerReise(
      beispielreise({
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    assert.ok(evaluations.length > 0)
    for (const evaluation of evaluations) {
      assert.notEqual(evaluation.result, 'required')
      assert.notEqual(evaluation.result, 'not_required')
      assert.notEqual(evaluation.result, 'conditional')
      assert.equal(evaluation.evidence.provider, null)
    }
  })

  test('LLM- oder Browser-Behauptung überschreibt Official Truth nicht', () => {
    const official = officialRequirementsPruefen({
      destinationCountryCode: 'TH',
      officialResult: 'not_required',
      llmResult: 'required',
      result: 'required',
    } as never)
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
  })

  test('fehlende Nationalität bleibt insufficient_context', () => {
    const evaluations = requirementsFuerReise(beispielreise({ travellers: 1, party: [] }))
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.status, 'insufficient_context')
    assert.ok(visa?.missingFacts.includes('nationality'))
    assert.equal(visa?.result, 'unknown')
  })

  test('bekannte Fakten werden nicht erneut verlangt', () => {
    const reise = beispielreise({
      travellers: 1,
      party: [
        reisende({
          clientRef: 'traveller:1',
          nationalityCountryCode: 'CH',
          residenceCountryCode: 'CH',
          documentType: 'passport',
          documentIssuingCountryCode: 'CH',
          documentExpiresOn: '2030-01-01',
        }),
      ],
    })
    const slot = travellerSlots(reise)[0]
    assert.deepEqual(slot?.missingFacts, [])
    assert.ok(!fehlendeFaktenFuerReise(reise).includes('nationality'))
  })

  test('unterschiedliche Nationalitäten werden nicht vermischt', () => {
    const reise = beispielreise({
      travellers: 2,
      stages: beispielreise().stages.map((etappe) => ({ ...etappe, countryCode: 'TH' })),
      party: [
        reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' }),
        reisende({ clientRef: 'traveller:2', nationalityCountryCode: 'DE' }),
      ],
    })
    const evaluations = requirementsFuerReise(reise, testProvider)
    const ch = evaluations.find(
      (eintrag) => eintrag.travellerClientRef === 'traveller:1' && eintrag.requirementType === 'visa',
    )
    const de = evaluations.find(
      (eintrag) => eintrag.travellerClientRef === 'traveller:2' && eintrag.requirementType === 'visa',
    )
    assert.equal(ch?.result, 'required')
    assert.equal(de?.result, 'not_required')
    assert.notEqual(ch?.result, de?.result)
  })

  test('gelöschter Traveller entfernt seine Evaluation', () => {
    const mit = beispielreise({
      travellers: 2,
      party: [
        reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' }),
        reisende({ clientRef: 'traveller:2', nationalityCountryCode: 'DE' }),
      ],
    })
    const ohne = beispielreise({
      travellers: 1,
      party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
    })
    assert.ok(requirementsFuerReise(mit).some((eintrag) => eintrag.travellerClientRef === 'traveller:2'))
    assert.ok(!requirementsFuerReise(ohne).some((eintrag) => eintrag.travellerClientRef === 'traveller:2'))
    assert.equal(travellerGeloeschtPruefen(ohne, 'traveller:2'), true)
    assert.equal(travellerGeloeschtPruefen(mit, 'traveller:2'), false)
  })

  test('Provider required/not_required/conditional nur über injizierten Port', () => {
    const anfrage = {
      originCountryCode: null,
      destinationCountryCodes: ['US'],
      transitCountryCodes: [],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          nationalityCountryCode: 'FR',
          residenceCountryCode: 'FR',
          documentType: 'passport' as const,
          documentIssuingCountryCode: 'FR',
          documentExpiresOn: '2030-01-01',
        },
      ],
    }
    const evaluations = requirementsAuswerten(anfrage, testProvider)
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'conditional')
    assert.equal(visa?.freshness, 'current')
    assert.equal(requirementsAuswerten(anfrage, null)[0]?.result, 'unknown')
  })

  test('Health Pflicht und Empfehlung bleiben getrennt', () => {
    const provider: RequirementsProvider = {
      name: 'health-double',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'vaccination',
            result: 'required',
            officialClass: 'requirement',
            authority: 'Health',
            checkedAt: JETZT,
            sourceUrl: 'https://example.test/health',
          },
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'health',
            result: 'unknown',
            officialClass: 'recommendation',
            authority: 'Health',
            checkedAt: JETZT,
            sourceUrl: 'https://example.test/health',
          },
        ]
      },
    }
    const evaluations = requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
      provider,
    )
    const impf = evaluations.find((eintrag) => eintrag.requirementType === 'vaccination')
    const gesundheit = evaluations.find((eintrag) => eintrag.requirementType === 'health')
    assert.equal(impf?.officialClass, 'requirement')
    assert.equal(gesundheit?.officialClass, 'recommendation')
    assert.notEqual(impf?.officialClass, gesundheit?.officialClass)
  })

  test('Source URL wird validiert', () => {
    assert.equal(quelleUrlLesen('https://example.test/a'), 'https://example.test/a')
    assert.equal(quelleUrlLesen('javascript:alert(1)'), null)
    assert.equal(quelleUrlLesen('http://example.test/a'), null)
    assert.equal(quelleUrlLesen('https://user:pass@example.test/a'), null)
  })

  test('Freshness: veralteter Fingerprint ist stale, abgelaufene Gültigkeit recheck', () => {
    const fingerprint = officialFingerprint({
      travellerClientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      residenceCountryCode: null,
      documentType: null,
      documentIssuingCountryCode: null,
      documentExpiresOn: null,
      destinationCountryCode: 'TH',
      transitCountryCodes: [],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      requirementType: 'visa',
    })
    assert.equal(
      officialFrische({
        storedFingerprint: 'alt',
        currentFingerprint: fingerprint,
        checkedAt: JETZT,
        validUntil: '2027-01-01',
        hasProvider: true,
      }),
      'stale',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: fingerprint,
        currentFingerprint: fingerprint,
        checkedAt: JETZT,
        validUntil: '2026-01-01',
        now: '2026-08-22T00:00:00.000Z',
        hasProvider: true,
      }),
      'recheck_needed',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: fingerprint,
        currentFingerprint: fingerprint,
        checkedAt: JETZT,
        validUntil: '2027-01-01',
        hasProvider: false,
      }),
      'provider_unavailable',
    )
  })

  test('Transit ohne belastbare Route bleibt insufficient_context', () => {
    const evaluations = requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    const transit = evaluations.find((eintrag) => eintrag.requirementType === 'transit')
    assert.equal(transit?.result, 'unknown')
    assert.ok(transit?.missingFacts.includes('transit_itinerary'))
  })

  test('alle Pflicht-Requirement-Typen werden pro Reisendem und Ziel bewertet', () => {
    const evaluations = requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    const typen = new Set(evaluations.map((eintrag) => eintrag.requirementType))
    for (const typ of [
      'visa',
      'electronic_travel_authorization',
      'passport',
      'identity_document',
      'passport_validity',
      'transit',
      'health',
      'vaccination',
      'health_document',
      'entry_form',
      'insurance',
      'onward_or_return_ticket',
      'booking_or_travel_document',
      'other_entry_requirement',
    ] as const) {
      assert.ok(typen.has(typ), typ)
    }
  })

  test('Mehrländerreise erzeugt getrennte Destination-Evaluations', () => {
    const reise = beispielreise({
      travellers: 1,
      stages: [
        { ...beispielreise().stages[0]!, countryCode: 'TH', name: 'Bangkok' },
        { ...beispielreise().stages[1]!, countryCode: 'JP', name: 'Tokio' },
      ],
      party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
    })
    const visa = requirementsFuerReise(reise).filter((eintrag) => eintrag.requirementType === 'visa')
    const laender = visa.map((eintrag) => eintrag.destinationCountryCode).sort()
    assert.deepEqual(laender, ['JP', 'TH'])
  })

  test('Destination-, Datums- oder Nationalitätswechsel ändert Official Fingerprint', () => {
    const basis = {
      travellerClientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      residenceCountryCode: 'CH',
      documentType: 'passport',
      documentIssuingCountryCode: 'CH',
      documentExpiresOn: '2030-01-01',
      originCountryCode: null,
      destinationCountryCode: 'TH',
      transitCountryCodes: [] as string[],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      requirementType: 'visa',
    }
    const aktuell = officialFingerprint(basis)
    assert.notEqual(aktuell, officialFingerprint({ ...basis, destinationCountryCode: 'JP' }))
    assert.notEqual(aktuell, officialFingerprint({ ...basis, startDate: '2026-10-01' }))
    assert.notEqual(aktuell, officialFingerprint({ ...basis, nationalityCountryCode: 'DE' }))
    assert.notEqual(aktuell, officialFingerprint({ ...basis, transitCountryCodes: ['QA'] }))
  })

  test('Transit-Itinerary macht transit_itinerary nicht mehr missing', () => {
    const evaluations = requirementsAuswerten({
      originCountryCode: 'CH',
      destinationCountryCodes: ['TH'],
      transitCountryCodes: ['QA'],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          nationalityCountryCode: 'CH',
          residenceCountryCode: 'CH',
          documentType: 'passport',
          documentIssuingCountryCode: 'CH',
          documentExpiresOn: '2030-01-01',
        },
      ],
    })
    const transit = evaluations.find((eintrag) => eintrag.requirementType === 'transit')
    assert.ok(transit)
    assert.ok(!transit?.missingFacts.includes('transit_itinerary'))
    assert.equal(transit?.result, 'unknown')
    assert.equal(transit?.freshness, 'provider_unavailable')
  })

  test('Official Action nur aus validierter HTTPS-Quelle', () => {
    assert.equal(officialAktionAusQuelle('https://example.test/visa')?.href, 'https://example.test/visa')
    assert.equal(officialAktionAusQuelle('javascript:alert(1)'), null)
    assert.equal(officialAktionAusQuelle('http://example.test/visa'), null)
    const ohneProvider = requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    assert.ok(ohneProvider.every((eintrag) => eintrag.action === null))
    const mitQuelle = requirementsAuswerten(
      {
        originCountryCode: 'CH',
        destinationCountryCodes: ['US'],
        transitCountryCodes: [],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        travellers: [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: 'FR',
            residenceCountryCode: 'FR',
            documentType: 'passport',
            documentIssuingCountryCode: 'FR',
            documentExpiresOn: '2030-01-01',
          },
        ],
      },
      testProvider,
    )
    const visa = mitQuelle.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.action?.kind, 'open_official_source')
    assert.equal(visa?.action?.href, 'https://example.test/visa')
  })

  test('temporär nicht erreichbare Quelle bleibt unknown und nicht required', () => {
    const provider: RequirementsProvider = {
      name: 'down-double',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'required',
            checkedAt: JETZT,
            sourceUrl: 'https://example.test/visa',
            availability: 'temporarily_unavailable',
          },
        ]
      },
    }
    const evaluations = requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
      provider,
    )
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'unknown')
    assert.equal(visa?.freshness, 'source_temporarily_unavailable')
    assert.equal(visa?.action, null)
  })

  test('ohne Provider erfindet die Engine keine Transit- oder Health-Aussage', () => {
    const evaluations = requirementsAuswerten({
      originCountryCode: 'CH',
      destinationCountryCodes: ['TH'],
      transitCountryCodes: ['QA'],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          nationalityCountryCode: 'CH',
          residenceCountryCode: 'CH',
          documentType: 'passport',
          documentIssuingCountryCode: 'CH',
          documentExpiresOn: '2030-01-01',
        },
      ],
    })
    for (const evaluation of evaluations) {
      assert.equal(evaluation.result, 'unknown')
      assert.notEqual(evaluation.result, 'required')
      assert.notEqual(evaluation.result, 'not_required')
    }
  })

  test('2 Traveller × 2 Destinationen bleiben getrennte Evaluations', () => {
    const evaluations = requirementsEvaluationsPruefen(
      {
        destinationCountryCodes: ['TH', 'JP'],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        party: [
          { clientRef: 'traveller:1', nationalityCountryCode: 'CH' },
          { clientRef: 'traveller:2', nationalityCountryCode: 'DE' },
        ],
      },
      testProvider,
    )
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.length, 4)
    assert.equal(
      visa.find((eintrag) => eintrag.travellerClientRef === 'traveller:1' && eintrag.destinationCountryCode === 'TH')
        ?.result,
      'required',
    )
    assert.equal(
      visa.find((eintrag) => eintrag.travellerClientRef === 'traveller:2' && eintrag.destinationCountryCode === 'TH')
        ?.result,
      'not_required',
    )
    assert.ok(evaluations.filter((eintrag) => eintrag.requirementType === 'passport').length >= 2)
  })

  test('required ohne belastbare Evidence bleibt unknown', () => {
    const ohneZeit: RequirementsProvider = {
      name: 'thin',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
          },
        ]
      },
    }
    const ungueltig: RequirementsProvider = {
      name: 'thin',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: 'gestern',
          },
        ]
      },
    }
    const ohneUrl: RequirementsProvider = {
      name: 'thin',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            sourceUrl: 'javascript:alert(1)',
            checkedAt: JETZT,
          },
        ]
      },
    }
    const anfrage = {
      originCountryCode: 'CH',
      destinationCountryCodes: ['US'],
      transitCountryCodes: [] as string[],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          nationalityCountryCode: 'FR',
          residenceCountryCode: 'FR',
          documentType: 'passport' as const,
          documentIssuingCountryCode: 'FR',
          documentExpiresOn: '2030-01-01',
        },
      ],
    }
    assert.equal(requirementsAuswerten(anfrage, ohneZeit).find((e) => e.requirementType === 'visa')?.result, 'unknown')
    assert.equal(requirementsAuswerten(anfrage, ungueltig).find((e) => e.requirementType === 'visa')?.result, 'unknown')
    const ohneQuelle = requirementsAuswerten(anfrage, ohneUrl).find((e) => e.requirementType === 'visa')
    assert.equal(ohneQuelle?.result, 'unknown')
    assert.equal(ohneQuelle?.action, null)
  })

  test('zwei Transitländer bleiben getrennte Evaluations', () => {
    const provider: RequirementsProvider = {
      name: 'transit-double',
      evaluate(anfrage) {
        return anfrage.transitCountryCodes.map((transit) => ({
          travellerClientRef: anfrage.travellers[0]!.clientRef,
          destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
          transitCountryCode: transit,
          requirementType: 'transit' as const,
          result: transit === 'QA' ? ('required' as const) : ('not_required' as const),
          officialClass: 'requirement' as const,
          authority: 'Transit',
          sourceUrl: 'https://example.test/transit',
          checkedAt: JETZT,
        }))
      },
    }
    const evaluations = requirementsAuswerten(
      {
        originCountryCode: 'CH',
        destinationCountryCodes: ['TH', 'JP'],
        transitCountryCodes: ['QA', 'SG'],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        travellers: [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: 'CH',
            residenceCountryCode: 'CH',
            documentType: 'passport',
            documentIssuingCountryCode: 'CH',
            documentExpiresOn: '2030-01-01',
          },
        ],
      },
      provider,
    )
    const transit = evaluations.filter((eintrag) => eintrag.requirementType === 'transit')
    assert.equal(transit.length, 4)
    assert.equal(
      transit.find((eintrag) => eintrag.destinationCountryCode === 'TH' && eintrag.transitCountryCode === 'QA')?.result,
      'required',
    )
    assert.equal(
      transit.find((eintrag) => eintrag.destinationCountryCode === 'TH' && eintrag.transitCountryCode === 'SG')?.result,
      'not_required',
    )
    const identisch = requirementsAuswerten(
      {
        originCountryCode: 'CH',
        destinationCountryCodes: ['TH'],
        transitCountryCodes: ['QA'],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        travellers: [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: 'CH',
            residenceCountryCode: 'CH',
            documentType: 'passport',
            documentIssuingCountryCode: 'CH',
            documentExpiresOn: '2030-01-01',
          },
        ],
      },
      {
        name: 'dup',
        evaluate(anfrage) {
          const zeile = {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: 'TH',
            transitCountryCode: 'QA',
            requirementType: 'transit' as const,
            result: 'required' as const,
            authority: 'Transit',
            sourceUrl: 'https://example.test/transit',
            checkedAt: JETZT,
          }
          return [zeile, zeile]
        },
      },
    ).filter((eintrag) => eintrag.requirementType === 'transit')
    assert.equal(identisch.length, 1)
  })

  test('Provider missingFacts bleiben strukturiert und blockieren required', () => {
    const provider: RequirementsProvider = {
      name: 'facts-double',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'insufficient_context',
            missingFacts: ['residence', 'document_expiry', 'origin_country'],
          },
        ]
      },
    }
    const evaluations = requirementsAuswerten(
      {
        originCountryCode: null,
        destinationCountryCodes: ['TH'],
        transitCountryCodes: [],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        travellers: [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: 'CH',
            residenceCountryCode: null,
            documentType: 'passport',
            documentIssuingCountryCode: 'CH',
            documentExpiresOn: null,
          },
        ],
      },
      provider,
    )
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'unknown')
    assert.equal(visa?.status, 'insufficient_context')
    assert.ok(visa?.missingFacts.includes('residence'))
    assert.ok(visa?.missingFacts.includes('document_expiry'))
    assert.ok(visa?.missingFacts.includes('origin_country'))
    assert.ok(!visa?.missingFacts.includes('nationality'))
    const slot = slotMissingFactsErgaenzen(travellerSlots({ travellers: 1, party: [] })[0]!, visa?.missingFacts ?? [])
    assert.ok(slot.missingFacts.includes('residence'))
    assert.ok(!slot.missingFacts.includes('origin_country'))
  })

  test('bekannte origin_country und transit_itinerary werden nicht erneut verlangt', () => {
    const provider: RequirementsProvider = {
      name: 'facts-double',
      evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'insufficient_context',
            missingFacts: ['origin_country', 'transit_itinerary', 'residence'],
          },
        ]
      },
    }
    const evaluations = requirementsAuswerten(
      {
        originCountryCode: 'CH',
        destinationCountryCodes: ['TH'],
        transitCountryCodes: ['QA'],
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        travellers: [
          {
            clientRef: 'traveller:1',
            nationalityCountryCode: 'CH',
            residenceCountryCode: null,
            documentType: 'passport',
            documentIssuingCountryCode: 'CH',
            documentExpiresOn: '2030-01-01',
          },
        ],
      },
      provider,
    )
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.status, 'insufficient_context')
    assert.ok(!visa?.missingFacts.includes('origin_country'))
    assert.ok(!visa?.missingFacts.includes('transit_itinerary'))
    assert.ok(visa?.missingFacts.includes('residence'))
    assert.ok(!visa?.missingFacts.includes('nationality'))
  })

  test('Official Evidence braucht Provider, Zeit, Authority und HTTPS-Quelle', () => {
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: JETZT,
        authority: 'Test',
        sourceUrl: 'https://example.test/visa',
      }),
      true,
    )
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: null,
        checkedAt: JETZT,
        authority: 'Test',
        sourceUrl: 'https://example.test/visa',
      }),
      false,
    )
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: null,
        authority: 'Test',
        sourceUrl: 'https://example.test/visa',
      }),
      false,
    )
  })
})
