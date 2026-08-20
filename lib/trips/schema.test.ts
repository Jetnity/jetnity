// lib/trips/schema.test.ts
//
// Drei Quellen liefern Reisedaten, und keine davon ist vertrauenswürdig: der
// `localStorage`, das Formular unter /planen und die Nutzlast der Übernahme ins
// Konto. Diese Prüfung ist die Stelle, an der eine unbrauchbare Angabe eine
// Meldung wird statt eines SQLSTATE mitten in einer Transaktion.
//
// Geprüft wird gegen die Bedingungen aus
// `supabase/migrations/20260817120000_reiseschema.sql`. Wo dort ein CHECK steht,
// steht hier ein Test – sonst wäre die doppelte Prüfung keine Absicherung,
// sondern nur eine zweite Meinung.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  GRENZEN,
  ersteMeldung,
  neuePlanpunktNutzlastSchema,
  neueReiseSchema,
  planpunktFormularSchema,
  reiseLesen,
  reiseNutzlastSchema,
  reiseSchema,
} from '@/lib/trips/schema'

const JETZT = '2026-08-17T22:00:00.000Z'

/** Eine gültige Reise. Jeder Test verändert genau eine Angabe daran. */
function reise(abweichung: Record<string, unknown> = {}) {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Japan im Herbst',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture', 'food'],
    travelWish: 'Wenig Hotelwechsel.',
    stages: [{ id: 'stage-1', position: 1, name: 'Tokio' }],
    days: [
      { id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', items: [] },
      { id: 'day-2', dayIndex: 2, dayDate: '2026-09-13', items: [] },
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...abweichung,
  }
}

describe('Eine vollständige Reise kommt durch', () => {
  test('die Vorlage ist gültig', () => {
    const gelesen = reiseLesen(reise())

    assert.notEqual(gelesen, null)
    assert.equal(gelesen?.title, 'Japan im Herbst')
    assert.equal(gelesen?.days.length, 2)
    assert.equal(gelesen?.stages[0].name, 'Tokio')
  })

  test('fehlende optionale Angaben werden zu null, nicht zu undefined', () => {
    // `undefined` verschwindet in `JSON.stringify` und käme in der Nutzlast als
    // fehlender Schlüssel an – nicht als „ausdrücklich leer".
    const gelesen = reiseLesen(reise({ origin: '', travelWish: '   ', budgetAmount: null }))

    assert.equal(gelesen?.origin, null)
    assert.equal(gelesen?.travelWish, null)
    assert.equal(gelesen?.budgetAmount, null)
  })

  test('eine Reise ohne Zeitraum ist gültig', () => {
    // „Irgendwann im Herbst nach Japan" ist der Zustand, in dem eine Reiseidee
    // entsteht. `trips.start_date` und `.end_date` dürfen deshalb fehlen.
    const gelesen = reiseLesen(
      reise({ startDate: null, endDate: null, days: [{ id: 'day-1', dayIndex: 1, items: [] }] }),
    )

    assert.notEqual(gelesen, null)
    assert.equal(gelesen?.startDate, null)
    assert.equal(gelesen?.days[0].dayDate, null)
  })
})

describe('Was die Datenbank ablehnen würde, wird hier abgelehnt', () => {
  test('ein Titel nur aus Leerzeichen – wie trips_title_laenge', () => {
    assert.equal(reiseLesen(reise({ title: '    ' })), null)
  })

  test('ein zu langer Titel', () => {
    assert.equal(reiseLesen(reise({ title: 'a'.repeat(GRENZEN.titel + 1) })), null)
  })

  test('Rückreise vor Abreise – wie trips_zeitraum', () => {
    const ergebnis = reiseSchema.safeParse(reise({ startDate: '2026-09-16', endDate: '2026-09-12' }))

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) {
      assert.match(ersteMeldung(ergebnis.error), /Rückreise liegt vor der Abreise/)
    }
  })

  test('mehr als 365 Tage Zeitraum – wie trips_zeitraum_laenge', () => {
    assert.equal(reiseLesen(reise({ startDate: '2026-01-01', endDate: '2027-06-01' })), null)
  })

  test('ein Datum, das es nicht gibt', () => {
    // `^\d{4}-\d{2}-\d{2}$` allein liesse den 31. Februar durch. PostgreSQL
    // nicht – dort wäre es ein `22008` mitten in der Übernahme.
    assert.equal(reiseLesen(reise({ startDate: '2026-02-31', endDate: '2026-03-02' })), null)
  })

  test('mehr als 20 Reisende – wie trips_travellers_bereich', () => {
    assert.equal(reiseLesen(reise({ travellers: 21 })), null)
    assert.equal(reiseLesen(reise({ travellers: 0 })), null)
  })

  test('Reisende als Bruchzahl', () => {
    assert.equal(reiseLesen(reise({ travellers: 2.5 })), null)
  })

  test('keine Währung nach ISO 4217 – wie trips_currency_format', () => {
    assert.equal(reiseLesen(reise({ currency: 'Franken' })), null)
    assert.equal(reiseLesen(reise({ currency: 'chf' })), null)
  })

  test('ein negatives Budget – wie trips_budget_bereich', () => {
    assert.equal(reiseLesen(reise({ budgetAmount: -1 })), null)
  })

  test('ein Budget jenseits von numeric(12, 2)', () => {
    // Ohne diese Grenze schlüge der Betrag erst in der Datenbank auf, als
    // `22003 numeric field overflow`.
    assert.equal(reiseLesen(reise({ budgetAmount: 10_000_000_000 })), null)
  })

  test('ein Tag darf nicht auf eine unbekannte Etappe zeigen', () => {
    assert.equal(
      reiseLesen(
        reise({
          days: [{ id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', stageId: 'gibt-es-nicht', items: [] }],
        }),
      ),
      null,
    )
  })

  test('ein unbekannter Status – wie trips_status_werte', () => {
    assert.equal(reiseLesen(reise({ status: 'unterwegs' })), null)
  })

  test('ein unbekanntes Interesse – wie trips_interests_werte', () => {
    assert.equal(reiseLesen(reise({ interests: ['culture', 'weltraum'] })), null)
  })

  test('zwei Tage mit derselben Nummer – wie trip_days_index_eindeutig', () => {
    const ergebnis = reiseSchema.safeParse(
      reise({
        days: [
          { id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', items: [] },
          { id: 'day-2', dayIndex: 1, dayDate: '2026-09-13', items: [] },
        ],
      }),
    )

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ersteMeldung(ergebnis.error), /dieselbe Nummer/)
  })

  test('zwei Tage mit demselben Datum – wie trip_days_datum_eindeutig', () => {
    const ergebnis = reiseSchema.safeParse(
      reise({
        days: [
          { id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', items: [] },
          { id: 'day-2', dayIndex: 2, dayDate: '2026-09-12', items: [] },
        ],
      }),
    )

    assert.equal(ergebnis.success, false)
    if (!ergebnis.success) assert.match(ersteMeldung(ergebnis.error), /dasselbe Datum/)
  })

  test('zwei Tage ohne Datum sind kein Widerspruch', () => {
    // NULL kollidiert in PostgreSQL nicht mit NULL, und der Teilindex
    // `where day_date is not null` bildet das ab.
    const gelesen = reiseLesen(
      reise({
        startDate: null,
        endDate: null,
        days: [
          { id: 'day-1', dayIndex: 1, items: [] },
          { id: 'day-2', dayIndex: 2, items: [] },
        ],
      }),
    )

    assert.notEqual(gelesen, null)
  })

  test('eine v3-Reise ohne ohneTag bleibt lesbar', () => {
    const gelesen = reiseLesen(reise())
    assert.deepEqual(gelesen?.ohneTag, [])
  })

  test('ungeplante Planpunkte gehören nicht zu einem Tag', () => {
    const gelesen = reiseLesen(
      reise({
        ohneTag: [
          {
            id: 'item-offen',
            dayId: null,
            title: 'Noch offen',
            kind: 'note',
            position: 1,
          },
        ],
      }),
    )

    assert.equal(gelesen?.ohneTag[0]?.title, 'Noch offen')
    assert.equal(gelesen?.days.every((tag) => tag.items.length === 0), true)
  })

  test('ein Buchungslink ohne HTTPS – wie trip_items_booking_url_format', () => {
    const mitLink = (url: string) =>
      reise({
        days: [
          {
            id: 'day-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            items: [{ id: 'item-1', title: 'Flug', kind: 'flight', bookingUrl: url }],
          },
        ],
      })

    assert.equal(reiseLesen(mitLink('https://example.com/angebot')) === null, false)
    assert.equal(reiseLesen(mitLink('http://example.com/angebot')), null)
    assert.equal(reiseLesen(mitLink('javascript:alert(1)')), null)
  })

  test('eine Uhrzeit, die es nicht gibt', () => {
    const gelesen = reiseLesen(
      reise({
        days: [
          {
            id: 'day-1',
            dayIndex: 1,
            dayDate: '2026-09-12',
            items: [{ id: 'item-1', title: 'Check-in', kind: 'stay', startsAt: '25:00' }],
          },
        ],
      }),
    )

    assert.equal(gelesen, null)
  })
})

describe('Alte Angaben aus dem Browser bleiben erhalten', () => {
  test('deutsche Tempowerte werden gelesen, nicht verworfen', () => {
    // Bis Phase 1.5 stand im `localStorage` `ruhig` statt `calm`. Ein Entwurf,
    // der dort liegt, soll seine Angabe behalten und nicht auf die Vorgabe
    // zurückfallen.
    assert.equal(reiseLesen(reise({ pace: 'ruhig' }))?.pace, 'calm')
    assert.equal(reiseLesen(reise({ pace: 'ausgewogen' }))?.pace, 'balanced')
    assert.equal(reiseLesen(reise({ pace: 'intensiv' }))?.pace, 'intense')
  })

  test('deutsche Interessen werden gelesen', () => {
    assert.deepEqual(reiseLesen(reise({ interests: ['Kultur', 'Strand'] }))?.interests, [
      'culture',
      'beach',
    ])
  })

  test('ein unbekanntes Tempo ist ein Fehler, keine stille Vorgabe', () => {
    assert.equal(reiseLesen(reise({ pace: 'gemütlich' })), null)
  })

  test('doppelte Interessen werden zur Menge – wie trips_interests_eindeutig', () => {
    // Aus einer Liste eine Menge zu machen ist keine Auslegung, sondern
    // dieselbe Aussage. Eine Ablehnung wäre hier unnötig streng.
    assert.deepEqual(reiseLesen(reise({ interests: ['culture', 'culture', 'Kultur'] }))?.interests, [
      'culture',
    ])
  })
})

describe('Die Nutzlast für public.reise_anlegen() trägt nur, was die Funktion liest', () => {
  const nutzlast = {
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

  test('eine gültige Nutzlast kommt durch', () => {
    assert.equal(reiseNutzlastSchema.safeParse(nutzlast).success, true)
  })

  test('ohne Kennung ist sie nicht idempotent und wird abgelehnt', () => {
    const { client_ref: _, ...ohne } = nutzlast
    assert.equal(reiseNutzlastSchema.safeParse(ohne).success, false)
  })

  test('ein mitgeschickter Status wird nicht übernommen', () => {
    // Die Funktion setzt `draft` selbst. Käme der Status aus der Nutzlast,
    // könnte ein Client eine Reise als `booked` behaupten.
    const ergebnis = reiseNutzlastSchema.safeParse({ ...nutzlast, status: 'booked' })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('status' in ergebnis.data, false)
  })

  test('eine mitgeschickte user_id wird nicht übernommen', () => {
    // Die Eigentümerkennung kommt aus `auth.uid()`. Sie hier durchzulassen
    // hiesse, sie irgendwann zu verwenden.
    const ergebnis = reiseNutzlastSchema.safeParse({
      ...nutzlast,
      user_id: '00000000-0000-0000-0000-000000000001',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('user_id' in ergebnis.data, false)
  })

  test('ein mitgeschickter Preis wird nicht übernommen', () => {
    // Die Funktion liest an einem Planpunkt nur `kind`, `title`, `note`,
    // `position` und `starts_at`. Ein Preis in der Nutzlast käme nicht an; ihn
    // zu akzeptieren wäre die Behauptung, er täte es.
    const ergebnis = reiseNutzlastSchema.safeParse({
      ...nutzlast,
      days: [
        {
          ...nutzlast.days[0],
          items: [{ ...nutzlast.days[0].items[0], price_amount: 120, price_currency: 'CHF' }],
        },
      ],
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal('price_amount' in ergebnis.data.days[0].items[0], false)
  })

  test('mehr Etappen als erlaubt', () => {
    const zuViele = Array.from({ length: GRENZEN.etappenJeReise + 1 }, (_, nr) => ({
      position: nr + 1,
      name: `Ort ${nr}`,
      country_code: null,
      arrival_date: null,
      departure_date: null,
    }))

    assert.equal(reiseNutzlastSchema.safeParse({ ...nutzlast, stages: zuViele }).success, false)
  })

  test('mehr Tage als erlaubt', () => {
    const zuViele = Array.from({ length: GRENZEN.reisetageJeReise + 1 }, (_, nr) => ({
      day_index: nr + 1,
      day_date: null,
      title: null,
      items: [],
    }))

    assert.equal(reiseNutzlastSchema.safeParse({ ...nutzlast, days: zuViele }).success, false)
  })
})

describe('Das Formular unter /planen', () => {
  const eingabe = {
    clientRef: 'trip-1',
    title: 'Japan',
    destination: 'Japan',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
  }

  test('eine gültige Eingabe kommt durch', () => {
    assert.equal(neueReiseSchema.safeParse(eingabe).success, true)
  })

  test('ohne Kennung wäre ein Doppelklick eine zweite Reise', () => {
    const { clientRef: _, ...ohne } = eingabe
    assert.equal(neueReiseSchema.safeParse(ohne).success, false)
  })

  test('ein Zeitraum ist Pflicht – anders als bei einer bestehenden Reise', () => {
    // Das Formular erzeugt die Tage aus dem Zeitraum. Ohne ihn entstünde eine
    // Reise ohne Tage, und der Arbeitsbereich hätte nichts zu zeigen.
    assert.equal(neueReiseSchema.safeParse({ ...eingabe, startDate: '' }).success, false)
  })

  test('Rand-Leerzeichen werden entfernt', () => {
    const ergebnis = neueReiseSchema.safeParse({ ...eingabe, title: '  Japan  ' })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.title, 'Japan')
  })
})

describe('Ein neuer Planpunkt', () => {
  test('das Formular braucht keine Kennungen', () => {
    const ergebnis = planpunktFormularSchema.safeParse({
      kind: 'activity',
      title: 'Tsukiji Outer Market',
      note: '',
      startsAt: '09:30',
    })

    assert.equal(ergebnis.success, true)
    if (ergebnis.success) assert.equal(ergebnis.data.note, null)
  })

  test('die Nutzlast für das Konto braucht echte UUIDs', () => {
    const felder = { kind: 'activity', title: 'Tsukiji', note: null, startsAt: null }

    assert.equal(
      neuePlanpunktNutzlastSchema.safeParse({
        ...felder,
        tripId: 'trip-1',
        dayId: 'day-1',
      }).success,
      false,
      'lokale Gastkennungen gehören nicht in eine Abfrage an PostgREST',
    )

    assert.equal(
      neuePlanpunktNutzlastSchema.safeParse({
        ...felder,
        tripId: '11111111-1111-4111-8111-111111111111',
        dayId: '22222222-2222-4222-8222-222222222222',
      }).success,
      true,
    )
  })

  test('eine zu lange Notiz – wie trip_items_note_laenge', () => {
    assert.equal(
      planpunktFormularSchema.safeParse({
        kind: 'note',
        title: 'Notiz',
        note: 'a'.repeat(GRENZEN.notiz + 1),
        startsAt: null,
      }).success,
      false,
    )
  })
})
