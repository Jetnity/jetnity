import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { OPTION_DIREKT, SUCHANFRAGE } from '@/lib/flights/fixtures/optionen'
import {
  FLUG_NACHWEIS_MELDUNG,
  flugNachweisAusKatalog,
  flugNachweisAusUmgebung,
  flugNachweisFehler,
  flugNachweisKontextAusReise,
  type FlugNachweisKontext,
} from '@/lib/flights/nachweis'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'

const KONTEXT: FlugNachweisKontext = {
  legs: [{ origin: 'ZRH', destination: 'BKK', date: '2026-11-01' }],
  passengers: { adults: 2, children: 0, infants: 0 },
  cabin: 'economy',
  currency: 'CHF',
}

function katalog() {
  return flugNachweisAusKatalog({
    optionen: { direkt: OPTION_DIREKT },
    kontexte: { direkt: KONTEXT },
    abgelaufen: ['opt-alt'],
    geaendert: ['opt-neu'],
    fehler: { 'opt-err': 'error' },
  })
}

describe('Flug-Nachweis', () => {
  test('ohne Umgebung gibt es keinen Nachweis', () => {
    assert.equal(flugNachweisAusUmgebung(), null)
  })

  test('der erwartete Kontext bindet Legs, Passagiere, Kabine und Währung aus Reise plus Suchvertrag', () => {
    const kontext = flugNachweisKontextAusReise(beispielreise(), {
      legs: SUCHANFRAGE.legs,
      cabin: 'economy',
    })
    assert.deepEqual(kontext, KONTEXT)
  })

  test('eine unbekannte, abgelaufene oder geänderte Auswahl wird abgelehnt', async () => {
    const nachweis = katalog()
    const unbekannt = await nachweis.nachweisen({ optionId: 'gibt-es-nicht', kontext: KONTEXT })
    const abgelaufen = await nachweis.nachweisen({ optionId: 'opt-alt', kontext: KONTEXT })
    const geaendert = await nachweis.nachweisen({ optionId: 'opt-neu', kontext: KONTEXT })
    const fehlerhaft = await nachweis.nachweisen({ optionId: 'opt-err', kontext: KONTEXT })
    assert.equal(unbekannt.ok, false)
    assert.equal(abgelaufen.ok, false)
    assert.equal(geaendert.ok, false)
    assert.equal(fehlerhaft.ok, false)
    if (unbekannt.ok || abgelaufen.ok || geaendert.ok || fehlerhaft.ok) return
    assert.equal(unbekannt.art, 'unbekannt')
    assert.equal(abgelaufen.art, 'abgelaufen')
    assert.equal(geaendert.art, 'geaendert')
    assert.equal(fehlerhaft.art, 'error')
  })

  test('gleiche optionId mit anderen Legs, Passagieren, Kabine oder Währung wird abgelehnt', async () => {
    const nachweis = katalog()
    const faelle: FlugNachweisKontext[] = [
      { ...KONTEXT, legs: [{ origin: 'ZRH', destination: 'SIN', date: '2026-11-01' }] },
      { ...KONTEXT, passengers: { adults: 4, children: 0, infants: 0 } },
      { ...KONTEXT, cabin: 'business' },
      { ...KONTEXT, currency: 'EUR' },
    ]
    for (const kontext of faelle) {
      const ergebnis = await nachweis.nachweisen({ optionId: 'direkt', kontext })
      assert.equal(ergebnis.ok, false)
      if (ergebnis.ok) return
      assert.equal(ergebnis.art, 'geaendert')
    }
  })

  test('verschiedene Währungen werden nicht gleichgesetzt', async () => {
    const nachweis = katalog()
    const ergebnis = await nachweis.nachweisen({
      optionId: 'direkt',
      kontext: { ...KONTEXT, currency: 'usd' },
    })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'geaendert')
  })

  test('eine gültige Katalogauswahl mit passendem Kontext liefert die Option', async () => {
    const nachweis = katalog()
    const ergebnis = await nachweis.nachweisen({ optionId: 'direkt', kontext: KONTEXT })
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.option.priceAmount, 892.5)
    assert.equal(ergebnis.option.provider, 'duffel')
    assert.equal(ergebnis.option.externalRef, OPTION_DIREKT.externalRef)
  })

  test('eine unvollständige Katalogzeile fällt fail-closed', async () => {
    const nachweis = flugNachweisAusKatalog({
      optionen: { 'opt-leer': { id: 'opt-leer', provider: 'duffel' } },
      kontexte: { 'opt-leer': KONTEXT },
    })
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-leer', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.art, 'invalid')
  })

  test('Fehler enthalten keine Secrets, Tokens oder Rohpayloads', async () => {
    const nachweis = flugNachweisAusKatalog({
      optionen: {
        'opt-secret': {
          ...OPTION_DIREKT,
          id: 'opt-secret',
          access_token: 'duffel_test_leak',
          payload: { offer: 'raw' },
        },
      },
      kontexte: { 'opt-secret': KONTEXT },
      fehler: { 'opt-secret': 'error' },
    })
    const ergebnis = await nachweis.nachweisen({ optionId: 'opt-secret', kontext: KONTEXT })
    assert.equal(ergebnis.ok, false)
    if (ergebnis.ok) return
    assert.equal(ergebnis.message, FLUG_NACHWEIS_MELDUNG.error)
    assert.equal(/duffel_test_leak|access_token|payload|raw/i.test(ergebnis.message), false)
  })

  test('unavailable bleibt die ehrliche Meldung ohne Nachweisquelle', () => {
    const fehler = flugNachweisFehler('unavailable')
    assert.equal(fehler.ok, false)
    if (fehler.ok) return
    assert.match(fehler.message, /noch nicht verbindlich/)
  })
})
