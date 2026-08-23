import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { safetyAusFacts } from '@/lib/safety/engine'
import { mehrzielreise as safetyMehrziel, safetyFact } from '@/lib/safety/fixtures'
import { seasonalZusammenfassungText } from '@/lib/seasonal/anzeige'
import { seasonalAuswerten, seasonalAusFacts } from '@/lib/seasonal/engine'
import { seasonalContextFingerprint, seasonalFactFingerprint } from '@/lib/seasonal/fingerprint'
import { scopeIdentitaet } from '@/lib/seasonal/scope'
import { travelWindowLesen } from '@/lib/seasonal/fenster'
import {
  SEASONAL_NOW_MS,
  bangkokMonsunReise,
  bangkokRouteReise,
  goaKeralaReise,
  karibikHurrikanReise,
  mehrzielreise,
  schalttagReise,
  seasonalFact,
  testSeasonalProvider,
  wiederholteGoaReise,
  winterJahreswechselReise,
} from '@/lib/seasonal/fixtures'
import { seasonalAnsicht, seasonalApiStatus } from '@/lib/seasonal/status'
import type { SeasonalProviderFact } from '@/lib/seasonal/provider'
import type { TripTraveller } from '@/types/trips'

const JETZT = SEASONAL_NOW_MS

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

function hinweise(evaluations: Awaited<ReturnType<typeof seasonalAuswerten>>) {
  return evaluations.filter(
    (eintrag) =>
      eintrag.relevance === 'applies' &&
      (eintrag.presentationClass === 'timing_check' ||
        eintrag.presentationClass === 'timing_notice' ||
        eintrag.presentationClass === 'information'),
  )
}

describe('Seasonal-Engine', () => {
  test('1 kein Provider => unavailable, keine Reisezeit-Behauptung', async () => {
    const evaluations = await seasonalAuswerten(bangkokMonsunReise(), null, null, JETZT)
    assert.equal(evaluations[0]?.freshness, 'provider_unavailable')
    assert.equal(evaluations[0]?.evidenceStatus, 'unavailable')
    assert.equal(hinweise(evaluations).length, 0)
    assert.match(evaluations[0]?.reason ?? '', /keine Reisezeit-Aussage/)
    assert.equal(seasonalAnsicht(bangkokMonsunReise()).summary.sichtbar, false)
  })

  test('2 Provider timeout / throw => fail-closed', async () => {
    const timeout = await seasonalAuswerten(
      bangkokMonsunReise(),
      testSeasonalProvider(async () => {
        await new Promise((_, reject) => {
          setTimeout(() => reject(Object.assign(new Error('seasonal-timeout'), { name: 'SeasonalProviderTimeout' })), 20)
        })
        return []
      }),
      null,
      JETZT,
      5,
    )
    assert.equal(timeout[0]?.freshness, 'source_temporarily_unavailable')
    const thrown = await seasonalAuswerten(
      bangkokMonsunReise(),
      testSeasonalProvider(async () => {
        throw new Error('down')
      }),
      null,
      JETZT,
    )
    assert.equal(thrown[0]?.freshness, 'source_temporarily_unavailable')
    assert.equal(hinweise(timeout).length, 0)
    assert.equal(hinweise(thrown).length, 0)
  })

  test('3 erfolgreicher Provider [] => checked-empty, nicht unavailable', async () => {
    const evaluations = await seasonalAuswerten(bangkokMonsunReise(), testSeasonalProvider([]), null, JETZT)
    assert.equal(evaluations[0]?.factKey, 'checked_empty')
    assert.equal(evaluations[0]?.freshness, 'current')
    assert.match(evaluations[0]?.reason ?? '', /keine belastbaren relevanten saisonalen Hinweise/)
    assert.doesNotMatch(evaluations[0]?.reason ?? '', /Reisezeit ist gut|Reisezeit ist optimal/)
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.checkState, 'checked_empty')
    assert.equal(ansicht.summary.sichtbar, false)
    assert.equal(seasonalApiStatus(ansicht.summary), 'ok')
  })

  test('4 malformed whole response => unknown', async () => {
    const evaluations = await seasonalAuswerten(
      bangkokMonsunReise(),
      {
        name: 'audit-seasonal',
        async evaluate() {
          return 'nein' as unknown as SeasonalProviderFact[]
        },
      },
      null,
      JETZT,
    )
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.equal(hinweise(evaluations).length, 0)
  })

  test('5 gemischte valide + malformed => incomplete, kein favorable by omission', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'favorable_context' }),
        { factKey: null, category: 'monsoon' },
        { nested: [{ factKey: 'x' }] },
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations.some((eintrag) => eintrag.factKey === 'partial_invalid'), true)
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')
    assert.notEqual(ansicht.summary.checkState, 'checked_empty')
  })

  test('6 gleiche Facts andere Reihenfolge => identisches Ergebnis/Fingerprint', () => {
    const a = seasonalFact({ factKey: 'rain-th', category: 'monsoon' })
    const b = seasonalFact({
      factKey: 'heat-th',
      category: 'heat',
      travelWindow: { kind: 'annual_recurring', start: '03-01', end: '05-31' },
    })
    const eins = seasonalAusFacts(bangkokMonsunReise(), [a, b], 'audit-seasonal', { nowMs: JETZT })
    const zwei = seasonalAusFacts(bangkokMonsunReise(), [b, a], 'audit-seasonal', { nowMs: JETZT })
    assert.deepEqual(
      eins.map((eintrag) => eintrag.factFingerprint),
      zwei.map((eintrag) => eintrag.factFingerprint),
    )
    assert.deepEqual(
      eins.map((eintrag) => eintrag.factKey),
      zwei.map((eintrag) => eintrag.factKey),
    )
  })

  test('7 semantischer Conflict => unknown/recheck, kein winner', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'less_favorable' }),
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', outcome: 'favorable_context' }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations.some((eintrag) => eintrag.conflict), true)
    assert.equal(hinweise(evaluations).length, 0)
    assert.equal(evaluations.every((eintrag) => eintrag.presentationClass === 'unknown'), true)
  })

  test('7b gleiche Semantik andere URL ist kein Konflikt', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', sourceUrl: 'https://example.org/a' }),
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', sourceUrl: 'https://example.org/b' }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations.filter((eintrag) => eintrag.factKey === 'rain-th').length, 1)
    assert.equal(evaluations.some((eintrag) => eintrag.conflict), false)
  })

  test('8 November–März recurring trifft Dezember/Januar', () => {
    const evaluations = seasonalAusFacts(
      winterJahreswechselReise(),
      [
        seasonalFact({
          factKey: 'cold-is',
          category: 'cold',
          spatialScope: { kind: 'country', countryCode: 'IS' },
          travelWindow: { kind: 'annual_recurring', start: '11-01', end: '03-31' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.equal(evaluations[0]?.presentationClass, 'timing_check')
  })

  test('9 recurring window trifft nicht ausserhalb', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({
          factKey: 'cold-th',
          category: 'cold',
          travelWindow: { kind: 'annual_recurring', start: '11-01', end: '03-31' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_applies')
  })

  test('10 leap-day valid/invalid deterministisch', () => {
    const gilt = seasonalAusFacts(
      schalttagReise(),
      [
        seasonalFact({
          factKey: 'leap-no',
          category: 'cold',
          spatialScope: { kind: 'country', countryCode: 'NO' },
          travelWindow: { kind: 'annual_recurring', start: '02-29', end: '02-29' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(gilt[0]?.relevance, 'applies')
    const nicht = seasonalAusFacts(
      {
        ...schalttagReise(),
        startDate: '2027-02-27',
        endDate: '2027-03-01',
        stages: schalttagReise().stages.map((etappe) => ({
          ...etappe,
          arrivalDate: '2027-02-28',
          departureDate: '2027-02-28',
        })),
      },
      [
        seasonalFact({
          factKey: 'leap-no',
          category: 'cold',
          spatialScope: { kind: 'country', countryCode: 'NO' },
          travelWindow: { kind: 'annual_recurring', start: '02-29', end: '02-29' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(nicht[0]?.relevance, 'not_applies')
  })

  test('11 Reisedatum über Jahreswechsel', () => {
    const evaluations = seasonalAusFacts(
      winterJahreswechselReise(),
      [
        seasonalFact({
          factKey: 'cold-is',
          category: 'cold',
          spatialScope: { kind: 'country', countryCode: 'IS' },
          travelWindow: { kind: 'annual_recurring', start: '12-15', end: '01-15' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
  })

  test('12 gleiche Kategorie, andere Region im selben Land => keine pauschale Betroffenheit', () => {
    const evaluations = seasonalAusFacts(
      goaKeralaReise(),
      [
        seasonalFact({
          factKey: 'rain-kerala',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1273874' },
          travelWindow: { kind: 'annual_recurring', start: '06-01', end: '09-30' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.equal(evaluations[0]?.affectedRefs.every((ref) => ref.id === 'stage-kerala'), true)
    assert.equal(evaluations[0]?.affectedRefs.some((ref) => ref.id === 'stage-goa'), false)
  })

  test('13 feinere Region ohne Membership => insufficient_context', () => {
    const evaluations = seasonalAusFacts(
      goaKeralaReise(),
      [
        seasonalFact({
          factKey: 'rain-west',
          category: 'monsoon',
          spatialScope: { kind: 'admin_region', countryCode: 'IN', regionName: 'Western Ghats' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('14 country-level fact + passende Stage => applies', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.equal(evaluations[0]?.spatialPrecision, 'country')
  })

  test('15 title-only Activity erzeugt keine Geo-Truth', () => {
    const reise = {
      ...bangkokMonsunReise(),
      ohneTag: [
        {
          ...goaKeralaReise().days[0]!.items[0]!,
          id: 'act-titel',
          dayId: null,
          stageId: null,
          title: 'Monsunfest in Goa',
          originPlaceId: null,
          destinationPlaceId: null,
        },
      ],
    }
    const evaluations = seasonalAusFacts(
      reise,
      [
        seasonalFact({
          factKey: 'rain-goa',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1271157' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_applies')
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.ref.id === 'act-titel'), false)
  })

  test('16 Route/Transit nur aus Foundation-D-Routefacts', () => {
    const evaluations = seasonalAusFacts(
      bangkokRouteReise(),
      [
        seasonalFact({
          factKey: 'heat-doh',
          category: 'heat',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
          travelWindow: { kind: 'annual_recurring', start: '01-01', end: '12-31' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.equal(evaluations[0]?.affectedRefs.some((ref) => ref.id === 'DOH'), true)
    assert.equal(evaluations[0]?.affectedRefs.some((ref) => ref.kind === 'stage'), false)
  })

  test('17 wiederholter Ort bleibt getrennte Fenster', () => {
    const evaluations = seasonalAusFacts(
      wiederholteGoaReise(),
      [
        seasonalFact({
          factKey: 'rain-goa',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1271157' },
          travelWindow: { kind: 'annual_recurring', start: '06-01', end: '09-30' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.deepEqual(
      evaluations[0]?.affectedRefs.map((ref) => ref.id),
      ['stage-goa-jul'],
    )
  })

  test('18 Date-only ↔ UTC instant bleibt insufficient', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({
          factKey: 'forecast-th',
          category: 'heavy_rain',
          evidenceClass: 'forecast_outlook',
          travelWindow: {
            kind: 'absolute',
            start: '2026-09-10T16:00:00.000Z',
            end: '2026-09-11T04:00:00.000Z',
          },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('19 lokale HH:mm ↔ UTC instant bleibt insufficient', () => {
    const evaluations = seasonalAusFacts(
      bangkokRouteReise(),
      [
        seasonalFact({
          factKey: 'heat-doh',
          category: 'heat',
          spatialScope: { kind: 'airport', airportCode: 'DOH', countryCode: 'QA' },
          travelWindow: {
            kind: 'absolute',
            start: '2026-09-12T14:00:00.000Z',
            end: '2026-09-12T16:00:00.000Z',
          },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'insufficient_context')
  })

  test('20 active_warning erscheint nicht als Seasonal-Hinweis', () => {
    const evaluations = seasonalAusFacts(
      karibikHurrikanReise(),
      [
        seasonalFact({
          factKey: 'warn-bb',
          category: 'tropical_cyclone_season',
          evidenceClass: 'active_warning',
          spatialScope: { kind: 'country', countryCode: 'BB' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(hinweise(evaluations).length, 0)
    assert.match(evaluations[0]?.reason ?? '', /Safety/)
    assert.equal(evaluations[0]?.evidenceClass, 'rejected_acute')
    assert.equal(evaluations[0]?.acuteRejected, true)
    assert.notEqual(evaluations[0]?.evidenceClass, 'seasonal_pattern')
  })

  test('21 seasonal_pattern bleibt in Safety ausgeschlossen', () => {
    const evaluations = safetyAusFacts(
      safetyMehrziel(),
      [safetyFact({ factKey: 'season-it', category: 'flood', nature: 'seasonal_pattern' })],
      'audit-safety',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.factKey, 'checked_empty')
    assert.equal(
      evaluations.some((eintrag) => eintrag.presentationClass === 'critical_warning'),
      false,
    )
  })

  test('22 stale/recheck-needed => keine current/favorable Copy', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', freshUntil: '2026-08-21T09:30:00.000Z' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'recheck_needed')
    assert.equal(evaluations[0]?.presentationClass, 'unknown')
    const text = seasonalZusammenfassungText(seasonalAnsicht(bangkokMonsunReise(), evaluations).summary)
    assert.doesNotMatch(text, /Reisezeit ist gut|Reisezeit ist optimal/)
  })

  test('23 fehlende Freshness-Semantik => nicht current', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', freshUntil: null })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'recheck_needed')
    assert.notEqual(evaluations[0]?.evidenceStatus, 'current')
  })

  test('24 Reference Period wird nicht als Travel Window gelesen', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({
          factKey: 'rain-th',
          category: 'monsoon',
          referencePeriod: { startYear: 1991, endYear: 2020 },
          travelWindow: { kind: 'annual_recurring', start: '05-01', end: '10-31' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.deepEqual(evaluations[0]?.evidence.referencePeriod, { startYear: 1991, endYear: 2020 })
  })

  test('25 Datumsänderung verändert Context-Fingerprint', () => {
    const vorher = seasonalContextFingerprint(bangkokMonsunReise())
    const nachher = seasonalContextFingerprint({
      ...bangkokMonsunReise(),
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      stages: bangkokMonsunReise().stages.map((etappe) => ({
        ...etappe,
        arrivalDate: '2026-11-01',
        departureDate: '2026-11-10',
      })),
    })
    assert.notEqual(vorher, nachher)
  })

  test('26 Ziel-/Stageänderung verändert Context-Fingerprint', () => {
    const vorher = seasonalContextFingerprint(bangkokMonsunReise())
    const nachher = seasonalContextFingerprint(goaKeralaReise())
    assert.notEqual(vorher, nachher)
  })

  test('27 passendes Activity-Item wird konservativ needs_recheck', () => {
    const evaluations = seasonalAusFacts(
      goaKeralaReise(),
      [
        seasonalFact({
          factKey: 'rain-goa',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1271157' },
          affectedDomains: ['activity'],
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.domain === 'activity' && eintrag.status === 'needs_recheck'), true)
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.domain === 'activity' && eintrag.status === 'affected'), false)
  })

  test('28 nicht passendes Item nicht betroffen', () => {
    const evaluations = seasonalAusFacts(
      goaKeralaReise(),
      [
        seasonalFact({
          factKey: 'rain-kerala',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1273874' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.impact.some((eintrag) => eintrag.ref.id === 'act-goa'), false)
  })

  test('29 Guest und Account identischer Graph => identische Evaluation', () => {
    const gast = goaKeralaReise()
    const konto = { ...goaKeralaReise(), id: 'account-trip', clientRef: 'account-1' }
    const a = seasonalAusFacts(gast, [seasonalFact({ factKey: 'rain-in', category: 'monsoon', spatialScope: { kind: 'country', countryCode: 'IN' } })], 'audit-seasonal', { nowMs: JETZT })
    const b = seasonalAusFacts(konto, [seasonalFact({ factKey: 'rain-in', category: 'monsoon', spatialScope: { kind: 'country', countryCode: 'IN' } })], 'audit-seasonal', { nowMs: JETZT })
    assert.equal(a[0]?.factFingerprint, b[0]?.factFingerprint)
    assert.equal(a[0]?.relevance, b[0]?.relevance)
    assert.equal(seasonalContextFingerprint(gast), seasonalContextFingerprint(konto))
  })

  test('30 keine Citizenship-Pflicht / kein Citizenship-Fingerprint', () => {
    const ohne = goaKeralaReise()
    const mit = { ...goaKeralaReise(), party: [reisender({ clientRef: 'a', codes: ['CH', 'IT'] })] }
    assert.equal(seasonalContextFingerprint(ohne), seasonalContextFingerprint(mit))
    const evaluations = seasonalAusFacts(
      mit,
      [seasonalFact({ factKey: 'rain-in', category: 'monsoon', spatialScope: { kind: 'country', countryCode: 'IN' } })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
  })

  test('31 mehrere Destinationen werden separat bewertet', () => {
    const evaluations = seasonalAusFacts(
      goaKeralaReise(),
      [
        seasonalFact({
          factKey: 'rain-goa',
          category: 'monsoon',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1271157' },
        }),
        seasonalFact({
          factKey: 'heat-kerala',
          category: 'heat',
          spatialScope: { kind: 'place', countryCode: 'IN', placeId: 'geonames:1273874' },
          travelWindow: { kind: 'annual_recurring', start: '03-01', end: '05-31' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    const goa = evaluations.find((eintrag) => eintrag.factKey === 'rain-goa')
    const kerala = evaluations.find((eintrag) => eintrag.factKey === 'heat-kerala')
    assert.equal(goa?.relevance, 'applies')
    assert.equal(kerala?.relevance, 'not_applies')
  })

  test('32 Nutzerentscheidung wird nicht simuliert oder Reise verändert', () => {
    const reise = bangkokMonsunReise()
    const vorher = JSON.stringify(reise)
    seasonalAusFacts(reise, [seasonalFact({ factKey: 'rain-th', category: 'monsoon' })], 'audit-seasonal', {
      nowMs: JETZT,
    })
    assert.equal(JSON.stringify(reise), vorher)
  })

  test('maxFacts wird deterministisch verworfen', () => {
    const zeilen = Array.from({ length: 41 }, (_, index) =>
      seasonalFact({ factKey: `rain-${index}`, category: 'monsoon' }),
    )
    const evaluations = seasonalAusFacts(bangkokMonsunReise(), zeilen, 'audit-seasonal', { nowMs: JETZT })
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.match(evaluations[0]?.reason ?? '', /zu viele Zeilen/)
  })

  test('future checkedAt und ungültige URL verwerfen Trust', () => {
    const future = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', checkedAt: '2027-01-01T00:00:00.000Z' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(future[0]?.presentationClass, 'unknown')
    const url = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', sourceUrl: 'http://example.org/x' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(url.length, 1)
    assert.equal(url[0]?.presentationClass, 'unknown')
  })

  test('freshUntil vor checkedAt verwirft die Zeile', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({
          factKey: 'rain-th',
          category: 'monsoon',
          checkedAt: '2026-08-21T09:00:00.000Z',
          freshUntil: '2026-08-20T09:00:00.000Z',
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    assert.match(evaluations[0]?.reason ?? '', /ungültig/)
  })

  test('UTC+14 / UTC-12 Hülle: klar ausserhalb darf not_applies sein', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({
          factKey: 'forecast-th',
          category: 'heavy_rain',
          evidenceClass: 'forecast_outlook',
          travelWindow: {
            kind: 'absolute',
            start: '2026-08-01T00:00:00.000Z',
            end: '2026-08-02T00:00:00.000Z',
          },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'not_applies')
  })

  test('offizielle Hurrikansaison ohne aktive Warnung bleibt Seasonal', () => {
    const evaluations = seasonalAusFacts(
      karibikHurrikanReise(),
      [
        seasonalFact({
          factKey: 'hurr-bb',
          category: 'tropical_cyclone_season',
          evidenceClass: 'official_seasonal_risk_window',
          spatialScope: { kind: 'country', countryCode: 'BB' },
          travelWindow: { kind: 'annual_recurring', start: '06-01', end: '11-30' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.relevance, 'applies')
    assert.equal(evaluations[0]?.evidenceClass, 'official_seasonal_risk_window')
    assert.equal(evaluations[0]?.presentationClass, 'timing_check')
  })

  test('malformed nested arrays / null rows / wrong enums werden verworfen', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [null, ['x'], { factKey: 'rain-th', category: 1 }, { factKey: 'rain-th', category: 'monsoon', outcome: 'bad' }],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
  })

  test('Browser-/LLM-Felder ändern keine Evidence', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon' })],
      'audit-seasonal',
      {
        nowMs: JETZT,
        roh: { llmResult: 'gute Reisezeit', officialResult: 'safe', seasonalResult: { outcome: 'favorable_context' } },
      },
    )
    assert.equal(evaluations[0]?.outcome, 'less_favorable')
    assert.notEqual(evaluations[0]?.presentationClass, 'information')
  })

  test('fehlende oder malformed evidenceClass erzeugt keine Seasonal-Truth', () => {
    const fälle = [undefined, null, '', 1, { kind: 'seasonal_pattern' }, ['seasonal_pattern']]
    for (const evidenceClass of fälle) {
      const evaluations = seasonalAusFacts(
        bangkokMonsunReise(),
        [seasonalFact({ factKey: 'rain-th', category: 'monsoon', evidenceClass: evidenceClass as never })],
        'audit-seasonal',
        { nowMs: JETZT },
      )
      assert.equal(hinweise(evaluations).length, 0, String(evidenceClass))
      assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    }
    const acute = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'warn-th', category: 'monsoon', evidenceClass: 'acute_event' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(hinweise(acute).length, 0)
    assert.equal(acute[0]?.factKey, 'acute_rejected')
    assert.equal(acute[0]?.evidenceClass, 'rejected_acute')
    assert.equal(acute[0]?.acuteRejected, true)

    const gemischt = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', evidenceClass: 'seasonal_pattern' }),
        seasonalFact({ factKey: 'classless', category: 'monsoon', evidenceClass: null }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    const ansicht = seasonalAnsicht(bangkokMonsunReise(), gemischt)
    assert.equal(gemischt.some((eintrag) => eintrag.factKey === 'partial_invalid'), true)
    assert.equal(ansicht.summary.complete, false)
    assert.equal(seasonalApiStatus(ansicht.summary), 'unknown')

    for (const evidenceClass of ['seasonal_pattern', 'official_seasonal_risk_window', 'forecast_outlook'] as const) {
      const evaluations = seasonalAusFacts(
        bangkokMonsunReise(),
        [seasonalFact({ factKey: `ok-${evidenceClass}`, category: 'monsoon', evidenceClass })],
        'audit-seasonal',
        { nowMs: JETZT },
      )
      assert.equal(evaluations[0]?.evidenceClass, evidenceClass)
      assert.equal(evaluations[0]?.relevance, 'applies')
    }
  })

  test('abgewiesene Acute-Klassen bleiben rejected_acute und nicht checked_empty', () => {
    for (const evidenceClass of ['active_warning', 'acute', 'acute_event'] as const) {
      const evaluations = seasonalAusFacts(
        bangkokMonsunReise(),
        [seasonalFact({ factKey: `warn-${evidenceClass}`, category: 'monsoon', evidenceClass })],
        'audit-seasonal',
        { nowMs: JETZT },
      )
      assert.equal(hinweise(evaluations).length, 0, evidenceClass)
      assert.equal(evaluations[0]?.evidenceClass, 'rejected_acute', evidenceClass)
      assert.equal(evaluations[0]?.acuteRejected, true, evidenceClass)
      assert.notEqual(evaluations[0]?.factKey, 'checked_empty', evidenceClass)
      const ansicht = seasonalAnsicht(bangkokMonsunReise(), evaluations)
      assert.equal(ansicht.summary.sichtbar, false, evidenceClass)
      assert.equal(ansicht.summary.complete, false, evidenceClass)
      assert.notEqual(ansicht.summary.checkState, 'checked_empty', evidenceClass)
      assert.equal(seasonalApiStatus(ansicht.summary), 'unknown', evidenceClass)
    }

    const gemischt = seasonalAusFacts(
      bangkokMonsunReise(),
      [
        seasonalFact({ factKey: 'rain-th', category: 'monsoon', evidenceClass: 'seasonal_pattern' }),
        seasonalFact({ factKey: 'warn-th', category: 'monsoon', evidenceClass: 'active_warning' }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    const saisonal = gemischt.find((eintrag) => eintrag.factKey === 'rain-th')
    const acute = gemischt.find((eintrag) => eintrag.acuteRejected || eintrag.evidenceClass === 'rejected_acute')
    assert.equal(saisonal?.evidenceClass, 'seasonal_pattern')
    assert.equal(saisonal?.relevance, 'applies')
    assert.equal(saisonal?.acuteRejected, false)
    assert.equal(acute?.evidenceClass, 'rejected_acute')
    assert.equal(acute?.acuteRejected, true)
    assert.equal(
      gemischt.some((eintrag) => eintrag.acuteRejected && eintrag.evidenceClass === 'seasonal_pattern'),
      false,
    )
    assert.equal(hinweise(gemischt).some((eintrag) => eintrag.factKey === 'rain-th'), true)
    assert.equal(hinweise(gemischt).some((eintrag) => eintrag.evidenceClass === 'rejected_acute'), false)
  })

  test('rückwärts laufender Trip-Datumsbereich erzeugt kein falsches not_applies', () => {
    const reise = beispielreise({
      title: 'Bangkok rückwärts',
      startDate: '2026-09-20',
      endDate: '2026-09-10',
      stages: [
        {
          id: 'stage-bkk',
          position: 1,
          name: 'Bangkok',
          countryCode: 'TH',
          placeId: 'geonames:1609350',
          latitude: 13.7563,
          longitude: 100.5018,
          arrivalDate: '2026-09-12',
          departureDate: '2026-09-16',
        },
      ],
      days: [],
      ohneTag: [],
    })
    const evaluations = seasonalAusFacts(
      reise,
      [
        seasonalFact({
          factKey: 'rain-th',
          category: 'monsoon',
          travelWindow: { kind: 'absolute', start: '2026-09-12', end: '2026-09-16' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.notEqual(evaluations[0]?.relevance, 'not_applies')
    assert.equal(evaluations[0]?.relevance, 'applies')

    const etappeRueckwaerts = beispielreise({
      title: 'Bangkok Stage rückwärts',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      stages: [
        {
          id: 'stage-bkk',
          position: 1,
          name: 'Bangkok',
          countryCode: 'TH',
          placeId: 'geonames:1609350',
          latitude: 13.7563,
          longitude: 100.5018,
          arrivalDate: '2026-09-16',
          departureDate: '2026-09-12',
        },
      ],
      days: [],
      ohneTag: [],
    })
    const etappeEval = seasonalAusFacts(
      etappeRueckwaerts,
      [
        seasonalFact({
          factKey: 'rain-th',
          category: 'monsoon',
          travelWindow: { kind: 'absolute', start: '2026-09-12', end: '2026-09-16' },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.notEqual(etappeEval[0]?.relevance, 'not_applies')
    assert.equal(etappeEval[0]?.relevance, 'insufficient_context')
  })

  test('sourceUrl mit falschem Runtime-Typ erzeugt keine trusted Timing-Aussage', () => {
    for (const sourceUrl of [123, { href: 'https://example.org/x' }, ['https://example.org/x']]) {
      const evaluations = seasonalAusFacts(
        bangkokMonsunReise(),
        [seasonalFact({ factKey: 'rain-th', category: 'monsoon', sourceUrl: sourceUrl as never })],
        'audit-seasonal',
        { nowMs: JETZT },
      )
      assert.equal(hinweise(evaluations).length, 0)
      assert.equal(evaluations[0]?.evidenceStatus, 'unknown')
    }
    const gültig = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', sourceUrl: 'https://example.org/seasonal' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(gültig[0]?.presentationClass, 'timing_check')
  })

  test('availability temporarily_unavailable bleibt explizit unavailable', () => {
    const evaluations = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', availability: 'temporarily_unavailable' })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    assert.equal(hinweise(evaluations).length, 0)
    const ungültig = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', availability: 'maybe' as never })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(ungültig[0]?.evidenceStatus, 'unknown')
    assert.notEqual(ungültig[0]?.freshness, 'source_temporarily_unavailable')
    const typ = seasonalAusFacts(
      bangkokMonsunReise(),
      [seasonalFact({ factKey: 'rain-th', category: 'monsoon', availability: 1 as never })],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(typ[0]?.evidenceStatus, 'unknown')
  })

  test('route.airportCodes mit malformed Kind wird nicht still gekürzt', () => {
    const evaluations = seasonalAusFacts(
      bangkokRouteReise(),
      [
        seasonalFact({
          factKey: 'storm-route',
          category: 'tropical_cyclone_season',
          spatialScope: { kind: 'route', airportCodes: ['DOH', 123] },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.notEqual(evaluations[0]?.relevance, 'applies')
    const gültig = seasonalAusFacts(
      bangkokRouteReise(),
      [
        seasonalFact({
          factKey: 'storm-route',
          category: 'tropical_cyclone_season',
          spatialScope: { kind: 'route', airportCodes: ['ZRH', 'BKK'] },
        }),
      ],
      'audit-seasonal',
      { nowMs: JETZT },
    )
    assert.equal(gültig[0]?.relevance, 'applies')
  })

  test('point_radius-Grenze ändert Fingerprint und Relevanz innerhalb desselben toFixed(4)-Buckets', () => {
    const innen = beispielreise({
      startDate: '2026-09-10',
      endDate: '2026-09-12',
      stages: [
        {
          id: 'stage-eq',
          position: 1,
          name: 'Equator',
          countryCode: 'EC',
          placeId: null,
          latitude: 0.000895,
          longitude: 0,
          arrivalDate: '2026-09-10',
          departureDate: '2026-09-12',
        },
      ],
      days: [],
      ohneTag: [],
    })
    const aussen = {
      ...innen,
      stages: innen.stages.map((etappe) => ({ ...etappe, latitude: 0.000904 })),
    }
    const scope = { kind: 'point_radius' as const, latitude: 0, longitude: 0, radiusKm: 0.1, countryCode: 'EC' }
    assert.equal(0.000895.toFixed(4), 0.000904.toFixed(4))
    assert.notEqual(seasonalContextFingerprint(innen), seasonalContextFingerprint(aussen))
    assert.notEqual(
      scopeIdentitaet({ ...scope, latitude: 0.000895 }),
      scopeIdentitaet({ ...scope, latitude: 0.000904 }),
    )
    const fact = seasonalFact({
      factKey: 'heat-eq',
      category: 'heat',
      spatialScope: scope,
      travelWindow: { kind: 'annual_recurring', start: '01-01', end: '12-31' },
    })
    const innenEval = seasonalAusFacts(innen, [fact], 'audit-seasonal', { nowMs: JETZT })
    const aussenEval = seasonalAusFacts(aussen, [fact], 'audit-seasonal', { nowMs: JETZT })
    assert.equal(innenEval[0]?.relevance, 'applies')
    assert.equal(aussenEval[0]?.relevance, 'not_applies')
    assert.equal(
      seasonalFactFingerprint({
        factKey: 'heat-eq',
        category: 'heat',
        evidenceClass: 'seasonal_pattern',
        outcome: 'less_favorable',
        updatedAt: null,
        checkedAt: '2026-08-21T09:00:00.000Z',
        freshUntil: null,
        referencePeriod: null,
        vertrauenswuerdig: true,
        scope,
        travelWindow: travelWindowLesen({ kind: 'annual_recurring', start: '01-01', end: '12-31' }),
        affectedDomains: [],
      }),
      seasonalFactFingerprint({
        factKey: 'heat-eq',
        category: 'heat',
        evidenceClass: 'seasonal_pattern',
        outcome: 'less_favorable',
        updatedAt: null,
        checkedAt: '2026-08-21T09:00:00.000Z',
        freshUntil: null,
        referencePeriod: null,
        vertrauenswuerdig: true,
        scope,
        travelWindow: travelWindowLesen({ kind: 'annual_recurring', start: '01-01', end: '12-31' }),
        affectedDomains: [],
      }),
    )
  })
})

