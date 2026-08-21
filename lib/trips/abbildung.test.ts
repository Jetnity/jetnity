// lib/trips/abbildung.test.ts
//
// Die Umschrift zwischen Datenbankzeile und Reisemodell ist absichtlich
// langweilig – und genau deshalb prüfbar, ohne eine Datenbank zu starten.
//
// Was hier schiefgehen kann, geht still schief: Ein `numeric`, das als
// Zeichenkette ankommt und als solche weitergegeben wird, ist in einer Summe
// eine Verkettung. Eine `time`, die `15:00:00` bleibt, füllt ein
// `<input type="time">` nicht. Ein Planpunkt, dessen Tag entfernt wurde, wäre
// ohne eigenen Platz unsichtbar, aber vorhanden.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  alsNutzlast,
  etappeAus,
  planpunktAus,
  reiseAus,
  type EtappeZeile,
  type PunktZeile,
  type ReiseZeile,
  type TagZeile,
} from '@/lib/trips/abbildung'

const JETZT = '2026-08-17T22:00:00.000Z'

function reisezeile(abweichung: Partial<ReiseZeile> = {}): ReiseZeile {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    client_ref: 'trip-1',
    title: 'Japan im Herbst',
    origin: 'Zürich',
    start_date: '2026-09-12',
    end_date: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budget_amount: '4200.00',
    status: 'draft',
    pace: 'balanced',
    interests: ['culture', 'food'],
    travel_wish: null,
    revision: 1,
    last_mutation_id: null,
    created_at: JETZT,
    updated_at: JETZT,
    ...abweichung,
  }
}

function punktzeile(abweichung: Partial<PunktZeile> = {}): PunktZeile {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    day_id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    stage_id: null,
    kind: 'activity',
    title: 'Tsukiji Outer Market',
    note: null,
    position: 1,
    starts_on: null,
    starts_at: null,
    ends_on: null,
    ends_at: null,
    price_amount: null,
    price_currency: null,
    provider: null,
    external_ref: null,
    booking_url: null,
    created_at: JETZT,
    ...abweichung,
  }
}

function tagzeile(nr: number, id: string, stageId: string | null = null): TagZeile {
  return { id, stage_id: stageId, day_index: nr, day_date: `2026-09-${11 + nr}`, title: null }
}

describe('Beträge kommen als Zahl an', () => {
  test('ein numeric als Zeichenkette wird eine Zahl', () => {
    // PostgREST liefert `numeric` als Zeichenkette, wenn der Wert die
    // Genauigkeit von `double` überschreiten könnte. In einer Summe wäre das
    // eine Verkettung.
    const reise = reiseAus(reisezeile({ budget_amount: '4200.00' }), [], [], [])

    assert.equal(reise.budgetAmount, 4200)
    assert.equal(typeof reise.budgetAmount, 'number')
  })

  test('ein fehlender Betrag bleibt null', () => {
    assert.equal(reiseAus(reisezeile({ budget_amount: null }), [], [], []).budgetAmount, null)
  })

  test('eine alte Reise ohne origin_place_id bleibt lesbar', () => {
    assert.equal(reiseAus(reisezeile(), [], [], []).originPlaceId, null)
  })

  test('origin_place_id wird zur kanonischen Abreise', () => {
    assert.equal(
      reiseAus(reisezeile({ origin_place_id: 'geonames:2657896' }), [], [], []).originPlaceId,
      'geonames:2657896',
    )
  })

  test('ein unlesbarer Betrag wird null und nicht NaN', () => {
    // `NaN` überlebt `JSON.stringify` nicht und würde in der Oberfläche als
    // `null` erscheinen – nur eine Ebene später und ohne Erklärung.
    assert.equal(reiseAus(reisezeile({ budget_amount: 'kein Betrag' }), [], [], []).budgetAmount, null)
  })

  test('Koordinaten einer Etappe werden Zahlen', () => {
    const etappe = etappeAus({
      id: 'ssssssss-ssss-4sss-8sss-sssssssssss1',
      position: 1,
      name: 'Tokio',
      country_code: 'JP',
      arrival_date: null,
      departure_date: null,
      latitude: '35.676190',
      longitude: '139.650311',
      created_at: JETZT,
    } as EtappeZeile)

    assert.equal(etappe.latitude, 35.67619)
    assert.equal(etappe.longitude, 139.650311)
    assert.equal(etappe.placeId, null)
  })

  test('eine Place-ID an der Etappe bleibt erhalten', () => {
    const etappe = etappeAus({
      id: 'ssssssss-ssss-4sss-8sss-sssssssssss1',
      position: 1,
      name: 'Bali',
      country_code: 'ID',
      arrival_date: null,
      departure_date: null,
      latitude: -8.33333,
      longitude: 115.16667,
      place_id: 'geonames:1650535',
      created_at: JETZT,
    })

    assert.equal(etappe.placeId, 'geonames:1650535')
  })
})

describe('Uhrzeiten kommen ohne Sekunden an', () => {
  test('HH:MM:SS wird HH:MM', () => {
    // `<input type="time">` liest und schreibt `HH:MM`. Mit Sekunden bliebe das
    // Feld leer, obwohl ein Wert gespeichert ist.
    const punkt = planpunktAus(punktzeile({ starts_at: '15:00:00', ends_at: '18:30:00' }))

    assert.equal(punkt.startsAt, '15:00')
    assert.equal(punkt.endsAt, '18:30')
  })

  test('eine fehlende Uhrzeit bleibt null', () => {
    assert.equal(planpunktAus(punktzeile({ starts_at: null })).startsAt, null)
  })
})

describe('Ein unbekannter Wert macht eine Reise nicht unlesbar', () => {
  test('eine künftige Art fällt auf note zurück', () => {
    // Ergänzt eine spätere Migration einen Wert, den diese Fassung nicht kennt,
    // soll die Reise lesbar bleiben. Eine Behauptung `as TripItemKind` wäre
    // bequemer und in genau diesem Fall falsch.
    assert.equal(planpunktAus(punktzeile({ kind: 'restaurant' })).kind, 'note')
  })

  test('ein historischer Planpunkt ohne Buchungsstatus ist unbestätigt', () => {
    const punkt = planpunktAus(punktzeile())
    assert.equal(punkt.bookingStatus, 'unconfirmed')
    assert.equal(punkt.bookingSource, null)
    assert.equal(punkt.bookingConfirmedAt, null)
  })

  test('eine behauptete Provider-Quelle wird nicht als bestätigt gelesen', () => {
    const punkt = planpunktAus(
      punktzeile({
        kind: 'flight',
        booking_status: 'booked',
        booking_source: 'provider',
        booking_confirmed_at: '2026-08-21T10:00:00.000Z',
      }),
    )
    assert.equal(punkt.bookingStatus, 'booked')
    assert.equal(punkt.bookingSource, 'user')
    assert.equal(punkt.bookingConfirmedAt, '2026-08-21T10:00:00.000Z')
  })

  test('ein unbekanntes Tempo fällt auf balanced zurück', () => {
    assert.equal(reiseAus(reisezeile({ pace: 'schnell' }), [], [], []).pace, 'balanced')
  })

  test('ein unbekanntes Interesse fällt heraus, der Rest bleibt', () => {
    const reise = reiseAus(reisezeile({ interests: ['culture', 'weltraum', 'food'] }), [], [], [])

    assert.deepEqual(reise.interests, ['culture', 'food'])
  })
})

describe('Der Reisegraph wird aus vier Tabellen zusammengesetzt', () => {
  const tag1 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1'
  const tag2 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'

  test('Planpunkte landen an ihrem Tag, in Reihenfolge', () => {
    const reise = reiseAus(
      reisezeile(),
      [],
      [tagzeile(2, tag2), tagzeile(1, tag1)],
      [
        punktzeile({ id: 'p3', day_id: tag2, position: 1, title: 'Tempel' }),
        punktzeile({ id: 'p2', day_id: tag1, position: 2, title: 'Abendessen' }),
        punktzeile({ id: 'p1', day_id: tag1, position: 1, title: 'Markt' }),
      ],
    )

    assert.deepEqual(
      reise.days.map((tag) => tag.dayIndex),
      [1, 2],
      'Tage stehen nach day_index, nicht nach der Reihenfolge der Antwort',
    )
    assert.deepEqual(
      reise.days[0].items.map((punkt) => punkt.title),
      ['Markt', 'Abendessen'],
    )
    assert.deepEqual(
      reise.days[1].items.map((punkt) => punkt.title),
      ['Tempel'],
    )
  })

  test('gleiche position wird über created_at und id entschieden', () => {
    // `trip_stages.position` und `trip_items.position` sind bewusst nicht
    // eindeutig – Umsortieren bleibt dadurch einschrittig. Die Leseordnung muss
    // trotzdem stabil sein, sonst springt die Liste bei jedem Laden.
    const reise = reiseAus(
      reisezeile(),
      [],
      [tagzeile(1, tag1)],
      [
        punktzeile({ id: 'b', day_id: tag1, position: 1, created_at: JETZT, title: 'Zweiter' }),
        punktzeile({ id: 'a', day_id: tag1, position: 1, created_at: JETZT, title: 'Erster' }),
      ],
    )

    assert.deepEqual(
      reise.days[0].items.map((punkt) => punkt.title),
      ['Erster', 'Zweiter'],
    )
  })

  test('ein Planpunkt ohne Tag verschwindet nicht', () => {
    // Entsteht, wenn ein Tag entfernt wird (`on delete set null`). Er gehört
    // weiter zur Reise, hat aber keinen Platz im Tagesplan.
    const reise = reiseAus(
      reisezeile(),
      [],
      [tagzeile(1, tag1)],
      [
        punktzeile({ id: 'a', day_id: tag1, title: 'Markt' }),
        punktzeile({ id: 'b', day_id: null, title: 'Noch offen' }),
      ],
    )

    assert.deepEqual(
      reise.days[0].items.map((punkt) => punkt.title),
      ['Markt'],
    )
    assert.deepEqual(
      reise.ohneTag.map((punkt) => punkt.title),
      ['Noch offen'],
    )
  })

  test('Etappen stehen nach position', () => {
    const etappe = (position: number, name: string, id: string): EtappeZeile => ({
      id,
      position,
      name,
      country_code: 'JP',
      arrival_date: null,
      departure_date: null,
      latitude: null,
      longitude: null,
      created_at: JETZT,
    })

    const reise = reiseAus(
      reisezeile(),
      [etappe(2, 'Kyoto', 's2'), etappe(1, 'Tokio', 's1')],
      [],
      [],
    )

    assert.deepEqual(
      reise.stages.map((eintrag) => eintrag.name),
      ['Tokio', 'Kyoto'],
    )
  })
})

describe('Aus einer Reise wird die Nutzlast für public.reise_anlegen()', () => {
  const gastreise = reiseAus(
    reisezeile({ client_ref: 'trip-abc' }),
    [
      {
        id: 's1',
        position: 1,
        name: 'Tokio',
        country_code: 'JP',
        arrival_date: '2026-09-12',
        departure_date: '2026-09-16',
        latitude: null,
        longitude: null,
        created_at: JETZT,
      },
    ],
    [tagzeile(1, 'd1')],
    [punktzeile({ day_id: 'd1', starts_at: '09:30:00', title: 'Markt' })],
  )

  test('die Kennung geht mit – sie trägt die Idempotenz', () => {
    assert.equal(alsNutzlast(gastreise).client_ref, 'trip-abc')
  })

  test('ohne eigene Kennung dient die Reisekennung als Ersatz', () => {
    const ohne = { ...gastreise, clientRef: null }

    assert.equal(alsNutzlast(ohne).client_ref, gastreise.id)
  })

  test('Status und Eigentümerkennung gehen nicht mit', () => {
    // Beides setzt die Datenbank: `draft` und `auth.uid()`. Sie mitzuschicken
    // wäre die Einladung, sie irgendwann zu lesen.
    const nutzlast = alsNutzlast(gastreise) as Record<string, unknown>

    assert.equal('status' in nutzlast, false)
    assert.equal('user_id' in nutzlast, false)
  })

  test('lokale Kennungen der Tage und Punkte gehen nicht mit', () => {
    // In der Datenbank hätten sie keine Bedeutung; die Zuordnung eines Punkts
    // zu seinem Tag läuft über `day_index`.
    const nutzlast = alsNutzlast(gastreise)

    assert.equal('id' in nutzlast.days[0], false)
    assert.equal('id' in nutzlast.days[0].items[0], false)
    assert.equal(nutzlast.days[0].day_index, 1)
  })

  test('Etappen, Tage und Punkte kommen vollständig mit', () => {
    const nutzlast = alsNutzlast(gastreise)

    assert.equal(nutzlast.stages.length, 1)
    assert.equal(nutzlast.stages[0].name, 'Tokio')
    assert.equal(nutzlast.stages[0].country_code, 'JP')
    assert.equal(nutzlast.days.length, 1)
    assert.equal(nutzlast.days[0].items.length, 1)
    assert.equal(nutzlast.days[0].items[0].title, 'Markt')
    assert.equal(nutzlast.days[0].items[0].starts_at, '09:30')
    assert.equal(nutzlast.days[0].items[0].booking_status, 'unconfirmed')
    assert.equal('booking_source' in nutzlast.days[0].items[0], false)
  })

  test('ungeplante Planpunkte gehen als eigene Liste mit', () => {
    const mitOffen = {
      ...gastreise,
      ohneTag: [
        {
          ...gastreise.days[0]!.items[0]!,
          id: 'offen',
          dayId: null,
          title: 'Noch offen',
        },
      ],
    }
    const nutzlast = alsNutzlast(mitOffen)

    assert.equal(nutzlast.ungeplante.length, 1)
    assert.equal(nutzlast.ungeplante[0]?.title, 'Noch offen')
    assert.equal(nutzlast.days[0]?.items.some((punkt) => punkt.title === 'Noch offen'), false)
  })

  test('fehlende Reihenfolgen werden aus der Liste ergänzt', () => {
    // Ein Entwurf aus der Fassung vor Phase 1.5 kennt `position` nicht. Ohne
    // Ersatz wäre `position: 0` in der Datenbank ein
    // `trip_items_position_bereich`-Verstoss.
    const ohnePositionen = {
      ...gastreise,
      stages: gastreise.stages.map((etappe) => ({ ...etappe, position: 0 })),
      days: gastreise.days.map((tag) => ({
        ...tag,
        dayIndex: 0,
        items: tag.items.map((punkt) => ({ ...punkt, position: 0 })),
      })),
    }

    const nutzlast = alsNutzlast(ohnePositionen)

    assert.equal(nutzlast.stages[0].position, 1)
    assert.equal(nutzlast.days[0].day_index, 1)
    assert.equal(nutzlast.days[0].items[0].position, 1)
  })
})
