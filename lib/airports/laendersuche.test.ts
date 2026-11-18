import test from 'node:test'
import assert from 'node:assert/strict'
import { flughafenLaender } from './laendersuche'
import { flughaefenOrdnen } from './suche'

const zeilen = [
  { iata: 'VIE', icao: 'LOWW', city: 'Vienna', name: 'Vienna International Airport', country: 'Austria', country_code: 'AT', klasse: 'large' },
  { iata: 'SZG', icao: 'LOWS', city: 'Salzburg', name: 'Salzburg Airport', country: 'Austria', country_code: 'AT', klasse: 'medium' },
  { iata: 'ZRH', icao: 'LSZH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland', country_code: 'CH', klasse: 'large' },
]
for (const text of ['österr', 'Österreich', 'oesterreich', 'Austria']) {
  test(`${text} findet konkrete österreichische Flughäfen`, () => {
    assert.deepEqual(flughafenLaender(text), ['AT'])
    assert.deepEqual(flughaefenOrdnen(zeilen, text).map(o => o.value), ['VIE', 'SZG'])
  })
}
test('Schweiz findet ZRH, unbekannt bleibt leer und IATA hat Vorrang', () => {
  assert.equal(flughaefenOrdnen(zeilen, 'schweiz')[0]?.value, 'ZRH')
  assert.deepEqual(flughaefenOrdnen(zeilen, 'Atlantis'), [])
  assert.equal(flughaefenOrdnen(zeilen, 'VIE')[0]?.value, 'VIE')
  assert.deepEqual(flughafenLaender('Rom'), [])
  assert.deepEqual(flughafenLaender('AT'), [])
  assert.deepEqual(flughafenLaender('öste),country_code.neq.X'), [])
})
