// lib/trips/destination-essentials.test.ts
//
// Destination Essentials fasst nur vorhandene Ziel-Wahrheit zusammen.
// Transit, Label-Ähnlichkeit oder fehlende Evidence dürfen keine
// Reiseberatung erzeugen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  DESTINATION_ESSENTIALS_LEERTEXT,
  DESTINATION_ESSENTIALS_TITEL,
  destinationEssentialsAbleiten,
  destinationIstOfficialZiel,
  destinationOfficialAktion,
  destinationOfficialQuelle,
  destinationSafetyBetrifftStage,
  destinationSeasonalBetrifftStage,
} from '@/lib/trips/destination-essentials'
import { officialLeer, type OfficialEvaluation } from '@/lib/readiness/official'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

const JETZT = '2026-08-21T10:00:00.000Z'

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

function reisender(teil: Partial<TripTraveller> = {}): TripTraveller {
  return {
    id: 'traveller-1',
    clientRef: 'traveller:1',
    label: 'Alex',
    residenceCountryCode: 'CH',
    citizenships: [
      { id: 'cit-ch', clientRef: 'cit:ch', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
      { id: 'cit-rs', clientRef: 'cit:rs', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
    ],
    documents: [
      {
        id: 'doc-ch',
        clientRef: 'document:passport:CH',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        expiresOn: '2030-01-01',
        citizenshipClientRef: 'cit:ch',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
      {
        id: 'doc-rs',
        clientRef: 'document:passport:RS',
        documentType: 'passport',
        issuingCountryCode: 'RS',
        expiresOn: '2029-01-01',
        citizenshipClientRef: 'cit:rs',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
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
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
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
    ohneTag: [],
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
      contextFingerprint: 'fp-official',
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
      provider: 'fixture',
      authority: 'test',
      sourceUrl: null,
      checkedAt: JETZT,
      validFrom: null,
      validUntil: null,
      ruleReference: 'rule-1',
      contextFingerprint: 'fp-official',
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
    evidence: leereSafetyEvidence('fp-safety'),
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
    evidence: leereSeasonalEvidence(),
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
    ...teil,
  }
}

describe('Etappenprojektion', () => {
  test('bewahrt Reihenfolge und hält doppelte Länder getrennt', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise({
        stages: [
          etappe({ id: 'stage-rm', position: 2, name: 'Rom', countryCode: 'IT' }),
          etappe({ id: 'stage-fl', position: 1, name: 'Florenz', countryCode: 'IT' }),
        ],
      }),
    })
    assert.deepEqual(
      ableitung.ziele.map((ziel) => ({ id: ziel.stageId, land: ziel.countryCode, name: ziel.name })),
      [
        { id: 'stage-fl', land: 'IT', name: 'Florenz' },
        { id: 'stage-rm', land: 'IT', name: 'Rom' },
      ],
    )
    assert.equal(ableitung.ziele[0]?.stageId === ableitung.ziele[1]?.stageId, false)
  })

  test('leitet keinen Landescode aus dem Namen ab', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise({
        stages: [etappe({ id: 'stage-th', name: 'Thailand', countryCode: null })],
      }),
      officialEvaluations: [official({ destinationCountryCode: 'TH', result: 'not_required' })],
    })
    const ziel = ableitung.ziele[0]
    assert.equal(ziel?.countryCode, null)
    assert.equal(ziel?.countryLabel, null)
    assert.equal(ziel?.name, 'Thailand')
    assert.equal(ziel?.einreise.lage, 'keine_evidence')
    assert.equal(destinationIstOfficialZiel(official({ destinationCountryCode: 'TH' }), null), false)
  })

  test('zeigt Name, Land und Daten nur wenn vorhanden und schliesst nicht auf visited', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise({
        stages: [
          etappe({
            id: 'stage-alt',
            name: '  ',
            countryCode: null,
            arrivalDate: '2020-01-01',
            departureDate: '2020-01-08',
          }),
        ],
      }),
    })
    const ziel = ableitung.ziele[0]
    assert.equal(ziel?.name, null)
    assert.equal(ziel?.countryLabel, null)
    assert.equal(ziel?.zeitraumText, '01. Jan. – 08. Jan.')
    assert.equal('visited' in (ziel ?? {}), false)
  })
})

describe('Official-Zielwahrheit', () => {
  test('hält Destination und Transit getrennt', () => {
    const transit = official({
      requirementType: 'transit',
      destinationCountryCode: 'IT',
      transitCountryCode: 'QA',
      result: 'required',
    })
    const zielVisa = official({
      requirementType: 'visa',
      destinationCountryCode: 'IT',
      transitCountryCode: null,
      result: 'required',
    })
    assert.equal(destinationIstOfficialZiel(transit, 'IT'), false)
    assert.equal(destinationIstOfficialZiel(zielVisa, 'IT'), true)

    const ableitung = destinationEssentialsAbleiten({
      reise: reise({ stages: [etappe({ id: 'stage-fl', name: 'Florenz', countryCode: 'IT' })] }),
      officialEvaluations: [transit],
    })
    assert.equal(ableitung.ziele[0]?.einreise.lage, 'keine_evidence')
    assert.equal(ableitung.ziele[0]?.einreise.text, DESTINATION_ESSENTIALS_LEERTEXT)
  })

  test('macht unknown, unavailable und stale niemals zu not required', () => {
    const faelle: Array<[Partial<OfficialEvaluation>, string]> = [
      [{ result: 'unknown', status: 'unknown', freshness: 'never_checked' }, 'unknown'],
      [{ result: 'not_required', status: 'unavailable', freshness: 'provider_unavailable' }, 'unavailable'],
      [{ result: 'not_required', status: 'current', freshness: 'stale' }, 'stale'],
      [{ result: 'not_required', status: 'current', freshness: 'recheck_needed' }, 'stale'],
    ]
    for (const [lage, erwartet] of faelle) {
      const ableitung = destinationEssentialsAbleiten({
        reise: reise({ stages: [etappe({ id: 'stage-fl', name: 'Florenz', countryCode: 'IT' })] }),
        officialEvaluations: [official(lage)],
      })
      assert.equal(ableitung.ziele[0]?.einreise.lage, erwartet)
      assert.notEqual(ableitung.ziele[0]?.einreise.lage, 'not_required')
      assert.equal(/nicht erforderlich/i.test(ableitung.ziele[0]?.einreise.text ?? ''), false)
    }
  })

  test('bewertet Credential-Optionen getrennt und nimmt keinen Default-Pass', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise({ stages: [etappe({ id: 'stage-fl', name: 'Florenz', countryCode: 'IT' })] }),
      officialEvaluations: [
        official({
          credentialOptionRef: 'traveller:1:document:passport:CH',
          result: 'required',
          status: 'current',
          freshness: 'current',
        }),
        official({
          credentialOptionRef: 'traveller:1:document:passport:RS',
          result: 'not_required',
          status: 'current',
          freshness: 'current',
          visaMode: 'visa_exempt',
        }),
      ],
    })
    assert.equal(ableitung.ziele[0]?.einreise.lage, 'required')
    assert.equal(ableitung.ziele[0]?.einreise.unvollstaendig, false)
    assert.equal(ableitung.ziele[0]?.einreise.details.length, 2)
    assert.equal(
      ableitung.ziele[0]?.einreise.details.some((detail) => detail.text === 'Nicht erforderlich'),
      true,
    )
    assert.equal(
      ableitung.ziele[0]?.einreise.details.some((detail) => detail.text === 'Erforderlich'),
      true,
    )
  })

  test('not_required nur bei durchgehend aktueller Gewissheit', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise({ stages: [etappe({ id: 'stage-fl', name: 'Florenz', countryCode: 'IT' })] }),
      officialEvaluations: [
        official({ result: 'not_required', status: 'current', freshness: 'current', visaMode: 'visa_exempt' }),
      ],
    })
    assert.equal(ableitung.ziele[0]?.einreise.lage, 'not_required')
  })

  test('nur validierte Official-Actions sind actionable', () => {
    const mitAction = official({
      action: {
        kind: 'open_official_action',
        purpose: 'application',
        href: 'https://example.test/apply',
      },
      evidence: {
        provider: 'fixture',
        authority: 'test',
        sourceUrl: 'https://example.test/source',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: 'rule-1',
        contextFingerprint: 'fp-official',
      },
    })
    const nurQuelle = official({
      action: null,
      evidence: {
        provider: 'fixture',
        authority: 'test',
        sourceUrl: 'https://example.test/source',
        checkedAt: JETZT,
        validFrom: null,
        validUntil: null,
        ruleReference: 'rule-1',
        contextFingerprint: 'fp-official',
      },
    })
    const ungueltig = official({
      action: {
        kind: 'open_official_action',
        purpose: 'application',
        href: 'http://example.test/apply',
      },
    })

    const action = destinationOfficialAktion(mitAction)
    const quelle = destinationOfficialQuelle(mitAction)
    assert.equal(action?.art, 'action')
    assert.equal(action?.label, 'Offiziellen Antrag öffnen')
    assert.equal(quelle?.art, 'source')
    assert.equal(quelle?.label, 'Offizielle Quelle öffnen')
    assert.equal(destinationOfficialAktion(nurQuelle), null)
    assert.equal(destinationOfficialQuelle(nurQuelle)?.art, 'source')
    assert.equal(destinationOfficialAktion(ungueltig), null)

    const ableitung = destinationEssentialsAbleiten({
      reise: reise({ stages: [etappe({ id: 'stage-fl', name: 'Florenz', countryCode: 'IT' })] }),
      officialEvaluations: [mitAction],
    })
    assert.deepEqual(
      ableitung.ziele[0]?.einreise.links.map((link) => link.art),
      ['action', 'source'],
    )
  })
})

describe('Safety- und Seasonal-Zuordnung', () => {
  test('nutzt nur explizite Stage-Refs, keine Label-Ähnlichkeit', () => {
    const perLabel = safety({
      factId: 'safe-label',
      affectedRefs: [{ kind: 'airport', id: 'FLR', label: 'Florenz' }],
    })
    const perStage = safety({
      factId: 'safe-stage',
      affectedRefs: [{ kind: 'stage', id: 'stage-fl', label: 'Ganz anderer Name' }],
    })
    assert.equal(destinationSafetyBetrifftStage(perLabel, 'stage-fl'), false)
    assert.equal(destinationSafetyBetrifftStage(perStage, 'stage-fl'), true)

    const saisonLabel = seasonal({
      factId: 'season-label',
      affectedRefs: [{ kind: 'airport', id: 'FCO', label: 'Rom' }],
    })
    const saisonStage = seasonal({
      factId: 'season-stage',
      affectedRefs: [{ kind: 'stage', id: 'stage-rm', label: 'nicht Rom' }],
    })
    assert.equal(destinationSeasonalBetrifftStage(saisonLabel, 'stage-rm'), false)
    assert.equal(destinationSeasonalBetrifftStage(saisonStage, 'stage-rm'), true)

    const ableitung = destinationEssentialsAbleiten({
      reise: reise(),
      safetyEvaluations: [perLabel, perStage],
      seasonalEvaluations: [saisonLabel, saisonStage],
    })
    assert.equal(ableitung.ziele[0]?.sicherheit.lage, 'important_notice')
    assert.equal(ableitung.ziele[0]?.sicherheit.details[0]?.id, 'safe-stage')
    assert.equal(ableitung.ziele[1]?.sicherheit.lage, 'keine_evidence')
    assert.equal(ableitung.ziele[1]?.saison.lage, 'timing_check')
    assert.equal(ableitung.ziele[0]?.saison.lage, 'keine_evidence')
  })
})

describe('Leerstand und Suche', () => {
  test('leere Evidence bleibt ehrlich begrenzt', () => {
    const ohneZiele = destinationEssentialsAbleiten({ reise: reise({ stages: [] }) })
    assert.equal(ohneZiele.hatZiele, false)
    assert.equal(ohneZiele.hatHinweise, false)
    assert.equal(ohneZiele.leerText, DESTINATION_ESSENTIALS_LEERTEXT)
    assert.equal(ohneZiele.titel, DESTINATION_ESSENTIALS_TITEL)

    const ohneEvidence = destinationEssentialsAbleiten({ reise: reise() })
    assert.equal(ohneEvidence.hatHinweise, false)
    assert.equal(ohneEvidence.ziele[0]?.einreise.text, DESTINATION_ESSENTIALS_LEERTEXT)
    assert.equal(ohneEvidence.ziele[0]?.sicherheit.text, DESTINATION_ESSENTIALS_LEERTEXT)
    assert.equal(ohneEvidence.ziele[0]?.saison.text, DESTINATION_ESSENTIALS_LEERTEXT)
    assert.doesNotMatch(ohneEvidence.ziele[0]?.einreise.text ?? '', /nicht erforderlich|entwarnt|gute reisezeit/i)
  })

  test('löst keine Commercial-Suche aus', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: reise(),
      officialEvaluations: [official()],
      safetyEvaluations: [safety()],
      seasonalEvaluations: [seasonal()],
    })
    assert.equal(ableitung.loestSucheAus, false)
  })

  test('führt keinen DB-, Provider-, Service-Worker- oder Indexing-Scope ein', () => {
            const dateien = [
              'lib/trips/destination-essentials.ts',
              'components/trips/TripWorkspaceDestinationEssentials.tsx',
            ]
    for (const datei of dateien) {
      const inhalt = readFileSync(resolve(datei), 'utf8')
      assert.doesNotMatch(inhalt, /@supabase|createClient|service_role|serviceRole/)
      assert.doesNotMatch(inhalt, /serviceWorker|navigator\.serviceWorker|\/sw\.js/)
      assert.doesNotMatch(inhalt, /robots\.txt|sitemap|index,\s*follow/)
      assert.doesNotMatch(inhalt, /sucheSollMounten|sucheOeffnen|FlugSuche|HotelBereich/)
      assert.doesNotMatch(inhalt, /from '@\/lib\/flights|from '@\/lib\/hotels|from '@\/lib\/activities/)
    }
  })
})
