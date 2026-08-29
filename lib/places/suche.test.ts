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
  ORT_LAND_UNIVERSUM,
  ORT_TREFFER,
  landAliasMehrdeutig,
  landAliasNachzugNoetig,
  orteOrdnen,
  ortAnzeigeKontext,
  ortAnzeigeLabel,
  ortLandAliasExaktfilter,
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
    assert.equal(optionen[0]?.label, 'Schweiz')
    assert.equal(optionen[0]?.description, 'Land')
    assert.equal(optionen[0]?.ariaLabel, 'Schweiz, Land')
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
    assert.equal(optionen[0]?.label, 'Ruritanien')
    assert.equal(optionen[0]?.description, 'Land')
    assert.equal(optionen[0]?.landAliasMatch, true)
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === stadt.id))
    assert.match(optionen.find((option) => option.id === stadt.id)?.description ?? '', /^Stadt · /)
  })

  test('zwei Länder mit demselben exakten Alias bleiben unterscheidbar und auswählbar', () => {
    const erstes = ortFixture({
      id: 'geonames:9100001',
      name: 'Northern Sylvani Federation',
      typ: 'country',
      country: 'Northern Sylvani Federation',
      countryCode: 'NS',
      keywords: 'Sylvani, Northern Sylvani Federation',
    })
    const zweites = ortFixture({
      id: 'geonames:9100002',
      name: 'Southern Sylvani Republic',
      typ: 'country',
      country: 'Southern Sylvani Republic',
      countryCode: 'SS',
      keywords: 'Sylvani, Southern Sylvani Republic',
    })
    const stadt = ortFixture({
      id: 'geonames:9100003',
      name: 'Sylvani',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Iowa',
      keywords: 'Sylvani, Sylvani, Iowa',
    })
    const optionen = orteOrdnen([stadt, erstes, zweites], 'Sylvani', 'ziel')
    const laender = optionen.filter((option) => option.typ === 'country')
    assert.equal(laender.length, 2)
    assert.ok(laender.every((option) => option.label === 'Sylvani'))
    assert.ok(laender.some((option) => option.id === erstes.id))
    assert.ok(laender.some((option) => option.id === zweites.id))
    assert.ok(optionen.some((option) => option.id === stadt.id))
    const texte = laender.map((option) => option.description ?? '')
    assert.ok(texte.some((text) => text.includes('Northern Sylvani Federation') && text.includes('NS')))
    assert.ok(texte.some((text) => text.includes('Southern Sylvani Republic') && text.includes('SS')))
    assert.notEqual(laender[0]?.description, laender[1]?.description)
    assert.notEqual(laender[0]?.ariaLabel, laender[1]?.ariaLabel)
    assert.ok(laender.every((option) => (option.ariaLabel ?? '').includes(option.description ?? '')))
    const eindeutig = orteOrdnen([erstes, stadt], 'Sylvani', 'ziel')
    assert.equal(eindeutig[0]?.id, erstes.id)
    assert.equal(eindeutig[0]?.label, 'Sylvani')
    assert.equal(eindeutig[0]?.description, 'Land')
    assert.equal(eindeutig[0]?.ariaLabel, 'Sylvani, Land')
  })

  test('Production-förmige geteilte Länder-Aliase bleiben über kanonischen Namen unterscheidbar', () => {
    const kongoCd = ortFixture({
      id: 'geonames:203312',
      name: 'Democratic Republic of the Congo',
      typ: 'country',
      country: 'Democratic Republic of the Congo',
      countryCode: 'CD',
      keywords: 'Congo, DRC, Democratic Republic of the Congo',
    })
    const kongoCg = ortFixture({
      id: 'geonames:2260494',
      name: 'Republic of the Congo',
      typ: 'country',
      country: 'Republic of the Congo',
      countryCode: 'CG',
      keywords: 'Congo, Republic of the Congo',
    })
    const optionen = orteOrdnen([kongoCd, kongoCg], 'Congo', 'ziel')
    assert.equal(optionen.length, 2)
    assert.ok(optionen.every((option) => option.label === 'Congo' && option.typ === 'country'))
    const cd = optionen.find((option) => option.id === kongoCd.id)
    const cg = optionen.find((option) => option.id === kongoCg.id)
    assert.equal(cd?.description, 'Land · Democratic Republic of the Congo · CD')
    assert.equal(cg?.description, 'Land · Republic of the Congo · CG')
    assert.equal(cd?.ariaLabel, 'Congo, Land · Democratic Republic of the Congo · CD')
    assert.equal(cg?.ariaLabel, 'Congo, Land · Republic of the Congo · CG')
  })

  test('die Zeilenform folgt dem Typ, nicht einzelnen Ländernamen', () => {
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
      name: 'Ruritanien',
      typ: 'city',
      country: 'United States',
      countryCode: 'US',
      region: 'Ohio',
      keywords: 'Ruritanien, Ruritanien, Ohio',
    })
    const region = ortFixture({
      id: 'geonames:9000003',
      name: 'South Ruritania',
      typ: 'region',
      country: 'Ruritania',
      countryCode: 'RR',
    })
    const insel = ortFixture({
      id: 'geonames:9000004',
      name: 'Ruritania Key',
      typ: 'island',
      country: 'Ruritania',
      countryCode: 'RR',
    })
    const flughafen = ortFixture({
      id: 'airport:RRR',
      source: 'ourairports',
      sourceId: 'RRR',
      name: 'Ruritania Airport',
      typ: 'airport',
      country: 'Ruritania',
      countryCode: 'RR',
      region: 'Capital',
      iata: 'RRR',
      keywords: 'Ruritanien, RRR',
    })
    assert.equal(ortAnzeigeLabel(land, 'Ruritanien'), 'Ruritanien')
    assert.equal(ortAnzeigeKontext(land), 'Land')
    assert.equal(ortAnzeigeKontext(land, 'Ruritanien', true), 'Land · Republic of Ruritania · RR')
    assert.equal(landAliasMehrdeutig([land], 'Ruritanien'), false)
    assert.equal(landAliasMehrdeutig([land, stadt], 'Ruritanien'), false)
    assert.equal(ortAnzeigeKontext(stadt), 'Stadt · Ohio, United States')
    assert.equal(ortAnzeigeKontext(region), 'Region · Ruritania')
    assert.equal(ortAnzeigeKontext(insel), 'Insel · Ruritania')
    assert.equal(ortAnzeigeKontext(flughafen), 'Flughafen · RRR · Capital, Ruritania')
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

  test('die Runtime enthält keine Länder-Allowlist', () => {
    const datei = readFileSync(join(hier, 'suche.ts'), 'utf8')
    for (const name of ['Peru', 'China', 'Schweiz', 'Ruritanien', 'Congo', 'Sylvani', 'Zaxony', 'Zxyland', 'Paris'] as const) {
      assert.equal(datei.includes(name), false, name)
    }
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
    assert.equal(landAliasNachzugNoetig([...staedte, republik], 'Peru', 'ziel'), true)
    assert.equal(landAliasNachzugNoetig(orte, 'Thailand', 'ziel'), true)
    assert.ok(ORT_LAND_UNIVERSUM > 12)
    assert.ok(ORT_LAND_UNIVERSUM >= 250)
    const filter = ortLandAliasExaktfilter('Paris')
    assert.ok(filter)
    assert.equal(filter.includes('keywords.ilike.%Paris%'), false)
    assert.match(filter, /keywords\.ilike\.Paris/)
    assert.match(filter, /keywords\.ilike\."Paris,%"/)
    const lauf = readFileSync(join(hier, 'suche-lauf.ts'), 'utf8')
    assert.match(lauf, /ortLandAliasExaktfilter/)
    assert.equal(lauf.includes('ORT_LAND_UNIVERSUM_FILTER'), false)
    assert.equal(lauf.includes('keywords.ilike.%'), false)
    const route = readFileSync(join(hier, '../../app/api/search/places/route.ts'), 'utf8')
    assert.match(route, /eq\('typ', 'country'\)/)
    assert.match(route, /filter \? anfrage\.or\(filter\) : anfrage/)
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
