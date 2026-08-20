import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { flughaefenOrdnen, flughafenAlsOption } from '@/lib/airports/suche'

const ZRH = {
  iata: 'ZRH',
  icao: 'LSZH',
  name: 'Zurich Airport',
  city: 'Zurich',
  country: 'Switzerland',
}

const BSL = {
  iata: 'BSL',
  icao: 'LFSB',
  name: 'EuroAirport Basel',
  city: 'Basel',
  country: 'Switzerland',
}

describe('Lokale Flughafensuche', () => {
  test('ein genauer IATA-Treffer steht vorn', () => {
    const optionen = flughaefenOrdnen([BSL, ZRH], 'ZRH')
    assert.equal(optionen[0]?.value, 'ZRH')
    assert.match(optionen[0]?.label ?? '', /ZRH/)
  })

  test('eine leere lokale Menge bleibt leer, ohne Provider-Fallback', () => {
    assert.deepEqual(flughaefenOrdnen([], 'ZRH'), [])
  })

  test('die Option trägt nur lokale Felder', () => {
    const option = flughafenAlsOption(ZRH)
    assert.equal(option.value, 'ZRH')
    assert.equal(option.description, 'Switzerland')
    assert.equal('access_token' in option, false)
  })
})
