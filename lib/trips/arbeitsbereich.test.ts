// lib/trips/arbeitsbereich.test.ts
//
// Die mobile Übersicht darf nur zählen, was im Reisegraphen liegt.
// Eine zweite Tageswahrheit oder ein gemutmasster Providerstatus wäre ein
// Produktdefekt, auch wenn die Seite nicht abstürzt.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ARBEITSBEREICHE,
  STANDARD_ARBEITSBEREICH,
  aenderungIstSichtbar,
  arbeitsbereichLesen,
  bereichSollMounten,
  bereichSollSichtbar,
  bereichStatus,
  besuchteBereicheErweitern,
  gewaehlterTagId,
  istArbeitsbereich,
  planpunkteSammeln,
} from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

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
      {
        id: 'day-2',
        stageId: 'stage-1',
        dayIndex: 2,
        dayDate: '2026-09-13',
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

describe('Arbeitsbereich-Kennungen', () => {
  test('der Default auf Mobile ist die Übersicht', () => {
    assert.equal(STANDARD_ARBEITSBEREICH, 'uebersicht')
    assert.deepEqual(ARBEITSBEREICHE, [
      'uebersicht',
      'plan',
      'fluege',
      'unterkunft',
      'aktivitaeten',
    ])
  })

  test('unbekannte Werte fallen auf die Übersicht zurück', () => {
    assert.equal(istArbeitsbereich('plan'), true)
    assert.equal(istArbeitsbereich('budget'), false)
    assert.equal(arbeitsbereichLesen('fluege'), 'fluege')
    assert.equal(arbeitsbereichLesen('budget'), 'uebersicht')
    assert.equal(arbeitsbereichLesen(undefined), 'uebersicht')
  })
})

describe('Status der Übersicht', () => {
  test('leere Reise behauptet keinen Flug, kein Hotel, keine Aktivität', () => {
    const status = bereichStatus(reise())
    assert.deepEqual(
      status.map((eintrag) => eintrag.text),
      [
        'Noch keine Punkte geplant',
        'Noch kein Flug ausgewählt',
        'Noch keine Unterkunft ausgewählt',
        'Noch keine Aktivität geplant',
      ],
    )
  })

  test('zählt nur vorhandene Arten und nimmt ungeplante Punkte mit', () => {
    const ohneTag = [
      punkt({ id: 'item-offen', kind: 'flight', title: 'ZRH–DPS', dayId: null }),
    ]
    const status = bereichStatus(
      reise({
        days: [
          {
            id: 'day-1',
            stageId: 'stage-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            title: null,
            items: [
              punkt({ id: 'item-1', kind: 'stay', title: 'Ubud Inn' }),
              punkt({ id: 'item-2', kind: 'activity', title: 'Reisterrassen' }),
              punkt({ id: 'item-3', kind: 'note', title: 'Frei' }),
            ],
          },
        ],
      }),
      ohneTag,
    )

    assert.equal(planpunkteSammeln(reise(), ohneTag).length, 1)
    assert.equal(status[0]?.text, '4 Punkte geplant, davon 1 noch nicht eingeplant')
    assert.equal(status[1]?.text, '1 Flug ausgewählt')
    assert.equal(status[2]?.text, '1 Unterkunft ausgewählt')
    assert.equal(status[3]?.text, '1 Aktivität geplant')
  })

  test('erfindet keinen Status aus fehlenden Providerdaten', () => {
    const texte = bereichStatus(reise()).map((eintrag) => eintrag.text).join(' ')
    assert.equal(texte.includes('unavailable'), false)
    assert.equal(texte.includes('Duffel'), false)
    assert.equal(texte.includes('Booking'), false)
  })
})

describe('Tagesauswahl', () => {
  test('hält den gewählten Tag, wenn er noch existiert', () => {
    assert.equal(gewaehlterTagId(reise(), 'day-2'), 'day-2')
  })

  test('fällt auf den ersten Tag zurück, wenn der bisherige fehlt', () => {
    assert.equal(gewaehlterTagId(reise(), 'day-weg'), 'day-1')
    assert.equal(gewaehlterTagId(reise({ days: [] }), 'day-1'), '')
  })
})

describe('Sichtbarkeit und Mount', () => {
  test('auf Mobile ist nur der aktive Bereich sichtbar', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht', true), true)
    assert.equal(bereichSollSichtbar('plan', 'uebersicht', true), false)
    assert.equal(bereichSollSichtbar('plan', 'plan', true), true)
  })

  test('auf Desktop bleibt die Übersicht weg und die Arbeitsbereiche sichtbar', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht', false), false)
    assert.equal(bereichSollSichtbar('plan', 'uebersicht', false), true)
    assert.equal(bereichSollSichtbar('fluege', 'plan', false), true)
  })

  test('Mobile hängt Hotel und Aktivitäten erst beim Besuch ein', () => {
    const leer = new Set<'uebersicht'>()
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', leer, true), false)
    assert.equal(bereichSollMounten('aktivitaeten', 'uebersicht', leer, true), false)
    assert.equal(bereichSollMounten('fluege', 'fluege', leer, true), true)
    assert.equal(bereichSollMounten('uebersicht', 'plan', leer, true), true)
    assert.equal(bereichSollMounten('plan', 'uebersicht', leer, true), true)
  })

  test('ein einmal besuchter Suchbereich bleibt eingehängt', () => {
    const besucht = besuchteBereicheErweitern(new Set(), 'unterkunft')
    assert.equal(bereichSollMounten('unterkunft', 'plan', besucht, true), true)
    assert.equal(besuchteBereicheErweitern(besucht, 'unterkunft'), besucht)
  })

  test('Desktop hängt die Arbeitsbereiche ein, nicht die mobile Übersicht', () => {
    assert.equal(bereichSollMounten('uebersicht', 'uebersicht', new Set(), false), false)
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', new Set(), false), true)
    assert.equal(bereichSollMounten('aktivitaeten', 'plan', new Set(), false), true)
  })

  test('Reise ändern ist auf Desktop immer da, auf Mobile nur geöffnet', () => {
    assert.equal(aenderungIstSichtbar(false, false), true)
    assert.equal(aenderungIstSichtbar(true, false), false)
    assert.equal(aenderungIstSichtbar(true, true), true)
  })
})
