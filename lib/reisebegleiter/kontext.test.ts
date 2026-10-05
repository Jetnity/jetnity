// lib/reisebegleiter/kontext.test.ts
//
// Die Assistant-Truth-Context-Projektion darf vorhandene Wahrheit nur
// privacy-minimiert weiterreichen. Reihenfolge, Transit, fehlende Evidence
// oder sensible Felder dürfen keine neue Wahrheit erzeugen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ASSISTANT_TRUTH_CLASSES,
  ASSISTANT_TRUTH_CONTEXT_VERSION,
  assistantOfficialIstTransit,
  assistantTruthContextProjizieren,
} from '@/lib/reisebegleiter/kontext'
import { officialLeer, type OfficialEvaluation } from '@/lib/readiness/official'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import type { Trip, TripItem, TripStage, TripTraveller } from '@/types/trips'

const JETZT = '2026-09-02T10:00:00.000Z'

const LEAK_PASSNUMMER = 'X9Z8Y7W6V5'
const LEAK_MRZ = 'P<CHESAMPLE<<LEAKTEST<<<<<<<<<<<<<<<<<<<<<<'
const LEAK_BOOKING = 'https://booking.leak.test/deeplink-xyz?token=abc'
const LEAK_PREIS = 4242.42
const LEAK_SECRET = 'sk-live-leak-secret'
const LEAK_EMAIL = 'leak-test@privacy.example'
const LEAK_USER = '00000000-leak-4000-8000-000000000099'
const LEAK_HEALTH = 'HIV-positive-akte-leak'
const LEAK_SESSION = 'sess-leak-token-9911'
const LEAK_RAW = '{"offers":[{"amount":4242.42}]}'
const LEAK_FINGERPRINT =
  'off-v2|t=traveller:1|cit=CH,RS|res=DE|docs=passport:CH|orig=CH|dest=IT|tr=CH|start=2026-09-12|end=2026-09-20|type=visa|LEAK-FP-MARKER-9911'
const LEAK_FINGERPRINT_MARKER = 'LEAK-FP-MARKER-9911'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function citizenship(
  countryCode: string,
  clientRef = `cit:${countryCode.toLowerCase()}`,
): TripTraveller['citizenships'][number] {
  return {
    id: clientRef,
    clientRef,
    countryCode,
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function dokument(
  teil: Partial<TripTraveller['documents'][number]> &
    Pick<TripTraveller['documents'][number], 'clientRef' | 'documentType'>,
): TripTraveller['documents'][number] {
  return {
    id: teil.clientRef,
    issuingCountryCode: null,
    citizenshipClientRef: null,
    expiresOn: null,
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reisender(teil: Partial<TripTraveller> = {}): TripTraveller {
  return {
    id: 'traveller-1',
    clientRef: 'traveller:1',
    label: 'Alex',
    residenceCountryCode: 'DE',
    citizenships: [citizenship('CH'), citizenship('RS')],
    documents: [
      dokument({
        clientRef: 'document:passport:CH',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        expiresOn: '2030-01-01',
        citizenshipClientRef: 'cit:ch',
      }),
      dokument({
        clientRef: 'document:passport:RS',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        expiresOn: '2029-01-01',
        citizenshipClientRef: 'cit:rs',
      }),
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function handelsPunkt(): TripItem {
  return {
    id: 'item-flight-1',
    dayId: null,
    stageId: 'stage-fl',
    kind: 'flight',
    title: 'ZRH-FCO',
    note: null,
    position: 0,
    startsOn: '2026-09-12',
    startsAt: '08:00',
    endsOn: '2026-09-12',
    endsAt: '10:00',
    priceAmount: LEAK_PREIS,
    priceCurrency: 'EUR',
    provider: 'duffel',
    externalRef: 'off_secret',
    bookingUrl: LEAK_BOOKING,
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
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-20',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: LEAK_PREIS,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-fl',
        position: 1,
        name: 'Florenz',
        countryCode: 'IT',
        arrivalDate: '2026-09-12',
        departureDate: '2026-09-15',
        placeId: 'geonames:3176959',
        latitude: 43.7696,
        longitude: 11.2558,
      }),
      etappe({
        id: 'stage-rm',
        position: 2,
        name: 'Rom',
        countryCode: 'IT',
        arrivalDate: '2026-09-15',
        departureDate: '2026-09-20',
        placeId: 'geonames:3169070',
      }),
    ],
    days: [],
    ohneTag: [handelsPunkt()],
    party: [reisender()],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function official(teil: Partial<OfficialEvaluation> = {}): OfficialEvaluation {
  return {
    ...officialLeer({
      requirementType: teil.requirementType ?? 'visa',
      contextFingerprint: teil.evidence?.contextFingerprint ?? 'fp-official',
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:document:passport:CH',
      destinationCountryCode: 'IT',
      transitCountryCode: null,
      status: 'current',
      freshness: 'current',
    }),
    result: 'required',
    officialClass: 'requirement',
    visaMode: 'visa_before_travel',
    evidence: {
      provider: 'paid-provider-raw',
      authority: 'MAECI',
      sourceUrl: LEAK_BOOKING,
      checkedAt: JETZT,
      validFrom: null,
      validUntil: null,
      ruleReference: 'rule-1',
      contextFingerprint: LEAK_FINGERPRINT,
    },
    action: {
      kind: 'open_official_action',
      purpose: 'application',
      href: LEAK_BOOKING,
    },
    ...teil,
  }
}

function safety(teil: Partial<SafetyEvaluation> = {}): SafetyEvaluation {
  return {
    factId: 'safe-1',
    factKey: 'flood',
    category: 'flood',
    eventStatus: 'active',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'affected',
    spatialPrecision: 'city',
    presentationClass: 'important_notice',
    sourceSeverity: 'moderate',
    advisoryClass: 'exercise_caution',
    authorityClass: 'official_government',
    affectedRefs: [{ kind: 'stage', id: 'stage-fl', label: 'Florenz' }],
    impact: [],
    reason: 'Hochwasserhinweis für die Etappe',
    nextAction: 'check_stage',
    conflict: false,
    seasonalRejected: false,
    evidence: {
      ...leereSafetyEvidence('fp-safety'),
      sourceUrl: LEAK_BOOKING,
      provider: 'paid-provider-raw',
    },
    contextFingerprint: 'fp-safety',
    eventFingerprint: 'fp-safety',
    ...teil,
  }
}

function seasonal(teil: Partial<SeasonalEvaluation> = {}): SeasonalEvaluation {
  return {
    factId: 'season-1',
    factKey: 'heat',
    category: 'heat',
    evidenceClass: 'seasonal_pattern',
    outcome: 'less_favorable',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'applies',
    spatialPrecision: 'city',
    presentationClass: 'timing_check',
    authorityClass: 'official_climate',
    affectedRefs: [{ kind: 'stage', id: 'stage-rm', label: 'Rom' }],
    impact: [],
    reason: 'Hitzeperiode typischerweise im September',
    nextAction: 'review_timing',
    conflict: false,
    acuteRejected: false,
    evidence: {
      ...leereSeasonalEvidence(),
      sourceUrl: LEAK_BOOKING,
      provider: 'paid-provider-raw',
    },
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
    ...teil,
  }
}

function schluesselSammeln(wert: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(wert)) {
    for (const eintrag of wert) schluesselSammeln(eintrag, acc)
    return acc
  }
  if (!wert || typeof wert !== 'object') return acc
  for (const [name, inhalt] of Object.entries(wert)) {
    acc.add(name)
    schluesselSammeln(inhalt, acc)
  }
  return acc
}

function normalisierterName(name: string): string {
  return name.replace(/[_-]/g, '').toLowerCase()
}

const VERBOTENE_FELDNAMEN = new Set([
  'passportnumber',
  'passnumber',
  'documentnumber',
  'serialnumber',
  'ausweisnummer',
  'passnummer',
  'mrz',
  'mrzline',
  'scan',
  'scanurl',
  'image',
  'photo',
  'biometric',
  'biometrics',
  'health',
  'healthdata',
  'healthrecord',
  'healthdocument',
  'vaccination',
  'medical',
  'email',
  'userid',
  'accountid',
  'sessionid',
  'sessiontoken',
  'bookingurl',
  'priceamount',
  'pricecurrency',
  'provider',
  'providerraw',
  'rawpayload',
  'apikey',
  'secret',
  'rankingcontext',
  'provision',
  'availability',
  'externalref',
  'sourceurl',
  'href',
  'action',
  'evidence',
  'contextfingerprint',
])

const VERBOTENE_WERTE = [
  LEAK_PASSNUMMER,
  LEAK_MRZ,
  LEAK_BOOKING,
  String(LEAK_PREIS),
  LEAK_SECRET,
  LEAK_EMAIL,
  LEAK_USER,
  LEAK_HEALTH,
  LEAK_SESSION,
  LEAK_RAW,
  LEAK_FINGERPRINT,
  LEAK_FINGERPRINT_MARKER,
  'off_secret',
]

function sensibleReisende(): TripTraveller {
  return {
    ...reisender(),
    ...{
      passportNumber: LEAK_PASSNUMMER,
      passNumber: LEAK_PASSNUMMER,
      documentNumber: LEAK_PASSNUMMER,
      mrz: LEAK_MRZ,
      mrzLine: LEAK_MRZ,
      scanUrl: 'https://evil.example/scan.png',
      biometric: 'face-template',
      healthRecord: LEAK_HEALTH,
      email: LEAK_EMAIL,
      userId: LEAK_USER,
      accountId: LEAK_USER,
      sessionId: LEAK_SESSION,
      sessionToken: LEAK_SECRET,
      apiKey: LEAK_SECRET,
    },
  } as TripTraveller
}

describe('Assistant Truth Context 1', () => {
  test('bewahrt Multi-Traveller, Multi-Citizenship und Multi-Document als Peers', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        party: [
          reisender(),
          reisender({
            id: 'traveller-2',
            clientRef: 'traveller:2',
            label: 'Sam',
            residenceCountryCode: 'AT',
            citizenships: [citizenship('AT')],
            documents: [
              dokument({
                clientRef: 'document:passport:AT',
                documentType: 'passport',
                issuingCountryCode: 'AT',
                expiresOn: '2031-01-01',
                citizenshipClientRef: 'cit:at',
              }),
            ],
          }),
        ],
      }),
    })

    assert.equal(kontext.travellers.length, 2)
    const alex = kontext.travellers.find((eintrag) => eintrag.travellerClientRef === 'traveller:1')
    const sam = kontext.travellers.find((eintrag) => eintrag.travellerClientRef === 'traveller:2')
    assert.ok(alex)
    assert.ok(sam)
    assert.deepEqual(
      alex.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH', 'RS'],
    )
    assert.equal(alex.documents.length, 2)
    assert.equal(alex.credentialOptions.length, 2)
    assert.equal(alex.residenceCountryCode, 'DE')
    assert.equal(
      alex.citizenships.some((eintrag) => eintrag.countryCode === alex.residenceCountryCode),
      false,
    )
    assert.equal(sam.residenceCountryCode, 'AT')
    assert.equal(JSON.stringify(kontext).includes('"primary"'), false)
    assert.equal(JSON.stringify(kontext).includes('"preferred"'), false)
    assert.equal(JSON.stringify(kontext).includes('"default"'), false)
  })

  test('ändert die Array-Reihenfolge ohne Primary/Preferred-Semantik', () => {
    const original = reisender()
    const umgekehrt = reisender({
      citizenships: [...original.citizenships].reverse(),
      documents: [...original.documents].reverse(),
    })
    const zweiteReisende = reisender({
      id: 'traveller-2',
      clientRef: 'traveller:2',
      label: 'Sam',
      residenceCountryCode: 'AT',
      citizenships: [citizenship('AT')],
      documents: [
        dokument({
          clientRef: 'document:passport:AT',
          documentType: 'passport',
          issuingCountryCode: 'AT',
          expiresOn: '2031-01-01',
          citizenshipClientRef: 'cit:at',
        }),
      ],
    })

    const vorwaerts = assistantTruthContextProjizieren({
      reise: reise({ party: [original, zweiteReisende] }),
      officialEvaluations: [
        official({
          credentialOptionRef: 'traveller:1:document:passport:CH',
          result: 'required',
          evidence: { ...official().evidence, contextFingerprint: 'fp-ch' },
        }),
        official({
          credentialOptionRef: 'traveller:1:document:passport:RS',
          result: 'not_required',
          visaMode: 'visa_exempt',
          evidence: { ...official().evidence, contextFingerprint: 'fp-rs' },
        }),
      ],
    })
    const rueckwaerts = assistantTruthContextProjizieren({
      reise: reise({ party: [zweiteReisende, umgekehrt] }),
      officialEvaluations: [
        official({
          credentialOptionRef: 'traveller:1:document:passport:RS',
          result: 'not_required',
          visaMode: 'visa_exempt',
          evidence: { ...official().evidence, contextFingerprint: 'fp-rs' },
        }),
        official({
          credentialOptionRef: 'traveller:1:document:passport:CH',
          result: 'required',
          evidence: { ...official().evidence, contextFingerprint: 'fp-ch' },
        }),
      ],
    })

    assert.deepEqual(vorwaerts.travellers, rueckwaerts.travellers)
    assert.deepEqual(vorwaerts.official, rueckwaerts.official)
    const alex = vorwaerts.travellers.find((eintrag) => eintrag.travellerClientRef === 'traveller:1')
    assert.deepEqual(
      alex?.credentialOptions.map((option) => option.optionRef),
      ['traveller:1:document:passport:CH', 'traveller:1:document:passport:RS'],
    )
    assert.equal(
      vorwaerts.official.some((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:CH'),
      true,
    )
    assert.equal(
      vorwaerts.official.some((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:RS'),
      true,
    )
    assert.notEqual(
      vorwaerts.official.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:CH')?.result,
      vorwaerts.official.find((eintrag) => eintrag.credentialOptionRef === 'traveller:1:document:passport:RS')?.result,
    )
  })

  test('hält Residence, Issuer Country und Citizenship getrennt', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        party: [
          reisender({
            residenceCountryCode: 'DE',
            citizenships: [citizenship('CH')],
            documents: [
              dokument({
                clientRef: 'document:passport:US',
                documentType: 'passport',
                issuingCountryCode: 'US',
                citizenshipClientRef: 'cit:ch',
                expiresOn: '2030-01-01',
              }),
            ],
          }),
        ],
      }),
    })
    const alex = kontext.travellers[0]
    assert.equal(alex?.residenceCountryCode, 'DE')
    assert.deepEqual(alex?.citizenships.map((eintrag) => eintrag.countryCode), ['CH'])
    assert.equal(alex?.documents[0]?.issuingCountryCode, 'US')
    assert.equal(alex?.documents[0]?.citizenshipCountryCode, 'CH')
    assert.notEqual(alex?.residenceCountryCode, alex?.citizenships[0]?.countryCode)
    assert.notEqual(alex?.documents[0]?.issuingCountryCode, alex?.documents[0]?.citizenshipCountryCode)
  })

  test('leitet keine Citizenship aus Dokument oder Wohnsitz ab', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        party: [
          reisender({
            residenceCountryCode: 'FR',
            citizenships: [],
            documents: [
              dokument({
                clientRef: 'document:passport:IT',
                documentType: 'passport',
                issuingCountryCode: 'IT',
                citizenshipClientRef: null,
              }),
            ],
          }),
        ],
      }),
    })
    const alex = kontext.travellers[0]
    assert.equal(alex?.residenceCountryCode, 'FR')
    assert.deepEqual(alex?.citizenships, [])
    assert.equal(alex?.documents[0]?.issuingCountryCode, 'IT')
    assert.equal(alex?.documents[0]?.citizenshipCountryCode, null)
    assert.deepEqual(alex?.credentialOptions[0]?.citizenshipCountryCodes, [])
  })

  test('hält current, unknown, unavailable, stale, recheck_needed und not_required unterscheidbar', () => {
    const zustaende: Array<Pick<OfficialEvaluation, 'result' | 'status' | 'freshness'> & { fingerprint: string }> = [
      { result: 'required', status: 'current', freshness: 'current', fingerprint: 'fp-current' },
      { result: 'unknown', status: 'unknown', freshness: 'never_checked', fingerprint: 'fp-unknown' },
      { result: 'not_required', status: 'unavailable', freshness: 'provider_unavailable', fingerprint: 'fp-unavailable' },
      { result: 'not_required', status: 'current', freshness: 'stale', fingerprint: 'fp-stale' },
      { result: 'not_required', status: 'current', freshness: 'recheck_needed', fingerprint: 'fp-recheck' },
      { result: 'not_required', status: 'current', freshness: 'current', fingerprint: 'fp-not-required' },
    ]
    const kontext = assistantTruthContextProjizieren({
      reise: reise(),
      officialEvaluations: zustaende.map((zustand) =>
        official({
          result: zustand.result,
          status: zustand.status,
          freshness: zustand.freshness,
          visaMode: zustand.result === 'not_required' ? 'visa_exempt' : 'visa_before_travel',
          evidence: { ...official().evidence, contextFingerprint: zustand.fingerprint },
        }),
      ),
    })

    const frischen = kontext.official.map((eintrag) => eintrag.freshness)
    const results = kontext.official.map((eintrag) => eintrag.result)
    const statuses = kontext.official.map((eintrag) => eintrag.status)

    assert.equal(frischen.includes('current'), true)
    assert.equal(frischen.includes('stale'), true)
    assert.equal(frischen.includes('recheck_needed'), true)
    assert.equal(frischen.includes('never_checked'), true)
    assert.equal(frischen.includes('provider_unavailable'), true)
    assert.notEqual(
      kontext.official.find((eintrag) => eintrag.freshness === 'stale')?.freshness,
      kontext.official.find((eintrag) => eintrag.freshness === 'recheck_needed')?.freshness,
    )
    assert.notEqual(
      kontext.official.find((eintrag) => eintrag.freshness === 'recheck_needed')?.freshness,
      'current',
    )
    assert.equal(results.includes('unknown'), true)
    assert.equal(results.includes('not_required'), true)
    assert.equal(results.includes('required'), true)
    assert.equal(statuses.includes('unavailable'), true)
    assert.equal(statuses.includes('unknown'), true)
    assert.equal(statuses.includes('current'), true)

    const staleNotRequired = kontext.official.find((eintrag) => eintrag.freshness === 'stale')
    assert.equal(staleNotRequired?.result, 'not_required')
    assert.equal(staleNotRequired?.freshness, 'stale')
    assert.notEqual(staleNotRequired?.freshness, 'current')

    const unknown = kontext.official.find((eintrag) => eintrag.result === 'unknown')
    assert.notEqual(unknown?.result, 'not_required')

    const currentNotRequired = kontext.official.find((eintrag) => eintrag.freshness === 'current' && eintrag.result === 'not_required')
    assert.ok(currentNotRequired)
    assert.notEqual(staleNotRequired?.freshness, currentNotRequired.freshness)
  })

  test('kollabiert Destination- und Transit-Official nicht bei gleichem Land', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        stages: [
          etappe({ id: 'stage-zh', position: 0, name: 'Zürich', countryCode: 'CH' }),
          etappe({ id: 'stage-fl', position: 1, name: 'Florenz', countryCode: 'IT' }),
        ],
      }),
      officialEvaluations: [
        official({
          requirementType: 'visa',
          destinationCountryCode: 'IT',
          transitCountryCode: null,
          result: 'required',
          evidence: { ...official().evidence, contextFingerprint: 'fp-dest-it' },
        }),
        official({
          requirementType: 'transit',
          destinationCountryCode: 'IT',
          transitCountryCode: 'IT',
          result: 'not_required',
          visaMode: null,
          evidence: { ...official().evidence, contextFingerprint: 'fp-transit-it' },
        }),
      ],
    })

    const destination = kontext.official.find((eintrag) => eintrag.scope === 'destination')
    const transit = kontext.official.find((eintrag) => eintrag.scope === 'transit')
    assert.ok(destination)
    assert.ok(transit)
    assert.equal(assistantOfficialIstTransit(official({ requirementType: 'transit', transitCountryCode: 'IT' })), true)
    assert.equal(destination.destinationCountryCode, 'IT')
    assert.equal(transit.transitCountryCode, 'IT')
    assert.equal(destination.scope, 'destination')
    assert.equal(transit.scope, 'transit')
    assert.deepEqual(destination.boundStageIds, ['stage-fl'])
    assert.deepEqual(transit.boundStageIds, [])
    assert.notEqual(destination.result, transit.result)
    assert.equal(kontext.official.length, 2)
    assert.equal(JSON.stringify(kontext).includes('contextFingerprint'), false)
  })

  test('hält zwei Etappen im selben Land als getrennte Stage-Refs', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        stages: [
          etappe({ id: 'stage-rm', position: 2, name: 'Rom', countryCode: 'IT' }),
          etappe({ id: 'stage-fl', position: 1, name: 'Florenz', countryCode: 'IT' }),
        ],
      }),
    })
    assert.deepEqual(
      kontext.stages.map((stage) => ({ id: stage.stageId, land: stage.countryCode })),
      [
        { id: 'stage-fl', land: 'IT' },
        { id: 'stage-rm', land: 'IT' },
      ],
    )
    assert.notEqual(kontext.stages[0]?.stageId, kontext.stages[1]?.stageId)
  })

  test('leitet kein Land aus Name, Koordinaten oder Place-ID ab', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        stages: [
          etappe({
            id: 'stage-th',
            name: 'Thailand',
            countryCode: null,
            placeId: 'geonames:1605651',
            latitude: 13.7563,
            longitude: 100.5018,
          }),
        ],
      }),
      officialEvaluations: [official({ destinationCountryCode: 'TH', result: 'not_required' })],
    })
    assert.equal(kontext.stages[0]?.countryCode, null)
    assert.equal(kontext.stages[0]?.name, 'Thailand')
    assert.deepEqual(kontext.official[0]?.boundStageIds, [])
  })

  test('bindet Safety und Seasonal nur über explizite Stage-Refs', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise(),
      safetyEvaluations: [
        safety(),
        safety({
          factId: 'safe-unbound',
          affectedRefs: [{ kind: 'airport', id: 'FLR', label: 'Florenz' }],
        }),
      ],
      seasonalEvaluations: [
        seasonal(),
        seasonal({
          factId: 'season-rejected',
          acuteRejected: true,
          evidenceClass: 'rejected_acute',
          affectedRefs: [{ kind: 'stage', id: 'stage-rm', label: 'Rom' }],
        }),
      ],
    })
    assert.deepEqual(kontext.safety.find((eintrag) => eintrag.factId === 'safe-1')?.boundStageIds, ['stage-fl'])
    assert.deepEqual(kontext.safety.find((eintrag) => eintrag.factId === 'safe-unbound')?.boundStageIds, [])
    assert.deepEqual(kontext.seasonal.find((eintrag) => eintrag.factId === 'season-1')?.boundStageIds, ['stage-rm'])
    assert.deepEqual(kontext.seasonal.find((eintrag) => eintrag.factId === 'season-rejected')?.boundStageIds, [])
    assert.equal(kontext.safety[0]?.domain, 'safety')
    assert.equal(kontext.seasonal[0]?.domain, 'seasonal')
    assert.notEqual(kontext.safety[0]?.domain, 'official')
  })

  test('lässt fehlende Country-/Credential-/Evaluation-Evidence missing', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        startDate: null,
        endDate: null,
        stages: [etappe({ id: 'stage-x', name: '  ', countryCode: 'ITALY' })],
        party: [
          reisender({
            residenceCountryCode: null,
            citizenships: [],
            documents: [],
          }),
        ],
      }),
    })
    assert.equal(kontext.stages[0]?.countryCode, null)
    assert.equal(kontext.stages[0]?.name, null)
    assert.equal(kontext.trip.startDate, null)
    assert.equal(kontext.route.vorhanden, false)
    assert.deepEqual(kontext.route.destinationCountryCodes, [])
    assert.deepEqual(kontext.route.transitCountryCodes, [])
    assert.deepEqual(kontext.official, [])
    assert.deepEqual(kontext.safety, [])
    assert.deepEqual(kontext.seasonal, [])
    assert.deepEqual(kontext.travellers[0]?.citizenships, [])
    assert.deepEqual(kontext.travellers[0]?.documents, [])
    assert.equal(kontext.travellers[0]?.credentialOptions[0]?.documentClientRef, null)
  })

  test('hält Destination- und Transit-Routenländer getrennt', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise(),
      routeFacts: {
        quelle: 'flight_itinerary',
        destinationCountryCodes: ['IT', 'IT'],
        transitCountryCodes: ['CH', 'IT'],
      },
    })
    assert.equal(kontext.route.vorhanden, true)
    assert.deepEqual(kontext.route.destinationCountryCodes, ['IT'])
    assert.deepEqual(kontext.route.transitCountryCodes, ['CH', 'IT'])
    assert.notDeepEqual(kontext.route.destinationCountryCodes, kontext.route.transitCountryCodes)
  })

  test('bereitet Generated-Suggestion vor, füllt sie aber nicht', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise(),
      officialEvaluations: [official()],
      ...{
        generatedSuggestions: [{ text: 'Nimm den teureren Flug', truthClass: 'official' }],
      },
    })
    assert.deepEqual(kontext.generatedSuggestion, [])
    assert.deepEqual(kontext.unfilledTruthClasses, [
      'provider',
      'recommendation',
      'community_opinion',
      'generated_suggestion',
    ])
    assert.equal(kontext.official[0]?.truthClass, 'official')
    assert.equal(kontext.version, ASSISTANT_TRUTH_CONTEXT_VERSION)
    assert.deepEqual(ASSISTANT_TRUTH_CLASSES, [
      'official',
      'provider',
      'recommendation',
      'community_opinion',
      'generated_suggestion',
    ])
  })

  test('lässt keine sensiblen oder kommerziellen Felder in der serialisierten Projektion', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        party: [sensibleReisende()],
        ohneTag: [handelsPunkt()],
      } as Partial<Trip>),
      officialEvaluations: [official()],
      safetyEvaluations: [safety()],
      seasonalEvaluations: [seasonal()],
      routeFacts: {
        quelle: 'flight_itinerary',
        destinationCountryCodes: ['IT'],
        transitCountryCodes: ['CH'],
      },
    })
    const serialisiert = JSON.stringify(kontext)
    const namen = [...schluesselSammeln(kontext)].map(normalisierterName)

    for (const wert of VERBOTENE_WERTE) {
      assert.equal(serialisiert.includes(wert), false, `leak value ${wert}`)
    }
    for (const name of namen) {
      assert.equal(VERBOTENE_FELDNAMEN.has(name), false, `leak field ${name}`)
    }
    assert.equal(serialisiert.includes('booking.leak.test'), false)
    assert.equal(serialisiert.includes('paid-provider-raw'), false)
    assert.equal(serialisiert.includes('duffel'), false)
    assert.equal(kontext.official[0]?.authority, 'MAECI')
    assert.equal(kontext.official[0]?.checkedAt, JETZT)
    assert.equal(Object.prototype.hasOwnProperty.call(kontext.official[0], 'contextFingerprint'), false)
  })

  test('projiziert keinen Official-contextFingerprint und bindet Transit nicht per Landesgleichheit', () => {
    const kontext = assistantTruthContextProjizieren({
      reise: reise({
        stages: [etappe({ id: 'stage-fl', position: 1, name: 'Florenz', countryCode: 'IT' })],
      }),
      officialEvaluations: [
        official({
          requirementType: 'visa',
          destinationCountryCode: 'IT',
          transitCountryCode: null,
          result: 'required',
          evidence: { ...official().evidence, contextFingerprint: LEAK_FINGERPRINT },
        }),
        official({
          requirementType: 'transit',
          destinationCountryCode: 'IT',
          transitCountryCode: 'IT',
          result: 'not_required',
          visaMode: null,
          evidence: {
            ...official().evidence,
            contextFingerprint: `${LEAK_FINGERPRINT}|scope=transit`,
          },
        }),
      ],
      routeFacts: {
        quelle: 'flight_itinerary',
        destinationCountryCodes: ['IT'],
        transitCountryCodes: ['IT'],
      },
    })
    const serialisiert = JSON.stringify(kontext)
    assert.equal(serialisiert.includes(LEAK_FINGERPRINT), false)
    assert.equal(serialisiert.includes(LEAK_FINGERPRINT_MARKER), false)
    assert.equal(serialisiert.includes('contextFingerprint'), false)
    const destination = kontext.official.find((eintrag) => eintrag.scope === 'destination')
    const transit = kontext.official.find((eintrag) => eintrag.scope === 'transit')
    assert.ok(destination)
    assert.ok(transit)
    assert.deepEqual(destination.boundStageIds, ['stage-fl'])
    assert.deepEqual(transit.boundStageIds, [])
    assert.deepEqual(kontext.route.destinationCountryCodes, ['IT'])
    assert.deepEqual(kontext.route.transitCountryCodes, ['IT'])
    assert.notDeepEqual(destination.boundStageIds, transit.boundStageIds)
  })

  test('ist deterministisch bei identischer Quelle', () => {
    const quelle = {
      reise: reise({
        party: [reisender(), reisender({ id: 'traveller-2', clientRef: 'traveller:2', label: 'Sam' })],
      }),
      officialEvaluations: [official(), official({ freshness: 'recheck_needed', evidence: { ...official().evidence, contextFingerprint: 'fp-2' } })],
      safetyEvaluations: [safety()],
      seasonalEvaluations: [seasonal()],
    }
    const links = assistantTruthContextProjizieren(quelle)
    const rechts = assistantTruthContextProjizieren(quelle)
    assert.equal(JSON.stringify(links), JSON.stringify(rechts))
  })
})
