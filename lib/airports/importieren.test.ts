import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { flughaefenAusOurAirports } from '@/lib/airports/importieren'

const hier = dirname(fileURLToPath(import.meta.url))

function fixture(name: string): string {
  return readFileSync(join(hier, 'fixtures', name), 'utf8')
}

describe('OurAirports → Jetnity', () => {
  const { zeilen, verworfen } = flughaefenAusOurAirports({
    airportsCsv: fixture('airports.csv'),
    countriesCsv: fixture('countries.csv'),
    regionsCsv: fixture('regions.csv'),
  })

  test('behält die kommerziell relevanten IATA-Flughäfen', () => {
    const codes = zeilen.map((zeile) => zeile.iata)
    for (const code of ['ZRH', 'GVA', 'BSL', 'LHR', 'LGW', 'JFK', 'EWR', 'DXB', 'BKK', 'HND', 'NRT', 'SMV']) {
      assert.equal(codes.includes(code), true, code)
    }
  })

  test('verwirft Helipads, geschlossene und private Felder ohne IATA', () => {
    const codes = new Set(zeilen.map((zeile) => zeile.iata))
    assert.equal(codes.has('ZUR'), false)
    assert.equal(codes.has('ZZZ'), false)
    assert.ok(verworfen >= 3)
  })

  test('speichert Name, Stadt, Region, Land und Koordinaten', () => {
    const zrh = zeilen.find((zeile) => zeile.iata === 'ZRH')
    assert.ok(zrh)
    assert.equal(zrh?.icao, 'LSZH')
    assert.equal(zrh?.city, 'Zurich')
    assert.equal(zrh?.region, 'Zurich')
    assert.equal(zrh?.country, 'Switzerland')
    assert.equal(zrh?.countryCode, 'CH')
    assert.equal(zrh?.klasse, 'large')
    assert.ok(zrh?.lat !== null && zrh.lat > 47 && zrh.lat < 48)
    assert.match(zrh?.keywords ?? '', /Zürich/)
  })

  test('bei gleichem ICAO behält der relevantere Flughafen den Code', () => {
    const zrh = zeilen.find((zeile) => zeile.iata === 'ZRH')
    const aaa = zeilen.find((zeile) => zeile.iata === 'AAA')
    assert.equal(zrh?.icao, 'LSZH')
    assert.equal(aaa?.icao, null)
  })

  test('dieselbe Quelle liefert dieselbe Menge', () => {
    const nochmal = flughaefenAusOurAirports({
      airportsCsv: fixture('airports.csv'),
      countriesCsv: fixture('countries.csv'),
      regionsCsv: fixture('regions.csv'),
    })
    assert.deepEqual(nochmal.zeilen, zeilen)
    assert.equal(nochmal.verworfen, verworfen)
  })
})
