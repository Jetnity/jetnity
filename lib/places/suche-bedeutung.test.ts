import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { OrtZeile } from '@/lib/places/abbildung'
import { placesSuchen } from '@/lib/places/suche-lauf'

// Zeilen aus dem Production-Bestand (GeoNames, CC BY 4.0). Schlüsselwörter sind auf
// die für die Suche relevanten Aliase gekürzt. Kleingeschriebene Tokens sind die
// maschinellen Umschriften, die der Import tatsächlich liefert.
let zaehler = 0
function zeile(
  name: string,
  typ: 'city' | 'region' | 'island',
  country_code: string,
  population: number | null,
  feature_code: string,
  keywords: string,
  region: string | null = null,
): OrtZeile {
  zaehler += 1
  return {
    id: `geonames:${zaehler}`, source: 'geonames', source_id: String(zaehler), name, typ,
    country: country_code, country_code, region, lat: 0, lon: 0, iata: null, keywords, population, feature_code,
  }
}

const BESTAND: OrtZeile[] = [
  zeile('Rome', 'city', 'IT', 2_318_895, 'PPLC', 'Rome, Rom, ROM, rom, Roma', 'Lazio'),
  zeile('Rome', 'city', 'US', 36_323, 'PPLA2', 'Rome, Rom, roma', 'Floyd County, Georgia'),
  zeile('Rom', 'island', 'NO', null, 'ISL', 'Rom', 'Hvaler, Østfold'),
  zeile('Rømø', 'island', 'DK', null, 'ISL', 'Rom'),
  zeile('Rombach', 'city', 'FR', 2_000_000, 'PPLA', 'Rombach'),
  zeile('Berlin', 'city', 'DE', 3_426_354, 'PPLC', 'Berlin, BER, berlin', 'State of Berlin'),
  zeile('Land Berlin', 'region', 'DE', 3_677_472, 'ADM1', 'Berlin, berlin'),
  zeile('Berlin', 'city', 'US', 9_367, 'PPL', 'Berlin', 'Coos County, New Hampshire'),
  zeile('Barrlind', 'island', 'SE', null, 'ISL', 'Berlin', 'Västra Götaland'),
  zeile('Lisbon', 'city', 'PT', 517_802, 'PPLC', 'Lisbon, Lisboa, Lissabon, lisbona'),
  zeile('Distrito de Lisboa', 'region', 'PT', 2_135_992, 'ADM1', 'Lissabon'),
  zeile('Lissabon', 'island', 'FI', null, 'ISL', 'Lissabon', 'Kemi-Tornio, Lapland'),
  zeile('Porto', 'city', 'PT', 252_687, 'PPLA', 'Porto, OPO, Oporto, porto'),
  zeile('Porto', 'region', 'PT', 237_591, 'ADM2', 'Porto'),
  zeile('Bordeaux', 'city', 'FR', 265_328, 'PPLA', 'Bordeaux, porto', 'Gironde'),
  zeile('Pirttisaari', 'island', 'FI', null, 'ISL', 'Porto', 'Porvoo, Uusimaa'),
  zeile('Amsterdam', 'city', 'NL', 741_636, 'PPLC', 'Amsterdam, AMS', 'Gemeente Amsterdam, North Holland'),
  zeile('Amsterdamøya', 'island', 'SJ', null, 'ISL', 'Amsterdam', 'Spitsbergen, Svalbard'),
  zeile('Sydney', 'city', 'AU', 5_638_830, 'PPLA', 'Sydney', 'New South Wales'),
  zeile('Manra Island', 'island', 'KI', null, 'ATOL', 'Sydney'),
  zeile('Sylt', 'island', 'DE', null, 'ISL', 'Sylt, Sild, sylt', 'Schleswig-Holstein'),
  zeile('Sylhet', 'city', 'BD', 237_000, 'PPLA', 'Sylhet, sylht, sylt'),
  zeile('Asilah', 'city', 'MA', 34_011, 'PPL', 'Asilah, Arcila, sylt'),
  zeile('Bali', 'island', 'ID', 4_225_384, 'ISL', 'Bali'),
  zeile('Bali', 'region', 'ID', 4_362_700, 'ADM1', 'Bali'),
  zeile('Bali', 'city', 'CM', 27_473, 'PPL', 'Bali', 'North-West'),
  zeile('Madeira', 'region', 'PT', 238_928, 'ADM1', 'Madeira'),
  zeile('Madeira', 'island', 'NO', null, 'ISL', 'Madeira', 'Kristiansand, Agder'),
  zeile('Madeira', 'city', 'US', 8_976, 'PPL', 'Madeira', 'Hamilton County, Ohio'),
]

async function erster(suche: string, rolle: 'ziel' | 'abreise' = 'ziel') {
  const ergebnis = await placesSuchen(suche, rolle, async () => ({ zeilen: BESTAND, problem: null }))
  assert.equal(ergebnis.problem, null)
  return (ergebnis.optionen ?? []).map((option) => `${option.label}/${option.countryCode}/${option.typ}`)
}

describe('Ortssuche: Bedeutung entscheidet nur beim Gleichstand exakter Namen', () => {
  test('deutsche Namen grosser Städte schlagen gleichnamige Mini-Inseln', async () => {
    assert.equal((await erster('Rom'))[0], 'Rome/IT/city')
    assert.equal((await erster('Berlin'))[0], 'Berlin/DE/city')
    assert.equal((await erster('Lissabon'))[0], 'Lisbon/PT/city')
    assert.equal((await erster('Amsterdam'))[0], 'Amsterdam/NL/city')
    assert.equal((await erster('Sydney'))[0], 'Sydney/AU/city')
  })

  test('die gleichnamige Insel bleibt auffindbar, nur nicht zuerst', async () => {
    const rom = await erster('Rom')
    assert.ok(rom.includes('Rom/NO/island'))
    assert.ok(rom.indexOf('Rom/NO/island') > 0)
    assert.ok((await erster('Berlin')).includes('Barrlind/SE/island'))
  })

  test('Porto: der eigene Name schlägt einen fremden Alias gleicher Stufe', async () => {
    const porto = await erster('Porto')
    assert.equal(porto[0], 'Porto/PT/city')
    assert.equal(porto.includes('Bordeaux/FR/city'), false)
  })

  test('maschinelle Umschriften gelten nicht als Ortsname: Sylt bleibt die Insel', async () => {
    const sylt = await erster('Sylt')
    assert.equal(sylt[0], 'Sylt/DE/island')
    assert.equal(sylt.some((eintrag) => eintrag.startsWith('Sylhet') || eintrag.startsWith('Asilah')), false)
  })

  test('echte Ziel-Inseln und Regionen behalten ihren Platz', async () => {
    assert.equal((await erster('Bali'))[0], 'Bali/ID/island')
    assert.equal((await erster('Madeira'))[0], 'Madeira/PT/region')
  })

  test('ein grosser Ort überholt nie eine bessere Namensübereinstimmung', async () => {
    const rom = await erster('Rom')
    const exakt = rom.indexOf('Rom/NO/island')
    const praefix = rom.indexOf('Rombach/FR/city')
    assert.ok(exakt >= 0)
    assert.ok(praefix === -1 || exakt < praefix)
  })

  test('Abreise: dieselbe Reihenfolge, Hauptstadt statt Insel', async () => {
    assert.equal((await erster('Rom', 'abreise'))[0], 'Rome/IT/city')
    assert.equal((await erster('Porto', 'abreise'))[0], 'Porto/PT/city')
  })
})
