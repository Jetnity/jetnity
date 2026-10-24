import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import {
  BUCHUNGEN_COPY,
  buchungAusZeile,
  type RoheBuchungszeile,
} from '@/lib/account/buchungen'
import {
  BUCHUNGEN_LIMIT,
  BUCHUNGEN_SEITE,
  aktiveBuchungsStati,
  buchbareBuchungsarten,
  buchungenAbfrageBauen,
  buchungenAdresse,
  buchungenAnfrageAus,
  buchungenAnsichtAus,
  buchungenCursorLesen,
  buchungenCursorSchreiben,
  buchungenSeiteAusZeilen,
  buchungenSeitenLauf,
  buchungenTitelMuster,
  buchungenZeitGueltig,
  type BuchungenFilter,
} from '@/lib/account/buchungen-abfrage'

const FILTER: BuchungenFilter = { titel: null, art: null, archiv: 'alle' }

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

function zeit(n: number): string {
  const sekunde = n % 60
  const minute = Math.floor(n / 60) % 60
  const stunde = Math.floor(n / 3600)
  return `2026-01-01T${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(sekunde).padStart(2, '0')}.123456Z`
}

function schnitt(anzahl: number, optionen: { zeit?: (n: number) => string | null } = {}) {
  return Array.from({ length: anzahl }, (_, index) => ({
    id: uuid(index + 1),
    bookingConfirmedAt: optionen.zeit ? optionen.zeit(index) : zeit(anzahl - index),
  }))
}

function zeile(teil: Partial<RoheBuchungszeile> & { booking_confirmed_at?: unknown } = {}) {
  return {
    id: uuid(1),
    kind: 'flight',
    title: 'Zürich – Lissabon',
    starts_on: '2026-09-12',
    starts_at: '08:40:00',
    ends_on: '2026-09-12',
    ends_at: null,
    booking_status: 'booked',
    booking_confirmed_at: '2026-08-30T12:00:00.123456Z',
    trips: { id: uuid(9), title: 'Lissabon', status: 'planned' },
    ...teil,
  }
}

describe('Buchungsabfrage', () => {
  test('leitet die buchbaren Arten aus dem bestehenden Vertrag ab', () => {
    assert.deepEqual(buchbareBuchungsarten(), ['flight', 'stay', 'transfer', 'rental_car'])
    assert.deepEqual(aktiveBuchungsStati(), ['draft', 'planned', 'booked'])
  })

  test('Titelsuche bleibt der rohe Titel hinter ***=', () => {
    for (const titel of ['*', '%', '_', '\\', '"', "'", 'a,b(c)', '.*', '(a|b)', 'Zürich']) {
      assert.equal(buchungenTitelMuster(titel), `***=${titel}`)
      assert.equal(buchungenTitelMuster(titel).includes('"'), titel.includes('"'))
    }
  })

  test('nimmt nur kanonische Zeitstempel an und schreibt sie nicht um', () => {
    const exakt = '2026-08-30T12:00:00.123456Z'
    assert.equal(buchungenZeitGueltig(exakt), true)
    assert.equal(buchungenZeitGueltig('2026-08-30T12:00:00.123456+00:00'), true)
    assert.equal(buchungenZeitGueltig('2026-02-31T00:00:00Z'), false)
    assert.equal(buchungenZeitGueltig('2026-08-30T12:00:00.1234567Z'), false)
    assert.equal(buchungenZeitGueltig('2026-08-30T12:00:00.123456+01:00'), false)
    const cursor = buchungenCursorSchreiben(FILTER, exakt, uuid(1))
    assert.equal(cursor?.includes(exakt), true)
    assert.equal(buchungenCursorLesen(cursor ?? '', FILTER)?.zeit, exakt)
  })

  test('ein Cursor eines anderen Filters ist ungültig und fragt nichts', () => {
    const cursor = buchungenCursorSchreiben(FILTER, zeit(1), uuid(1))
    assert.ok(cursor)
    const fremd = buchungenAnfrageAus({ titel: 'Zürich', weiter: cursor })
    assert.equal(fremd.ok, false)
    if (fremd.ok) return
    assert.equal(fremd.grund, 'cursor')
    assert.equal(fremd.filter?.titel, 'Zürich')
    assert.equal(fremd.ersteSeite, buchungenAdresse({ titel: 'Zürich', art: null, archiv: 'alle' }))
  })

  test('wiederholte, zu lange und unbekannte Parameter sind ungültig', () => {
    assert.equal(buchungenAnfrageAus({ art: ['stay', 'flight'] }).ok, false)
    assert.equal(buchungenAnfrageAus({ titel: 'x'.repeat(121) }).ok, false)
    assert.equal(buchungenAnfrageAus({ art: 'activity' }).ok, false)
    assert.equal(buchungenAnfrageAus({ art: 'note' }).ok, false)
    assert.equal(buchungenAnfrageAus({ archiv: 'weg' }).ok, false)
    assert.equal(buchungenAnfrageAus({ weiter: 'v1|nicht-ein-cursor' }).ok, false)
    assert.equal(buchungenAnfrageAus({ weiter: 'x'.repeat(513) }).ok, false)
    const leer = buchungenAnfrageAus({ titel: '   ', art: '', archiv: '' })
    assert.equal(leer.ok, true)
    if (!leer.ok) return
    assert.equal(leer.filter.titel, null)
    assert.equal(leer.cursor, null)
    const fremd = buchungenAnfrageAus({ titel: 'Rom', unbekannt: 'x' })
    assert.equal(fremd.ok, true)
    if (!fremd.ok) return
    assert.equal(fremd.filter.titel, 'Rom')
    assert.equal(fremd.ersteSeite.includes('unbekannt'), false)
    assert.equal(fremd.wiederholen.includes('unbekannt'), true)
  })

  test('Art und Archiv stehen vor dem Limit, Titel nicht in der Keyset-Klammer', () => {
    const ohneArt = buchungenAbfrageBauen(FILTER, null)
    assert.equal(ohneArt.kind.op, 'in')
    if (ohneArt.kind.op !== 'in') return
    assert.deepEqual(ohneArt.kind.werte, ['flight', 'stay', 'transfer', 'rental_car'])
    assert.equal(ohneArt.archiv, null)
    assert.equal(ohneArt.titelMuster, null)
    assert.equal(ohneArt.limit, BUCHUNGEN_LIMIT)

    const stay = buchungenAbfrageBauen({ titel: 'a"b\\*', art: 'stay', archiv: 'aktiv' }, {
      zeit: '2026-08-30T12:00:00.123456Z',
      id: uuid(4),
    })
    assert.deepEqual(stay.kind, { op: 'eq', wert: 'stay' })
    assert.deepEqual(stay.archiv, { op: 'in', werte: ['draft', 'planned', 'booked'] })
    assert.equal(stay.titelMuster, '***=a"b\\*')
    assert.equal(stay.keyset?.op, 'or')
    if (stay.keyset?.op !== 'or') return
    assert.match(stay.keyset.ausdruck, /booking_confirmed_at\.lt\."2026-08-30T12:00:00\.123456Z"/)
    assert.match(stay.keyset.ausdruck, new RegExp(`id\\.gt\\.${uuid(4)}`))
    assert.equal(stay.keyset.ausdruck.includes('a"b'), false)
    assert.equal(stay.keyset.ausdruck.includes('imatch'), false)

    const archiv = buchungenAbfrageBauen({ ...FILTER, archiv: 'archiviert' }, { zeit: null, id: uuid(2) })
    assert.deepEqual(archiv.archiv, { op: 'eq', wert: 'archived' })
    assert.deepEqual(archiv.keyset, { op: 'null', id: uuid(2) })
  })

  test('Seiten 0, 1, 50, 51 und über 200 erreichen jede Zeile einmal', () => {
    for (const anzahl of [0, 1, 50, 51, 201]) {
      const lauf = buchungenSeitenLauf(schnitt(anzahl))
      assert.equal(lauf.ids.length, anzahl)
      assert.equal(new Set(lauf.ids).size, anzahl)
      assert.deepEqual(lauf.seiten.flat(), lauf.ids)
      for (const seite of lauf.seiten.slice(0, -1)) assert.equal(seite.length, BUCHUNGEN_SEITE)
      const letzte = lauf.seiten.at(-1) ?? []
      assert.equal(letzte.length <= BUCHUNGEN_SEITE, true)
    }
  })

  test('der Cursor kommt aus Zeile 50, nicht aus der Sentinel-Zeile', () => {
    const zeilen = schnitt(51)
    const lauf = buchungenSeitenLauf(zeilen)
    assert.equal(lauf.seiten[0]?.[0], uuid(1))
    assert.equal(lauf.seiten[0]?.[49], uuid(50))
    assert.equal(lauf.seiten[1]?.[0], uuid(51))
    const cursor = lauf.cursor[0] ?? ''
    assert.equal(cursor.includes(uuid(50)), true)
    assert.equal(cursor.includes(uuid(51)), false)
    assert.equal(
      buchungenCursorLesen(cursor, FILTER)?.zeit,
      zeilen.find((zeile) => zeile.id === uuid(50))?.bookingConfirmedAt,
    )
  })

  test('gleiche Zeit, Übergang auf null und nur null setzen fort', () => {
    const gleich = Array.from({ length: 60 }, (_, index) => ({
      id: uuid(index + 1),
      bookingConfirmedAt: '2026-08-30T12:00:00.123456Z',
    }))
    const gleichLauf = buchungenSeitenLauf(gleich)
    assert.equal(gleichLauf.seiten[0]?.[49], uuid(50))
    assert.equal(gleichLauf.seiten[1]?.[0], uuid(51))
    assert.equal(gleichLauf.cursor[0]?.includes('2026-08-30T12:00:00.123456Z'), true)

    const gemischt = [
      ...schnitt(40),
      ...Array.from({ length: 20 }, (_, index) => ({ id: uuid(100 + index), bookingConfirmedAt: null })),
    ]
    const gemischtLauf = buchungenSeitenLauf(gemischt)
    assert.equal(gemischtLauf.ids.length, 60)
    assert.equal(new Set(gemischtLauf.ids).size, 60)
    assert.equal(gemischtLauf.cursor[0]?.includes('|null|'), true)

    const nurNull = buchungenSeitenLauf(
      Array.from({ length: 51 }, (_, index) => ({ id: uuid(index + 1), bookingConfirmedAt: null })),
    )
    assert.equal(nurNull.seiten[0]?.length, 50)
    assert.equal(nurNull.seiten[1]?.length, 1)
    assert.equal(nurNull.cursor[0]?.includes('|null|'), true)
  })

  test('eine spätere leere Seite ist nicht das leere Konto', () => {
    const cursor = buchungenCursorSchreiben(FILTER, zeit(3), uuid(3))
    assert.ok(cursor)
    const seite = buchungenSeiteAusZeilen([], FILTER)
    assert.equal(seite.ok, true)
    if (!seite.ok) return
    const ansicht = buchungenAnsichtAus({
      ok: true,
      filter: FILTER,
      fortsetzung: true,
      buchungen: seite.buchungen,
      weiter: null,
      ersteSeite: '/account/bookings',
      wiederholen: `/account/bookings?weiter=${cursor}`,
    })
    assert.equal(ansicht.zustand, 'fortsetzungLeer')
    const html = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht }))
    assert.match(html, new RegExp(BUCHUNGEN_COPY.fortsetzungEndeTitel))
    assert.doesNotMatch(html, new RegExp(BUCHUNGEN_COPY.leerTitel))
    assert.doesNotMatch(html, new RegExp(BUCHUNGEN_COPY.keineTrefferTitel))
    assert.match(html, /Erste Seite dieser Filter/)
  })

  test('Abbildung bleibt fail-closed und der Cursor ist die 50. sichtbare Zeile', () => {
    const roh = Array.from({ length: 51 }, (_, index) =>
      zeile({
        id: uuid(index + 1),
        booking_confirmed_at: index === 50 ? null : zeit(51 - index),
        trips: { id: uuid(9), title: index % 2 === 0 ? 'Alt' : 'Neu', status: index % 2 === 0 ? 'archived' : 'planned' },
      }),
    )
    const seite = buchungenSeiteAusZeilen(roh, FILTER)
    assert.equal(seite.ok, true)
    if (!seite.ok) return
    assert.equal(seite.buchungen.length, 50)
    assert.equal(seite.buchungen[0]?.id, uuid(1))
    assert.equal(seite.buchungen[0]?.tripArchived, true)
    assert.equal(seite.weiter?.includes(uuid(50)), true)
    assert.equal(seite.weiter?.includes(uuid(51)), false)
    assert.equal(buchungenSeiteAusZeilen([zeile({ kind: 'activity' })], FILTER).ok, false)
    assert.equal(buchungenSeiteAusZeilen([zeile({ title: '' })], FILTER).ok, false)
    assert.equal(buchungenSeiteAusZeilen([zeile({ booking_confirmed_at: 'gestern' })], FILTER).ok, false)
    assert.equal(buchungenSeiteAusZeilen([zeile({ id: 'keine-uuid' })], FILTER).ok, false)
  })

  test('Zustände bleiben getrennt und die Karte öffnet den Planpunkt', () => {
    const gebucht = buchungAusZeile(zeile())
    assert.notEqual(typeof gebucht, 'string')
    if (typeof gebucht === 'string') return
    const faelle = [
      buchungenAnsichtAus({
        ok: true,
        filter: FILTER,
        fortsetzung: false,
        buchungen: [],
        weiter: null,
        ersteSeite: '/account/bookings',
        wiederholen: '/account/bookings',
      }),
      buchungenAnsichtAus({
        ok: true,
        filter: { titel: 'Zürich', art: 'stay', archiv: 'archiviert' },
        fortsetzung: false,
        buchungen: [],
        weiter: null,
        ersteSeite: '/account/bookings?titel=Z%C3%BCrich&art=stay&archiv=archiviert',
        wiederholen: '/account/bookings?titel=Z%C3%BCrich&art=stay&archiv=archiviert',
      }),
      buchungenAnsichtAus({
        ok: false,
        grund: 'lesen',
        status: 503,
        filter: FILTER,
        ersteSeite: '/account/bookings',
        wiederholen: '/account/bookings',
      }),
      buchungenAnsichtAus({
        ok: false,
        grund: 'parameter',
        filter: null,
        ersteSeite: '/account/bookings',
        wiederholen: '/account/bookings?art=activity',
      }),
      buchungenAnsichtAus({
        ok: true,
        filter: FILTER,
        fortsetzung: false,
        buchungen: [gebucht],
        weiter: '/account/bookings?weiter=naechste',
        ersteSeite: '/account/bookings',
        wiederholen: '/account/bookings',
      }),
    ]
    const namen = ['leer', 'keine', 'fehler', 'ungueltig', 'liste'] as const
    faelle.forEach((ansicht, index) => {
      assert.equal(ansicht.zustand, namen[index])
      const html = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht }))
      assert.match(html, /method="get"/)
      assert.equal(html.includes('name="weiter"'), false)
      assert.equal(html.includes('overflow-hidden'), false)
    })
    const liste = faelle[4]
    assert.ok(liste)
    const html = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: liste }))
    assert.match(html, /Planpunkt öffnen/)
    assert.match(html, new RegExp(`/reisen/${uuid(9)}\\?ansicht=plan&amp;punkt=${uuid(1)}`))
    assert.match(html, /Weitere Buchungen/)
    assert.match(html, /name="titel"/)
    assert.doesNotMatch(html, /leerTitel|Noch keine bestätigten Buchungen/)
    const leer = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: faelle[0] }))
    assert.match(leer, /Noch keine bestätigten Buchungen/)
    assert.doesNotMatch(leer, /Keine Buchung passt/)
    const fehler = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: faelle[2] }))
    assert.match(fehler, /konnten nicht geladen werden/)
    assert.match(fehler, /später neu/)
    assert.match(fehler, /Erneut versuchen/)
  })
})
