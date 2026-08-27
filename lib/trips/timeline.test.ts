// lib/trips/timeline.test.ts
//
// TW-3 Timeline darf keine zweite Tageswahrheit und kein Transit-Ziel erfinden.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { itineraryEinTransit } from '@/lib/route/fixtures'
import { gewaehlterTagId } from '@/lib/trips/arbeitsbereich'
import { ersterTagDerEtappe, timelineAbleiten } from '@/lib/trips/timeline'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

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

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return {
    stageId: 'stage-1',
    dayDate: null,
    title: null,
    items: [],
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
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 3500,
    status: 'draft',
    pace: 'calm',
    interests: ['culture'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', name: 'Florenz', countryCode: 'IT' })],
    days: [
      tag({ id: 'day-1', dayIndex: 1, dayDate: '2026-09-12' }),
      tag({ id: 'day-2', dayIndex: 2, dayDate: '2026-09-13' }),
    ],
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function mehrziel(): Trip {
  return reise({
    title: 'Florenz und Rom',
    stages: [
      etappe({ id: 'stage-1', name: 'Florenz', countryCode: 'IT', position: 1 }),
      etappe({ id: 'stage-2', name: 'Rom', countryCode: 'IT', position: 2 }),
    ],
    days: [
      tag({ id: 'day-1', stageId: 'stage-1', dayIndex: 1, dayDate: '2026-09-12', items: [punkt({ id: 'act-1', kind: 'activity', title: 'Duomo' })] }),
      tag({ id: 'day-2', stageId: 'stage-1', dayIndex: 2, dayDate: '2026-09-13' }),
      tag({ id: 'day-3', stageId: 'stage-2', dayIndex: 3, dayDate: '2026-09-14', items: [punkt({ id: 'stay-1', kind: 'stay', title: 'Hotel Rom', dayId: 'day-3', stageId: 'stage-2' })] }),
    ],
  })
}

describe('TW-3 Timeline-Ableitung', () => {
  test('Multi-Stage gruppiert Tage unter die kanonischen Etappen', () => {
    const sicht = timelineAbleiten(mehrziel())
    assert.deepEqual(
      sicht.etappen.map((etappe) => ({
        stageId: etappe.stageId,
        name: etappe.name,
        istNutzerziel: etappe.istNutzerziel,
        tage: etappe.tage.map((eintrag) => eintrag.id),
      })),
      [
        { stageId: 'stage-1', name: 'Florenz', istNutzerziel: true, tage: ['day-1', 'day-2'] },
        { stageId: 'stage-2', name: 'Rom', istNutzerziel: true, tage: ['day-3'] },
      ],
    )
    assert.equal(sicht.etappen[0]?.tage[1]?.items.length, 0)
    assert.equal(sicht.hatTage, true)
  })

  test('Tage ohne Items bleiben sichtbare leere Tage, nicht ein Fehler', () => {
    const sicht = timelineAbleiten(reise())
    assert.equal(sicht.etappen[0]?.tage.every((eintrag) => eintrag.items.length === 0), true)
    assert.equal(sicht.planText, '0 Punkte geplant')
  })

  test('Items ohne Tag bleiben ungeplant und gehören nicht zum letzten Tag', () => {
    const offen = punkt({ id: 'item-offen', kind: 'flight', title: 'ZRH–FCO', dayId: null, stageId: null })
    const sicht = timelineAbleiten(reise({ ohneTag: [offen] }))
    assert.equal(sicht.ungeplante.length, 1)
    assert.equal(sicht.ungeplante[0]?.id, 'item-offen')
    assert.equal(sicht.etappen[0]?.tage.at(-1)?.items.some((eintrag) => eintrag.id === 'item-offen'), false)
    assert.equal(sicht.planText.includes('noch nicht eingeplant'), true)
  })

  test('Wechsel zwischen Etappen ändert nur den gewählten Tag', () => {
    const graph = mehrziel()
    const florenz = timelineAbleiten(graph, [], 'day-1')
    assert.equal(florenz.gewaehlterTagId, 'day-1')
    assert.equal(florenz.gewaehlteEtappeId, 'stage-1')
    const romTag = ersterTagDerEtappe(florenz.etappen, 'stage-2')
    assert.equal(romTag, 'day-3')
    const rom = timelineAbleiten(graph, [], romTag)
    assert.equal(rom.gewaehlterTagId, 'day-3')
    assert.equal(rom.gewaehlteEtappeId, 'stage-2')
    assert.equal(rom.gewaehlterTag?.id, 'day-3')
  })

  test('Graph-Mutation behält den Tag, wenn er noch existiert', () => {
    const vorher = timelineAbleiten(mehrziel(), [], 'day-3')
    assert.equal(vorher.gewaehlterTagId, 'day-3')
    const nachher = timelineAbleiten(
      {
        ...mehrziel(),
        days: mehrziel().days.map((eintrag) =>
          eintrag.id === 'day-3' ? { ...eintrag, title: 'Ankunft Rom' } : eintrag,
        ),
      },
      [],
      vorher.gewaehlterTagId,
    )
    assert.equal(nachher.gewaehlterTagId, 'day-3')
    assert.equal(nachher.gewaehlterTag?.title, 'Ankunft Rom')
  })

  test('Graph-Mutation fällt deterministisch zurück, wenn der gewählte Tag entfällt', () => {
    const graph = mehrziel()
    const ohneRom = {
      ...graph,
      days: graph.days.filter((eintrag) => eintrag.id !== 'day-3'),
    }
    const sicht = timelineAbleiten(ohneRom, [], 'day-3')
    assert.equal(sicht.gewaehlterTagId, 'day-1')
    assert.equal(sicht.gewaehlterTagId, gewaehlterTagId(ohneRom, 'day-3'))
    assert.equal(timelineAbleiten({ ...graph, days: [] }, [], 'day-1').gewaehlterTagId, '')
  })

  test('Guest und Account liefern bei gleichem Graphen dieselbe Timeline', () => {
    const graph = mehrziel()
    const gast = timelineAbleiten(graph, graph.ohneTag, 'day-2')
    const konto = timelineAbleiten(graph, graph.ohneTag, 'day-2')
    assert.deepEqual(gast, konto)
    assert.equal(JSON.stringify(gast).includes('Gerät'), false)
    assert.equal(JSON.stringify(konto).includes('Konto'), false)
  })

  test('Mobile und Desktop teilen dieselbe fachliche Ableitung', () => {
    const graph = mehrziel()
    const kompakt = timelineAbleiten(graph, [], 'day-2')
    const desktop = timelineAbleiten(graph, [], 'day-2')
    assert.deepEqual(kompakt, desktop)
    assert.equal('kompakt' in kompakt, false)
  })

  test('Transitland wird nicht als Nutzer-Reiseziel gezeigt', () => {
    const graph = reise({
      title: 'Bangkok',
      stages: [etappe({ id: 'stage-1', name: 'Bangkok', countryCode: 'TH' })],
      days: [
        tag({
          id: 'day-1',
          dayIndex: 1,
          items: [
            punkt({
              id: 'flight-1',
              kind: 'flight',
              title: 'ZRH-BKK',
              routeItinerary: itineraryEinTransit('DOH'),
            }),
          ],
        }),
      ],
    })
    const sicht = timelineAbleiten(graph)
    const ziele = sicht.etappen.map((etappe) => ({
      name: etappe.name,
      countryCode: etappe.countryCode,
      istNutzerziel: etappe.istNutzerziel,
    }))
    assert.deepEqual(ziele, [{ name: 'Bangkok', countryCode: 'TH', istNutzerziel: true }])
    assert.equal(ziele.some((etappe) => etappe.countryCode === 'QA' || etappe.name.includes('Doha')), false)
  })

  test('unassigned Multi-Ziel behauptet keine 2/2/2-Aufenthalte', () => {
    const sicht = timelineAbleiten(
      reise({
        title: 'Paris',
        dayStageAssignmentMode: 'unassigned',
        stages: [
          etappe({ id: 'stage-1', name: 'Paris', countryCode: 'FR', position: 1 }),
          etappe({ id: 'stage-2', name: 'Rom', countryCode: 'IT', position: 2 }),
          etappe({ id: 'stage-3', name: 'Paris', countryCode: 'FR', position: 3 }),
        ],
        days: [1, 2, 3, 4, 5, 6].map((nr) =>
          tag({
            id: `day-${nr}`,
            stageId: null,
            dayIndex: nr,
            dayDate: `2026-09-${11 + nr}`,
          }),
        ),
      }),
    )

    assert.deepEqual(
      sicht.etappen.map((etappe) => ({
        name: etappe.name,
        istNutzerziel: etappe.istNutzerziel,
        tage: etappe.tage.length,
      })),
      [
        { name: 'Paris', istNutzerziel: true, tage: 0 },
        { name: 'Rom', istNutzerziel: true, tage: 0 },
        { name: 'Paris', istNutzerziel: true, tage: 0 },
        { name: 'Noch keinem Ziel zugeordnet', istNutzerziel: false, tage: 6 },
      ],
    )
    assert.equal(sicht.etappen.filter((etappe) => etappe.istNutzerziel).every((etappe) => etappe.tage.length === 0), true)
  })

  test('Tage ohne Etappe bleiben ehrlich ohne Nutzerziel', () => {
    const sicht = timelineAbleiten(
      reise({
        days: [tag({ id: 'day-1', stageId: null, dayIndex: 1 })],
      }),
    )
    assert.equal(sicht.etappen.at(-1)?.stageId, null)
    assert.equal(sicht.etappen.at(-1)?.istNutzerziel, false)
    assert.equal(sicht.etappen.at(-1)?.name, 'Ohne Etappe')
  })
})
