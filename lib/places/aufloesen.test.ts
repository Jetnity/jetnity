import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { FLUGHAFEN_FIXTURES } from '@/lib/places/fixtures/airports'
import { geoNamesTsvZeile, laenderAusCountryInfo, ortAusFlughafen, orteAusGeoNames } from '@/lib/places/importieren'
import { aufgeloesterOrt, ortAufloesen } from '@/lib/places/aufloesen'
import type { Ort } from '@/lib/places/domain'

const hier = dirname(fileURLToPath(import.meta.url))

function bestand(): Ort[] {
  const tsv = readFileSync(join(hier, 'fixtures', 'geonames.tsv'), 'utf8')
  const zeilen = tsv
    .split(/\r?\n/)
    .map(geoNamesTsvZeile)
    .filter((zeile): zeile is NonNullable<typeof zeile> => Boolean(zeile))
  const laender = laenderAusCountryInfo(readFileSync(join(hier, 'fixtures', 'countries.txt'), 'utf8'))
  const { orte } = orteAusGeoNames({ zeilen, laender })
  const zrh = ortAusFlughafen(FLUGHAFEN_FIXTURES[0]!)
  return zrh ? [...orte, zrh] : orte
}

const orte = bestand()

describe('Modellort auflösen', () => {
  test('eine eindeutige Stadt wird kanonisch', () => {
    const bangkok = ortAufloesen(orte, { name: 'Bangkok', countryCode: 'TH', rolle: 'ziel' })
    assert.equal(bangkok.status, 'eindeutig')
    if (bangkok.status === 'eindeutig') {
      assert.equal(bangkok.ort.id, 'geonames:1609350')
      assert.equal(bangkok.ort.typ, 'city')
    }

    const barcelona = aufgeloesterOrt(orte, { name: 'Barcelona', countryCode: 'ES', rolle: 'ziel' })
    assert.equal(barcelona?.id, 'geonames:3128760')

    const samui = aufgeloesterOrt(orte, { name: 'Koh Samui', countryCode: 'TH', rolle: 'ziel' })
    assert.equal(samui?.typ, 'island')
  })

  test('ein eindeutiges Land oder eine Region wird kanonisch', () => {
    const thailand = ortAufloesen(orte, { name: 'Thailand', countryCode: 'TH', rolle: 'ziel' })
    assert.equal(thailand.status, 'eindeutig')
    if (thailand.status === 'eindeutig') assert.equal(thailand.ort.typ, 'country')

    const toskana = aufgeloesterOrt(orte, { name: 'Toskana', countryCode: 'IT', rolle: 'ziel' })
    assert.equal(toskana?.id, 'geonames:3165361')
  })

  test('gleichnamige Orte trennt der Ländercode, ohne ihn bleiben sie mehrdeutig', () => {
    const ohneLand = ortAufloesen(orte, { name: 'Paris', rolle: 'ziel' })
    assert.deepEqual(ohneLand, { status: 'unaufgeloest', grund: 'mehrdeutig' })

    const frankreich = aufgeloesterOrt(orte, { name: 'Paris', countryCode: 'FR', rolle: 'ziel' })
    assert.equal(frankreich?.id, 'geonames:2988507')

    const texas = aufgeloesterOrt(orte, { name: 'Paris', countryCode: 'US', rolle: 'ziel' })
    assert.equal(texas?.id, 'geonames:4717560')
  })

  test('kein Treffer bleibt unaufgelöst', () => {
    assert.deepEqual(ortAufloesen(orte, { name: 'Mordor', rolle: 'ziel' }), {
      status: 'unaufgeloest',
      grund: 'kein-treffer',
    })
    assert.deepEqual(ortAufloesen(orte, { name: 'abcxyz', countryCode: 'DE', rolle: 'ziel' }), {
      status: 'unaufgeloest',
      grund: 'kein-treffer',
    })
    assert.equal(aufgeloesterOrt(orte, { name: 'Bangkok', countryCode: 'FR', rolle: 'ziel' }), null)
  })

  test('manipulierte Werte werden nicht als Ort übernommen', () => {
    assert.deepEqual(ortAufloesen(orte, { name: 'geonames:1609350', rolle: 'ziel' }), {
      status: 'unaufgeloest',
      grund: 'ungueltig',
    })
    assert.deepEqual(ortAufloesen(orte, { name: '', rolle: 'ziel' }), {
      status: 'unaufgeloest',
      grund: 'ungueltig',
    })
    assert.deepEqual(ortAufloesen(orte, { name: null, rolle: 'ziel' }), {
      status: 'unaufgeloest',
      grund: 'ungueltig',
    })
    assert.equal(aufgeloesterOrt(orte, { name: 'Paris', countryCode: 'FRANCE', rolle: 'ziel' }), null)
    assert.equal(aufgeloesterOrt(orte, { name: 'Paris', countryCode: 'th', rolle: 'ziel' }), null)
  })

  test('Zürich und ZRH sind eindeutige Abreisen', () => {
    assert.equal(aufgeloesterOrt(orte, { name: 'Zürich', countryCode: 'CH', rolle: 'abreise' })?.id, 'geonames:2657896')
    assert.equal(aufgeloesterOrt(orte, { name: 'ZRH', rolle: 'abreise' })?.id, 'airport:ZRH')
    assert.equal(aufgeloesterOrt(orte, { name: 'ZRH', rolle: 'ziel' }), null)
  })
})
