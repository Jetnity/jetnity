import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { safetyZusammenfassungText } from '@/lib/safety/anzeige'
import { safetyAuswerten, safetyAusFacts, safetyLokalFuerReise } from '@/lib/safety/engine'
import { safetyContextFingerprint } from '@/lib/safety/fingerprint'
import {
  SAFETY_NOW_MS,
  bangkokRouteReise,
  mehrzielreise,
  mumbaiDelhiRouteReise,
  safetyFact,
  testSafetyProvider,
} from '@/lib/safety/fixtures'
import type { SafetyProviderFact } from '@/lib/safety/provider'
import { safetyAnsicht, safetyApiStatus } from '@/lib/safety/status'
import type { TripTraveller } from '@/types/trips'

const JETZT = SAFETY_NOW_MS

function reisender(opts: { clientRef: string; codes: string[] }): TripTraveller {
  return {
    id: opts.clientRef,
    clientRef: opts.clientRef,
    label: opts.clientRef,
    residenceCountryCode: null,
    citizenships: opts.codes.map((code) => ({
      id: `${opts.clientRef}-${code}`,
      clientRef: `${opts.clientRef}:cit:${code}`,
      countryCode: code,
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
    })),
    documents: [],
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  }
}

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
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: '2026-01-01T09:00:00.000Z' })],
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
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: '2026-01-01T09:00:00.000Z' })],
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

  test('Review Freshness: altes checkedAt ohne Event-Ende ist nicht current', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validUntil: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const alt = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: '2020-04-01T09:00:00.000Z', validUntil: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'current')
    assert.equal(alt[0]?.freshness, 'recheck_needed')
    assert.equal(warnungen(alt).length, 0)
  })

  test('Review Freshness: aktuelles checkedAt bei zukünftigem Event bleibt current', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-09-13', validUntil: '2026-09-14' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'current')
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.notEqual(evaluations[0]?.presentationClass, 'unknown')
  })

  test('Review Freshness: Event-Fenster ändert Relevanz, nicht Evidence-Frische', () => {
    const current = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-09-13' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const danach = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-10-01' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(current[0]?.freshness, danach[0]?.freshness)
    assert.equal(current[0]?.freshness, 'current')
    assert.equal(current[0]?.relevance, 'affected')
    assert.equal(danach[0]?.relevance, 'not_affected')
  })

  test('Review Freshness: fehlendes checkedAt bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'never_checked')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Review Geo: Region ohne Membership bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'unrest-lombardy',
          category: 'civil_unrest',
          spatialScope: { kind: 'admin_region', countryCode: 'IT', regionName: 'Lombardei' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Review Geo: andere belegte Stadt bleibt not_affected', () => {
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
  })

  test('Review Geo: Stadt nur per Name ergibt kein not_affected', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-firenze-name',
          category: 'earthquake',
          spatialScope: { kind: 'city', countryCode: 'IT', cityName: 'Firenze' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Review Geo: Polygon ohne Land und ohne Koordinaten bleibt insufficient', () => {
    const reise = mehrzielreise({
      stages: mehrzielreise().stages.map((etappe) => ({ ...etappe, latitude: null, longitude: null })),
    })
    const evaluations = safetyAusFacts(
      reise,
      [
        safetyFact({
          factKey: 'poly-unklar',
          category: 'flood',
          spatialScope: {
            kind: 'polygon',
            coordinates: [
              [43.7, 11.2],
              [43.8, 11.2],
              [43.8, 11.3],
            ],
          },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Review Geo: kanonischer City-Place-Match bleibt affected', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.deepEqual(evaluations[0]?.affectedRefs.map((ref) => ref.id), ['stage-1'])
  })

  test('Review Dedup: traveller-dependent vs trip-level ist order-independent', () => {
    const trip = safetyFact({ factKey: 'eq-firenze', category: 'earthquake', travellerDependent: false })
    const traveller = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      travellerDependent: true,
      travellerCitizenshipCodes: ['RS'],
    })
    const vor = safetyAusFacts(mehrzielreise(), [trip, traveller], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [traveller, trip], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(vor[0]?.conflict, true)
    assert.equal(warnungen(vor).length, 0)
  })

  test('Review Dedup: unterschiedliche Citizenship-Mengen sind order-independent', () => {
    const a = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      travellerDependent: true,
      travellerCitizenshipCodes: ['RS'],
    })
    const b = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      travellerDependent: true,
      travellerCitizenshipCodes: ['CH'],
    })
    const vor = safetyAusFacts(mehrzielreise(), [a, b], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [b, a], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(vor[0]?.conflict, true)
  })

  test('Review Dedup: trusted und untrusted Evidence bleibt order-independent', () => {
    const trusted = safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })
    const untrusted = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      sourceUrl: 'http://example.org/advisory',
    })
    const vor = safetyAusFacts(mehrzielreise(), [untrusted, trusted], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [trusted, untrusted], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(vor[0]?.evidence.sourceUrl, 'https://example.org/advisory')
    assert.notEqual(vor[0]?.presentationClass, 'unknown')
  })

  test('Review Dedup: 41 Facts vorn oder hinten ergeben dasselbe fail-closed Resultat', () => {
    const kritisch = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      sourceSeverity: 'extreme',
      advisoryClass: 'do_not_travel',
    })
    const fueller = Array.from({ length: 40 }, (_, index) =>
      safetyFact({
        factKey: `info-${index}`,
        category: 'other',
        spatialScope: { kind: 'country', countryCode: 'FR' },
        sourceSeverity: 'minor',
      }),
    )
    const vor = safetyAusFacts(mehrzielreise(), [kritisch, ...fueller], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [...fueller, kritisch], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(warnungen(vor).length, 0)
    assert.match(vor[0]?.reason ?? '', /zu viele Zeilen/)
  })

  test('Review Dedup: malformed nature erzeugt keine akute Warnung', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', nature: 'monsoon_vibes' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Review Timeout: hängender Provider bleibt fail-closed', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider(() => new Promise(() => {})),
      null,
      JETZT,
      30,
    )
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    assert.match(evaluations[0]?.reason ?? '', /nicht rechtzeitig/)
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Review Timeout: schneller Provider bleibt unverändert', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider([safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })]),
      null,
      JETZT,
      200,
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.equal(evaluations[0]?.freshness, 'current')
  })

  test('Review Timeout: Throw bleibt ohne Warn-Truth', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider(async () => {
        throw new Error('boom')
      }),
      null,
      JETZT,
      200,
    )
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    assert.match(evaluations[0]?.reason ?? '', /nicht erreichbar/)
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: leerer erfolgreicher Provider ist nicht unavailable', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider([]),
      null,
      JETZT,
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(ansicht.summary.unavailable, false)
    assert.equal(warnungen(evaluations).length, 0)
    assert.equal(evaluations[0]?.factKey, 'checked_empty')
    assert.match(evaluations[0]?.reason ?? '', /keine Entwarnung/)
  })

  test('Re-Review: vollständig malformed Antwort ist unknown, nicht checked-clean', () => {
    const evaluations = safetyAusFacts(mehrzielreise(), [null, 'nein'], 'audit-safety', { nowMs: JETZT })
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.notEqual(evaluations[0]?.factKey, 'checked_empty')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: Seasonal-only bleibt geprüft, nicht unavailable', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'monsoon-it',
          category: 'flood',
          nature: 'seasonal_pattern',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(ansicht.summary.unavailable, false)
    assert.equal(warnungen(evaluations).length, 0)
    assert.equal(evaluations[0]?.factKey, 'checked_empty')
  })

  test('Re-Review: [null] crasht nicht und bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(mehrzielreise(), [null], 'audit-safety', { nowMs: JETZT })
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: travellerCitizenshipCodes als String bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [{ ...safetyFact({ factKey: 'eq-firenze', category: 'earthquake' }), travellerCitizenshipCodes: 'CH' as unknown as string[] }],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.notEqual(evaluations[0]?.factKey, 'checked_empty')
  })

  test('Re-Review: malformed validFrom erzeugt keine Warnung', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: 'gestern' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: malformed validUntil erzeugt keine Warn- oder Entwarn-Truth', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validUntil: 'bald' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: malformed freshUntil wird nicht current durch Fallback', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', freshUntil: 'irgendwann' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(evaluations[0]?.freshness, 'current')
    assert.equal(warnungen(evaluations).length, 0)
  })

  test('Re-Review: Transit QA + Admin-Region QA bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'qa-region',
          category: 'civil_unrest',
          spatialScope: { kind: 'admin_region', countryCode: 'QA', regionName: 'Ad Dawhah' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
    assert.notEqual(evaluations[0]?.relevance, 'not_affected')
  })

  test('Re-Review: Transit QA + Place QA ohne Route-Membership bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doha-place',
          category: 'civil_unrest',
          spatialScope: { kind: 'place', countryCode: 'QA', placeId: 'geonames:290030' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Re-Review: Transit QA + City QA ohne Place-Match bleibt nicht not_affected', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doha-city',
          category: 'civil_unrest',
          spatialScope: { kind: 'city', countryCode: 'QA', cityName: 'Doha' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Re-Review: Transit QA + Polygon QA ohne Route-Koordinaten bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'qa-poly',
          category: 'flood',
          spatialScope: {
            kind: 'polygon',
            countryCode: 'QA',
            coordinates: [
              [25.2, 51.4],
              [25.4, 51.4],
              [25.4, 51.6],
            ],
          },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Re-Review: anderes Land ohne Route-Schnitt bleibt not_affected', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'fr-region',
          category: 'civil_unrest',
          spatialScope: { kind: 'admin_region', countryCode: 'FR', regionName: 'Île-de-France' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('Re-Review: Airport DOH bleibt affected', () => {
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
  })

  test('Re-Review: unvollständiger zweiter Traveller bleibt insufficient', () => {
    const reise = mehrzielreise({
      travellers: 2,
      party: [reisender({ clientRef: 'traveller:1', codes: ['RS'] })],
    })
    const evaluations = safetyAusFacts(
      reise,
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          travellerDependent: true,
          travellerCitizenshipCodes: ['CH'],
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Re-Review: vollständige Traveller ohne Match bleiben not_affected', () => {
    const reise = mehrzielreise({
      travellers: 2,
      party: [
        reisender({ clientRef: 'traveller:1', codes: ['RS'] }),
        reisender({ clientRef: 'traveller:2', codes: ['IT'] }),
      ],
    })
    const evaluations = safetyAusFacts(
      reise,
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          travellerDependent: true,
          travellerCitizenshipCodes: ['CH'],
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('Re-Review: CH-Match bleibt affected', () => {
    const reise = mehrzielreise({
      travellers: 2,
      party: [
        reisender({ clientRef: 'traveller:1', codes: ['RS'] }),
        reisender({ clientRef: 'traveller:2', codes: ['CH'] }),
      ],
    })
    const evaluations = safetyAusFacts(
      reise,
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          travellerDependent: true,
          travellerCitizenshipCodes: ['CH'],
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
  })

  test('Re-Review: Citizenship-Wechsel ändert Context-Fingerprint', () => {
    const rs = mehrzielreise({
      travellers: 1,
      party: [reisender({ clientRef: 'traveller:1', codes: ['RS'] })],
    })
    const ch = mehrzielreise({
      travellers: 1,
      party: [reisender({ clientRef: 'traveller:1', codes: ['CH'] })],
    })
    assert.notEqual(safetyContextFingerprint(rs), safetyContextFingerprint(ch))
  })

  test('Re-Review: validFrom und freshUntil ändern Event-Fingerprint', () => {
    const basis = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const validFrom = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-09-13' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const freshUntil = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', freshUntil: '2026-08-22T09:00:00.000Z' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const severity = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', sourceSeverity: 'extreme', advisoryClass: 'do_not_travel' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(basis[0]?.eventFingerprint, validFrom[0]?.eventFingerprint)
    assert.notEqual(basis[0]?.eventFingerprint, freshUntil[0]?.eventFingerprint)
    assert.notEqual(basis[0]?.eventFingerprint, severity[0]?.eventFingerprint)
  })

  test('Final: Timeout ist nicht clean/ok und enthält keine Entwarnung', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider(() => new Promise(() => {})),
      null,
      JETZT,
      30,
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    const text = safetyZusammenfassungText(ansicht.summary)
    assert.equal(safetyApiStatus(ansicht.summary), 'unavailable')
    assert.notEqual(ansicht.summary.checkState, 'checked_clean')
    assert.match(text, /keine Entwarnung/)
    assert.equal(text.includes('Keine aktuelle Safety-Warnung'), false)
  })

  test('Final: Throw ist nicht clean/ok', async () => {
    const evaluations = await safetyAuswerten(
      mehrzielreise(),
      testSafetyProvider(async () => {
        throw new Error('boom')
      }),
      null,
      JETZT,
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(safetyApiStatus(ansicht.summary), 'unavailable')
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Keine aktuelle Safety-Warnung'), false)
  })

  test('Final: malformed Response ist unknown ohne Clean-Copy', () => {
    const evaluations = safetyAusFacts(mehrzielreise(), [null, 1], 'audit-safety', { nowMs: JETZT })
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(safetyApiStatus(ansicht.summary), 'unknown')
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Keine aktuelle Safety-Warnung'), false)
  })

  test('Final: stale/recheck ohne Warnung hat keine Clean-Copy', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: '2026-01-01T09:00:00.000Z' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(evaluations[0]?.freshness, 'recheck_needed')
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Keine aktuelle Safety-Warnung'), false)
  })

  test('Final: Konflikt ohne current Warning hat keine Clean-Copy', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'active' }),
        safetyFact({ factKey: 'eq-firenze', category: 'earthquake', status: 'resolved' }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(evaluations[0]?.conflict, true)
    assert.equal(ansicht.summary.checkState, 'unknown')
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Keine aktuelle Safety-Warnung'), false)
  })

  test('Final: leerer Provider bleibt checked-clean', async () => {
    const evaluations = await safetyAuswerten(mehrzielreise(), testSafetyProvider([]), null, JETZT)
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(ansicht.summary.checkState, 'checked_clean')
    assert.equal(safetyApiStatus(ansicht.summary), 'ok')
    assert.equal(ansicht.summary.unavailable, false)
    assert.match(safetyZusammenfassungText(ansicht.summary), /Keine aktuelle Safety-Warnung/)
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Reise ist sicher'), false)
  })

  test('Final: Seasonal-only ist geprüft, nicht unavailable, keine globale Sicherheit', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'monsoon-it', category: 'flood', nature: 'seasonal_pattern' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const ansicht = safetyAnsicht(mehrzielreise(), evaluations)
    assert.equal(ansicht.summary.checkState, 'checked_clean')
    assert.equal(ansicht.summary.unavailable, false)
    assert.equal(warnungen(evaluations).length, 0)
    assert.equal(safetyZusammenfassungText(ansicht.summary).includes('Reise ist sicher'), false)
  })

  test('Final: Florenz-Event nach Abreise bleibt not_affected', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          validFrom: '2026-09-15',
          validUntil: '2026-09-16',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('Final: Florenz-Event während der Etappe bleibt affected', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          validFrom: '2026-09-13',
          validUntil: '2026-09-13',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.deepEqual(evaluations[0]?.affectedRefs.map((ref) => ref.id), ['stage-1'])
  })

  test('Final: Country-Event betrifft nur die zeitlich passende Stage', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'unrest-it',
          category: 'civil_unrest',
          spatialScope: { kind: 'country', countryCode: 'IT' },
          validFrom: '2026-09-12',
          validUntil: '2026-09-14',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
    assert.deepEqual(evaluations[0]?.affectedRefs.map((ref) => ref.id), ['stage-1'])
  })

  test('Final: DOH-Event nach Transit bleibt not_affected', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doh-disrupt',
          category: 'infrastructure_disruption',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
          validFrom: '2026-09-15',
          validUntil: '2026-09-16',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('Final: DOH-Event während Transit bleibt affected', () => {
    const evaluations = safetyAusFacts(
      bangkokRouteReise(),
      [
        safetyFact({
          factKey: 'doh-disrupt',
          category: 'infrastructure_disruption',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
          validFrom: '2026-09-12',
          validUntil: '2026-09-12',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'affected')
  })

  test('Final: fehlendes Route-Datum bleibt insufficient, nie erfundene Entwarnung', () => {
    const reise = bangkokRouteReise()
    const flug = reise.ohneTag[0]
    if (flug?.routeItinerary) {
      flug.routeItinerary = {
        ...flug.routeItinerary,
        legs: flug.routeItinerary.legs.map((leg) => ({
          segments: leg.segments.map((segment) => ({
            ...segment,
            departureDate: null,
            arrivalDate: null,
          })),
        })),
      }
    }
    const evaluations = safetyAusFacts(
      reise,
      [
        safetyFact({
          factKey: 'doh-disrupt',
          category: 'infrastructure_disruption',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
          validFrom: '2026-09-15',
          validUntil: '2026-09-16',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(evaluations[0]?.relevance, 'not_affected')
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Final: Route-Segmentdatum ändert Context-Fingerprint', () => {
    const vorher = bangkokRouteReise()
    const nachher = bangkokRouteReise()
    const flug = nachher.ohneTag[0]
    if (flug?.routeItinerary) {
      flug.routeItinerary = {
        ...flug.routeItinerary,
        legs: flug.routeItinerary.legs.map((leg) => ({
          segments: leg.segments.map((segment) =>
            segment.destination.airportCode === 'DOH'
              ? { ...segment, arrivalDate: '2026-09-13' }
              : segment,
          ),
        })),
      }
    }
    assert.notEqual(safetyContextFingerprint(vorher), safetyContextFingerprint(nachher))
  })

  test('Final: Mumbai-Stage + DEL-Transit + City Delhi bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      mumbaiDelhiRouteReise(),
      [
        safetyFact({
          factKey: 'delhi-city',
          category: 'civil_unrest',
          spatialScope: { kind: 'city', countryCode: 'IN', placeId: 'geonames:1273294', cityName: 'Delhi' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Final: Mumbai-Stage + DEL-Transit + Place Delhi bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      mumbaiDelhiRouteReise(),
      [
        safetyFact({
          factKey: 'delhi-place',
          category: 'civil_unrest',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1273294' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Final: Mumbai-Koordinaten ausserhalb Delhi-Polygon + DEL ohne Route-Koordinaten bleibt insufficient', () => {
    const evaluations = safetyAusFacts(
      mumbaiDelhiRouteReise(),
      [
        safetyFact({
          factKey: 'delhi-poly',
          category: 'flood',
          spatialScope: {
            kind: 'polygon',
            countryCode: 'IN',
            coordinates: [
              [28.4, 76.9],
              [28.8, 76.9],
              [28.8, 77.4],
              [28.4, 77.4],
            ],
          },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('Final: anderes Land ohne Stage/Route bleibt not_affected', () => {
    const evaluations = safetyAusFacts(
      mumbaiDelhiRouteReise(),
      [
        safetyFact({
          factKey: 'fr-region',
          category: 'civil_unrest',
          spatialScope: { kind: 'admin_region', countryCode: 'FR', regionName: 'Île-de-France' },
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_affected')
  })

  test('Final: Airport DEL bleibt affected, Reihenfolge ändert Semantik nicht', () => {
    const fact = safetyFact({
      factKey: 'del-disrupt',
      category: 'infrastructure_disruption',
      spatialScope: { kind: 'airport', airportCode: 'DEL', countryCode: 'IN' },
    })
    const vor = safetyAusFacts(mumbaiDelhiRouteReise(), [fact], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mumbaiDelhiRouteReise(true), [fact], 'audit-safety', { nowMs: JETZT })
    assert.equal(vor[0]?.relevance, 'affected')
    assert.equal(nach[0]?.relevance, 'affected')
  })

  test('Final: unterschiedliches freshUntil bleibt reihenfolgeunabhängig fail-closed', () => {
    const alt = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      freshUntil: '2026-08-20T10:00:00.000Z',
    })
    const neu = safetyFact({
      factKey: 'eq-firenze',
      category: 'earthquake',
      freshUntil: '2026-08-28T10:00:00.000Z',
    })
    const vor = safetyAusFacts(mehrzielreise(), [alt, neu], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [neu, alt], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(warnungen(vor).length, 0)
    assert.equal(vor[0]?.conflict, true)
  })

  test('Final: unterschiedliches Scope-countryCode bleibt konfliktstabil', () => {
    const a = safetyFact({
      factKey: 'poly-1',
      category: 'flood',
      spatialScope: {
        kind: 'polygon',
        countryCode: 'IT',
        coordinates: [
          [43.7, 11.2],
          [43.8, 11.2],
          [43.8, 11.3],
        ],
      },
    })
    const b = {
      ...a,
      spatialScope: { ...a.spatialScope as object, countryCode: 'FR' },
    }
    const vor = safetyAusFacts(mehrzielreise(), [a, b], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [b, a], 'audit-safety', { nowMs: JETZT })
    assert.deepEqual(vor, nach)
    assert.equal(vor[0]?.conflict, true)
  })

  test('Final: Category-Wechsel ändert Event-Fingerprint', () => {
    const erdbeben = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'lage', category: 'earthquake', sourceSeverity: null, advisoryClass: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const sonst = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'lage', category: 'other', sourceSeverity: null, advisoryClass: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(erdbeben[0]?.presentationClass, sonst[0]?.presentationClass)
    assert.notEqual(erdbeben[0]?.eventFingerprint, sonst[0]?.eventFingerprint)
  })

  test('Final: checkedAt-Wechsel ändert Event-Fingerprint', () => {
    const aktuell = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const alt = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', checkedAt: '2026-01-01T09:00:00.000Z' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(aktuell[0]?.freshness, alt[0]?.freshness)
    assert.notEqual(aktuell[0]?.eventFingerprint, alt[0]?.eventFingerprint)
  })

  test('Final: trusted vs untrusted ändert Event-Fingerprint', () => {
    const trusted = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    const untrusted = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', authority: null })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.notEqual(trusted[0]?.eventFingerprint, untrusted[0]?.eventFingerprint)
  })

  test('Final: unmögliches Kalenderdatum bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [safetyFact({ factKey: 'eq-firenze', category: 'earthquake', validFrom: '2026-02-31' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.notEqual(evaluations[0]?.factKey, 'eq-firenze')
  })

  test('Final: validFrom nach validUntil bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        safetyFact({
          factKey: 'eq-firenze',
          category: 'earthquake',
          validFrom: '2026-09-16',
          validUntil: '2026-09-12',
        }),
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.notEqual(evaluations[0]?.factKey, 'eq-firenze')
  })

  test('Final: travellerDependent als String bleibt fail-closed', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        {
          ...safetyFact({ factKey: 'eq-firenze', category: 'earthquake' }),
          travellerDependent: 'true' as unknown as boolean,
        },
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.notEqual(evaluations[0]?.relevance, 'affected')
  })

  test('Final: ungültiges decision-Enum wird nicht zum Default-Warnen', () => {
    const evaluations = safetyAusFacts(
      mehrzielreise(),
      [
        {
          ...safetyFact({ factKey: 'eq-firenze', category: 'earthquake', sourceSeverity: null }),
          sourceSeverity: 'super-bad' as unknown as 'severe',
        },
      ],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(warnungen(evaluations).length, 0)
    assert.notEqual(evaluations[0]?.factKey, 'eq-firenze')
  })

  test('Final: konsistente Duplikate bleiben deterministisch eine Evaluation', () => {
    const fact = safetyFact({ factKey: 'eq-firenze', category: 'earthquake' })
    const vor = safetyAusFacts(mehrzielreise(), [fact, { ...fact }], 'audit-safety', { nowMs: JETZT })
    const nach = safetyAusFacts(mehrzielreise(), [{ ...fact }, fact], 'audit-safety', { nowMs: JETZT })
    assert.equal(vor.length, 1)
    assert.deepEqual(vor, nach)
    assert.equal(vor[0]?.relevance, 'affected')
  })
})
