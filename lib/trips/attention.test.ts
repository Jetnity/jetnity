// lib/trips/attention.test.ts
//
// TW-4 Attention darf keine Hard Truth erfinden und keine Evaluation
// als clean oder unavailable umdeuten.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import { attentionAbleiten } from '@/lib/trips/attention'
import type { Trip, TripItem, TripTraveller } from '@/types/trips'

const JETZT = '2026-08-21T00:00:00.000Z'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function reisender(teil: Partial<TripTraveller> & Pick<TripTraveller, 'id' | 'clientRef'>): TripTraveller {
  return {
    label: null,
    residenceCountryCode: null,
    citizenships: [],
    documents: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Bali',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['beach'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Ubud',
        countryCode: 'ID',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-16',
        latitude: null,
        longitude: null,
        placeId: null,
      },
    ],
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [],
      },
    ],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function safetyLeer(): SafetyEvaluation {
  return {
    factId: 'safety:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    eventStatus: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_affected',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    sourceSeverity: null,
    advisoryClass: null,
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    seasonalRejected: false,
    evidence: leereSafetyEvidence('fp-safety'),
    contextFingerprint: 'fp-safety',
    eventFingerprint: 'fp-safety',
  }
}

function safetyWarnung(klasse: SafetyEvaluation['presentationClass'], factId: string): SafetyEvaluation {
  return {
    ...safetyLeer(),
    factId,
    factKey: factId,
    presentationClass: klasse,
    relevance: 'affected',
    evidenceStatus: 'current',
    freshness: 'current',
    category: 'flood',
    eventStatus: 'active',
  }
}

function safetyUnavailable(): SafetyEvaluation {
  return {
    ...safetyLeer(),
    factId: 'safety:unavailable',
    factKey: 'unavailable',
    evidenceStatus: 'unavailable',
    freshness: 'provider_unavailable',
    relevance: 'unknown',
  }
}

function seasonalLeer(): SeasonalEvaluation {
  return {
    factId: 'seasonal:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    evidenceClass: 'seasonal_pattern',
    outcome: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_applies',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    acuteRejected: false,
    evidence: leereSeasonalEvidence(),
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
  }
}

function seasonalTiming(): SeasonalEvaluation {
  return {
    ...seasonalLeer(),
    factId: 'seasonal:monsoon',
    factKey: 'monsoon',
    category: 'monsoon',
    presentationClass: 'timing_check',
    relevance: 'applies',
    outcome: 'less_favorable',
  }
}

function officialSauberFuer(
  travellerClientRef: string,
  credentialOptionRef: string,
  teil: Partial<OfficialEvaluation> = {},
): OfficialEvaluation {
  return {
    travellerClientRef,
    credentialOptionRef,
    destinationCountryCode: 'ID',
    transitCountryCode: null,
    requirementType: 'visa',
    result: 'not_required',
    status: 'current',
    freshness: 'current',
    officialClass: 'requirement',
    missingFacts: [],
    evidence: {
      provider: 'fixture',
      authority: 'test',
      sourceUrl: null,
      checkedAt: JETZT,
      validFrom: null,
      validUntil: null,
      ruleReference: null,
      contextFingerprint: `fp-official:${travellerClientRef}:${credentialOptionRef}`,
    },
    action: null,
    ...teil,
  }
}

function officialSauber(): OfficialEvaluation {
  return officialSauberFuer('traveller:1', 'cit:1')
}

function officialVollstaendig(): OfficialEvaluation[] {
  return [
    officialSauberFuer('traveller:1', 'cit:1'),
    officialSauberFuer('traveller:1', 'cit:2'),
    officialSauberFuer('traveller:2', 'cit:3'),
  ]
}

function officialUnavailableVollstaendig(): OfficialEvaluation[] {
  return officialVollstaendig().map((eintrag) => ({
    ...eintrag,
    status: 'unavailable',
    freshness: 'provider_unavailable',
    result: 'unknown',
  }))
}

function seasonalInsufficient(): SeasonalEvaluation {
  return {
    ...seasonalLeer(),
    factId: 'seasonal:insufficient',
    factKey: 'insufficient_context',
    evidenceStatus: 'insufficient_context',
    relevance: 'insufficient_context',
  }
}

function vollstaendigeParty(): TripTraveller[] {
  return [
    reisender({
      id: 't1',
      clientRef: 'traveller:1',
      citizenships: [
        { id: 'c1', clientRef: 'cit:1', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { id: 'c2', clientRef: 'cit:2', countryCode: 'IT', createdAt: JETZT, updatedAt: JETZT },
      ],
    }),
    reisender({
      id: 't2',
      clientRef: 'traveller:2',
      citizenships: [
        { id: 'c3', clientRef: 'cit:3', countryCode: 'DE', createdAt: JETZT, updatedAt: JETZT },
      ],
    }),
  ]
}

function reiseOhneLuecken(): Trip {
  return reise({
    origin: 'Ubud',
    originPlaceId: null,
    party: vollstaendigeParty(),
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-12',
        title: null,
        items: [
          punkt({
            id: 'stay-1',
            kind: 'stay',
            title: 'Hotel',
            startsOn: '2026-09-12',
            endsOn: '2026-09-16',
          }),
        ],
      },
    ],
  })
}

describe('Attention-Leerstände', () => {
  test('fehlende Safety-/Seasonal-Orchestrierung ist noch_nicht_geprueft, nicht clean und nicht unavailable', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      officialEvaluations: officialVollstaendig(),
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    assert.equal(sicht.leerstand, 'noch_nicht_geprueft')
    assert.equal(sicht.orchestrierung.safety, 'nicht_ausgefuehrt')
    assert.equal(sicht.orchestrierung.seasonal, 'nicht_ausgefuehrt')
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.ungeprueft'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'seasonal.ungeprueft'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'warning' || eintrag.lage === 'known_gap'), false)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
    assert.notEqual(sicht.leerstand, 'pruefung_nicht_verfuegbar')
  })

  test('lokale Safety-/Seasonal-Evaluation im Produktpfad ist angebunden und unavailable, nicht ungeprüft', () => {
    const sicht = attentionAbleiten({
      reise: reise({ party: vollstaendigeParty() }),
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.orchestrierung.safety, 'angebunden')
    assert.equal(sicht.orchestrierung.seasonal, 'angebunden')
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'ungeprueft'), false)
    assert.notEqual(sicht.leerstand, 'noch_nicht_geprueft')
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.unavailable'), true)
    assert.equal(
      sicht.leerstand === 'pruefung_nicht_verfuegbar' ||
        sicht.punkte.some((eintrag) => eintrag.signal === 'safety.unavailable'),
      true,
    )
  })

  test('erfolgreiche relevante Prüfungen ohne Signal ergeben nichts_dringend_geprueft', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyLeer()],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.leerstand, 'nichts_dringend_geprueft')
    assert.equal(sicht.punkte.length, 0)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.schwere === 'blockierend' || eintrag.lage === 'warning'), false)
  })

  test('fehlender Ziel- und Datumskontext ist noch_nicht_pruefbar', () => {
    const sicht = attentionAbleiten({
      reise: reise({
        startDate: null,
        endDate: null,
        stages: [{ ...reise().stages[0]!, countryCode: null, arrivalDate: null, departureDate: null }],
        party: [],
      }),
      safetyEvaluations: [safetyLeer()],
      seasonalEvaluations: [seasonalLeer()],
      orchestriereSafety: true,
      orchestriereSeasonal: true,
    })
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
    assert.notEqual(sicht.leerstand, 'pruefung_nicht_verfuegbar')
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'insufficient_context'), true)
    assert.equal(sicht.leerstand === 'noch_nicht_pruefbar' || sicht.leerstand === null, true)
  })

  test('belegte Unavailability bleibt pruefung_nicht_verfuegbar und nicht ungeprüft', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyUnavailable()],
      seasonalEvaluations: [{ ...seasonalLeer(), evidenceStatus: 'unavailable', freshness: 'provider_unavailable' }],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.leerstand, 'pruefung_nicht_verfuegbar')
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.unavailable'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'seasonal.unavailable'), true)
    assert.notEqual(sicht.leerstand, 'noch_nicht_geprueft')
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })
})

describe('Coverage und Priorisierung', () => {
  test('teilweise oder offene Flug-/Hotel-Coverage wird nicht als vollständig gelesen', () => {
    const sicht = attentionAbleiten({
      reise: reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [punkt({ id: 'stay-1', kind: 'stay', title: 'Nacht 1', startsOn: '2026-09-12', endsOn: '2026-09-13' })],
          },
        ],
      }),
    })
    const fluege = sicht.punkte.find((eintrag) => eintrag.signal === 'coverage.fluege')
    const hotel = sicht.punkte.find((eintrag) => eintrag.signal === 'coverage.unterkunft')
    assert.ok(fluege)
    assert.ok(hotel)
    assert.notEqual(fluege.lage, 'warning')
    assert.equal(hotel.lage === 'known_gap' || hotel.lage === 'unknown', true)
  })

  test('Priorisierung ist deterministisch und Safety-critical steht vor Coverage', () => {
    const erste = attentionAbleiten({
      reise: reise(),
      safetyEvaluations: [safetyWarnung('critical_warning', 'safe-1')],
      seasonalEvaluations: [seasonalTiming()],
    })
    const zweite = attentionAbleiten({
      reise: reise(),
      safetyEvaluations: [safetyWarnung('critical_warning', 'safe-1')],
      seasonalEvaluations: [seasonalTiming()],
    })
    assert.deepEqual(
      erste.punkte.map((eintrag) => eintrag.id),
      zweite.punkte.map((eintrag) => eintrag.id),
    )
    assert.equal(erste.punkte[0]?.signal, 'safety.critical_warning')
    assert.equal(erste.punkte[0]?.schwere, 'blockierend')
  })

  test('sichtbares Limit lässt restliche Punkte progressiv übrig', () => {
    const sicht = attentionAbleiten({
      reise: reise(),
      sichtbarLimit: 2,
    })
    assert.equal(sicht.sichtbar.length, 2)
    assert.equal(sicht.weitere.length, sicht.punkte.length - 2)
    assert.equal(sicht.sichtbar.length + sicht.weitere.length, sicht.punkte.length)
  })

  test('stale, unknown und error bleiben unterscheidbar', () => {
    const sicht = attentionAbleiten({
      reise: reise({
        readinessItems: [
          {
            id: 'r1',
            clientRef: 'prep:1',
            kind: 'preparation',
            userStatus: 'open',
            evidence: 'user',
            countryCode: null,
            tripItemId: null,
            title: 'Adapter',
            contextFingerprint: 'veraltet',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
        ],
      }),
      safetyEvaluations: [{ ...safetyWarnung('important_notice', 'safe-err'), conflict: true, factKey: 'partial_invalid' }],
      seasonalEvaluations: [seasonalLeer()],
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'stale'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'error'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'unknown' || eintrag.signal === 'coverage.fluege'), true)
    assert.equal(sicht.leerstand, null)
  })
})

describe('TW-4 Review-Regression', () => {
  test('Critical Warning erzeugt keinen Clean-Leerstand', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyWarnung('critical_warning', 'safe-crit')],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.critical_warning'), true)
    assert.equal(sicht.leerstand, null)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })

  test('Coverage-Gap erzeugt keinen Clean-Leerstand', () => {
    const sicht = attentionAbleiten({
      reise: reise({
        party: vollstaendigeParty(),
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [punkt({ id: 'stay-1', kind: 'stay', title: 'Nacht 1', startsOn: '2026-09-12', endsOn: '2026-09-13' })],
          },
        ],
      }),
      safetyEvaluations: [safetyLeer()],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'coverage.unterkunft' || eintrag.signal === 'coverage.fluege'), true)
    assert.equal(sicht.leerstand, null)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })

  test('Error erzeugt keinen Clean-Leerstand', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [{ ...safetyLeer(), factId: 'safe-err', conflict: true, factKey: 'partial_invalid' }],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.lage === 'error'), true)
    assert.equal(sicht.leerstand, null)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })

  test('Safety- und Seasonal-stale, unknown und insufficient_context bleiben getrennt', () => {
    const stale = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [{ ...safetyLeer(), factId: 'safe-stale', freshness: 'stale', evidenceStatus: 'current', relevance: 'not_affected' }],
      seasonalEvaluations: [{ ...seasonalLeer(), factId: 'sea-stale', freshness: 'recheck_needed', evidenceStatus: 'current', relevance: 'not_applies' }],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(stale.punkte.filter((eintrag) => eintrag.lage === 'stale').length >= 2, true)
    assert.equal(stale.punkte.some((eintrag) => eintrag.lage === 'unknown'), false)
    assert.equal(stale.punkte.some((eintrag) => eintrag.lage === 'insufficient_context'), false)
    assert.equal(stale.leerstand, null)

    const unknown = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [{ ...safetyLeer(), factId: 'safe-unk', evidenceStatus: 'unknown', relevance: 'unknown', freshness: 'current' }],
      seasonalEvaluations: [{ ...seasonalLeer(), factId: 'sea-unk', evidenceStatus: 'unknown', relevance: 'unknown', freshness: 'current' }],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(unknown.punkte.some((eintrag) => eintrag.signal === 'safety.unknown' && eintrag.lage === 'unknown'), true)
    assert.equal(unknown.punkte.some((eintrag) => eintrag.signal === 'seasonal.unknown' && eintrag.lage === 'unknown'), true)
    assert.equal(unknown.leerstand, null)
    assert.notEqual(unknown.leerstand, 'noch_nicht_pruefbar')
    assert.equal(unknown.punkte.some((eintrag) => eintrag.lage === 'stale'), false)
    assert.equal(unknown.punkte.some((eintrag) => eintrag.lage === 'insufficient_context'), false)

    const unzureichend = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [{ ...safetyLeer(), factId: 'safe-miss', evidenceStatus: 'insufficient_context', relevance: 'insufficient_context' }],
      seasonalEvaluations: [{ ...seasonalLeer(), factId: 'sea-miss', evidenceStatus: 'insufficient_context', relevance: 'insufficient_context' }],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(unzureichend.leerstand, 'noch_nicht_pruefbar')
    assert.equal(unzureichend.punkte.some((eintrag) => eintrag.signal === 'safety.insufficient_context'), true)
    assert.equal(unzureichend.punkte.some((eintrag) => eintrag.signal === 'seasonal.insufficient_context'), true)
    assert.notEqual(unzureichend.leerstand, 'nichts_dringend_geprueft')
  })

  test('Warning plus paralleles insufficient_context bleibt vollständig sichtbar', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [
        safetyWarnung('critical_warning', 'safe-warn'),
        {
          ...safetyLeer(),
          factId: 'safe-miss',
          factKey: 'partial_region',
          evidenceStatus: 'insufficient_context',
          relevance: 'insufficient_context',
          freshness: 'current',
        },
      ],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.critical_warning'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.insufficient_context'), true)
    assert.equal(sicht.leerstand, null)
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })
})

describe('Citizenship, Guest/Account, Side Effects', () => {
  test('mehrere Citizenships erzeugen keinen Default-Pass-Punkt', () => {
    const sicht = attentionAbleiten({
      reise: reise({ party: vollstaendigeParty() }),
      officialEvaluations: [officialSauber()],
    })
    const texte = JSON.stringify(sicht)
    assert.equal(texte.includes('CH'), false)
    assert.equal(texte.includes('IT'), false)
    assert.equal(texte.includes('DE'), false)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'official.insufficient_context'), false)
  })

  test('Guest und Account liefern bei gleichem Graphen dieselbe Attention', () => {
    const graph = reise({ party: vollstaendigeParty() })
    const gast = attentionAbleiten({ reise: graph })
    const konto = attentionAbleiten({ reise: graph })
    assert.deepEqual(gast, konto)
    assert.equal(JSON.stringify(gast).includes('Gerät'), false)
    assert.equal(JSON.stringify(konto).includes('Konto'), false)
  })

  test('Attention erzeugt keine Writes und liest keine lokalisierten Status-Tokens', () => {
    const sicht = attentionAbleiten({ reise: reise() })
    assert.equal(sicht.punkte.every((eintrag) => typeof eintrag.signal === 'string' && !eintrag.signal.includes(' ')), true)
    assert.equal(sicht.orchestrierung.safety, 'angebunden')
  })

  test('0 Aktivitäten werden nicht zum Attention-Punkt', () => {
    const sicht = attentionAbleiten({ reise: reise() })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal.includes('aktivitaeten')), false)
  })
})

describe('TW-4 Completeness und gemischte Degraded States', () => {
  test('eine Official-Evaluation bei 2 Travellern und 3 Citizenship-Optionen ist nie clean', () => {
    const unvollstaendig = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyLeer()],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: [officialSauber()],
    })
    assert.notEqual(unvollstaendig.leerstand, 'nichts_dringend_geprueft')
    assert.equal(unvollstaendig.punkte.some((eintrag) => eintrag.signal === 'official.ungeprueft'), true)
    assert.equal(unvollstaendig.punkte.some((eintrag) => eintrag.lage === 'warning'), false)

    const vollstaendig = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyLeer()],
      seasonalEvaluations: [seasonalLeer()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(vollstaendig.leerstand, 'nichts_dringend_geprueft')
    assert.equal(vollstaendig.punkte.length, 0)
  })

  test('Safety unavailable und Seasonal insufficient_context bleiben beide erkennbar', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      safetyEvaluations: [safetyUnavailable()],
      seasonalEvaluations: [seasonalInsufficient()],
      officialEvaluations: officialVollstaendig(),
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.unavailable' && eintrag.lage === 'unavailable'), true)
    assert.equal(
      sicht.punkte.some((eintrag) => eintrag.signal === 'seasonal.insufficient_context' && eintrag.lage === 'insufficient_context'),
      true,
    )
    assert.equal(
      sicht.punkte.some((eintrag) =>
        eintrag.lage === 'warning' ||
        eintrag.lage === 'known_gap' ||
        eintrag.lage === 'stale' ||
        eintrag.lage === 'error' ||
        eintrag.lage === 'unknown',
      ),
      false,
    )
    assert.equal(sicht.leerstand, 'noch_nicht_pruefbar')
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })

  test('Safety/Seasonal ungeprüft und Official unavailable bleiben beide erkennbar', () => {
    const sicht = attentionAbleiten({
      reise: reiseOhneLuecken(),
      officialEvaluations: officialUnavailableVollstaendig(),
      orchestriereSafety: false,
      orchestriereSeasonal: false,
    })
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'safety.ungeprueft' && eintrag.lage === 'ungeprueft'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'seasonal.ungeprueft' && eintrag.lage === 'ungeprueft'), true)
    assert.equal(sicht.punkte.some((eintrag) => eintrag.signal === 'official.unavailable' && eintrag.lage === 'unavailable'), true)
    assert.equal(
      sicht.punkte.some((eintrag) =>
        eintrag.lage === 'warning' ||
        eintrag.lage === 'known_gap' ||
        eintrag.lage === 'stale' ||
        eintrag.lage === 'error' ||
        eintrag.lage === 'unknown',
      ),
      false,
    )
    assert.equal(sicht.leerstand, 'noch_nicht_geprueft')
    assert.notEqual(sicht.leerstand, 'nichts_dringend_geprueft')
  })
})
