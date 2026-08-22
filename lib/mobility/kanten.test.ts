// lib/mobility/kanten.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { unbestaetigteBuchung } from '@/lib/trips/buchung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-08-21T10:00:00.000Z'

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
    ...unbestaetigteBuchung(),
    ...leereMobilitaet(),
    ...teil,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: 'CH',
    arrivalDate: '2026-09-12',
    departureDate: '2026-09-16',
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Tessin',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 2000,
    status: 'draft',
    pace: 'calm',
    interests: ['nature'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [etappe({ id: 'stage-1', name: 'Lugano', placeId: 'geonames:2659836', position: 1 })],
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

describe('Mobilitätsabdeckung', () => {
  test('ohne Origin oder Etappe bleibt die Abdeckung unbestimmt', () => {
    const lage = mobilitaetsAbdeckung(reise({ origin: null, originPlaceId: null, stages: [] }))
    assert.equal(lage.bestimmbar, false)
    assert.equal(lage.zusammenfassung, 'Noch keine Verbindung geplant')
  })

  test('eine Bahnverbindung mit passendem Start, Ziel und Datum gilt als ausgewählt', () => {
    const zug = punkt({
      id: 'rail-1',
      kind: 'transfer',
      title: 'Zürich → Lugano',
      mobilityMode: 'rail',
      originName: 'Zürich',
      destinationName: 'Lugano',
      originPlaceId: 'geonames:2657896',
      destinationPlaceId: 'geonames:2659836',
      startsOn: '2026-09-12',
      startsAt: '08:10',
      endsOn: '2026-09-12',
      endsAt: '10:40',
      mobilityEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [zug] }] }))
    assert.equal(lage.bestimmbar, true)
    assert.equal(lage.kanten[0]?.status, 'selected')
    assert.equal(lage.kanten[0]?.mobilityItem?.id, 'rail-1')
    assert.equal(lage.kanten[0]?.durationMinutes, 150)
    assert.match(lage.zusammenfassung, /ausgewählt/)
  })

  test('alle vier Mobilitätsarten können eine Kante abdecken', () => {
    for (const mode of ['rail', 'bus', 'ferry', 'transfer'] as const) {
      const item = punkt({
        id: mode,
        kind: 'transfer',
        title: mode,
        mobilityMode: mode,
        originName: 'Zürich',
        destinationName: 'Lugano',
        startsOn: '2026-09-12',
        mobilityEvidence: 'user',
      })
      const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [item] }] }))
      assert.equal(lage.kanten[0]?.status, 'selected', mode)
    }
  })

  test('ein einzelner Flug am Kantendatum ohne strukturierte Route bleibt unbestimmt', () => {
    const flug = punkt({
      id: 'flight-1',
      kind: 'flight',
      title: 'ZRH → LUG',
      startsOn: '2026-09-12',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [flug] }] }))
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.equal(lage.kanten[0]?.flightItem, null)
    assert.equal(lage.kanten.find((kante) => kante.art === 'return')?.status, 'open')
    assert.equal(lage.kanten.some((kante) => kante.status === 'covered_by_flight'), false)
    assert.match(lage.zusammenfassung, /noch nicht vollständig bestimmbar/i)
  })

  test('ein anders gerouteter gleichdatiger Flug darf die Kante nicht als Flugabdeckung markieren', () => {
    const flug = punkt({
      id: 'flight-wrong',
      kind: 'flight',
      title: 'ZRH → GVA',
      note: 'Zürich → Genf',
      startsOn: '2026-09-12',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [flug] }] }))
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.equal(lage.kanten[0]?.originName, 'Zürich')
    assert.equal(lage.kanten[0]?.destinationName, 'Lugano')
    assert.equal(lage.kanten.some((kante) => kante.status === 'covered_by_flight'), false)
  })

  test('ohne Flug und ohne Transfer bleibt eine vollständige Kante offen', () => {
    const lage = mobilitaetsAbdeckung(reise())
    assert.equal(lage.bestimmbar, true)
    assert.equal(lage.kanten[0]?.status, 'open')
    assert.equal(lage.kanten[0]?.art, 'outbound')
    assert.equal(lage.kanten.some((kante) => kante.status === 'covered_by_flight'), false)
    assert.equal(lage.zusammenfassung, 'Noch keine Verbindung geplant')
  })

  test('ein Flug an einem anderen Tag lässt die Kante offen', () => {
    const flug = punkt({
      id: 'flight-other-day',
      kind: 'flight',
      title: 'ZRH → LUG',
      startsOn: '2026-09-14',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [flug] }] }))
    assert.equal(lage.kanten[0]?.status, 'open')
    assert.equal(lage.kanten[0]?.art, 'outbound')
    assert.equal(lage.kanten.some((kante) => kante.status === 'covered_by_flight'), false)
  })

  test('Titel und Notiz eines Fluges sind keine Trust Boundary für die Route', () => {
    const flug = punkt({
      id: 'flight-title',
      kind: 'flight',
      title: 'Zürich → Lugano',
      note: 'ZRH 08:10 → LUG 09:05',
      startsOn: '2026-09-12',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [flug] }] }))
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.equal(lage.kanten.some((kante) => kante.status === 'covered_by_flight'), false)
  })

  test('fehlendes Datum macht die Kante unbestimmt, nicht offen', () => {
    const lage = mobilitaetsAbdeckung(
      reise({
        startDate: null,
        stages: [etappe({ id: 'stage-1', name: 'Lugano', arrivalDate: null, departureDate: null })],
      }),
    )
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.match(lage.zusammenfassung, /noch nicht vollständig bestimmbar/i)
  })

  test('zwei passende Transfers machen die Zuordnung unbestimmt', () => {
    const a = punkt({
      id: 'a',
      kind: 'transfer',
      title: 'Zug A',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      mobilityMode: 'rail',
      mobilityEvidence: 'user',
    })
    const b = punkt({
      id: 'b',
      kind: 'transfer',
      title: 'Zug B',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      mobilityMode: 'rail',
      mobilityEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [a, b] }] }))
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.equal(lage.kanten[0]?.mobilityItem, null)
  })

  test('über Mitternacht wird die Dauer aus beiden Kalendertagen berechnet', () => {
    const nacht = punkt({
      id: 'ferry-1',
      kind: 'transfer',
      title: 'Nachtfähre',
      mobilityMode: 'ferry',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      startsAt: '23:30',
      endsOn: '2026-09-13',
      endsAt: '01:15',
      mobilityEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [nacht] }] }))
    assert.equal(lage.kanten[0]?.durationMinutes, 105)
  })

  test('eine gebuchte Verbindung bleibt gebucht und nicht nur ausgewählt', () => {
    const bus = punkt({
      id: 'bus-1',
      kind: 'transfer',
      title: 'Zürich → Lugano',
      mobilityMode: 'bus',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      bookingStatus: 'booked',
      bookingSource: 'user',
      bookingConfirmedAt: JETZT,
      mobilityEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [bus] }] }))
    assert.equal(lage.kanten[0]?.status, 'booked')
  })

  test('ein Transfer und ein Flug am selben Datum bleiben unbestimmt', () => {
    const zug = punkt({
      id: 'rail-1',
      kind: 'transfer',
      title: 'Zürich → Lugano',
      mobilityMode: 'rail',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      mobilityEvidence: 'user',
    })
    const flug = punkt({
      id: 'flight-1',
      kind: 'flight',
      title: 'ZRH → LUG',
      startsOn: '2026-09-12',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [zug, flug] }] }))
    assert.equal(lage.kanten[0]?.status, 'unknown')
    assert.equal(lage.kanten[0]?.mobilityItem, null)
    assert.equal(lage.kanten[0]?.flightItem, null)
  })

  test('ein Transfer ohne Start/Ziel bleibt unzugeordnet', () => {
    const lose = punkt({
      id: 'loose',
      kind: 'transfer',
      title: 'Irgendwohin',
      mobilityMode: 'transfer',
      mobilityEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ ohneTag: [lose] }))
    assert.equal(lage.unzugeordnet.some((punkt) => punkt.id === 'loose'), true)
  })

  test('ein überlappender Mietwagen deckt keine Bewegungskante', () => {
    const auto = punkt({
      id: 'car-1',
      kind: 'rental_car',
      title: 'Mietwagen Zürich → Lugano',
      originName: 'Zürich',
      destinationName: 'Lugano',
      startsOn: '2026-09-12',
      endsOn: '2026-09-16',
      rentalEvidence: 'user',
    })
    const lage = mobilitaetsAbdeckung(reise({ days: [{ ...reise().days[0], items: [auto] }] }))
    assert.equal(lage.kanten[0]?.status, 'open')
    assert.equal(lage.kanten[0]?.mobilityItem, null)
    assert.equal(lage.unzugeordnet.some((eintrag) => eintrag.id === 'car-1'), false)
  })
})
