import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { FLUGHAFEN_FIXTURES } from '@/lib/places/fixtures/airports'
import {
  geoNamesTsvZeile,
  geoNamesZeileRelevant,
  laenderAusCountryInfo,
  ortAusFlughafen,
  orteAusGeoNames,
} from '@/lib/places/importieren'

const hier = dirname(fileURLToPath(import.meta.url))

function fixtureOrte() {
  const tsv = readFileSync(join(hier, 'fixtures', 'geonames.tsv'), 'utf8')
  const zeilen = tsv
    .split(/\r?\n/)
    .map(geoNamesTsvZeile)
    .filter((zeile): zeile is NonNullable<typeof zeile> => Boolean(zeile))
  const laender = laenderAusCountryInfo(readFileSync(join(hier, 'fixtures', 'countries.txt'), 'utf8'))
  return orteAusGeoNames({ zeilen, laender })
}

describe('GeoNames → Jetnity-Orte', () => {
  const { orte, verworfen } = fixtureOrte()
  const namen = orte.map((ort) => ort.name)

  test('behält Länder, Regionen, Inseln und Städte', () => {
    for (const name of ['Bali', 'Thailand', 'South Tyrol', 'Tuscany', 'New York City', 'Japan']) {
      assert.equal(namen.includes(name), true, name)
    }
  })

  test('Südtirol und Toskana bleiben über Alternativnamen auffindbar', () => {
    const suedtirol = orte.find((ort) => ort.name === 'South Tyrol')
    const toskana = orte.find((ort) => ort.name === 'Tuscany')
    assert.match(suedtirol?.keywords ?? '', /Südtirol/)
    assert.match(toskana?.keywords ?? '', /Toskana/)
    assert.equal(suedtirol?.typ, 'region')
    assert.equal(toskana?.typ, 'region')
  })

  test('verwirft Fantasieorte und irrelevante Felder', () => {
    assert.equal(namen.includes('Mordor'), false)
    assert.equal(namen.includes('Test'), false)
    assert.equal(namen.includes('abcxyz'), false)
    assert.equal(namen.includes('Helipad Nowhere'), false)
    assert.ok(verworfen >= 4)
  })

  test('Zermatt bleibt trotz kleiner Einwohnerzahl, weil es ein relevanter Ort ist', () => {
    assert.equal(namen.includes('Zermatt'), true)
  })

  test('dieselbe Quelle liefert dieselbe Menge', () => {
    assert.deepEqual(fixtureOrte().orte, orte)
  })

  test('eine Helipad-Zeile ist nicht relevant', () => {
    const zeile = geoNamesTsvZeile(
      '1	X	X		0	0	S	AIRH	CH		ZH				0		0	Europe/Zurich	2024-01-01',
    )
    assert.ok(zeile)
    assert.equal(geoNamesZeileRelevant(zeile!), false)
  })
})

describe('Flughafen als Ort', () => {
  test('ZRH wird ein airport-Ort', () => {
    const ort = ortAusFlughafen(FLUGHAFEN_FIXTURES[0]!)
    assert.equal(ort?.id, 'airport:ZRH')
    assert.equal(ort?.typ, 'airport')
    assert.equal(ort?.iata, 'ZRH')
  })
})
