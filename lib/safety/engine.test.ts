import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { safetyAuswerten, safetyAusFacts, safetyLokalFuerReise } from '@/lib/safety/engine'
import { safetyContextFingerprint } from '@/lib/safety/fingerprint'
import {
  SAFETY_NOW_MS,
  bangkokRouteReise,
  mehrzielreise,
  safetyFact,
  testSafetyProvider,
} from '@/lib/safety/fixtures'
import type { SafetyProviderFact } from '@/lib/safety/provider'
import { safetyAnsicht } from '@/lib/safety/status'

const JETZT = SAFETY_NOW_MS

function warnungen(evaluations: Awaited<ReturnType<typeof safetyAuswerten>>) {
  return evaluations.filter(
    (eintrag) =>
      eintrag.relevance === 'affected' &&
      (eintrag.presentationClass === 'critical_warning' ||
        eintrag.presentationClass === 'important_notice' ||
        eintrag.presentationClass === 'information'),
  )
}

describe('Safety-Engine', () => {
  test('1 Provider fehlt => unavailable / keine Fake-Warnung', async () => {
    const evaluations = await safetyAuswerten(mehrzielreise(), null, null, JETZT)
    assert.equal(evaluations.length, 1)
    assert.equal(evaluations[0]?.freshness, 'provider_unavailable')
    assert.equal(evaluations[0]?.evidenceStatus, 'unavailable')
    assert.equal(warnungen(evaluations).length, 0)
    assert.equal(safetyAnsicht(mehrzielreise()).summary.sichtbar, false)
  })

  test('2 Provider throw => fail closed', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider(async () => {
        throw new Error('timeout')
      }),
      null,
      JETZT,
    )
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('3 malformed Provider-Response => verworfen', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      {
        name: 'audit-safety',
        async evaluate() {
          return 'nein' as unknown as SafetyProviderFact[]
        },
      },
      null,
      JETZT,
    )
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('4 stale Evidence => nicht als current Warning', async () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validUntil: '2026-08-01' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'recheck_needed')
    assert.equal(evaluations[0]?.presentationClass, 'unknown')
  })

  test('5 resolved Event => nicht still aktiv', async () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'resolved' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(evaluations[0]?.relevance, 'affected')
    assert.equal(evaluations[0]?.presentationClass, 'unknown')
  })

  test('6 semantisch identische Duplikate werden dedupliziert', () => {
    const fact = safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [fact, { ...fact, sourceUrl: 'https://example.org/other' }],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations.length, 1)
    assert.equal(evaluations[0]?.relevance, 'affected')
  })

  test('7 widersprüchliche Duplikate bleiben konfliktbehaftet', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'active' }),
        safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'resolved' }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations.length, 1)
    assert.equal(evaluations[0]?.conflict, true)
    assert.equal(evaluations[0]?.presentationClass, 'unknown')
  })

  test('8 umgekehrte Provider-Reihenfolge ergibt identisches Resultat', () => {
    const a = safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'active' })
    const b = safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'resolved' })
    const vor = safetyAusFacts(mehrzielreise(), [a, b], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [b, a], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
  })

  test('9 kritisches Event betrifft genau eine Etappe', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const betroffen = evaluations[0]?.affectedRefs.filter((ref) => ref.kind === 'stage').map((ref) => ref.id)
    assert.deepEqual(betroffen, ['stage-1'])
    assert.equal(evaluations[0]?.spatialPrecision, 'city')
  })

  test('10 Event im selben Land ausserhalb der Reisezone warnt nicht pauschal', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-milano',
          category: 'earthquake',
          spatialScope: { kind: 'city', countryCode: 'IT', placeId: 'geonames:3173435', cityName: 'Mailand' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
    assert.equal(evaluations[0]?.affectedRefs.length, 0)
  })

  test('11 Country-Level Warning bleibt country-level', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'unrest-it',
          category: 'civil_unrest',
          spatialScope: { kind: 'country', countryCode: 'IT' },
          sourceSeverity: 'moderate',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.equal(evaluations[0]?.spatialPrecision, 'country')
    assert.match(evaluations[0]?.reason ?? '', /Landesebene/)
  })

  test('12 Transit-Airport betroffen, Ziel nicht pauschal', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doh-disrupt',
          category: 'infrastructure_disruption',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.equal(evaluations[0]?.spatialPrecision, 'airport')
    assert.equal(evaluations[0]?.affectedRefs.some((ref) => ref.id === 'stage-bkk'), false)
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.domain === 'flight'), true)
  })

  test('13 Event endet vor Reisebeginn', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validUntil: '2026-09-01' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('14 Event beginnt nach Reiseende', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-10-01' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('15 unklare Geo-Evidence => insufficient context', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-unklar',
          category: 'earthquake',
          spatialScope: { kind: 'point_radius', latitude: 43.77, longitude: 11.25 },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('16 betroffene Stage liefert Hotel/Activity/Day-Plan Recheck', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise({
        days: mehrzielreise().days,
        ohneTag: [
          {
            ...mehrzielreise().days[0]!.items[0]!,
            id: 'stay-1',
            kind: 'stay',
            title: 'Hotel Florenz',
            dayId: null,
            stageId: 'stage-1',
          },
        ],
      }),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const domains = evaluations[0]?.impact.map((eintrag) => eintrag.domain) ?? []
    assert.equal(domains.includes('stay'), true)
    assert.equal(domains.includes('activity'), true)
    assert.equal(domains.includes('day_plan'), true)
    assert.equal(evaluations[0]?.impact.every((eintrag) => eintrag.status !== 'affected' || eintrag.domain === 'stage'), true)
  })

  test('17 betroffener Transit prüft Flight/Readiness ohne Routenmutation', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doh-disrupt',
          category: 'infrastructure_disruption',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.nextAction, 'check_route')
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.domain === 'readiness'), true)
  })

  test('18 unabhängige Stage bleibt unbetroffen', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.affectedRefs.some((ref) => ref.id === 'stage-2'), false)
  })

  test('19 keine Cross-Trip-Refs', () => {
    const reise = mehrzielreise()
    const evaluations = safetyAusFacts(
      reise,
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const ids = new Set([
      ...reise.stages.map((etappe) => etappe.id),
      ...reise.days.map((tag) => tag.id),
      ...reise.days.flatMap((tag) => tag.items.map((punkt) => punkt.id)),
      'readiness',
    ])
    for (const ref of evaluations[0]?.affectedRefs ?? []) {
      if (ref.kind === 'stage' || ref.kind === 'day' || ref.kind === 'item') assert.equal(ids.has(ref.id), true)
    }
  })

  test('20 Stage-Änderung verändert Evaluation', () => {
    const vorher = safetyContextFingerprint(mehrzielreise())
    const nachher = safetyContextFingerprint(
      mehrzielreise({
        stages: mehrzielreise().stages.filter((etappe) => etappe.id === 'stage-1'),
      }),
    )
    assert.notEqual(vorher, nachher)
  })

  test('21 Route-Änderung verändert Evaluation', () => {
    const vorher = safetyContextFingerprint(bangkokRouteReise())
    const ohneFlug = safetyContextFingerprint(mehrzielreise())
    assert.notEqual(vorher, ohneFlug)
  })

  test('22 Datumsänderung verändert Evaluation', () => {
    const vorher = safetyContextFingerprint(mehrzielreise())
    const nachher = safetyContextFingerprint(mehrzielreise({ startDate: '2026-10-01', endDate: '2026-10-05' }))
    assert.notEqual(vorher, nachher)
  })

  test('23 reine Array-Reihenfolge ändert den Fingerprint nicht', () => {
    const a = mehrzielreise()
    const b = mehrzielreise({
      stages: [...a.stages].reverse(),
      days: [...a.days].reverse(),
    })
    assert.equal(safetyContextFingerprint(a), safetyContextFingerprint(b))
  })

  test('24 Source-Freshness-Wechsel invalidiert alte Bewertung', () => {
    const current = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const stale = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validUntil: '2026-08-01' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(current[0]?.freshness, 'current')
    assert.equal(stale[0]?.freshness, 'recheck_needed')
  })

  test('31 saisonales Muster ohne akutes Ereignis erzeugt keine Warnung', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'monsoon-it',
          category: 'flood',
          nature: 'seasonal_pattern',
          headline: 'Typische Regenzeit',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.equal(evaluations.every((eintrag) => !eintrag.seasonalRejected || eintrag.presentationClass === 'unknown'), true)
  })

  test('Client-Evidence und LLM-Felder werden ignoriert', () => {
    const evaluations = safetyAusFacts(mehrzielreise(), [], null, {
      nowMs: JETZT,
      roh: { llmResult: 'safe', officialResult: 'safe', safetyFacts: [{ category: 'earthquake' }] },
    })
    assert.equal(evaluations[0]?.freshness, 'provider_unavailable')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('lokale Auswertung bleibt fail-closed', () => {
    const evaluations = safetyLokalFuerReise(mehrzielreise())
    assert.equal(evaluations[0]?.evidenceStatus, 'unavailable')
  })
})
