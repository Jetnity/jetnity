import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  BUCHUNGEN_COPY,
  BUCHUNGEN_LISTE_GRENZE,
  buchungAusZeile,
  buchungReisePfad,
  buchungZeittext,
  buchungenAbgeschnitten,
  buchungenAusZeilen,
  buchungenGruppenAus,
  type RoheBuchungszeile,
} from '@/lib/account/buchungen'

function zeile(teil: Partial<RoheBuchungszeile> = {}): RoheBuchungszeile {
  return {
    id: 'item-1',
    kind: 'flight',
    title: 'Zürich – Lissabon',
    starts_on: '2026-09-12',
    starts_at: '08:40:00',
    ends_on: '2026-09-12',
    ends_at: null,
    booking_status: 'booked',
    trips: { id: 'trip-1', title: 'Lissabon', status: 'planned' },
    ...teil,
  }
}

describe('AP-10-S1 Buchungsabbildung', () => {
  test('nimmt nur ausdrücklich booked und buchbare Arten auf', () => {
    const gebucht = buchungAusZeile(zeile())
    assert.notEqual(gebucht, 'auslassen')
    assert.notEqual(gebucht, 'unvollstaendig')
    if (typeof gebucht === 'string') return
    assert.equal(gebucht.kind, 'flight')
    assert.equal(gebucht.artBezeichnung, 'Flug')
    assert.equal(gebucht.tripArchived, false)

    assert.equal(buchungAusZeile(zeile({ booking_status: 'unconfirmed' })), 'auslassen')
    assert.equal(buchungAusZeile(zeile({ booking_status: 'selected' })), 'auslassen')
    assert.equal(buchungAusZeile(zeile({ kind: 'activity', title: 'Walking Tour' })), 'auslassen')
    assert.equal(buchungAusZeile(zeile({ kind: 'note', title: 'Packliste' })), 'auslassen')
  })

  test('lässt Stay, Transfer und Mietwagen zu, wenn booked', () => {
    assert.notEqual(buchungAusZeile(zeile({ kind: 'stay', title: 'Baixa' })), 'auslassen')
    assert.notEqual(buchungAusZeile(zeile({ kind: 'transfer', title: 'Bahnhof' })), 'auslassen')
    assert.notEqual(buchungAusZeile(zeile({ kind: 'rental_car', title: 'Sixt' })), 'auslassen')
  })

  test('behält archivierte Reisen und kennzeichnet sie', () => {
    const abbildung = buchungenAusZeilen([
      zeile({
        id: 'alt',
        title: 'Algarve Hotel',
        kind: 'stay',
        starts_on: '2025-04-02',
        starts_at: null,
        trips: { id: 'trip-archiv', title: 'Algarve 2025', status: 'archived' },
      }),
      zeile({ id: 'neu', title: 'Zürich – Lissabon' }),
    ])
    assert.equal(abbildung.ok, true)
    if (!abbildung.ok) return
    assert.equal(abbildung.buchungen.length, 2)
    assert.equal(abbildung.buchungen[0]?.tripArchived, false)
    assert.equal(abbildung.buchungen[1]?.tripArchived, true)
    assert.equal(abbildung.buchungen[1]?.tripTitle, 'Algarve 2025')

    const gruppen = buchungenGruppenAus(abbildung.buchungen)
    assert.equal(gruppen.aktuell.length, 1)
    assert.equal(gruppen.archiviert.length, 1)
    assert.equal(gruppen.archiviert[0]?.id, 'alt')
  })

  test('erfindet bei fehlendem Datum keinen Zeitraum', () => {
    const ohneDatum = buchungAusZeile(
      zeile({
        starts_on: null,
        starts_at: null,
        ends_on: null,
        ends_at: null,
      }),
    )
    assert.notEqual(ohneDatum, 'auslassen')
    assert.notEqual(ohneDatum, 'unvollstaendig')
    if (typeof ohneDatum === 'string') return
    assert.equal(buchungZeittext(ohneDatum), null)
    assert.equal(ohneDatum.startsOn, null)
    assert.equal(ohneDatum.startsAt, null)
  })

  test('zeigt gespeicherte Zeit nur, wenn sie vorhanden ist', () => {
    const mitZeit = buchungAusZeile(zeile())
    assert.notEqual(mitZeit, 'auslassen')
    if (typeof mitZeit === 'string') return
    assert.equal(mitZeit.startsAt, '08:40')
    assert.match(buchungZeittext(mitZeit) ?? '', /08:40/)
    assert.doesNotMatch(buchungZeittext(mitZeit) ?? '', /unbekannt|noch nicht|offen/i)
  })

  test('liefert den internen Reise-Pfad und keine zweite Identität', () => {
    assert.equal(buchungReisePfad('trip-1'), '/reisen/trip-1')
    const gebucht = buchungAusZeile(zeile())
    assert.notEqual(gebucht, 'auslassen')
    if (typeof gebucht === 'string') return
    assert.equal(buchungReisePfad(gebucht.tripId), '/reisen/trip-1')
    assert.equal('priceAmount' in gebucht, false)
    assert.equal('provider' in gebucht, false)
    assert.equal('bookingUrl' in gebucht, false)
  })

  test('unterscheidet leere Abbildung von unvollständigen Zeilen', () => {
    const leer = buchungenAusZeilen([])
    assert.deepEqual(leer, { ok: true, buchungen: [] })

    const nurUnbestaetigt = buchungenAusZeilen([zeile({ booking_status: 'unconfirmed' })])
    assert.deepEqual(nurUnbestaetigt, { ok: true, buchungen: [] })

    const defekt = buchungenAusZeilen([zeile({ title: '' })])
    assert.deepEqual(defekt, { ok: false, grund: 'unvollstaendig' })

    const ohneReise = buchungenAusZeilen([zeile({ trips: null })])
    assert.deepEqual(ohneReise, { ok: false, grund: 'unvollstaendig' })
  })

  test('schneidet nicht still ab', () => {
    assert.equal(buchungenAbgeschnitten(12, 12), false)
    assert.equal(buchungenAbgeschnitten(200, 201), true)
    assert.equal(buchungenAbgeschnitten(BUCHUNGEN_LISTE_GRENZE, null), true)
    assert.equal(buchungenAbgeschnitten(3, null), false)
  })

  test('sortiert deterministisch: offene Reisen zuerst, dann Datum, dann Titel', () => {
    const abbildung = buchungenAusZeilen([
      zeile({
        id: 'b',
        title: 'Beta',
        starts_on: '2026-09-13',
        trips: { id: 't-2', title: 'Offen', status: 'draft' },
      }),
      zeile({
        id: 'a',
        title: 'Alpha',
        starts_on: '2026-09-13',
        trips: { id: 't-1', title: 'Offen', status: 'planned' },
      }),
      zeile({
        id: 'c',
        title: 'Alt',
        starts_on: '2024-01-01',
        trips: { id: 't-3', title: 'Alt', status: 'archived' },
      }),
    ])
    assert.equal(abbildung.ok, true)
    if (!abbildung.ok) return
    assert.deepEqual(
      abbildung.buchungen.map((buchung) => buchung.id),
      ['a', 'b', 'c'],
    )
  })

  test('hält die Nutzercopy ohne Preis- oder Providerbehauptung', () => {
    const texte = Object.values(BUCHUNGEN_COPY).join(' ')
    assert.match(texte, /ausdrücklich als gebucht/)
    assert.doesNotMatch(texte, /\b(?:CHF|EUR|USD|Affiliate|Conversion)\b|https:\/\//i)
    assert.doesNotMatch(texte, /hat der Anbieter bestätigt|wurde vom Anbieter bestätigt/i)
  })
})
