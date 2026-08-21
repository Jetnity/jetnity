// lib/reisevorschlag/abbildung.test.ts
//
// Hier wird aus einem Vorschlag eine Reise. Ein Fehler an dieser Stelle ist
// besonders unangenehm, weil er erst nach der Freigabe des Nutzers auffällt: Der
// Vorschlag war gültig, die Vorschau sah richtig aus, und die Übernahme scheitert
// – oder, schlimmer, sie gelingt mit einer Reise, die etwas anderes sagt als die
// Vorschau.
//
// Deshalb prüft dieser Test nicht nur einzelne Felder, sondern lässt das Ergebnis
// durch dieselben Prüfungen laufen, die es danach passieren muss:
// `reiseNutzlastSchema` für den Kontoweg und `reiseLesen()` für den Gastweg. Was
// hier durchkommt, kommt auch dort durch.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  reiseende,
  vorschlagAlsNutzlast,
  vorschlagAlsReise,
} from '@/lib/reisevorschlag/abbildung'
import {
  VORSCHLAG_FASSUNG,
  type Modellvorschlag,
  type Reisevorschlag,
} from '@/lib/reisevorschlag/schema'
import {
  VORSCHLAG_MIT_DATUM,
  VORSCHLAG_THAILAND,
  vorschlagMitTagen,
} from '@/lib/reisevorschlag/fixtures/antworten'
import { reiseLesen, reiseNutzlastSchema } from '@/lib/trips/schema'

const JETZT = '2026-08-18T08:00:00.000Z'

/** Kennungen, die sich nachlesen lassen – im Browser käme `crypto.randomUUID()`. */
function kennungen() {
  let zaehler = 0
  return (prefix: string) => `${prefix}-${++zaehler}`
}

function alsVorschlag(roh: Modellvorschlag, reisewunsch: string | null = null): Reisevorschlag {
  return { ...roh, fassung: VORSCHLAG_FASSUNG, reisewunsch }
}

describe('Das Reiseende rechnet Jetnity, nicht das Modell', () => {
  test('Start plus Dauer minus eins – beide Tage eingeschlossen', () => {
    // Drei Tage ab dem 1. Juni enden am 3., nicht am 4. Ein Tag zu viel wäre eine
    // Reise mit einem Tag ohne Inhalt.
    assert.equal(reiseende(alsVorschlag(VORSCHLAG_MIT_DATUM)), '2027-06-03')
  })

  test('ohne Start gibt es kein Ende', () => {
    assert.equal(reiseende(alsVorschlag(VORSCHLAG_THAILAND)), null)
  })

  test('über einen Monatswechsel', () => {
    const lang = { ...vorschlagMitTagen(5), startdatum: '2027-06-28' }

    assert.equal(reiseende(alsVorschlag(lang)), '2027-07-02')
  })

  test('über einen Schalttag', () => {
    const lang = { ...vorschlagMitTagen(3), startdatum: '2028-02-28' }

    assert.equal(reiseende(alsVorschlag(lang)), '2028-03-01')
  })
})

describe('Der Vorschlag als Nutzlast für public.reise_anlegen()', () => {
  const nutzlast = vorschlagAlsNutzlast(alsVorschlag(VORSCHLAG_MIT_DATUM, 'Drei Tage Rom.'), 'trip-1')

  test('sie kommt durch die Prüfung der Nutzlast', () => {
    // Die eigentliche Aussage dieses Tests: Was hier entsteht, wird von
    // `reiseNutzlastSchema` angenommen – und damit von der Funktion in der
    // Datenbank.
    const ergebnis = reiseNutzlastSchema.safeParse(nutzlast)

    assert.equal(ergebnis.success, true, JSON.stringify(ergebnis.error?.issues))
  })

  test('die Kennung trägt die Idempotenz', () => {
    assert.equal(nutzlast.client_ref, 'trip-1')
  })

  test('die erkannten Angaben stehen an den Feldern des Reiseschemas', () => {
    assert.equal(nutzlast.title, 'Drei Tage Rom')
    assert.equal(nutzlast.origin, 'Zürich')
    assert.equal(nutzlast.travellers, 3)
    assert.equal(nutzlast.currency, 'EUR')
    assert.equal(nutzlast.pace, 'balanced')
    assert.deepEqual(nutzlast.interests, ['culture', 'food'])
    assert.equal(nutzlast.start_date, '2027-06-01')
    assert.equal(nutzlast.end_date, '2027-06-03')
  })

  test('der Reisewunsch ist der Text des Nutzers', () => {
    // Nicht das, was das Modell daraus gemacht hat. `trips.travel_wish` existiert
    // genau für diese Angabe.
    assert.equal(nutzlast.travel_wish, 'Drei Tage Rom.')
  })

  test('jeder Tag bekommt sein Datum aus dem Start', () => {
    assert.deepEqual(
      nutzlast.days.map((tag) => [tag.day_index, tag.day_date]),
      [
        [1, '2027-06-01'],
        [2, '2027-06-02'],
        [3, '2027-06-03'],
      ],
    )
  })

  test('Planpunkte behalten Reihenfolge und Uhrzeit', () => {
    assert.deepEqual(nutzlast.days[1].items, [
      {
        kind: 'activity',
        title: 'Forum Romanum und Kolosseum',
        note: null,
        position: 1,
        starts_on: null,
        starts_at: '09:00',
        ends_on: null,
        ends_at: null,
        price_amount: null,
        price_currency: null,
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
      },
    ])
  })

  test('die Etappen tragen An- und Abreisedatum aus den Tagesnummern', () => {
    assert.deepEqual(nutzlast.stages, [
      {
        position: 1,
        name: 'Rom',
        country_code: 'IT',
        arrival_date: '2027-06-01',
        departure_date: '2027-06-03',
        latitude: null,
        longitude: null,
        place_id: null,
      },
    ])
  })

  test('kein Preis, kein Anbieter, kein Buchungslink', () => {
    // Der Modellweg setzt Handelsfelder ausdrücklich auf null (ADR-0054).
    // `reise_anlegen()` kann sie seit Phase 3.1 schreiben – aber nicht aus einem Vorschlag.
    const punkt = nutzlast.days[1]?.items[0]
    assert.equal(punkt?.price_amount, null)
    assert.equal(punkt?.provider, null)
    assert.equal(punkt?.external_ref, null)
    assert.equal(punkt?.booking_url, null)
    assert.equal(punkt?.booking_status, 'unconfirmed')
    assert.equal(punkt?.booking_confirmed_at, null)
    assert.equal('booking_source' in (punkt ?? {}), false)
  })

  test('das Budgetziel steht an der Reise, nicht an einem Planpunkt', () => {
    const mitBudget = vorschlagAlsNutzlast(alsVorschlag(VORSCHLAG_THAILAND), 'trip-2')

    assert.equal(mitBudget.budget_amount, 3000)
    assert.equal(mitBudget.currency, 'CHF')
  })

  test('kein Status in der Nutzlast', () => {
    // Die Funktion setzt `draft` selbst, und `reise_erzeugung_pruefen` lässt
    // nichts anderes zu.
    assert.equal('status' in nutzlast, false)
    assert.equal('user_id' in nutzlast, false)
  })
})

describe('Eine Reise ohne Zeitraum bleibt eine Reise', () => {
  const nutzlast = vorschlagAlsNutzlast(alsVorschlag(VORSCHLAG_THAILAND), 'trip-1')

  test('die Nutzlast ist gültig', () => {
    assert.equal(reiseNutzlastSchema.safeParse(nutzlast).success, true)
  })

  test('kein Start, kein Ende, kein Datum je Tag', () => {
    // Das Reiseschema ist absichtlich dafür gebaut: Eine Reiseidee hat eine
    // Dauer, bevor sie ein Datum hat.
    assert.equal(nutzlast.start_date, null)
    assert.equal(nutzlast.end_date, null)
    assert.deepEqual(new Set(nutzlast.days.map((tag) => tag.day_date)), new Set([null]))
  })

  test('die Tage sind trotzdem durchnummeriert', () => {
    assert.deepEqual(
      nutzlast.days.map((tag) => tag.day_index),
      [1, 2, 3, 4, 5, 6, 7],
    )
  })

  test('die Etappen haben keine Daten, aber ihre Reihenfolge', () => {
    assert.deepEqual(
      nutzlast.stages.map((etappe) => [etappe.position, etappe.name, etappe.arrival_date]),
      [
        [1, 'Bangkok', null],
        [2, 'Krabi', null],
      ],
    )
  })
})

describe('Der Vorschlag als Gastreise', () => {
  const reise = vorschlagAlsReise(
    alsVorschlag(VORSCHLAG_THAILAND, '7 Tage Thailand ab Zürich.'),
    'trip-gast',
    kennungen(),
    JETZT,
  )

  test('sie kommt durch reiseLesen() – dieselbe Prüfung wie jeder Weg in den Gastspeicher', () => {
    assert.notEqual(reiseLesen(reise), null)
  })

  test('die Kennung des Vorschlags wird die Kennung der Reise', () => {
    // Sie trägt die Idempotenz weiter: Bei einer späteren Übernahme ins Konto
    // prüft dieselbe Kennung `unique (user_id, client_ref)`.
    assert.equal(reise.id, 'trip-gast')
    assert.equal(reise.clientRef, 'trip-gast')
  })

  test('jeder Tag und jeder Punkt hat eine eigene Kennung', () => {
    const kennungenAlle = [
      ...reise.days.map((tag) => tag.id),
      ...reise.days.flatMap((tag) => tag.items.map((punkt) => punkt.id)),
      ...reise.stages.map((etappe) => etappe.id),
    ]

    assert.equal(new Set(kennungenAlle).size, kennungenAlle.length)
  })

  test('jeder Punkt zeigt auf seinen Tag', () => {
    for (const tag of reise.days) {
      for (const punkt of tag.items) assert.equal(punkt.dayId, tag.id)
    }
  })

  test('der Status ist ein Entwurf', () => {
    assert.equal(reise.status, 'draft')
  })

  test('kein Preis, kein Anbieter, kein Buchungslink', () => {
    for (const tag of reise.days) {
      for (const punkt of tag.items) {
        assert.equal(punkt.priceAmount, null)
        assert.equal(punkt.priceCurrency, null)
        assert.equal(punkt.provider, null)
        assert.equal(punkt.externalRef, null)
        assert.equal(punkt.bookingUrl, null)
      }
    }
  })

  test('Koordinaten kommen nicht aus einem Sprachmodell', () => {
    for (const etappe of reise.stages) {
      assert.equal(etappe.latitude, null)
      assert.equal(etappe.longitude, null)
    }
  })

  test('mit Zeitraum trägt jeder Punkt das Datum seines Tages', () => {
    const mitDatum = vorschlagAlsReise(
      alsVorschlag(VORSCHLAG_MIT_DATUM),
      'trip-rom',
      kennungen(),
      JETZT,
    )

    assert.notEqual(reiseLesen(mitDatum), null)
    assert.equal(mitDatum.days[0].dayDate, '2027-06-01')
    assert.equal(mitDatum.days[0].items[0].startsOn, '2027-06-01')
  })
})

describe('Beide Wege beschreiben dieselbe Reise', () => {
  // Der Fehler, den das verhindert: Eine Gastreise, die nach einer Anmeldung
  // andere Tage hat als vorher. Beide Abbildungen rechnen deshalb mit demselben
  // Tagesgerüst.

  const vorschlag = alsVorschlag(VORSCHLAG_MIT_DATUM, 'Drei Tage Rom.')
  const nutzlast = vorschlagAlsNutzlast(vorschlag, 'trip-1')
  const reise = vorschlagAlsReise(vorschlag, 'trip-1', kennungen(), JETZT)

  test('gleiche Stammdaten', () => {
    assert.equal(reise.title, nutzlast.title)
    assert.equal(reise.origin, nutzlast.origin)
    assert.equal(reise.startDate, nutzlast.start_date)
    assert.equal(reise.endDate, nutzlast.end_date)
    assert.equal(reise.travellers, nutzlast.travellers)
    assert.equal(reise.currency, nutzlast.currency)
    assert.equal(reise.budgetAmount, nutzlast.budget_amount)
    assert.equal(reise.pace, nutzlast.pace)
    assert.deepEqual(reise.interests, nutzlast.interests)
    assert.equal(reise.travelWish, nutzlast.travel_wish)
  })

  test('gleiches Tagesgerüst', () => {
    assert.deepEqual(
      reise.days.map((tag) => [tag.dayIndex, tag.dayDate]),
      nutzlast.days.map((tag) => [tag.day_index, tag.day_date]),
    )
  })

  test('gleiche Planpunkte in gleicher Reihenfolge', () => {
    assert.deepEqual(
      reise.days.flatMap((tag) => tag.items.map((punkt) => [punkt.kind, punkt.title, punkt.position])),
      nutzlast.days.flatMap((tag) => tag.items.map((punkt) => [punkt.kind, punkt.title, punkt.position])),
    )
  })

  test('gleiche Etappen', () => {
    assert.deepEqual(
      reise.stages.map((etappe) => [etappe.position, etappe.name, etappe.countryCode]),
      nutzlast.stages.map((etappe) => [etappe.position, etappe.name, etappe.country_code]),
    )
  })
})

describe('Die Grenzen halten auch am Rand', () => {
  test('ein Vorschlag mit der höchsten erlaubten Tageszahl bleibt gültig', () => {
    const voll = alsVorschlag({ ...vorschlagMitTagen(30), startdatum: '2027-06-01' })
    const nutzlast = vorschlagAlsNutzlast(voll, 'trip-1')

    assert.equal(reiseNutzlastSchema.safeParse(nutzlast).success, true)
    assert.equal(nutzlast.days.length, 30)
    assert.equal(nutzlast.end_date, '2027-06-30')
    assert.notEqual(reiseLesen(vorschlagAlsReise(voll, 'trip-1', kennungen(), JETZT)), null)
  })

  test('kein Tagesdatum kommt zweimal vor – wie trip_days_datum_eindeutig', () => {
    const voll = alsVorschlag({ ...vorschlagMitTagen(30), startdatum: '2027-02-20' })
    const daten = vorschlagAlsNutzlast(voll, 'trip-1').days.map((tag) => tag.day_date)

    assert.equal(new Set(daten).size, daten.length)
  })
})

describe('Kanonische Orte am Vorschlag', () => {
  const bangkok = {
    id: 'geonames:1609350',
    source: 'geonames' as const,
    sourceId: '1609350',
    name: 'Bangkok',
    typ: 'city' as const,
    country: 'Thailand',
    countryCode: 'TH',
    region: null,
    lat: 13.75,
    lon: 100.52,
    iata: null,
    keywords: null,
  }

  test('ohne Auflösung bleibt keine Place-ID stehen', () => {
    const nutzlast = vorschlagAlsNutzlast(alsVorschlag(VORSCHLAG_THAILAND), 'trip-1')
    assert.equal(nutzlast.origin_place_id, null)
    assert.deepEqual(nutzlast.stages.map((etappe) => etappe.place_id), [null, null])
  })

  test('ein eindeutiger Treffer wird zur Place-ID, der Name bleibt der Modelltext', () => {
    const nutzlast = vorschlagAlsNutzlast(alsVorschlag(VORSCHLAG_THAILAND), 'trip-1', {
      origin: null,
      stages: [bangkok, null],
    })
    assert.equal(nutzlast.stages[0]?.name, 'Bangkok')
    assert.equal(nutzlast.stages[0]?.place_id, 'geonames:1609350')
    assert.equal(nutzlast.stages[0]?.latitude, 13.75)
    assert.equal(nutzlast.stages[1]?.place_id, null)
    assert.equal(nutzlast.origin_place_id, null)
  })
})
