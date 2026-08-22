// lib/readiness/engine.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialRequirementsPruefen } from '@/lib/readiness/anforderungen'
import { officialFingerprint, requirementsAuswerten, requirementsFuerReise, travellerGeloeschtPruefen } from '@/lib/readiness/engine'
import { officialFrische, quelleUrlLesen } from '@/lib/readiness/official'
import { fehlendeFaktenFuerReise, travellerSlots } from '@/lib/readiness/party'
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
            checkedAt: JETZT,
            sourceUrl: 'https://example.test/health',
          },
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'health',
            result: 'unknown',
            officialClass: 'recommendation',
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
})
