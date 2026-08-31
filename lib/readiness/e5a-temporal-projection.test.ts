// lib/readiness/e5a-temporal-projection.test.ts
//
// Entry Requirements E5-A: exact event-instant temporal projection.
// Kein Trip-/Route-Resolver, keine Zeitzone, kein Provider, kein Default-Pass.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  OFFICIAL_TEMPORAL_KIND,
  OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
  temporalRuleLesen,
} from '@/lib/readiness/temporal'
import {
  OFFICIAL_TEMPORAL_PROJECTION_ISSUES,
  temporalRuleProjizieren,
  type OfficialTemporalEventBinding,
  type OfficialTemporalEventBindings,
} from '@/lib/readiness/temporal-projection'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const STUNDEN_72 = 72 * 60
const STUNDEN_24 = 24 * 60

function regelOderFail(roh: unknown) {
  const regel = temporalRuleLesen(roh)
  assert.ok(regel, 'E4-Regel muss gültig sein')
  return regel
}

function issueSeiten(
  issues: ReturnType<typeof temporalRuleProjizieren>['issues'],
  side: 'availableFrom' | 'dueBy' | 'window',
) {
  return issues.filter((eintrag) => eintrag.side === side).map((eintrag) => eintrag.issue)
}

describe('Entry Requirements E5-A temporal projection', () => {
  test('1. 72h before destination_arrival auf Z-Instant', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'destination:TH:leg-1',
        instant: '2026-10-10T12:00:00Z',
      },
    })
    assert.deepEqual(projektion.availableFrom, {
      instant: '2026-10-07T12:00:00.000Z',
      anchor: 'destination_arrival',
      eventRef: 'destination:TH:leg-1',
    })
    assert.equal(projektion.dueBy, null)
    assert.deepEqual(projektion.actionWindow, {
      availableFrom: projektion.availableFrom,
      dueBy: null,
    })
    assert.deepEqual(projektion.issues, [])
  })

  test('2. 24h before trip_departure normalisiert +02:00 zuerst', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      dueBy: {
        anchor: 'trip_departure',
        relation: 'before',
        offsetMinutes: STUNDEN_24,
        semantics: 'mandatory',
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      trip_departure: {
        eventRef: 'departure:ZRH:leg-1',
        instant: '2026-10-10T14:00:00+02:00',
      },
    })
    assert.deepEqual(projektion.dueBy, {
      instant: '2026-10-09T12:00:00.000Z',
      anchor: 'trip_departure',
      eventRef: 'departure:ZRH:leg-1',
      semantics: 'mandatory',
    })
    assert.equal(projektion.availableFrom, null)
    assert.deepEqual(projektion.issues, [])
  })

  test('3. at bleibt identischer normalisierter Instant', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'border_crossing',
        relation: 'at',
        offsetMinutes: 0,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      border_crossing: {
        eventRef: 'border:TH:imm-1',
        instant: '2026-10-10T12:00:00.000Z',
      },
    })
    assert.equal(projektion.availableFrom?.instant, '2026-10-10T12:00:00.000Z')
    assert.equal(projektion.availableFrom?.eventRef, 'border:TH:imm-1')
    assert.deepEqual(projektion.issues, [])
  })

  test('4. after addiert exakt', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'transit_arrival',
        relation: 'after',
        offsetMinutes: STUNDEN_24,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      transit_arrival: {
        eventRef: 'transit:QA:leg-1',
        instant: '2026-10-10T12:00:00Z',
      },
    })
    assert.equal(projektion.availableFrom?.instant, '2026-10-11T12:00:00.000Z')
    assert.equal(projektion.availableFrom?.eventRef, 'transit:QA:leg-1')
  })

  test('5. verschiedene Anchors brauchen explizite Bindings beider Seiten', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
      dueBy: {
        anchor: 'trip_departure',
        relation: 'at',
        offsetMinutes: 0,
        semantics: 'recommended',
      },
    })
    const beide: OfficialTemporalEventBindings = {
      destination_arrival: {
        eventRef: 'destination:TH:leg-1',
        instant: '2026-10-10T12:00:00Z',
      },
      trip_departure: {
        eventRef: 'departure:ZRH:leg-1',
        instant: '2026-10-10T12:00:00Z',
      },
    }
    const voll = temporalRuleProjizieren(regel, beide)
    assert.equal(voll.availableFrom?.instant, '2026-10-07T12:00:00.000Z')
    assert.equal(voll.dueBy?.instant, '2026-10-10T12:00:00.000Z')
    assert.equal(voll.dueBy?.semantics, 'recommended')
    assert.ok(voll.actionWindow)
    assert.deepEqual(voll.issues, [])

    const nurAnkunft = temporalRuleProjizieren(regel, {
      destination_arrival: beide.destination_arrival,
    })
    assert.equal(nurAnkunft.availableFrom?.instant, '2026-10-07T12:00:00.000Z')
    assert.equal(nurAnkunft.dueBy, null)
    assert.deepEqual(issueSeiten(nurAnkunft.issues, 'dueBy'), ['missing_anchor'])
    assert.equal(nurAnkunft.issues[0]?.anchor, 'trip_departure')
    assert.equal(nurAnkunft.actionWindow?.dueBy, null)
  })

  test('6. fehlender Anchor fällt nicht auf ein anderes Event zurück', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      trip_departure: {
        eventRef: 'departure:ZRH:leg-1',
        instant: '2026-10-10T12:00:00Z',
      },
      transit_arrival: {
        eventRef: 'transit:QA:leg-1',
        instant: '2026-10-09T12:00:00Z',
      },
    })
    assert.equal(projektion.availableFrom, null)
    assert.equal(projektion.actionWindow, null)
    assert.deepEqual(projektion.issues, [
      {
        side: 'availableFrom',
        issue: 'missing_anchor',
        anchor: 'destination_arrival',
        eventRef: null,
      },
    ])
  })

  test('7. zonenlose lokale Wanduhr wird als Instant abgelehnt', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'at',
        offsetMinutes: 0,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'destination:QA:doh-1',
        instant: '2026-09-12T18:00',
      },
    })
    assert.equal(projektion.availableFrom, null)
    assert.deepEqual(issueSeiten(projektion.issues, 'availableFrom'), ['invalid_instant'])
    assert.equal(projektion.issues[0]?.eventRef, 'destination:QA:doh-1')
  })

  test('8. Date-only wird abgelehnt', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'at',
        offsetMinutes: 0,
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      destination_arrival: { eventRef: 'destination:TH:day', instant: '2026-09-12' },
    })
    assert.equal(projektion.availableFrom, null)
    assert.deepEqual(issueSeiten(projektion.issues, 'availableFrom'), ['invalid_instant'])
  })

  test('9. ungültiger Offset, ungültiges Datum und Freitext werden abgelehnt', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'trip_departure',
        relation: 'at',
        offsetMinutes: 0,
      },
    })
    const faelle = [
      '2026-10-10T12:00:00+25:00',
      '2026-10-10T12:00:00-12:01',
      '2026-10-10T12:00:00+02:60',
      '2026-02-30T12:00:00Z',
      '2026-13-01T12:00:00Z',
      '2026-10-10T24:00:00Z',
      '2026-10-10T12:00:00',
      '10 October 2026 12:00',
      'tomorrow',
      '',
      '2026-10-10 12:00:00Z',
    ]
    for (const instant of faelle) {
      const projektion = temporalRuleProjizieren(regel, {
        trip_departure: { eventRef: 'departure:bad', instant },
      })
      assert.equal(projektion.availableFrom, null, instant)
      assert.deepEqual(issueSeiten(projektion.issues, 'availableFrom'), ['invalid_instant'], instant)
    }
  })

  test('10. Cross-Anchor availableFrom > dueBy ist invalid_projected_window', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'at',
        offsetMinutes: 0,
      },
      dueBy: {
        anchor: 'trip_departure',
        relation: 'at',
        offsetMinutes: 0,
        semantics: 'mandatory',
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'destination:TH:later',
        instant: '2026-10-10T18:00:00Z',
      },
      trip_departure: {
        eventRef: 'departure:ZRH:earlier',
        instant: '2026-10-10T12:00:00Z',
      },
    })
    assert.equal(projektion.availableFrom?.instant, '2026-10-10T18:00:00.000Z')
    assert.equal(projektion.dueBy?.instant, '2026-10-10T12:00:00.000Z')
    assert.equal(projektion.actionWindow, null)
    assert.deepEqual(issueSeiten(projektion.issues, 'window'), ['invalid_projected_window'])
  })

  test('11. eventRef bleibt für available/due Provenance erhalten', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
      dueBy: {
        anchor: 'trip_departure',
        relation: 'before',
        offsetMinutes: STUNDEN_24,
        semantics: 'recommended',
      },
    })
    const projektion = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'occ:destination:TH:2',
        instant: '2026-10-10T12:00:00Z',
      },
      trip_departure: {
        eventRef: 'occ:departure:ZRH:1',
        instant: '2026-10-10T14:00:00+02:00',
      },
    })
    assert.equal(projektion.availableFrom?.eventRef, 'occ:destination:TH:2')
    assert.equal(projektion.dueBy?.eventRef, 'occ:departure:ZRH:1')
    assert.equal(projektion.actionWindow?.availableFrom?.eventRef, 'occ:destination:TH:2')
    assert.equal(projektion.actionWindow?.dueBy?.eventRef, 'occ:departure:ZRH:1')
  })

  test('12. zwei Occurrences werden niemals first-picked', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
    })
    const erste: OfficialTemporalEventBinding = {
      eventRef: 'destination:TH:leg-1',
      instant: '2026-10-10T12:00:00Z',
    }
    const zweite: OfficialTemporalEventBinding = {
      eventRef: 'destination:TH:leg-2',
      instant: '2026-10-20T12:00:00Z',
    }
    const ungenutzt = [erste, zweite]

    const nurZweite = temporalRuleProjizieren(regel, { destination_arrival: zweite })
    assert.equal(nurZweite.availableFrom?.eventRef, 'destination:TH:leg-2')
    assert.equal(nurZweite.availableFrom?.instant, '2026-10-17T12:00:00.000Z')

    const nurErste = temporalRuleProjizieren(regel, { destination_arrival: erste })
    assert.equal(nurErste.availableFrom?.eventRef, 'destination:TH:leg-1')
    assert.equal(nurErste.availableFrom?.instant, '2026-10-07T12:00:00.000Z')

    const keine = temporalRuleProjizieren(regel, {})
    assert.equal(keine.availableFrom, null)
    assert.deepEqual(issueSeiten(keine.issues, 'availableFrom'), ['missing_anchor'])
    assert.equal(ungenutzt.length, 2)
    assert.notEqual(nurZweite.availableFrom?.eventRef, erste.eventRef)
  })

  test('DST-Übergang bleibt reine Offset-Arithmetik, keine Zonenrekonstruktion', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: 60,
      },
    })
    const vorUmstellung = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'dst:before',
        instant: '2026-03-29T01:30:00+01:00',
      },
    })
    const nachUmstellung = temporalRuleProjizieren(regel, {
      destination_arrival: {
        eventRef: 'dst:after',
        instant: '2026-03-29T03:30:00+02:00',
      },
    })
    assert.equal(vorUmstellung.availableFrom?.instant, '2026-03-28T23:30:00.000Z')
    assert.equal(nachUmstellung.availableFrom?.instant, '2026-03-29T00:30:00.000Z')
    assert.notEqual(vorUmstellung.availableFrom?.instant, nachUmstellung.availableFrom?.instant)
  })

  test('E4-Bound und Overflow erzeugen keinen erfundenen Instant', () => {
    const maxRegel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES,
      },
    })
    const maxProjektion = temporalRuleProjizieren(maxRegel, {
      destination_arrival: {
        eventRef: 'bound:max',
        instant: '2026-10-10T12:00:00Z',
      },
    })
    assert.equal(maxProjektion.availableFrom?.instant, '2024-10-10T12:00:00.000Z')

    const ueberBound = temporalRuleProjizieren(
      {
        kind: OFFICIAL_TEMPORAL_KIND,
        availableFrom: {
          anchor: 'destination_arrival',
          relation: 'before',
          offsetMinutes: OFFICIAL_TEMPORAL_OFFSET_MAX_MINUTES + 1,
        },
        dueBy: null,
      },
      {
        destination_arrival: {
          eventRef: 'bound:overflow',
          instant: '2026-10-10T12:00:00Z',
        },
      },
    )
    assert.equal(ueberBound.availableFrom, null)
    assert.deepEqual(issueSeiten(ueberBound.issues, 'availableFrom'), ['invalid_instant'])
  })

  test('gleiche Eingabe ist value-stabil und unabhängig von Binding-Key-Reihenfolge', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
      dueBy: {
        anchor: 'trip_departure',
        relation: 'before',
        offsetMinutes: STUNDEN_24,
        semantics: 'mandatory',
      },
    })
    const a = temporalRuleProjizieren(regel, {
      trip_departure: { eventRef: 'dep', instant: '2026-10-10T12:00:00Z' },
      destination_arrival: { eventRef: 'arr', instant: '2026-10-12T12:00:00Z' },
    })
    const b = temporalRuleProjizieren(regel, {
      destination_arrival: { eventRef: 'arr', instant: '2026-10-12T12:00:00Z' },
      trip_departure: { eventRef: 'dep', instant: '2026-10-10T12:00:00Z' },
    })
    assert.deepEqual(a, b)
    assert.equal(a.availableFrom?.instant, '2026-10-09T12:00:00.000Z')
    assert.equal(a.dueBy?.instant, '2026-10-09T12:00:00.000Z')
    assert.ok(a.actionWindow)
  })

  test('leere Projektionen teilen keine mutierbare Referenz zwischen Aufrufen', () => {
    const erste = temporalRuleProjizieren(null, {})
    const zweite = temporalRuleProjizieren(undefined, {})
    const dritte = temporalRuleProjizieren(
      { kind: OFFICIAL_TEMPORAL_KIND, availableFrom: null, dueBy: null },
      {},
    )

    assert.notEqual(erste, zweite)
    assert.notEqual(erste, dritte)
    assert.notEqual(zweite, dritte)
    assert.notEqual(erste.issues, zweite.issues)
    assert.notEqual(erste.issues, dritte.issues)
    assert.notEqual(zweite.issues, dritte.issues)

    erste.issues.push({
      side: 'window',
      issue: 'invalid_projected_window',
      anchor: null,
      eventRef: null,
    })
    erste.availableFrom = {
      instant: '2026-10-10T12:00:00.000Z',
      anchor: 'destination_arrival',
      eventRef: 'mutated-empty',
    }
    erste.actionWindow = {
      availableFrom: erste.availableFrom,
      dueBy: null,
    }

    const danach = temporalRuleProjizieren(null, {})
    assert.notEqual(danach, erste)
    assert.notEqual(danach.issues, erste.issues)
    assert.deepEqual(danach, {
      availableFrom: null,
      dueBy: null,
      actionWindow: null,
      issues: [],
    })
    assert.deepEqual(zweite, {
      availableFrom: null,
      dueBy: null,
      actionWindow: null,
      issues: [],
    })
    assert.deepEqual(dritte, {
      availableFrom: null,
      dueBy: null,
      actionWindow: null,
      issues: [],
    })
  })

  test('whitespace-only eventRef ist keine stabile Provenance', () => {
    const regel = regelOderFail({
      kind: OFFICIAL_TEMPORAL_KIND,
      availableFrom: {
        anchor: 'destination_arrival',
        relation: 'before',
        offsetMinutes: STUNDEN_72,
      },
    })
    const andere: OfficialTemporalEventBinding = {
      eventRef: 'destination:TH:leg-1',
      instant: '2026-10-10T12:00:00Z',
    }
    for (const eventRef of ['   ', '\t', '\n', ' \t\n ']) {
      const projektion = temporalRuleProjizieren(regel, {
        destination_arrival: { eventRef, instant: '2026-10-10T12:00:00Z' },
        trip_departure: andere,
      })
      assert.equal(projektion.availableFrom, null, eventRef)
      assert.equal(projektion.actionWindow, null, eventRef)
      assert.deepEqual(projektion.issues, [
        {
          side: 'availableFrom',
          issue: 'missing_anchor',
          anchor: 'destination_arrival',
          eventRef: null,
        },
      ], eventRef)
    }
  })

  test('13/14. E4-Invarianten und Factory bleiben unangetastet', () => {
    assert.equal(requirementsProviderAus(), null)
    assert.deepEqual([...OFFICIAL_TEMPORAL_PROJECTION_ISSUES], [
      'missing_anchor',
      'invalid_instant',
      'invalid_projected_window',
    ])

    const core = quelle('lib/readiness/temporal-projection.ts')
    const temporal = quelle('lib/readiness/temporal.ts')
    assert.match(core, /from '@\/lib\/readiness\/temporal'/)
    assert.equal(core.includes("from '@/lib/safety"), false)
    assert.equal(core.includes("from '@/lib/flights"), false)
    assert.equal(core.includes("from '@/lib/route"), false)
    assert.equal(core.includes('Date.now('), false)
    assert.equal(core.includes("new Date('"), false)
    assert.equal(core.includes('new Date(`'), false)
    assert.equal(core.includes('documents[0]'), false)
    assert.equal(core.includes('evaluations[0]'), false)
    assert.equal(core.includes('countryCode'), false)
    assert.equal(core.includes('LEERE_PROJEKTION'), false)
    assert.match(core, /function leereProjektion\(/)
    assert.match(core, /wert\.trim\(\)\.length === 0/)
    assert.doesNotMatch(core, /\$\{[^}]*\}:00\.000Z/)
    assert.match(temporal, /Kein Timestamp, keine Notification/)
  })
})
