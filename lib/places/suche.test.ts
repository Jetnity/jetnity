import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { FLUGHAFEN_FIXTURES } from '@/lib/places/fixtures/airports'
import { geoNamesTsvZeile, laenderAusCountryInfo, ortAusFlughafen, orteAusGeoNames } from '@/lib/places/importieren'
import { eingabeOhneAuswahl, ortAusBestand, ORT_MELDUNG } from '@/lib/places/pruefen'
import type { Ort } from '@/lib/places/domain'
import {
  ORT_TREFFER,
  landAliasNachzugNoetig,
  orteOrdnen,
  ortLandAliasfilter,
  ortNamensfilter,
  ortSchluesselfilter,
  schluesselErgaenzungNoetig,
} from '@/lib/places/suche'

const hier = dirname(fileURLToPath(import.meta.url))

function bestand(): ReturnType<typeof orteAusGeoNames>['orte'] {
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

function ortFixture(teil: Partial<Ort> & Pick<Ort, 'id' | 'name' | 'typ'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    country: teil.country ?? 'Unknown',
    countryCode: teil.countryCode ?? 'XX',
    region: teil.region ?? null,
    lat: teil.lat ?? 0,
    lon: teil.lon ?? 0,
    iata: teil.iata ?? null,
    keywords: teil.keywords ?? null,
    ...teil,
  }
}

describe('Ortssuche', () => {
  test('Bali ist ein gültiges Reiseziel, obwohl es kein Flughafen ist', () => {
    const optionen = orteOrdnen(orte, 'Bali', 'ziel')
    assert.equal(optionen.some((option) => option.label.includes('Bali')), true)
    assert.equal(optionen.some((option) => option.typ === 'airport'), false)
  })

  test('Thailand, Südtirol, Toskana und New York sind gültige Ziele', () => {
    assert.ok(orteOrdnen(orte, 'Thailand', 'ziel').some((option) => option.label.includes('Thailand')))
    assert.ok(orteOrdnen(orte, 'Südtirol', 'ziel').some((option) => option.label.includes('South Tyrol')))
    assert.ok(orteOrdnen(orte, 'Toskana', 'ziel').some((option) => option.label.includes('Tuscany')))
    assert.ok(orteOrdnen(orte, 'New York', 'ziel').some((option) => option.label.includes('New York')))
  })

  test('Zürich und ZRH sind gültige Abreisen', () => {
    assert.equal(orteOrdnen(orte, 'Zürich', 'abreise')[0]?.label.includes('Zürich') || orteOrdnen(orte, 'Zürich', 'abreise')[0]?.label.includes('Zurich'), true)
    assert.equal(orteOrdnen(orte, 'ZRH', 'abreise')[0]?.id, 'airport:ZRH')
  })

  test('Paris bleibt über Land unterscheidbar', () => {
    const optionen = orteOrdnen(orte, 'Paris', 'ziel')
    assert.ok(optionen.some((option) => /France/.test(option.description ?? '')))
    assert.ok(optionen.some((option) => /United States/.test(option.description ?? '')))
  })

  test('London liefert einen realen London-Treffer', () => {
    assert.ok(orteOrdnen(orte, 'London', 'ziel').some((option) => option.label.includes('London')))
  })

  test('Test, Mordor und abcxyz liefern keine Treffer', () => {
    assert.deepEqual(orteOrdnen(orte, 'Test', 'ziel'), [])
    assert.deepEqual(orteOrdnen(orte, 'Mordor', 'ziel'), [])
    assert.deepEqual(orteOrdnen(orte, 'abcxyz', 'ziel'), [])
  })

  test('Test bleibt leer, auch wenn Testaccio im Bestand steht', () => {
    const testaccio: (typeof orte)[number] = {
      id: 'geonames:6545164',
      source: 'geonames',
      sourceId: '6545164',
      name: 'Testaccio',
      typ: 'city',
      country: 'Italy',
      countryCode: 'IT',
      region: 'Lazio',
      lat: 41.87,
      lon: 12.47,
      iata: null,
      keywords: null,
    }
    assert.deepEqual(orteOrdnen([...orte, testaccio], 'Test', 'ziel'), [])
    assert.equal(orteOrdnen([testaccio], 'Testaccio', 'ziel')[0]?.id, 'geonames:6545164')
  })

  test('die Datenbankabfrage sucht nicht im Land und nicht nach Test', () => {
    assert.equal(ortNamensfilter('Test'), null)
    assert.equal(ortSchluesselfilter('Test'), null)
    const filter = ortNamensfilter('Thailand')
    assert.ok(filter)
    assert.equal(filter.includes('country.'), false)
    assert.equal(filter.includes('keywords.'), false)
    assert.equal(filter.includes('name.ilike.Thailand%'), true)
    assert.equal(ortSchluesselfilter('Südtirol')?.includes('keywords.ilike.'), true)
  })

  test('Peru als Land steht beim Reiseziel vorn', () => {
    const optionen = orteOrdnen(orte, 'Peru', 'ziel')
    assert.equal(optionen[0]?.label, 'Peru')
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.length <= ORT_TREFFER)
  })

  test('Zürich und Zurich priorisieren Stadt und ZRH, nicht Bezirke oder Illinois', () => {
    const extra: Ort[] = [
      {
        id: 'geonames:4900054',
        source: 'geonames',
        sourceId: '4900054',
        name: 'Lake Zurich',
        typ: 'city',
        country: 'United States',
        countryCode: 'US',
        region: 'Illinois',
        lat: 42.2,
        lon: -88.09,
        iata: null,
        keywords: 'Zurich',
      },
      {
        id: 'geonames:2657897',
        source: 'geonames',
        sourceId: '2657897',
        name: 'Zürich Kreis 1',
        typ: 'city',
        country: 'Switzerland',
        countryCode: 'CH',
        region: 'Zürich',
        lat: 47.37,
        lon: 8.54,
        iata: null,
        keywords: 'Zurich',
      },
    ]
    for (const suche of ['Zürich', 'Zurich'] as const) {
      const optionen = orteOrdnen([...orte, ...extra], suche, 'abreise')
      const ids = optionen.map((option) => option.id)
      assert.equal(ids[0], 'geonames:2657896')
      assert.ok(ids.includes('airport:ZRH'))
      assert.equal(ids.includes('geonames:4900054'), false)
      assert.equal(ids.includes('geonames:2657897'), false)
      assert.ok(optionen.length <= ORT_TREFFER)
      const zrh = optionen.find((option) => option.id === 'airport:ZRH')
      assert.equal(zrh?.label, 'Zürich Airport')
      assert.equal(zrh?.iata, 'ZRH')
    }
  })

  test('echte gleichnamige Orte bleiben über Region und Land unterscheidbar', () => {
    const optionen = orteOrdnen(orte, 'Paris', 'ziel')
    const frankreich = optionen.find((option) => /France/.test(option.description ?? ''))
    const texas = optionen.find((option) => /United States/.test(option.description ?? ''))
    assert.ok(frankreich)
    assert.ok(texas)
    assert.equal(frankreich?.label, 'Paris')
    assert.equal(texas?.label, 'Paris')
  })

  test('die Ergebnisliste bleibt kompakt und füllt sich nicht mit schwachen Treffern', () => {
    const rauschen: Ort[] = Array.from({ length: 12 }, (_, index) => ({
      id: `geonames:${8000000 + index}`,
      source: 'geonames',
      sourceId: `${8000000 + index}`,
      name: `Peru District ${index + 1}`,
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Indiana',
      lat: 40,
      lon: -86,
      iata: null,
      keywords: 'Peru',
    }))
    const optionen = orteOrdnen([...orte, ...rauschen], 'Peru', 'ziel')
    assert.equal(optionen[0]?.typ, 'country')
    assert.equal(optionen.some((option) => option.label.includes('District')), false)
    assert.ok(optionen.length <= ORT_TREFFER)
  })

  test('ein Land gewinnt gegen gleichnamige Unterorte im selben Land', () => {
    const thailand = orte.find((ort) => ort.name === 'Thailand')
    assert.ok(thailand)
    const amphoe: (typeof orte)[number] = {
      ...thailand!,
      id: 'geonames:1152356',
      sourceId: '1152356',
      name: 'Amphoe Li',
      typ: 'region',
      keywords: null,
    }
    const optionen = orteOrdnen([amphoe, thailand!], 'Thailand', 'ziel')
    assert.equal(optionen[0]?.id, thailand!.id)
    assert.equal(optionen.some((option) => option.id === amphoe.id), false)
  })

  test('Japan bleibt als Reiseziel vorn', () => {
    const optionen = orteOrdnen(orte, 'Japan', 'ziel')
    assert.equal(optionen[0]?.label, 'Japan')
    assert.equal(optionen[0]?.typ, 'country')
  })

  test('ein offizieller Ländername mit exaktem Alias schlägt gleichnamige Städte', () => {
    const republik = ortFixture({
      id: 'geonames:3932488',
      name: 'Republic of Peru',
      typ: 'country',
      country: 'Peru',
      countryCode: 'PE',
      keywords: 'Peru, Perú, Republic of Peru',
    })
    const stadtIllinois = ortFixture({
      id: 'geonames:4901424',
      name: 'Peru',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Illinois',
      keywords: 'Peru, Peru, Illinois',
    })
    const stadtIndiana = ortFixture({
      id: 'geonames:4924733',
      name: 'Peru',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Indiana',
      keywords: 'Peru, Peru, Indiana',
    })
    const optionen = orteOrdnen([stadtIllinois, stadtIndiana, republik], 'Peru', 'ziel')
    assert.equal(optionen[0]?.id, republik.id)
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === stadtIllinois.id))
    assert.ok(optionen.some((option) => option.id === stadtIndiana.id))
    assert.ok(optionen.length <= ORT_TREFFER)
  })

  test('China als Länder-Alias steht vor gleichnamigen Orten', () => {
    const republik = ortFixture({
      id: 'geonames:1814991',
      name: 'People’s Republic of China',
      typ: 'country',
      country: 'China',
      countryCode: 'CN',
      keywords: 'China, PRC, People’s Republic of China',
    })
    const stadtJapan = ortFixture({
      id: 'geonames:1864090',
      name: 'China',
      typ: 'city',
      country: 'Japan',
      countryCode: 'JP',
      region: 'Kagoshima',
      keywords: 'China, China, Kagoshima',
    })
    const stadtMexiko = ortFixture({
      id: 'geonames:4014336',
      name: 'China',
      typ: 'city',
      country: 'Mexico',
      countryCode: 'MX',
      region: 'Nuevo León',
      keywords: 'China, China, Nuevo Leon',
    })
    const optionen = orteOrdnen([stadtJapan, stadtMexiko, republik], 'China', 'ziel')
    assert.equal(optionen[0]?.id, republik.id)
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === stadtJapan.id))
  })

  test('Schweiz trifft Switzerland über das Alias und schlägt Präfix-Städte', () => {
    const land = ortFixture({
      id: 'geonames:2658434',
      name: 'Switzerland',
      typ: 'country',
      country: 'Switzerland',
      countryCode: 'CH',
      keywords: 'Schweiz, Suisse, Svizzera, Switzerland',
    })
    const praefixStadt = ortFixture({
      id: 'geonames:956817',
      name: 'Schweizer-Reneke',
      typ: 'city',
      country: 'South Africa',
      countryCode: 'ZA',
      region: 'North West',
      keywords: 'Schweizer-Reneke, Schweizer Reneke',
    })
    const optionen = orteOrdnen([praefixStadt, land], 'Schweiz', 'ziel')
    assert.equal(optionen[0]?.id, land.id)
    assert.equal(optionen[0]?.label, 'Switzerland')
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === praefixStadt.id))
  })

  test('dasselbe Alias-Ranking gilt generisch, nicht nur für einzelne Ländernamen', () => {
    const land = ortFixture({
      id: 'geonames:9000001',
      name: 'Republic of Ruritania',
      typ: 'country',
      country: 'Ruritania',
      countryCode: 'RR',
      keywords: 'Ruritanien, Ruritania',
    })
    const stadt = ortFixture({
      id: 'geonames:9000002',
      name: 'Ruritanien Heights',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Ohio',
      keywords: 'Ruritanien Heights, Ruritanien',
    })
    const optionen = orteOrdnen([stadt, land], 'Ruritanien', 'ziel')
    assert.equal(optionen[0]?.id, land.id)
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === stadt.id))
  })

  test('nur ein exaktes Länder-Alias wird angehoben, kein Keyword-Präfix', () => {
    const land = ortFixture({
      id: 'geonames:2658434',
      name: 'Switzerland',
      typ: 'country',
      country: 'Switzerland',
      countryCode: 'CH',
      keywords: 'Swiss Confederation, Switzerland',
    })
    const stadt = ortFixture({
      id: 'geonames:9000100',
      name: 'Swiss',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Missouri',
    })
    const optionen = orteOrdnen([land, stadt], 'Swiss', 'ziel')
    assert.equal(optionen[0]?.id, stadt.id)
    assert.equal(optionen.some((option) => option.id === land.id), false)
  })

  test('Abreise behält Stadt- und IATA-Semantik und hebt kein Land an', () => {
    const land = ortFixture({
      id: 'geonames:2658434',
      name: 'Switzerland',
      typ: 'country',
      country: 'Switzerland',
      countryCode: 'CH',
      keywords: 'Schweiz, Switzerland',
    })
    const optionen = orteOrdnen([...orte, land], 'Zürich', 'abreise')
    assert.equal(optionen.some((option) => option.typ === 'country'), false)
    assert.equal(optionen[0]?.id, 'geonames:2657896')
    assert.ok(optionen.some((option) => option.id === 'airport:ZRH'))
    assert.equal(orteOrdnen([...orte, land], 'ZRH', 'abreise')[0]?.id, 'airport:ZRH')
    assert.equal(landAliasNachzugNoetig([land], 'Schweiz', 'abreise'), false)
  })

  test('schwache, fachfremde Keyword-Treffer bleiben ausgefiltert', () => {
    const land = ortFixture({
      id: 'geonames:1814991',
      name: 'People’s Republic of China',
      typ: 'country',
      country: 'China',
      countryCode: 'CN',
      keywords: 'China',
    })
    const rauschen = Array.from({ length: 8 }, (_, index) =>
      ortFixture({
        id: `geonames:${9100000 + index}`,
        name: `China Township ${index + 1}`,
        typ: 'city',
        country: 'United States',
        countryCode: 'US',
        region: 'Michigan',
        keywords: 'China',
      }),
    )
    const optionen = orteOrdnen([land, ...rauschen], 'China', 'ziel')
    assert.equal(optionen[0]?.id, land.id)
    assert.equal(optionen.some((option) => option.label.includes('Township')), false)
    assert.ok(optionen.length <= ORT_TREFFER)
  })

  test('Import-Keywords der Gleichnam-Stadt dürfen das Länder-Alias nicht überholen', () => {
    const republik = ortFixture({
      id: 'geonames:3932488',
      name: 'Republic of Peru',
      typ: 'country',
      country: 'Peru',
      countryCode: 'PE',
      keywords: 'Peru, Peru, Republic of Peru, Perú',
    })
    const stadt = ortFixture({
      id: 'geonames:4901424',
      name: 'Peru',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Illinois',
      keywords: 'Peru, Peru, Illinois',
    })
    const optionen = orteOrdnen([stadt, republik], 'Peru', 'ziel')
    assert.equal(optionen[0]?.id, republik.id)
    assert.equal(optionen[1]?.id, stadt.id)
  })

  test('der Länder-Alias-Nachzug läuft, wenn Namens-Städte das Land verdecken', () => {
    const staedte = Array.from({ length: 4 }, (_, index) =>
      ortFixture({
        id: `geonames:${9200000 + index}`,
        name: 'Peru',
        typ: 'city',
        country: 'United States',
        countryCode: 'US',
        region: `State ${index + 1}`,
      }),
    )
    assert.equal(schluesselErgaenzungNoetig(staedte, 'Peru', 'ziel'), false)
    assert.equal(landAliasNachzugNoetig(staedte, 'Peru', 'ziel'), true)
    const republik = ortFixture({
      id: 'geonames:3932488',
      name: 'Republic of Peru',
      typ: 'country',
      country: 'Peru',
      countryCode: 'PE',
      keywords: 'Peru',
    })
    assert.equal(landAliasNachzugNoetig([...staedte, republik], 'Peru', 'ziel'), false)
    assert.equal(landAliasNachzugNoetig(orte, 'Thailand', 'ziel'), false)
    const filter = ortLandAliasfilter('Schweiz')
    assert.ok(filter)
    assert.equal(filter.includes('keywords.ilike.'), true)
    assert.equal(filter.includes('name.ilike.Schweiz%'), true)
  })
})

describe('Ortsprüfung', () => {
  test('nur eingetippter Text ohne Auswahl ist kein kanonischer Ort', () => {
    assert.equal(eingabeOhneAuswahl('Test', null), true)
    assert.equal(eingabeOhneAuswahl('Bali', 'geonames:1650535'), false)
  })

  test('eine manipulierte Place-ID wird abgelehnt', () => {
    assert.equal(ortAusBestand(orte, 'geonames:1', 'ziel'), null)
    assert.equal(ortAusBestand(orte, 'airport:XXX', 'abreise'), null)
    assert.equal(ortAusBestand(orte, 'mordor', 'ziel'), null)
    assert.equal(ORT_MELDUNG.idUngueltig.length > 0, true)
  })

  test('ein bekannter Ziel-Ort gilt, ein Flughafen als Ziel nicht', () => {
    const bali = orte.find((ort) => ort.name === 'Bali')
    assert.ok(bali)
    assert.equal(ortAusBestand(orte, bali!.id, 'ziel')?.name, 'Bali')
    assert.equal(ortAusBestand(orte, 'airport:ZRH', 'ziel'), null)
    assert.equal(ortAusBestand(orte, 'airport:ZRH', 'abreise')?.iata, 'ZRH')
  })
})
