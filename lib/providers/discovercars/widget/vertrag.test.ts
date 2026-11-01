import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  WIDGET_FIXTURE_TEXT,
  WIDGET_HERKUNFT_ERLAUBT,
  WIDGET_PRUEFNAHT,
  WIDGET_ATTRIBUT_ERLAUBT,
  WIDGET_EXPORT_BYTES,
  WIDGET_EXPORT_SHA256,
  WIDGET_LAUFZEIT,
  WIDGET_QUELLENSTATUS,
  widgetAnfang,
  widgetAnsicht,
  widgetAusfuehren,
  widgetDarfAusfuehren,
  widgetPruefnaht,
  widgetQuelle,
} from '@/lib/providers/discovercars/widget/vertrag'

const REISE = 'trip-uuid-geheim'

describe('DiscoverCars Widget-Quelle', () => {
  test('der allgemeine Export ist gebunden und die Laufzeit bleibt zu', () => {
    assert.deepEqual(widgetQuelle(), {
      status: WIDGET_QUELLENSTATUS,
      sha256: WIDGET_EXPORT_SHA256,
      bytes: WIDGET_EXPORT_BYTES,
      laufzeit: WIDGET_LAUFZEIT,
      herkunft: [],
    })
    assert.equal(WIDGET_QUELLENSTATUS, 'LIVE_SOURCE_VERIFIED')
    assert.equal(WIDGET_LAUFZEIT, 'CONSENT_BLOCKED')
    assert.equal(WIDGET_EXPORT_BYTES, 835)
    assert.equal(widgetDarfAusfuehren(), false)
    assert.deepEqual(WIDGET_ATTRIBUT_ERLAUBT, [])
    assert.deepEqual(WIDGET_HERKUNFT_ERLAUBT, [])
    assert.equal(widgetPruefnaht(WIDGET_PRUEFNAHT), true)
    assert.equal(widgetPruefnaht('live'), false)
    assert.equal(widgetPruefnaht(undefined), false)
    assert.match(WIDGET_FIXTURE_TEXT, /Synthetische Jetnity-Prüfseite/)
    assert.match(WIDGET_FIXTURE_TEXT, /keine Preise/)
  })

  test('ohne Export, Einwilligung oder Adresse bleibt die Quelle zu', () => {
    assert.deepEqual(widgetAusfuehren(), { ok: false, grund: 'quelle-fehlt' })
    assert.deepEqual(widgetAusfuehren({}), { ok: false, grund: 'quelle-fehlt' })
    assert.deepEqual(widgetAusfuehren({ einwilligung: true }), { ok: false, grund: 'einwilligung' })
    assert.deepEqual(widgetAusfuehren({ einwilligung: 'klick' }), { ok: false, grund: 'einwilligung' })
    assert.deepEqual(widgetAusfuehren({ einwilligung: 'click' }), { ok: false, grund: 'einwilligung' })
  })

  test('fremde und offizielle Hosts bleiben ohne freigegebene Herkunft zu', () => {
    assert.deepEqual(
      widgetAusfuehren({ adresse: 'https://cdn.example/widget.js' }),
      { ok: false, grund: 'herkunft' },
    )
    assert.deepEqual(
      widgetAusfuehren({ adresse: 'https://www.discovercars.com/widget.js' }),
      { ok: false, grund: 'herkunft' },
    )
    assert.deepEqual(
      widgetAusfuehren({ adresse: 'http://www.discovercars.com/widget.js' }),
      { ok: false, grund: 'adresse' },
    )
    assert.deepEqual(widgetAusfuehren({ adresse: 'nicht-eine-url' }), { ok: false, grund: 'adresse' })
    assert.deepEqual(widgetAusfuehren({ adresse: 12 }), { ok: false, grund: 'adresse' })
    assert.deepEqual(widgetAusfuehren('https://www.discovercars.com/'), { ok: false, grund: 'adresse' })
  })

  test('ein BKK-Standort ist nicht das allgemeine Widget', () => {
    assert.deepEqual(
      widgetAusfuehren({
        attribute: [{ name: 'data-location', wert: 'thailand/bangkok/suvarnabhumi-airport-bkk' }],
      }),
      { ok: false, grund: 'attribut' },
    )
  })

  test('Berichtsfetzen und doppelte Attribute sind kein Export', () => {
    assert.deepEqual(
      widgetAusfuehren({
        attribute: [{ name: 'data-utm-source', wert: 'jetnity' }],
      }),
      { ok: false, grund: 'attribut' },
    )
    assert.deepEqual(
      widgetAusfuehren({
        attribute: [
          { name: 'data-aff-code', wert: 'a_aid' },
          { name: 'data-aff-code', wert: 'nochmal' },
        ],
      }),
      { ok: false, grund: 'doppelt' },
    )
    assert.deepEqual(
      widgetAusfuehren({
        adresse: 'https://www.discovercars.com/?a_aid=jetnity&a_aid=andere',
      }),
      { ok: false, grund: 'doppelt' },
    )
    assert.deepEqual(widgetAusfuehren({ skript: 'https://evil.example/a.js' }), {
      ok: false,
      grund: 'attribut',
    })
  })

  test('Reisedaten und private Felder gehen nicht in eine Anbieteradresse', () => {
    assert.deepEqual(
      widgetAusfuehren(
        { adresse: `https://www.discovercars.com/?sub=${REISE}` },
        { reiseId: REISE },
      ),
      { ok: false, grund: 'reise' },
    )
    assert.deepEqual(
      widgetAusfuehren({ tripId: REISE, einwilligung: true }),
      { ok: false, grund: 'reise' },
    )
    assert.deepEqual(
      widgetAusfuehren(
        { attribute: [{ name: 'notiz', wert: `weg-${REISE}` }] },
        { reiseId: REISE },
      ),
      { ok: false, grund: 'reise' },
    )
    const entscheidung = widgetAusfuehren({ adresse: 'https://evil.example/?x=1' }, { reiseId: REISE })
    assert.equal(JSON.stringify(entscheidung).includes(REISE), false)
  })
})

describe('DiscoverCars Widget-Zustand', () => {
  test('normal bleibt ruhend, die Prüfnaht startet leer', () => {
    assert.deepEqual(widgetAnfang(false, REISE), { art: 'ruhend' })
    assert.deepEqual(widgetAnfang(true, REISE), { art: 'bereit', reiseId: REISE, lauf: 0 })
    const ruhend = widgetAnfang(false, REISE)
    assert.equal(widgetAnsicht(ruhend, { art: 'klick' }), ruhend)
    assert.deepEqual(widgetAnsicht(ruhend, { art: 'reise', reiseId: 'andere' }), ruhend)
  })

  test('Klick, Fehler und erneutes Laden bleiben an denselben Lauf gebunden', () => {
    const bereit = widgetAnfang(true, REISE)
    const laedt = widgetAnsicht(bereit, { art: 'klick' })
    assert.deepEqual(laedt, { art: 'laedt', reiseId: REISE, lauf: 1 })
    assert.equal(widgetAnsicht(laedt, { art: 'klick' }), laedt)
    const fehler = widgetAnsicht(laedt, { art: 'fehlschlag', lauf: 1, reiseId: REISE })
    assert.equal(fehler.art, 'fehler')
    assert.equal(widgetAnsicht(laedt, { art: 'fehlschlag', lauf: 2, reiseId: REISE }), laedt)
    const nochmal = widgetAnsicht(fehler, { art: 'erneut' })
    assert.deepEqual(nochmal, { art: 'laedt', reiseId: REISE, lauf: 2 })
    const fixture = widgetAnsicht(nochmal, { art: 'fertig', lauf: 2, reiseId: REISE })
    assert.equal(fixture.art, 'fixture')
    assert.equal(widgetAnsicht(nochmal, { art: 'fertig', lauf: 1, reiseId: REISE }), nochmal)
  })

  test('ein verspäteter Lauf und ein Reisewechsel tragen nichts hinüber', () => {
    const laedt = widgetAnsicht(widgetAnfang(true, REISE), { art: 'klick' })
    const danach = widgetAnsicht(laedt, { art: 'reise', reiseId: 'reise-zwei' })
    assert.deepEqual(danach, { art: 'bereit', reiseId: 'reise-zwei', lauf: 0 })
    assert.equal(
      widgetAnsicht(danach, { art: 'fertig', lauf: 1, reiseId: REISE }),
      danach,
    )
    const gesetzt = widgetAnsicht(laedt, { art: 'setzen', naht: true, reiseId: 'reise-drei' })
    assert.deepEqual(gesetzt, { art: 'bereit', reiseId: 'reise-drei', lauf: 0 })
    const zu = widgetAnsicht(laedt, { art: 'setzen', naht: false, reiseId: 'reise-vier' })
    assert.deepEqual(zu, { art: 'ruhend' })
  })

  test('Schließen kehrt zur Prüfnaht zurück und verwirft einen alten Lauf', () => {
    const laedt = widgetAnsicht(widgetAnfang(true, REISE), { art: 'klick' })
    const offen = widgetAnsicht(laedt, { art: 'fertig', lauf: 1, reiseId: REISE })
    const zu = widgetAnsicht(offen, { art: 'schliessen' })
    assert.deepEqual(zu, { art: 'bereit', reiseId: REISE, lauf: 1 })
    assert.equal(widgetAnsicht(zu, { art: 'fertig', lauf: 1, reiseId: REISE }), zu)
    assert.equal(widgetAnsicht(widgetAnfang(true, REISE), { art: 'schliessen' }).art, 'bereit')
  })
})
