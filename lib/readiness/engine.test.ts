// lib/readiness/engine.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialRequirementsPruefen, requirementsEvaluationsPruefen } from '@/lib/readiness/anforderungen'
import { officialFingerprint, requirementsAuswerten, requirementsFuerReise, travellerGeloeschtPruefen } from '@/lib/readiness/engine'
import { VERGLEICH_NICHT_VERFUEGBAR, credentialOptionenVergleichen } from '@/lib/readiness/vergleich'
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

function reisende(
  teil: Partial<TripTraveller> &
    Pick<TripTraveller, 'clientRef'> & {
      nationalityCountryCode?: string | null
      documentType?: TripTraveller['documents'][number]['documentType'] | null
      documentIssuingCountryCode?: string | null
      documentExpiresOn?: string | null
    },
): TripTraveller {
  const jetzt = teil.createdAt ?? JETZT
  const citizenships =
    teil.citizenships ??
    (teil.nationalityCountryCode
      ? [
          {
            id: `citizenship:${teil.nationalityCountryCode}`,
            clientRef: `citizenship:${teil.nationalityCountryCode}`,
            countryCode: teil.nationalityCountryCode,
            createdAt: jetzt,
            updatedAt: jetzt,
          },
        ]
      : [])
  const documents =
    teil.documents ??
    (teil.documentType || teil.documentIssuingCountryCode || teil.documentExpiresOn
      ? [
          {
            id: `document:${teil.documentType ?? 'unknown'}:${teil.documentIssuingCountryCode ?? 'xx'}`,
            clientRef: `document:${teil.documentType ?? 'unknown'}:${teil.documentIssuingCountryCode ?? 'xx'}`,
            documentType: teil.documentType ?? 'unknown',
            issuingCountryCode: teil.documentIssuingCountryCode ?? null,
            citizenshipClientRef: null,
            expiresOn: teil.documentExpiresOn ?? null,
            createdAt: jetzt,
            updatedAt: jetzt,
          },
        ]
      : [])
  return {
    id: teil.id ?? teil.clientRef,
    clientRef: teil.clientRef,
    label: teil.label ?? null,
    residenceCountryCode: teil.residenceCountryCode ?? null,
    citizenships,
    documents,
    createdAt: jetzt,
    updatedAt: teil.updatedAt ?? JETZT,
  }
}

const testProvider: RequirementsProvider = {
  name: 'test-double',
  async evaluate(anfrage) {
    return anfrage.travellers.flatMap((traveller) =>
      anfrage.destinationCountryCodes.map((destination) => ({
        travellerClientRef: traveller.clientRef,
        destinationCountryCode: destination,
        requirementType: 'visa' as const,
        result:
          traveller.citizenshipCountryCodes.includes('CH') && destination === 'TH'
            ? ('required' as const)
            : traveller.citizenshipCountryCodes.includes('DE') && destination === 'TH'
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
  test('ohne Provider keine Visa-/Passbehauptung', async () => {
    const evaluations = await requirementsFuerReise(
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

  test('LLM- oder Browser-Behauptung überschreibt Official Truth nicht', async () => {
    const official = officialRequirementsPruefen({
      destinationCountryCode: 'TH',
      officialResult: 'not_required',
      llmResult: 'required',
      result: 'required',
    } as never)
    assert.equal(official.result, 'unknown')
    assert.equal(official.authority, null)
  })

  test('fehlende Nationalität bleibt insufficient_context', async () => {
    const evaluations = await requirementsFuerReise(beispielreise({ travellers: 1, party: [] }))
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.status, 'insufficient_context')
    assert.ok(visa?.missingFacts.includes('nationality'))
    assert.equal(visa?.result, 'unknown')
  })

  test('bekannte Fakten werden nicht erneut verlangt', async () => {
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

  test('unterschiedliche Nationalitäten werden nicht vermischt', async () => {
    const reise = beispielreise({
      travellers: 2,
      stages: beispielreise().stages.map((etappe) => ({ ...etappe, countryCode: 'TH' })),
      party: [
        reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' }),
        reisende({ clientRef: 'traveller:2', nationalityCountryCode: 'DE' }),
      ],
    })
    const evaluations = await requirementsFuerReise(reise, testProvider)
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

  test('gelöschter Traveller entfernt seine Evaluation', async () => {
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
    assert.ok((await requirementsFuerReise(mit)).some((eintrag) => eintrag.travellerClientRef === 'traveller:2'))
    assert.ok(!(await requirementsFuerReise(ohne)).some((eintrag) => eintrag.travellerClientRef === 'traveller:2'))
    assert.equal(travellerGeloeschtPruefen(ohne, 'traveller:2'), true)
    assert.equal(travellerGeloeschtPruefen(mit, 'traveller:2'), false)
  })

  test('Provider required/not_required/conditional nur über injizierten Port', async () => {
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
    const evaluations = await requirementsAuswerten(anfrage, testProvider)
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'conditional')
    assert.equal(visa?.freshness, 'current')
    assert.equal((await requirementsAuswerten(anfrage, null))[0]?.result, 'unknown')
  })

  test('Health Pflicht und Empfehlung bleiben getrennt', async () => {
    const provider: RequirementsProvider = {
      name: 'health-double',
      async evaluate(anfrage) {
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
    const evaluations = await requirementsFuerReise(
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

  test('Source URL wird validiert', async () => {
    assert.equal(quelleUrlLesen('https://example.test/a'), 'https://example.test/a')
    assert.equal(quelleUrlLesen('javascript:alert(1)'), null)
    assert.equal(quelleUrlLesen('http://example.test/a'), null)
    assert.equal(quelleUrlLesen('https://user:pass@example.test/a'), null)
  })

  test('Freshness: veralteter Fingerprint ist stale, abgelaufene Gültigkeit recheck', async () => {
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

  test('Transit ohne belastbare Route bleibt insufficient_context', async () => {
    const evaluations = await requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    const transit = evaluations.find((eintrag) => eintrag.requirementType === 'transit')
    assert.equal(transit?.result, 'unknown')
    assert.ok(transit?.missingFacts.includes('transit_itinerary'))
  })

  test('alle Pflicht-Requirement-Typen werden pro Reisendem und Ziel bewertet', async () => {
    const evaluations = await requirementsFuerReise(
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

  test('Mehrländerreise erzeugt getrennte Destination-Evaluations', async () => {
    const reise = beispielreise({
      travellers: 1,
      stages: [
        { ...beispielreise().stages[0]!, countryCode: 'TH', name: 'Bangkok' },
        { ...beispielreise().stages[1]!, countryCode: 'JP', name: 'Tokio' },
      ],
      party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
    })
    const visa = (await requirementsFuerReise(reise)).filter((eintrag) => eintrag.requirementType === 'visa')
    const laender = visa.map((eintrag) => eintrag.destinationCountryCode).sort()
    assert.deepEqual(laender, ['JP', 'TH'])
  })

  test('Destination-, Datums- oder Nationalitätswechsel ändert Official Fingerprint', async () => {
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

  test('explizite Document-Citizenship-Relation ändert den Official Fingerprint', () => {
    const basis = {
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:document:passport:US',
      citizenshipCountryCodes: ['CH', 'RS'],
      residenceCountryCode: 'CH',
      documents: [
        {
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
          relatedCitizenshipCountryCode: 'CH',
        },
      ],
      destinationCountryCode: 'TH',
      transitCountryCodes: [] as string[],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      requirementType: 'visa',
    }
    const nachCh = officialFingerprint(basis)
    const nachRs = officialFingerprint({
      ...basis,
      documents: [{ ...basis.documents[0]!, relatedCitizenshipCountryCode: 'RS' }],
    })
    const ohneRelation = officialFingerprint({
      ...basis,
      documents: [{ ...basis.documents[0]!, relatedCitizenshipCountryCode: null }],
    })
    assert.notEqual(nachCh, nachRs)
    assert.notEqual(nachCh, ohneRelation)
    assert.notEqual(nachRs, ohneRelation)
    assert.equal(
      officialFingerprint({
        ...basis,
        citizenshipCountryCodes: ['RS', 'CH'],
      }),
      nachCh,
    )
  })

  test('Transit-Itinerary macht transit_itinerary nicht mehr missing', async () => {
    const evaluations = await requirementsAuswerten({
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

  test('Official Action nur aus validierter HTTPS-Quelle', async () => {
    assert.equal(officialAktionAusQuelle('https://example.test/visa')?.href, 'https://example.test/visa')
    assert.equal(officialAktionAusQuelle('javascript:alert(1)'), null)
    assert.equal(officialAktionAusQuelle('http://example.test/visa'), null)
    const ohneProvider = await requirementsFuerReise(
      beispielreise({
        travellers: 1,
        party: [reisende({ clientRef: 'traveller:1', nationalityCountryCode: 'CH' })],
      }),
    )
    assert.ok(ohneProvider.every((eintrag) => eintrag.action === null))
    const mitQuelle = await requirementsAuswerten(
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

  test('temporär nicht erreichbare Quelle bleibt unknown und nicht required', async () => {
    const provider: RequirementsProvider = {
      name: 'down-double',
      async evaluate(anfrage) {
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
    const evaluations = await requirementsFuerReise(
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

  test('ohne Provider erfindet die Engine keine Transit- oder Health-Aussage', async () => {
    const evaluations = await requirementsAuswerten({
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

  test('2 Traveller × 2 Destinationen bleiben getrennte Evaluations', async () => {
    const evaluations = await requirementsEvaluationsPruefen(
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

  test('required ohne belastbare Evidence bleibt unknown', async () => {
    const ohneZeit: RequirementsProvider = {
      name: 'thin',
      async evaluate(anfrage) {
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
      async evaluate(anfrage) {
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
      async evaluate(anfrage) {
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
    assert.equal((await requirementsAuswerten(anfrage, ohneZeit)).find((e) => e.requirementType === 'visa')?.result, 'unknown')
    assert.equal((await requirementsAuswerten(anfrage, ungueltig)).find((e) => e.requirementType === 'visa')?.result, 'unknown')
    const ohneQuelle = (await requirementsAuswerten(anfrage, ohneUrl)).find((e) => e.requirementType === 'visa')
    assert.equal(ohneQuelle?.result, 'unknown')
    assert.equal(ohneQuelle?.action, null)
    assert.equal(ohneQuelle?.freshness, 'never_checked')
    assert.notEqual(ohneQuelle?.freshness, 'current')
  })

  test('zwei Transitländer bleiben getrennte Evaluations', async () => {
    const provider: RequirementsProvider = {
      name: 'transit-double',
      async evaluate(anfrage) {
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
    const evaluations = await requirementsAuswerten(
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
    const identisch = (await requirementsAuswerten(
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
        async evaluate(anfrage) {
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
    )).filter((eintrag) => eintrag.requirementType === 'transit')
    assert.equal(identisch.length, 1)
  })

  test('Provider missingFacts bleiben strukturiert und blockieren required', async () => {
    const provider: RequirementsProvider = {
      name: 'facts-double',
      async evaluate(anfrage) {
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
    const evaluations = await requirementsAuswerten(
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

  test('bekannte origin_country und transit_itinerary werden nicht erneut verlangt', async () => {
    const provider: RequirementsProvider = {
      name: 'facts-double',
      async evaluate(anfrage) {
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
    const evaluations = await requirementsAuswerten(
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

  test('Official Evidence braucht Provider, Zeit und Authority oder Rule Reference', async () => {
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: JETZT,
        authority: 'Test',
        sourceUrl: null,
      }),
      true,
    )
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: JETZT,
        authority: null,
        ruleReference: 'VISA-US-1',
        sourceUrl: null,
      }),
      true,
    )
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: JETZT,
        authority: null,
        ruleReference: null,
        sourceUrl: 'https://example.test/visa',
      }),
      false,
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
    assert.equal(
      officialEvidenceVertrauenswuerdig({
        provider: 'test-double',
        checkedAt: JETZT,
        authority: 'Test',
        sourceUrl: null,
        sourceUrlRoh: 'javascript:alert(1)',
      }),
      false,
    )
  })

  test('async Testprovider liefert strukturierte Evaluations', async () => {
    const provider: RequirementsProvider = {
      name: 'async-double',
      async evaluate(anfrage) {
        await Promise.resolve()
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'not_required',
            authority: 'Test',
            checkedAt: JETZT,
            ruleReference: 'VISA-US',
          },
        ]
      },
    }
    const evaluations = await requirementsAuswerten(
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
      provider,
    )
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'not_required')
    assert.equal(visa?.freshness, 'current')
    assert.equal(visa?.action, null)
  })

  test('Provider-Throw bleibt fail closed und nicht required', async () => {
    const provider: RequirementsProvider = {
      name: 'throw-double',
      async evaluate() {
        throw Object.assign(new Error('timeout'), { availability: 'temporarily_unavailable' })
      },
    }
    const evaluations = await requirementsAuswerten(
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
      provider,
    )
    assert.ok(evaluations.length > 0)
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    const tot: RequirementsProvider = {
      name: 'dead-double',
      async evaluate() {
        throw Object.assign(new Error('down'), { availability: 'unavailable' })
      },
    }
    const totEvaluations = await requirementsAuswerten(
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
      tot,
    )
    assert.ok(totEvaluations.every((eintrag) => eintrag.result === 'unknown'))
    assert.equal(totEvaluations[0]?.freshness, 'provider_unavailable')
  })

  test('teilweises Multi-Transit bleibt vollständig und ignoriert unangefragte Länder', async () => {
    const provider: RequirementsProvider = {
      name: 'partial-transit',
      async evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            transitCountryCode: 'QA',
            requirementType: 'transit',
            result: 'required',
            authority: 'Transit',
            sourceUrl: 'https://example.test/transit',
            checkedAt: JETZT,
          },
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            transitCountryCode: 'US',
            requirementType: 'transit',
            result: 'required',
            authority: 'Transit',
            sourceUrl: 'https://example.test/transit',
            checkedAt: JETZT,
          },
        ]
      },
    }
    const evaluations = await requirementsAuswerten(
      {
        originCountryCode: 'CH',
        destinationCountryCodes: ['TH'],
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
    assert.equal(transit.length, 2)
    assert.equal(transit.find((eintrag) => eintrag.transitCountryCode === 'QA')?.result, 'required')
    assert.equal(transit.find((eintrag) => eintrag.transitCountryCode === 'SG')?.result, 'unknown')
    assert.ok(!transit.some((eintrag) => eintrag.transitCountryCode === 'US'))
  })

  test('vertrauenswürdige Evidence ohne URL darf Result setzen, Action bleibt leer', async () => {
    const provider: RequirementsProvider = {
      name: 'no-url',
      async evaluate(anfrage) {
        return [
          {
            travellerClientRef: anfrage.travellers[0]!.clientRef,
            destinationCountryCode: anfrage.destinationCountryCodes[0] ?? null,
            requirementType: 'visa',
            result: 'not_required',
            authority: 'Test',
            checkedAt: JETZT,
            ruleReference: 'VISA-US',
          },
        ]
      },
    }
    const evaluations = await requirementsAuswerten(
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
      provider,
    )
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'not_required')
    assert.equal(visa?.status, 'current')
    assert.equal(visa?.action, null)
  })

  test('validFrom, validUntil und Zukunfts-checkedAt bleiben fail closed', async () => {
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
    const zukuenftig: RequirementsProvider = {
      name: 'future-valid',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: JETZT,
            validFrom: '2027-01-01',
          },
        ]
      },
    }
    const abgelaufen: RequirementsProvider = {
      name: 'expired-valid',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: JETZT,
            validUntil: '2026-01-01',
          },
        ]
      },
    }
    const ungueltig: RequirementsProvider = {
      name: 'bad-valid',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: JETZT,
            validFrom: 'nicht-datum',
          },
        ]
      },
    }
    const zukunftsCheck: RequirementsProvider = {
      name: 'future-check',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: '2028-01-01T00:00:00.000Z',
          },
        ]
      },
    }
    const spaeter = (await requirementsAuswerten(anfrage, zukuenftig)).find((e) => e.requirementType === 'visa')
    assert.equal(spaeter?.result, 'unknown')
    assert.notEqual(spaeter?.freshness, 'current')
    const alt = (await requirementsAuswerten(anfrage, abgelaufen)).find((e) => e.requirementType === 'visa')
    assert.equal(alt?.result, 'unknown')
    assert.equal(alt?.freshness, 'recheck_needed')
    const kaputt = (await requirementsAuswerten(anfrage, ungueltig)).find((e) => e.requirementType === 'visa')
    assert.equal(kaputt?.result, 'unknown')
    assert.equal(kaputt?.freshness, 'never_checked')
    const zukunft = (await requirementsAuswerten(anfrage, zukunftsCheck)).find((e) => e.requirementType === 'visa')
    assert.equal(zukunft?.result, 'unknown')
    assert.notEqual(zukunft?.status, 'current')
    assert.equal(zukunft?.freshness, 'never_checked')
    assert.notEqual(zukunft?.freshness, 'current')
    assert.equal(zukunft?.action, null)
  })

  test('untrusted Evidence darf freshness nicht current lassen', async () => {
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
    const zukunft: RequirementsProvider = {
      name: 'future-check',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: '2028-01-01T00:00:00.000Z',
          },
        ]
      },
    }
    const ungueltigeUrl: RequirementsProvider = {
      name: 'bad-url',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            sourceUrl: 'javascript:alert(1)',
            checkedAt: JETZT,
          },
        ]
      },
    }
    const ohneUrl: RequirementsProvider = {
      name: 'no-url-trusted',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'not_required',
            authority: 'Test',
            checkedAt: JETZT,
            ruleReference: 'VISA-US',
          },
        ]
      },
    }
    const down: RequirementsProvider = {
      name: 'down',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            availability: 'temporarily_unavailable',
            checkedAt: JETZT,
            sourceUrl: 'https://example.test/visa',
          },
        ]
      },
    }
    const abgelaufen: RequirementsProvider = {
      name: 'expired',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            checkedAt: JETZT,
            validUntil: '2026-01-01',
          },
        ]
      },
    }

    const zukunftVisa = (await requirementsAuswerten(anfrage, zukunft)).find((e) => e.requirementType === 'visa')
    assert.equal(zukunftVisa?.result, 'unknown')
    assert.notEqual(zukunftVisa?.status, 'current')
    assert.equal(zukunftVisa?.freshness, 'never_checked')
    assert.equal(zukunftVisa?.action, null)

    const urlVisa = (await requirementsAuswerten(anfrage, ungueltigeUrl)).find((e) => e.requirementType === 'visa')
    assert.equal(urlVisa?.result, 'unknown')
    assert.equal(urlVisa?.freshness, 'never_checked')
    assert.equal(urlVisa?.action, null)

    const trustedVisa = (await requirementsAuswerten(anfrage, ohneUrl)).find((e) => e.requirementType === 'visa')
    assert.equal(trustedVisa?.result, 'not_required')
    assert.equal(trustedVisa?.freshness, 'current')
    assert.equal(trustedVisa?.action, null)

    const downVisa = (await requirementsAuswerten(anfrage, down)).find((e) => e.requirementType === 'visa')
    assert.equal(downVisa?.result, 'unknown')
    assert.equal(downVisa?.freshness, 'source_temporarily_unavailable')

    const altVisa = (await requirementsAuswerten(anfrage, abgelaufen)).find((e) => e.requirementType === 'visa')
    assert.equal(altVisa?.result, 'unknown')
    assert.equal(altVisa?.freshness, 'recheck_needed')
  })

  test('Provider-Port trägt option-level Semantik nur über vertrauenswürdige current Evidence', async () => {
    const anfrage = {
      originCountryCode: 'CH',
      destinationCountryCodes: ['TH'],
      transitCountryCodes: [],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          residenceCountryCode: 'CH',
          citizenshipCountryCodes: ['CH', 'RS'],
          documents: [
            {
              clientRef: 'document:passport:CH',
              documentType: 'passport' as const,
              issuingCountryCode: 'CH',
              expiresOn: '2030-01-01',
              citizenshipCountryCode: null,
            },
            {
              clientRef: 'document:passport:RS',
              documentType: 'passport' as const,
              issuingCountryCode: 'RS',
              expiresOn: '2029-01-01',
              citizenshipCountryCode: null,
            },
          ],
          credentialOptions: [
            {
              optionRef: 'traveller:1:document:passport:CH',
              documentClientRef: 'document:passport:CH',
              documentType: 'passport' as const,
              issuingCountryCode: 'CH',
              expiresOn: '2030-01-01',
              relatedCitizenshipCountryCode: null,
            },
            {
              optionRef: 'traveller:1:document:passport:RS',
              documentClientRef: 'document:passport:RS',
              documentType: 'passport' as const,
              issuingCountryCode: 'RS',
              expiresOn: '2029-01-01',
              relatedCitizenshipCountryCode: null,
            },
          ],
        },
      ],
    }

    const trusted: RequirementsProvider = {
      name: 'test-double',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:CH',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'not_required',
            officialClass: 'requirement',
            optionEligibility: 'allowed',
            optionMandate: 'not_mandatory',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: JETZT,
            validUntil: '2026-12-31',
          },
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:RS',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'required',
            officialClass: 'requirement',
            optionEligibility: 'not_allowed',
            optionMandate: 'not_mandatory',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: JETZT,
            validUntil: '2026-12-31',
          },
        ]
      },
    }

    const evaluations = await requirementsAuswerten(anfrage, trusted)
    const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa.find((eintrag) => eintrag.credentialOptionRef?.endsWith(':CH'))?.optionEligibility, 'allowed')
    assert.equal(visa.find((eintrag) => eintrag.credentialOptionRef?.endsWith(':RS'))?.optionEligibility, 'not_allowed')
    const vergleich = credentialOptionenVergleichen(visa)
    assert.equal(vergleich.comparable, true)
    assert.equal(vergleich.winnerOptionRef, 'traveller:1:document:passport:CH')

    const untrusted: RequirementsProvider = {
      name: 'test-double',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:CH',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'required',
            optionEligibility: 'allowed',
            optionMandate: 'mandatory',
            checkedAt: JETZT,
          },
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:RS',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'not_required',
            optionEligibility: 'not_allowed',
            checkedAt: JETZT,
          },
        ]
      },
    }
    const unsicher = (await requirementsAuswerten(anfrage, untrusted)).filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(unsicher[0]?.optionEligibility, undefined)
    assert.equal(unsicher[0]?.optionMandate, undefined)
    assert.equal(credentialOptionenVergleichen(unsicher).comparable, false)
    assert.equal(credentialOptionenVergleichen(unsicher).reason, VERGLEICH_NICHT_VERFUEGBAR)

    const garbage: RequirementsProvider = {
      name: 'test-double',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:CH',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'not_required',
            officialClass: 'requirement',
            optionEligibility: 'yes' as never,
            optionMandate: 'must' as never,
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: JETZT,
            validUntil: '2026-12-31',
          },
          {
            travellerClientRef: 'traveller:1',
            credentialOptionRef: 'traveller:1:document:passport:RS',
            destinationCountryCode: 'TH',
            requirementType: 'visa',
            result: 'required',
            officialClass: 'requirement',
            optionEligibility: 'allowed',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: JETZT,
            validUntil: '2026-12-31',
          },
        ]
      },
    }
    const normalisiert = (await requirementsAuswerten(anfrage, garbage)).filter((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(normalisiert.find((eintrag) => eintrag.credentialOptionRef?.endsWith(':CH'))?.optionEligibility, 'unknown')
    assert.equal(credentialOptionenVergleichen(normalisiert).comparable, false)
  })

  test('widersprüchliche current Provider-Zeilen gleicher Option werden nicht first-wins', async () => {
    const anfrage = {
      originCountryCode: 'CH',
      destinationCountryCodes: ['TH'],
      transitCountryCodes: [],
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: [
        {
          clientRef: 'traveller:1',
          residenceCountryCode: 'CH',
          citizenshipCountryCodes: ['CH', 'RS'],
          documents: [
            {
              clientRef: 'document:passport:CH',
              documentType: 'passport' as const,
              issuingCountryCode: 'CH',
              expiresOn: '2030-01-01',
              citizenshipCountryCode: null,
            },
            {
              clientRef: 'document:passport:RS',
              documentType: 'passport' as const,
              issuingCountryCode: 'RS',
              expiresOn: '2029-01-01',
              citizenshipCountryCode: null,
            },
          ],
          credentialOptions: [
            {
              optionRef: 'traveller:1:document:passport:CH',
              documentClientRef: 'document:passport:CH',
              documentType: 'passport' as const,
              issuingCountryCode: 'CH',
              expiresOn: '2030-01-01',
              relatedCitizenshipCountryCode: null,
            },
            {
              optionRef: 'traveller:1:document:passport:RS',
              documentClientRef: 'document:passport:RS',
              documentType: 'passport' as const,
              issuingCountryCode: 'RS',
              expiresOn: '2029-01-01',
              relatedCitizenshipCountryCode: null,
            },
          ],
        },
      ],
    }
    const widerspruch = (reihenfolge: 'required-first' | 'not-required-first'): RequirementsProvider => ({
      name: 'test-double',
      async evaluate() {
        const chRequired = {
          travellerClientRef: 'traveller:1',
          credentialOptionRef: 'traveller:1:document:passport:CH',
          destinationCountryCode: 'TH',
          requirementType: 'visa' as const,
          result: 'required' as const,
          officialClass: 'requirement' as const,
          optionEligibility: 'allowed' as const,
          authority: 'Test',
          sourceUrl: 'https://example.test/visa',
          checkedAt: JETZT,
          validUntil: '2026-12-31',
        }
        const chNotRequired = { ...chRequired, result: 'not_required' as const }
        const rs = {
          travellerClientRef: 'traveller:1',
          credentialOptionRef: 'traveller:1:document:passport:RS',
          destinationCountryCode: 'TH',
          requirementType: 'visa' as const,
          result: 'required' as const,
          officialClass: 'requirement' as const,
          optionEligibility: 'allowed' as const,
          authority: 'Test',
          sourceUrl: 'https://example.test/visa',
          checkedAt: JETZT,
          validUntil: '2026-12-31',
        }
        return reihenfolge === 'required-first' ? [chRequired, chNotRequired, rs] : [chNotRequired, chRequired, rs]
      },
    })
    const erste = (await requirementsAuswerten(anfrage, widerspruch('required-first'))).filter(
      (eintrag) => eintrag.requirementType === 'visa',
    )
    const zweite = (await requirementsAuswerten(anfrage, widerspruch('not-required-first'))).filter(
      (eintrag) => eintrag.requirementType === 'visa',
    )
    assert.equal(
      erste.some(
        (eintrag) =>
          eintrag.credentialOptionRef?.endsWith(':CH') && (eintrag.result === 'required' || eintrag.result === 'not_required'),
      ),
      false,
    )
    assert.equal(credentialOptionenVergleichen(erste).comparable, false)
    assert.equal(credentialOptionenVergleichen(zweite).comparable, false)
    assert.deepEqual(
      erste
        .filter((eintrag) => eintrag.credentialOptionRef?.endsWith(':CH'))
        .map((eintrag) => eintrag.result)
        .sort(),
      zweite
        .filter((eintrag) => eintrag.credentialOptionRef?.endsWith(':CH'))
        .map((eintrag) => eintrag.result)
        .sort(),
    )
  })
})
