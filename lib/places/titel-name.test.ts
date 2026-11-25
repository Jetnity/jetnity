import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { Ort } from '@/lib/places/domain'
import { gespeicherteEtappeAnzeigen, ortAnzeigeName, ortTitelName, schweizerSchreibweise, titelFolgtDemErstenZiel } from '@/lib/places/titel-name'

function ort(teil: Pick<Ort, 'name' | 'typ' | 'countryCode'> & Partial<Ort>): Pick<Ort, 'typ' | 'name' | 'sourceName' | 'countryCode'> {
  return { sourceName: teil.sourceName, name: teil.name, typ: teil.typ, countryCode: teil.countryCode }
}

describe('Reisetitel: deutsche Ortsnamen in Schweizer Schreibweise', () => {
  test('gängige deutsche Namen statt der englischen Katalognamen', () => {
    const faelle: Array<[Pick<Ort, 'name' | 'typ' | 'countryCode'>, string]> = [
      [{ name: 'Rome', typ: 'city', countryCode: 'IT' }, 'Rom'],
      [{ name: 'Lisbon', typ: 'city', countryCode: 'PT' }, 'Lissabon'],
      [{ name: 'Milan', typ: 'city', countryCode: 'IT' }, 'Mailand'],
      [{ name: 'Munich', typ: 'city', countryCode: 'DE' }, 'München'],
      [{ name: 'Vienna', typ: 'city', countryCode: 'AT' }, 'Wien'],
      [{ name: 'Geneva', typ: 'city', countryCode: 'CH' }, 'Genf'],
      [{ name: 'Prague', typ: 'city', countryCode: 'CZ' }, 'Prag'],
      [{ name: 'Strasbourg', typ: 'city', countryCode: 'FR' }, 'Strassburg'],
      [{ name: 'Corsica Island', typ: 'island', countryCode: 'FR' }, 'Korsika'],
      [{ name: 'Canary Islands', typ: 'island', countryCode: 'ES' }, 'Kanarische Inseln'],
    ]
    for (const [eingabe, erwartet] of faelle) assert.equal(ortTitelName(ort(eingabe)), erwartet, eingabe.name)
  })

  test('der Katalogname im Ort entscheidet, nicht eine lokalisierte Anzeige', () => {
    assert.equal(ortTitelName(ort({ name: 'Roma', sourceName: 'Rome', typ: 'city', countryCode: 'IT' })), 'Rom')
  })

  test('gleicher Name in anderem Land oder anderem Typ bleibt unverändert', () => {
    assert.equal(ortTitelName(ort({ name: 'Vienna', typ: 'city', countryCode: 'US' })), 'Vienna')
    assert.equal(ortTitelName(ort({ name: 'Rome', typ: 'city', countryCode: 'US' })), 'Rome')
    assert.equal(ortTitelName(ort({ name: 'Lisbon', typ: 'island', countryCode: 'PT' })), 'Lisbon')
    assert.equal(ortTitelName(ort({ name: 'Rome', typ: 'city', countryCode: null as unknown as string })), 'Rome')
  })

  test('Orte ohne Eintrag behalten ihren Namen, nur ß wird zu ss', () => {
    assert.equal(ortTitelName(ort({ name: 'Paris', typ: 'city', countryCode: 'FR' })), 'Paris')
    assert.equal(ortTitelName(ort({ name: 'Groß-Gerau', typ: 'city', countryCode: 'DE' })), 'Gross-Gerau')
    assert.equal(ortTitelName(ort({ name: 'Bali', typ: 'island', countryCode: 'ID' })), 'Bali')
  })

  test('dieselbe Tabelle, auch ohne Typ, nur bei einem eindeutigen Landstreffer', () => {
    assert.equal(ortAnzeigeName({ name: 'Lisbon', countryCode: 'PT' }), 'Lissabon')
    assert.equal(ortAnzeigeName({ name: 'Vienna', countryCode: 'AT', typ: 'city' }), 'Wien')
    assert.equal(ortAnzeigeName({ name: 'Munich', countryCode: 'DE' }), 'München')
    assert.equal(ortAnzeigeName({ name: 'Milan', countryCode: 'IT' }), 'Mailand')
    assert.equal(ortAnzeigeName({ name: 'Geneva', countryCode: 'CH' }), 'Genf')
    assert.equal(ortAnzeigeName({ name: 'Prague', countryCode: 'CZ' }), 'Prag')
    assert.equal(gespeicherteEtappeAnzeigen({ name: 'Rome', countryCode: 'IT' }), 'Rom')
  })

  test('gleicher Name im anderen Land, unbekannter Name und fehlender Kontext bleiben', () => {
    assert.equal(ortAnzeigeName({ name: 'Vienna', countryCode: 'US', typ: 'city' }), 'Vienna')
    assert.equal(ortAnzeigeName({ name: 'Rome', countryCode: 'US' }), 'Rome')
    assert.equal(ortAnzeigeName({ name: 'Lisbon', countryCode: 'PT', typ: 'island' }), 'Lisbon')
    assert.equal(ortAnzeigeName({ name: 'Nirgendwo', countryCode: 'DE', typ: 'city' }), 'Nirgendwo')
    assert.equal(ortAnzeigeName({ name: 'Vienna' }), 'Vienna')
    assert.equal(ortAnzeigeName({ name: 'Vienna', countryCode: null }), 'Vienna')
    assert.equal(ortAnzeigeName({ name: 'Groß-Gerau', countryCode: null }), 'Gross-Gerau')
    assert.equal(ortTitelName(ort({ name: 'Rome', sourceName: 'Rome', typ: 'city', countryCode: 'IT' })), ortAnzeigeName({ name: 'Rome', sourceName: 'Rome', typ: 'city', countryCode: 'IT' }))
  })

  test('schweizerSchreibweise ersetzt ß und ẞ, sonst nichts', () => {
    assert.equal(schweizerSchreibweise('Straße ẞ Fußach'), 'Strasse SS Fussach')
    assert.equal(schweizerSchreibweise('Zürich Genève'), 'Zürich Genève')
  })
})

describe('Titel, der nur das erste Ziel wiedergibt', () => {
  const lissabon = { name: 'Lisbon', countryCode: 'PT' }

  test('alter Katalogname und neuer deutscher Name zählen, eigene Titel nicht', () => {
    assert.equal(titelFolgtDemErstenZiel('Lisbon', lissabon), true)
    assert.equal(titelFolgtDemErstenZiel('Lissabon', lissabon), true)
    assert.equal(titelFolgtDemErstenZiel('Städtetrip Portugal', lissabon), false)
    assert.equal(titelFolgtDemErstenZiel('Rom', lissabon), false)
  })

  test('ß im Katalognamen: Titel in Schweizer Schreibweise zählt ebenfalls', () => {
    assert.equal(titelFolgtDemErstenZiel('Gross-Gerau', { name: 'Groß-Gerau', countryCode: 'DE' }), true)
  })

  test('ohne Land bleibt nur der Namensvergleich', () => {
    assert.equal(titelFolgtDemErstenZiel('Lissabon', { name: 'Lisbon', countryCode: null }), false)
    assert.equal(titelFolgtDemErstenZiel('Lisbon', { name: 'Lisbon', countryCode: null }), true)
  })
})
