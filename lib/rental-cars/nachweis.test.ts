import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarInKontoUebernehmen } from '@/lib/rental-cars/konto-uebernahme'
import { rentalCarNachweisAusUmgebung, rentalCarNachweisPruefen } from '@/lib/rental-cars/nachweis'

describe('Mietwagen-Nachweis', () => {
  test('ohne Provider bleibt der Nachweis fail closed', () => {
    assert.equal(rentalCarNachweisAusUmgebung(), null)
    const geprueft = rentalCarNachweisPruefen(null, {
      tripId: 'trip-1',
      optionId: 'opt-1',
    })
    assert.equal(geprueft.ok, false)
  })

  test('eine Konto-Übernahme aus dem Browser bleibt fail closed', async () => {
    const ergebnis = await rentalCarInKontoUebernehmen({
      tripId: '00000000-0000-0000-0000-000000000001',
      optionId: 'opt-1',
    })
    assert.equal(ergebnis.ok, false)
    assert.match(ergebnis.meldung, /noch nicht/)
  })
})
