import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { flughaefenAusOurAirports } from '@/lib/airports/importieren'
import { flughafenAlsOption, flughaefenOrdnen, sucheFilter, sucheSicher } from '@/lib/airports/suche'

const hier = dirname(fileURLToPath(import.meta.url))

const { zeilen } = flughaefenAusOurAirports({
  airportsCsv: readFileSync(join(hier, 'fixtures', 'airports.csv'), 'utf8'),
  countriesCsv: readFileSync(join(hier, 'fixtures', 'countries.csv'), 'utf8'),
  regionsCsv: readFileSync(join(hier, 'fixtures', 'regions.csv'), 'utf8'),
})

describe('Lokale Flughafensuche', () => {
  test('ein genauer IATA-Treffer steht vorn', () => {
    const optionen = flughaefenOrdnen(zeilen, 'ZRH')
    assert.equal(optionen[0]?.value, 'ZRH')
    assert.match(optionen[0]?.label ?? '', /ZRH/)
  })

  test('Zürich findet Zurich über Unicode-Faltung', () => {
    const optionen = flughaefenOrdnen(zeilen, 'Zürich')
    assert.equal(optionen.some((option) => option.value === 'ZRH'), true)
    assert.equal(sucheFilter('Zürich').includes('zurich'), true)
  })

  test('London liefert mehrere Flughäfen, Heathrow vor dem reinen Teiltreffer', () => {
    const optionen = flughaefenOrdnen(zeilen, 'London')
    const codes = optionen.map((option) => option.value)
    assert.equal(codes.includes('LHR'), true)
    assert.equal(codes.includes('LGW'), true)
    assert.equal(flughaefenOrdnen(zeilen, 'LHR')[0]?.value, 'LHR')
  })

  test('New York trifft JFK und Newark', () => {
    const optionen = flughaefenOrdnen(zeilen, 'New York')
    const codes = optionen.map((option) => option.value)
    assert.equal(codes.includes('JFK'), true)
    assert.equal(codes.includes('EWR'), true)
  })

  test('Tokyo trifft Haneda und Narita', () => {
    const optionen = flughaefenOrdnen(zeilen, 'Tokyo')
    const codes = optionen.map((option) => option.value)
    assert.equal(codes.includes('HND'), true)
    assert.equal(codes.includes('NRT'), true)
  })

  test('GVA, BSL, DXB und BKK bleiben auffindbar', () => {
    assert.equal(flughaefenOrdnen(zeilen, 'GVA')[0]?.value, 'GVA')
    assert.equal(flughaefenOrdnen(zeilen, 'Basel')[0]?.value, 'BSL')
    assert.equal(flughaefenOrdnen(zeilen, 'DXB')[0]?.value, 'DXB')
    assert.equal(flughaefenOrdnen(zeilen, 'Bangkok')[0]?.value, 'BKK')
  })

  test('PostgREST-Sonderzeichen verlassen den Filter nicht', () => {
    assert.equal(sucheSicher('zh%_,'), 'zh')
    assert.deepEqual(sucheFilter('zh%,()'), ['zh'])
  })

  test('eine leere lokale Menge bleibt leer, ohne Provider-Fallback', () => {
    assert.deepEqual(flughaefenOrdnen([], 'ZRH'), [])
  })

  test('die Option trägt nur lokale Felder', () => {
    const zrh = zeilen.find((zeile) => zeile.iata === 'ZRH')
    assert.ok(zrh)
    const option = flughafenAlsOption(zrh!)
    assert.equal(option.value, 'ZRH')
    assert.match(option.description ?? '', /Switzerland/)
    assert.equal('access_token' in option, false)
  })
})
