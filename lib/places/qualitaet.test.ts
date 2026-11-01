import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ISO_3166_1_ALPHA2 } from '@/lib/country/katalog'
import type { Ort } from './domain'
import { ortAusZeile, type OrtZeile } from './abbildung'
import { orteOrdnen, ortExaktfilter, ORT_SUCHTEXT_MAX } from './suche'
import { placesSuchen, type PlacesSuchart } from './suche-lauf'
import { kanonischeOrteLauf, ORT_AUFLOESUNG_MAX } from './lesen-lauf'
import { ortSuchKontext, passendeLandCodes } from './namen'
import { geoNamesTsvZeile, orteAusGeoNames, laenderReferenzProblem, type GeoNamesZeile } from './importieren'
import { planenVorbelegung } from '@/lib/trips/create-entry'
import { tripPlannerRouteVorbelegen } from './route-einstieg'

const zeile: OrtZeile = { id: 'geonames:2867714', source: 'geonames', source_id: '2867714', name: 'München', typ: 'city', country: 'Germany', country_code: 'DE', region: 'Bavaria', lat: 48.137, lon: 11.575, iata: null, keywords: 'Munich, Muenchen, München', population: 1500000, feature_code: 'PPLA' }
const muenchen = ortAusZeile(zeile)!
const ort = (werte: Partial<Ort>): Ort => ({ ...muenchen, ...werte })

test('exaktes lokales Alias schlägt ein Präfix unabhängig von Einwohnerzahl', () => {
  const laerm = ort({ id: 'geonames:1', name: 'Munichwood', keywords: null, population: 90000000 })
  assert.equal(orteOrdnen([laerm, muenchen], 'Munich', 'ziel')[0]?.id, muenchen.id)
})

test('Land wird schon bei Schwei angeboten; Metadaten lösen Namensgleichstand', () => {
  const land = ort({ id: 'geonames:2658434', typ: 'country', name: 'Switzerland', country: 'Switzerland', countryCode: 'CH', keywords: null })
  assert.equal(orteOrdnen([ort({ name: 'Schweizer-Reneke' }), land], 'Schwei', 'ziel')[0]?.id, land.id)
  const paris = ort({ id: 'geonames:2988507', name: 'Paris', keywords: 'Paris', countryCode: 'FR', population: 2000000 })
  const klein = ort({ id: 'geonames:4717560', name: 'Paris', keywords: 'Paris', countryCode: 'US', population: 24000 })
  assert.equal(orteOrdnen([klein, paris], 'Paris', 'ziel')[0]?.id, paris.id)
})

test('exakte Aliase gehen hinter 40 Präfixzeilen und starken Kandidaten nicht verloren', async () => {
  const aufrufe: PlacesSuchart[] = []
  const ergebnis = await placesSuchen('Munich', 'ziel', async (art, _filter, limit) => {
    aufrufe.push(art)
    return { zeilen: art === 'exakt' ? [zeile] : art === 'name' ? Array.from({ length: 60 }, (_, i) => ({ ...zeile, id: `geonames:${i + 1}`, name: `Munichwood ${i}`, keywords: null })).slice(0, limit) : [], problem: null }
  })
  assert.equal(ergebnis.optionen?.[0]?.id, muenchen.id)
  assert.ok(aufrufe.includes('schluessel'))
})

test('Länderzusatz filtert vor dem Limit und bleibt defensiv im Ergebnis', async () => {
  const aufrufe: Array<readonly string[] | undefined> = []
  const ergebnis = await placesSuchen('Paris, Frankreich', 'ziel', async (_art, _filter, _limit, codes) => {
    aufrufe.push(codes)
    return { zeilen: [{ ...zeile, id: 'geonames:2988507', name: 'Paris', country_code: 'FR' }, { ...zeile, id: 'geonames:4717560', name: 'Paris', country_code: 'US' }], problem: null }
  })
  assert.ok(aufrufe.every((codes) => codes?.join() === 'FR'))
  assert.deepEqual(ergebnis.optionen?.map((o) => o.id), ['geonames:2988507'])
  assert.deepEqual(ortSuchKontext('Trinidad und Tobago'), { suche: 'Trinidad und Tobago' })
  assert.deepEqual(passendeLandCodes('Frankreich', true), ['FR'])
})

test('überlange Eingaben lösen keine Datenbankabfrage aus, IATA wird exakt gesucht', async () => {
  const ergebnis = await placesSuchen('a'.repeat(ORT_SUCHTEXT_MAX + 1), 'ziel', async () => { throw Error('darf nicht lesen') })
  assert.deepEqual(ergebnis, { optionen: [], problem: null })
  assert.match(ortExaktfilter('ZRH') ?? '', /iata.eq.ZRH/)
})

test('Datenbankausfall ist kein erfolgreiches Ergebnis ohne Orts-IDs', async () => {
  for (const behaupteteIds of [undefined, { origin: muenchen.id }]) {
    const ergebnis = await kanonischeOrteLauf({ origin: { name: 'München', rolle: 'abreise' }, stages: [], behaupteteIds }, async () => ({ zeilen: null, problem: { status: 503, message: 'offline' } }))
    assert.equal(ergebnis.ok, false)
  }
})

test('bestätigte Identität überlebt ein Budget-Update ohne neue Namensauflösung', async () => {
  const ergebnis = await kanonischeOrteLauf({ origin: { name: null, rolle: 'abreise' }, stages: [{ name: 'Munich', countryCode: 'DE', rolle: 'ziel' }], behaupteteIds: { stages: [muenchen.id] } }, async (anfrage) => {
    assert.ok('ids' in anfrage)
    return { zeilen: [muenchen], problem: null }
  })
  assert.ok(ergebnis.ok)
  assert.equal(ergebnis.orte.stages[0]?.id, muenchen.id)
})

test('abgeschnittene Kandidatenmenge beweist niemals Eindeutigkeit', async () => {
  const ergebnis = await kanonischeOrteLauf({ origin: { name: null, rolle: 'abreise' }, stages: [{ name: 'München', rolle: 'ziel' }] }, async (anfrage) => {
    assert.ok('limit' in anfrage)
    assert.equal(anfrage.limit, ORT_AUFLOESUNG_MAX + 1)
    return { zeilen: Array.from({ length: anfrage.limit }, (_, i) => ort({ id: `geonames:${i + 1}`, name: i ? 'Anders' : 'München' })), problem: null }
  })
  assert.deepEqual(ergebnis, { ok: true, orte: { origin: null, stages: [null] } })
})

const quelle: GeoNamesZeile = { geonameId: '1342638', name: 'Ko Lipe', asciiName: 'Ko Lipe', altNames: 'Koh Lipe,Ko Lipe', lat: 6.49, lon: 99.3, featureClass: 'T', featureCode: 'ISL', countryCode: 'TH', admin1: '67', admin2: '6701', population: 0 }

test('benannte Insel ohne Bevölkerung erhält echte Verwaltungsnamen und stabile ID', () => {
  const { orte } = orteAusGeoNames({ zeilen: [quelle], laender: [{ code: 'TH', name: 'Thailand' }], admin1: [{ code: 'TH.67', name: 'Satun' }], admin2: [{ code: 'TH.67.6701', name: 'Mueang Satun' }] })
  assert.equal(orte[0]?.id, 'geonames:1342638')
  assert.equal(orte[0]?.typ, 'island')
  assert.equal(orte[0]?.region, 'Mueang Satun, Satun')
  assert.equal(orte[0]?.population, null)
  assert.equal(orte[0]?.featureCode, 'ISL')
})

test('Alias-Grenze trennt keine Wörter; ungültige Koordinaten werden verworfen', () => {
  const { orte, aliasAusgelassen } = orteAusGeoNames({ zeilen: [{ ...quelle, altNames: `${'x'.repeat(795)},Koh Lipe,Alias` }], laender: [] })
  assert.equal(orte[0]?.keywords, `Ko Lipe, Koh Lipe, Alias`)
  assert.equal(aliasAusgelassen, 1)
  assert.equal(orteAusGeoNames({ zeilen: [{ ...quelle, lat: 99 }], laender: [] }).verworfen, 1)
  assert.equal(geoNamesTsvZeile('1\tX\tX\t\t\t0\tT\tISL\tTH\t\t67\t\t\t\t0'), null)
})

test('Mehrziel-Handoff behält die sichtbare Ortsunterscheidung', () => {
  const ziel = { id: 'geonames:4717560', name: 'Paris', description: 'Stadt · Texas, Vereinigte Staaten' }
  assert.deepEqual(tripPlannerRouteVorbelegen(planenVorbelegung({ weitereZiele: [ziel] })).weitere[0]?.ort, ziel)
})

test('behauptete ID darf nicht widersprechenden Text und Ländercode beglaubigen', async () => {
  for (const hinweis of [
    { name: 'Paris', countryCode: 'FR', rolle: 'ziel' as const },
    { name: 'Munich', countryCode: 'FR', rolle: 'ziel' as const },
    { name: 'Paris', countryCode: 'DE', rolle: 'ziel' as const },
  ]) {
    const ergebnis = await kanonischeOrteLauf({ origin: { name: null, rolle: 'abreise' }, stages: [hinweis], behaupteteIds: { stages: [muenchen.id] } }, async () => ({ zeilen: [muenchen], problem: null }))
    assert.equal(ergebnis.ok, false)
  }
})

test('andere Sprachpräfixe funktionieren unabhängig von abgeschnittenen Quell-Aliasen', () => {
  const land = ort({ id: 'geonames:2921044', name: 'Germany', typ: 'country', countryCode: 'DE', keywords: null })
  const stadt = ort({ id: 'geonames:9', name: 'Allemagne-en-Provence', keywords: null })
  assert.equal(orteOrdnen([stadt, land], 'Allem', 'ziel')[0]?.id, land.id)
  assert.equal(orteOrdnen([land], 'DE', 'ziel')[0]?.label, 'Deutschland')
})

test('abhängige Gebiete und politische Einheiten sind kanonische Länderziele', () => {
  for (const [featureCode, countryCode, geonameId, name] of [
    ['PCLIX', 'AW', '3577279', 'Aruba'], ['PCLIX', 'CW', '7626836', 'Curaçao'],
    ['PCL', 'JE', '3042142', 'Jersey'], ['PCL', 'GG', '3042362', 'Guernsey'],
  ]) {
    const { orte } = orteAusGeoNames({ zeilen: [{ ...quelle, featureClass: 'A', featureCode: featureCode!, countryCode: countryCode!, geonameId: geonameId!, name: name! }], laender: [] })
    assert.equal(orte[0]?.id, `geonames:${geonameId}`)
    assert.equal(orte[0]?.typ, 'country')
  }
})

test('Länderidentität stammt aus countryInfo; zugehörige Gebiete werden nicht umbenannt', () => {
  const { orte } = orteAusGeoNames({
    laender: [{ code: 'AU', name: 'Australia', geonameId: '2077456' }, { code: 'AQ', name: 'Antarctica', geonameId: '6697173' }],
    zeilen: [
      { ...quelle, countryCode: 'AU', geonameId: '2077456', name: 'Commonwealth of Australia', featureCode: 'PCLI' },
      { ...quelle, countryCode: 'AU', geonameId: '8335033', name: 'Jervis Bay Territory', featureCode: 'TERR' },
      { ...quelle, countryCode: 'AQ', geonameId: '6697173', name: 'Antarctica', featureCode: 'CONT' },
    ],
  })
  assert.equal(orte.find((o) => o.sourceId === '2077456')?.typ, 'country')
  assert.equal(orte.find((o) => o.sourceId === '6697173')?.typ, 'country')
  const gebiet = orte.find((o) => o.sourceId === '8335033')!
  assert.equal(gebiet.typ, 'region')
  assert.equal(orteOrdnen([gebiet], 'Jervis', 'ziel')[0]?.label, 'Jervis Bay Territory')
})

test('kurze und überlange API-Eingaben erhalten je eine unabhängig lesbare Antwort', async () => {
  const { GET } = await import('@/app/api/search/places/route')
  for (const q of ['', 'a', 'x'.repeat(121)]) {
    for (let i = 0; i < 2; i += 1) {
      const antwort = await GET(new Request(`http://localhost/api/search/places?q=${q}`))
      assert.equal(antwort.status, 200)
      assert.deepEqual(await antwort.json(), [])
    }
  }
})

test('historische countryInfo-Einträge werden nicht als aktuelle Länderziele angeboten', () => {
  const ergebnis = orteAusGeoNames({ laender: [{ code: 'CS', name: 'Serbia and Montenegro', geonameId: '8505033' }], zeilen: [{ ...quelle, countryCode: 'CS', geonameId: '8505033', featureCode: 'PCLH' }] })
  assert.equal(ergebnis.orte.length, 0)
  assert.deepEqual(ergebnis.historischeLandIds, ['8505033'])
})


test('offizieller Import lehnt auch einzeln fehlende und doppelte Länder-IDs ab', () => {
  const laender = ISO_3166_1_ALPHA2.map((code, i) => ({ code, name: code, geonameId: String(i + 1) }))
  assert.equal(laenderReferenzProblem(laender), null)
  assert.ok(laenderReferenzProblem(laender.slice(1)))
  assert.ok(laenderReferenzProblem([{ ...laender[0]!, geonameId: undefined }, ...laender.slice(1)]))
  assert.ok(laenderReferenzProblem([{ ...laender[0]!, geonameId: laender[1]!.geonameId }, ...laender.slice(1)]))
})
