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
  bereichDarstellungKlasse,
  bereichSollMounten,
  bereichSollSichtbar,
  bereichStatus,
  besuchteBereicheErweitern,
  gewaehlterTagId,
  istArbeitsbereich,
  planStatus,
  planpunkteSammeln,
  tagesplanIstSichtbar,
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
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
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
    assert.deepEqual(ARBEITSBEREICHE, ['uebersicht', 'fluege', 'unterkunft', 'aktivitaeten'])
  })

  test('die Mobile-Navigation enthält keinen separaten Plan-Bereich', () => {
    assert.equal((ARBEITSBEREICHE as readonly string[]).includes('plan'), false)
    assert.equal(istArbeitsbereich('plan'), false)
  })

  test('unbekannte Werte und historisches plan fallen auf die Übersicht', () => {
    assert.equal(arbeitsbereichLesen('plan'), 'uebersicht')
    assert.equal(arbeitsbereichLesen('fluege'), 'fluege')
    assert.equal(arbeitsbereichLesen('budget'), 'uebersicht')
    assert.equal(arbeitsbereichLesen(undefined), 'uebersicht')
  })
})

describe('Status der Übersicht', () => {
  test('leere Reise behauptet keinen Flug, kein Hotel, keine Aktivität', () => {
    const status = bereichStatus(reise())
    assert.deepEqual(
      status.map((eintrag) => eintrag.bereich),
      ['fluege', 'unterkunft', 'aktivitaeten'],
    )
    assert.deepEqual(
      status.map((eintrag) => eintrag.text),
      ['Noch kein Flug ausgewählt', 'Noch keine Unterkunft ausgewählt', 'Noch keine Aktivität geplant'],
    )
  })

  test('Planstatus ist Einleitung, kein eigener Bereichswechsel', () => {
    assert.equal(planStatus(reise()).text, '0 Punkte geplant')
    assert.equal(
      bereichStatus(reise()).some((eintrag) => (eintrag.bereich as string) === 'plan'),
      false,
    )
  })

  test('zählt nur vorhandene Arten und nimmt ungeplante Punkte mit', () => {
    const ohneTag = [punkt({ id: 'item-offen', kind: 'flight', title: 'ZRH–DPS', dayId: null })]
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
    assert.equal(planStatus(reise(), ohneTag).text, '1 Punkt geplant, davon 1 noch nicht eingeplant')
    assert.equal(status[0]?.text, 'noch nicht vollständig bestimmbar')
    assert.equal(status[1]?.text, 'Abdeckung noch nicht vollständig bestimmbar')
    assert.equal(status[2]?.text, '1 Aktivität geplant')
  })

  test('zeigt gebuchten Hinflug und offenen Rückflug ehrlich', () => {
    const status = bereichStatus(
      reise({
        origin: 'Zürich',
        originPlaceId: 'geonames:2657896',
        startDate: '2026-08-30',
        endDate: '2026-09-13',
        stages: [
          {
            id: 'stage-1',
            position: 1,
            name: 'Bali',
            countryCode: 'ID',
            arrivalDate: '2026-08-30',
            departureDate: '2026-09-13',
            latitude: null,
            longitude: null,
            placeId: 'geonames:1650535',
          },
        ],
        ohneTag: [
          punkt({
            id: 'flug-hin',
            kind: 'flight',
            title: 'ZRH → DPS',
            dayId: null,
            startsOn: '2026-08-30',
            bookingStatus: 'booked',
            bookingSource: 'user',
            bookingConfirmedAt: JETZT,
            priceAmount: 890,
            priceCurrency: 'CHF',
            provider: 'duffel',
            externalRef: 'off_1',
          }),
        ],
      }),
    )
    assert.equal(status[0]?.text, 'Hinflug gebucht · Rückflug offen')
  })

  test('erfindet keinen Status aus fehlenden Providerdaten', () => {
    const texte = [...bereichStatus(reise()), planStatus(reise())].map((eintrag) => eintrag.text).join(' ')
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

  test('derselbe aktive Tag gilt für Übersicht/Tagesplan und Aktivitäten', () => {
    const aktiv = gewaehlterTagId(reise(), 'day-2')
    assert.equal(aktiv, 'day-2')
    assert.equal(tagesplanIstSichtbar('uebersicht', true), true)
    assert.equal(tagesplanIstSichtbar('aktivitaeten', true), false)
  })
})

describe('Sichtbarkeit und Mount', () => {
  test('auf Mobile ist nur der aktive Bereich sichtbar', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht', true), true)
    assert.equal(bereichSollSichtbar('fluege', 'uebersicht', true), false)
    assert.equal(bereichSollSichtbar('aktivitaeten', 'uebersicht', true), false)
  })

  test('auf Mobile liegt der Tagesplan in der Übersicht, nicht in einem eigenen Tab', () => {
    assert.equal(tagesplanIstSichtbar('uebersicht', true), true)
    assert.equal(tagesplanIstSichtbar('fluege', true), false)
    assert.equal(tagesplanIstSichtbar('unterkunft', true), false)
    assert.equal(tagesplanIstSichtbar('aktivitaeten', true), false)
  })

  test('auf Desktop bleibt die Übersicht weg und Plan sowie Suchen sichtbar', () => {
    assert.equal(bereichSollSichtbar('uebersicht', 'uebersicht', false), false)
    assert.equal(bereichSollSichtbar('fluege', 'uebersicht', false), true)
    assert.equal(tagesplanIstSichtbar('uebersicht', false), true)
    assert.equal(tagesplanIstSichtbar('fluege', false), true)
  })

  test('Mobile hängt Hotel und Aktivitäten erst beim Besuch ein', () => {
    const leer = new Set<'uebersicht'>()
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', leer, true), false)
    assert.equal(bereichSollMounten('aktivitaeten', 'uebersicht', leer, true), false)
    assert.equal(bereichSollMounten('fluege', 'fluege', leer, true), true)
    assert.equal(bereichSollMounten('uebersicht', 'fluege', leer, true), true)
  })

  test('ein einmal besuchter Suchbereich bleibt eingehängt', () => {
    const besucht = besuchteBereicheErweitern(new Set(), 'unterkunft')
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', besucht, true), true)
    assert.equal(besuchteBereicheErweitern(besucht, 'unterkunft'), besucht)
  })

  test('Desktop hängt die Arbeitsbereiche ein, nicht die mobile Übersicht', () => {
    assert.equal(bereichSollMounten('uebersicht', 'uebersicht', new Set(), false), false)
    assert.equal(bereichSollMounten('unterkunft', 'uebersicht', new Set(), false), true)
    assert.equal(bereichSollMounten('aktivitaeten', 'fluege', new Set(), false), true)
  })

  test('Reise ändern ist auf Desktop immer da, auf Mobile nur geöffnet', () => {
    assert.equal(aenderungIstSichtbar(false, false), true)
    assert.equal(aenderungIstSichtbar(true, false), false)
    assert.equal(aenderungIstSichtbar(true, true), true)
  })

  test('ein verborgener Bereich trägt keine Display-Utility neben hidden', () => {
    assert.equal(bereichDarstellungKlasse(true, 'mt-6 grid gap-6'), 'hidden')
    assert.equal(bereichDarstellungKlasse(true, 'mt-6 grid gap-6').includes('grid'), false)
    assert.equal(bereichDarstellungKlasse(false, 'mt-6 grid gap-6'), 'mt-6 grid gap-6')
    assert.equal(bereichDarstellungKlasse(false, 'mt-6'), 'mt-6')
    assert.equal(bereichDarstellungKlasse(true), 'hidden')
  })
})
