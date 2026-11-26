// lib/trips/bezeichnungen.test.ts
//
// Was Reisende lesen, muss auf dem Server und im Browser dasselbe sein.
//
// Der Anlass ist kein Schönheitsfehler: `Intl.NumberFormat('de-CH')` nimmt seinen
// Gruppentrenner aus ICU, Node und Browser bringen verschiedene ICU-Fassungen mit
// (U+2019 gegen U+0027), und React bricht beim Hydrieren mit „Text content does
// not match server-rendered HTML“ ab, sobald ein server-gerenderter Betrag im
// Browser anders geschrieben wird. Die Reiseansicht schaltete dadurch nach jedem
// Neuladen auf reines Client-Rendering um.
//
// Diese Tests halten deshalb den Trenner fest, nicht nur „irgendeine
// Gruppierung“: Ein Test, der `Intl` gegen `Intl` prüft, würde den Fehler
// mitmachen.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { BETRAG_NICHT_LESBAR, betragLesbar, interesseLesen, tempoLesen } from '@/lib/trips/bezeichnungen'

describe('Ein Betrag wird lesbar', () => {
  test('Tausender bekommen den Schweizer Trenner U+2019 und behalten die Hundertstel', () => {
    assert.equal(betragLesbar(3000, 'CHF'), 'CHF 3\u2019000.00')
  })

  test('Gruppierung ist U+2019, Dezimaltrennung ist der Punkt', () => {
    const wert = betragLesbar(3000.5, 'CHF')

    assert.equal(wert, 'CHF 3\u2019000.50')
    assert.ok(!wert.includes("'"), 'U+0027 wäre die andere ICU-Fassung')
    assert.ok(!wert.includes(','), 'ein Komma wäre die deutsche Dezimaltrennung')
    assert.ok(!wert.includes('\u00a0'), 'ein geschütztes Leerzeichen käme aus Intl')
    assert.ok(wert.includes('\u2019'))
    assert.ok(wert.includes('.'))
  })

  test('unter tausend bleibt ungruppiert, Null bleibt exakt', () => {
    assert.equal(betragLesbar(412, 'CHF'), 'CHF 412.00')
    assert.equal(betragLesbar(0, 'CHF'), 'CHF 0.00')
    assert.equal(betragLesbar(-0, 'CHF'), 'CHF 0.00')
  })

  test('mehrere Gruppen werden alle getrennt', () => {
    assert.equal(betragLesbar(1234567, 'CHF'), 'CHF 1\u2019234\u2019567.00')
  })

  test('Hundertstel bleiben stehen und werden nicht auf Franken gerundet', () => {
    assert.equal(betragLesbar(420.5, 'CHF'), 'CHF 420.50')
    assert.equal(betragLesbar(79.9, 'CHF'), 'CHF 79.90')
    assert.equal(betragLesbar(2999.5, 'CHF'), 'CHF 2\u2019999.50')
    assert.equal(betragLesbar(2999.4, 'CHF'), 'CHF 2\u2019999.40')
    assert.equal(betragLesbar(-389.6, 'CHF'), 'CHF -389.60')
    assert.notEqual(betragLesbar(420.5, 'CHF'), 'CHF 421')
  })

  test('unsichere oder ungenaue Werte werden nicht geraten', () => {
    assert.equal(betragLesbar(Number.NaN, 'CHF'), `CHF ${BETRAG_NICHT_LESBAR}`)
    assert.equal(betragLesbar(Number.POSITIVE_INFINITY, 'CHF'), `CHF ${BETRAG_NICHT_LESBAR}`)
    assert.equal(betragLesbar(Number.MAX_SAFE_INTEGER, 'CHF'), `CHF ${BETRAG_NICHT_LESBAR}`)
  })

  test('jede Währung erscheint als ISO-Code, nicht als Symbol', () => {
    // Ein Symbol käme aus ICU und wäre damit dieselbe Wette wie der Trenner.
    assert.equal(betragLesbar(3000, 'EUR'), 'EUR 3\u2019000.00')
    assert.equal(betragLesbar(3000, 'USD'), 'USD 3\u2019000.00')
    assert.equal(betragLesbar(3000, 'THB'), 'THB 3\u2019000.00')
  })

  test('die Ausgabe hängt nicht von der Umgebung ab', () => {
    // Derselbe Aufruf zweimal, dazwischen eine andere Zeitzone und Sprache: Was
    // `Intl` beeinflusst, darf hier nichts beeinflussen.
    const vorher = betragLesbar(3000, 'CHF')
    const spracheVorher = process.env.LANG
    const zoneVorher = process.env.TZ

    process.env.LANG = 'en_US.UTF-8'
    process.env.TZ = 'America/New_York'
    const nachher = betragLesbar(3000, 'CHF')

    if (spracheVorher === undefined) delete process.env.LANG
    else process.env.LANG = spracheVorher
    if (zoneVorher === undefined) delete process.env.TZ
    else process.env.TZ = zoneVorher

    assert.equal(nachher, vorher)
  })
})

describe('Alte Schreibweisen bleiben lesbar', () => {
  test('Tempo aus der Fassung bis Phase 1.5', () => {
    assert.equal(tempoLesen('ruhig'), 'calm')
    assert.equal(tempoLesen('calm'), 'calm')
    assert.equal(tempoLesen('gemuetlich'), null)
  })

  test('Interessen aus der Fassung bis Phase 1.5', () => {
    assert.equal(interesseLesen('Kulinarik'), 'food')
    assert.equal(interesseLesen('food'), 'food')
    assert.equal(interesseLesen('Segeln'), null)
  })
})
