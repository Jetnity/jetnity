import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { mobilityInKontoUebernehmen } from '@/lib/mobility/konto-uebernahme'
import { mobilityNachweisAusUmgebung, mobilityNachweisLesen, mobilityNachweisPruefen } from '@/lib/mobility/nachweis'

describe('Mobilitätsnachweis', () => {
  test('bleibt fail closed, auch mit einer behaupteten Kennung', () => {
    assert.equal(mobilityNachweisAusUmgebung(), null)
    const nachweis = mobilityNachweisLesen('proof-1')
    assert.equal(nachweis.ok, false)
    const pruefung = mobilityNachweisPruefen(null, {
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'opt-1',
    })
    assert.equal(pruefung.ok, false)
  })

  test('die Konto-Übernahme aus einem Providerergebnis bleibt geschlossen', async () => {
    const ergebnis = await mobilityInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'opt-1',
      nachweisKennung: 'browser-behauptung',
    })
    assert.equal(ergebnis.ok, false)
  })
})
