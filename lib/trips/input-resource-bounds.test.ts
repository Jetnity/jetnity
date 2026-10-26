import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  INTERESSEN_EINGABE_MAXIMUM,
  ROUTE_LEGS_MAXIMUM,
  ROUTE_SEGMENTE_MAXIMUM,
  rohEingabeBegrenzen,
} from '@/lib/trips/input-resource-bounds'
import { GRENZEN, neueReiseSchema, reiseNutzlastSchema } from '@/lib/trips/schema'
import { TRIP_INTERESTS } from '@/types/trips'

function sparse(laenge: number, beimLesen: () => void): unknown[] {
  const liste: unknown[] = []
  Object.defineProperty(liste, '0', {
    configurable: true,
    get() {
      beimLesen()
      return { name: 'gelesen' }
    },
  })
  liste.length = laenge
  return liste
}

const NUTZLAST = {
  client_ref: 'trip-1',
  title: 'Japan im Herbst',
  origin: 'Zürich',
  start_date: '2026-09-12',
  end_date: '2026-09-16',
  travellers: 2,
  currency: 'CHF',
  budget_amount: 4200,
  pace: 'balanced',
  interests: ['culture'],
  travel_wish: null,
  stages: [
    {
      position: 1,
      name: 'Tokio',
      country_code: 'JP',
      arrival_date: '2026-09-12',
      departure_date: '2026-09-16',
    },
  ],
  days: [
    {
      day_index: 1,
      day_date: '2026-09-12',
      title: null,
      items: [{ kind: 'activity', title: 'Tsukiji', note: null, position: 1, starts_at: '09:30' }],
    },
  ],
}

describe('Create-/Import-Grenzen vor dem ersten Zod-Lauf', () => {
  test('eine gültige Nutzlast und eine Formulareingabe bleiben unverändert zulässig', () => {
    assert.equal(rohEingabeBegrenzen(NUTZLAST).ok, true)
    assert.equal(reiseNutzlastSchema.safeParse(NUTZLAST).success, true)
    const formular = {
      clientRef: 'trip-1',
      title: 'Japan',
      destination: 'Japan',
      destinationPlaceId: 'geonames:1861060',
      origin: 'Zürich',
      originPlaceId: 'geonames:2657896',
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: 2,
      interests: ['culture', 'culture'],
    }
    assert.equal(rohEingabeBegrenzen(formular).ok, true)
    assert.equal(neueReiseSchema.safeParse({ ...formular, currency: 'CHF', pace: 'balanced' }).success, true)
    assert.equal(INTERESSEN_EINGABE_MAXIMUM, TRIP_INTERESTS.length * 2)
  })

  test('eine zu lange, lückenhafte Etappenliste wird abgelehnt, ohne den ersten Eintrag zu lesen', () => {
    let gelesen = false
    const ergebnis = rohEingabeBegrenzen({ stages: sparse(GRENZEN.etappenJeReise + 1, () => {
      gelesen = true
    }) })
    assert.equal(ergebnis.ok, false)
    assert.equal(gelesen, false)
  })

  test('ein Summenüberlauf der Tagespunkte wird abgelehnt, bevor Einträge gelesen werden', () => {
    let gelesen = false
    const ergebnis = rohEingabeBegrenzen({
      days: [
        { items: sparse(600, () => {
          gelesen = true
        }) },
        { items: sparse(600, () => {
          gelesen = true
        }) },
      ],
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.match(ergebnis.meldung, /1000 Planpunkte/)
    assert.equal(gelesen, false)
  })

  test('400 Planpunkte ohne Route bleiben unter der Summe zulässig', () => {
    const items = Array.from({ length: 400 }, () => ({ kind: 'note' }))
    assert.equal(rohEingabeBegrenzen({ days: [{ items }] }).ok, true)
  })

  test('eine zu große Route eines Nicht-Flugs wird abgelehnt, ohne Segmente zu lesen', () => {
    let segmentGelesen = false
    const segments = sparse(ROUTE_SEGMENTE_MAXIMUM + 1, () => {
      segmentGelesen = true
    })
    const zuVieleSegmente = rohEingabeBegrenzen({
      days: [{ items: [{ kind: 'note', route_itinerary: { legs: [{ segments }] } }] }],
    })
    assert.equal(zuVieleSegmente.ok, false)
    assert.equal(segmentGelesen, false)

    let legGelesen = false
    const legs = sparse(ROUTE_LEGS_MAXIMUM + 1, () => {
      legGelesen = true
    })
    const zuVieleLegs = rohEingabeBegrenzen({
      ungeplante: [{ kind: 'activity', route_itinerary: { legs } }],
    })
    assert.equal(zuVieleLegs.ok, false)
    assert.equal(legGelesen, false)
  })

  test('eine längenkonforme, semantisch ungültige Nicht-Flug-Route erreicht weiterhin Zod', () => {
    const eingabe = {
      ...NUTZLAST,
      days: [
        {
          ...NUTZLAST.days[0],
          items: [
            {
              kind: 'note',
              title: 'Notiz',
              note: null,
              position: 1,
              starts_at: null,
              route_itinerary: { v: 1, type: 'flight_route_itinerary', legs: [{ segments: [{}] }] },
            },
          ],
        },
      ],
    }
    assert.equal(rohEingabeBegrenzen(eingabe).ok, true)
    assert.equal(reiseNutzlastSchema.safeParse(eingabe).success, false)
  })

  test('kaputte Behälter, zusätzliche Ziele und Interessen werden vor dem Inhalt begrenzt', () => {
    assert.equal(rohEingabeBegrenzen({ days: { length: 400 } }).ok, false)
    assert.equal(rohEingabeBegrenzen({ ungeplante: 'nein' }).ok, false)
    assert.equal(rohEingabeBegrenzen(null).ok, false)

    let zielGelesen = false
    const weitere = rohEingabeBegrenzen({
      weitereDestinationPlaceIds: sparse(GRENZEN.etappenJeReise, () => {
        zielGelesen = true
      }),
    })
    assert.equal(weitere.ok, false)
    assert.equal(zielGelesen, false)

    let interesseGelesen = false
    const interessen = rohEingabeBegrenzen({
      interests: sparse(INTERESSEN_EINGABE_MAXIMUM + 1, () => {
        interesseGelesen = true
      }),
    })
    assert.equal(interessen.ok, false)
    assert.equal(interesseGelesen, false)

    let anspruchGelesen = false
    const ansprueche = rohEingabeBegrenzen({
      dayAllocation: {
        claims: sparse(GRENZEN.etappenJeReise + 1, () => {
          anspruchGelesen = true
        }),
      },
    })
    assert.equal(ansprueche.ok, false)
    assert.equal(anspruchGelesen, false)
  })
})
