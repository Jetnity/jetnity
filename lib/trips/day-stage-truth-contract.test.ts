import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { alsNutzlast } from '@/lib/trips/abbildung'
import { createZieleGraph } from '@/lib/trips/create-stages'
import {
  darfEinzelzielZuordnen,
  dayStageAssignmentSourceAbleiten,
} from '@/lib/trips/day-stage-assignment'
import { reiseNutzlastSchema } from '@/lib/trips/schema'
import { timelineAbleiten } from '@/lib/trips/timeline'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Ort } from '@/lib/places/domain'
import type { Trip, TripDay, TripStage } from '@/types/trips'

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: 'city',
    country: teil.country ?? 'France',
    countryCode: teil.countryCode ?? 'FR',
    region: null,
    lat: teil.lat ?? 48.85,
    lon: teil.lon ?? 2.35,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const PARIS = ort({
  id: 'geonames:2988507',
  name: 'Paris',
  country: 'France',
  countryCode: 'FR',
  lat: 48.85341,
  lon: 2.3488,
})
const ROM = ort({
  id: 'geonames:3169070',
  name: 'Rom',
  country: 'Italy',
  countryCode: 'IT',
  lat: 41.89193,
  lon: 12.51133,
})
const ZEITRAUM = { startDate: '2026-09-12', endDate: '2026-09-17' }

function tag(nr: number, stageId: string | null = null): TripDay {
  return {
    id: `day-${nr}`,
    stageId,
    dayIndex: nr,
    dayDate: `2026-09-${11 + nr}`,
    title: null,
    items: [],
  }
}

function etappe(id: string, position: number, name: string, countryCode: string): TripStage {
  return {
    id,
    position,
    name,
    countryCode,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-paris-rom-paris',
    clientRef: 'trip-paris-rom-paris',
    title: 'Paris',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: ZEITRAUM.startDate,
    endDate: ZEITRAUM.endDate,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'balanced',
    interests: [],
    travelWish: null,
    dayStageAssignmentSource: 'unassigned',
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe('stage-1', 1, 'Paris', 'FR'),
      etappe('stage-2', 2, 'Rom', 'IT'),
      etappe('stage-3', 3, 'Paris', 'FR'),
    ],
    days: [1, 2, 3, 4, 5, 6].map((nr) => tag(nr)),
    ohneTag: [],
    createdAt: '2026-08-26T20:00:00.000Z',
    updatedAt: '2026-08-26T20:00:00.000Z',
    ...teil,
  }
}

describe('TW6 Day→Stage Truth Contract – Paris → Rom → Paris / 12.–17. September', () => {
  test('Create erzeugt drei Stages, sechs unassigned Tage und keine 2/2/2-Erfindung', () => {
    const graph = createZieleGraph([PARIS, ROM, PARIS], ZEITRAUM)
    assert.equal(graph.assignmentSource, 'unassigned')
    assert.equal(graph.stages.length, 3)
    assert.equal(graph.dayStagePosition, null)
    assert.deepEqual(
      graph.stages.map((etappe) => etappe.name),
      ['Paris', 'Rom', 'Paris'],
    )

    const persistiert = reise()
    const geladen = tageEtappenZuordnen(persistiert)
    assert.equal(geladen.days.length, 6)
    assert.equal(geladen.days.every((eintrag) => eintrag.stageId === null), true)
    assert.equal(geladen.dayStageAssignmentSource, 'unassigned')

    const timeline = timelineAbleiten(geladen)
    assert.equal(timeline.etappen.filter((etappe) => etappe.istNutzerziel).length, 3)
    assert.equal(
      timeline.etappen.filter((etappe) => etappe.istNutzerziel).every((etappe) => etappe.tage.length === 0),
      true,
    )
    assert.equal(timeline.etappen.at(-1)?.name, 'Noch keinem Ziel zugeordnet')
    assert.equal(timeline.etappen.at(-1)?.tage.length, 6)
    assert.equal(JSON.stringify(timeline).includes('2/2/2'), false)
  })

  test('Guest→Account behält unassigned und leere Day→Stage-Zuordnung', () => {
    const nutzlast = alsNutzlast(reise())
    assert.equal(nutzlast.day_stage_assignment_source, 'unassigned')
    assert.equal(nutzlast.stages.length, 3)
    assert.equal(nutzlast.days.length, 6)
    assert.equal(nutzlast.days.every((eintrag) => eintrag.stage_position == null), true)
    assert.equal(reiseNutzlastSchema.safeParse(nutzlast).success, true)
  })

  test('Single-Destination bleibt der einen Stage zugeordnet', () => {
    const graph = createZieleGraph([PARIS], ZEITRAUM)
    assert.equal(graph.assignmentSource, 'single_destination')
    const einzel = reise({
      dayStageAssignmentSource: 'single_destination',
      stages: [etappe('stage-1', 1, 'Paris', 'FR')],
    })
    const zugeordnet = tageEtappenZuordnen(einzel)
    assert.equal(zugeordnet.days.every((eintrag) => eintrag.stageId === 'stage-1'), true)
    assert.equal(darfEinzelzielZuordnen('single_destination'), true)
  })

  test('Legacy ohne Source-Feld behält den proportionalen Fallback', () => {
    const { dayStageAssignmentSource: _quelle, ...alt } = reise({
      days: [1, 2, 3, 4].map((nr) => tag(nr)),
      stages: [etappe('s1', 1, 'Florenz', 'IT'), etappe('s2', 2, 'Rom', 'IT')],
    })
    const zugeordnet = tageEtappenZuordnen(alt)
    assert.equal(zugeordnet.days[0]?.stageId, 's1')
    assert.equal(zugeordnet.days[1]?.stageId, 's1')
    assert.equal(zugeordnet.days[2]?.stageId, 's2')
    assert.equal(zugeordnet.days[3]?.stageId, 's2')
  })

  test('manipulierter user- oder legacy-Claim erzeugt keine Server-Wahrheit', () => {
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'user',
        daysHaveStagePosition: false,
      }),
      'unassigned',
    )
    assert.equal(
      dayStageAssignmentSourceAbleiten({
        stageCount: 3,
        claimed: 'legacy_fallback',
        daysHaveStagePosition: false,
      }),
      'unassigned',
    )
    const gefaelscht = alsNutzlast(
      reise({
        dayStageAssignmentSource: 'user',
        days: [1, 2, 3, 4, 5, 6].map((nr) => tag(nr, nr <= 2 ? 'stage-1' : null)),
      }),
    )
    assert.equal(gefaelscht.day_stage_assignment_source, 'unassigned')
    assert.equal(gefaelscht.days.every((eintrag) => eintrag.stage_position == null), true)
  })
})
