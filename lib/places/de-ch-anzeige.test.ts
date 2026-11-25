import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import { gleichGefaltet } from '@/lib/airports/normalisieren'
import { flughafenAlsOption, type FlughafenZeile } from '@/lib/airports/suche'
import { ganzerOrtGlaubwuerdig } from '@/lib/places/route-intent'
import type { OrtZeile } from '@/lib/places/abbildung'
import { placesSuchen, type PlacesZeilenLesen } from '@/lib/places/suche-lauf'
import { ortAnzeigeAliasfilter, ortExaktfilter, ortNamensfilter, ortSchluesselfilter } from '@/lib/places/suche'
import { ortAnzeigeName } from '@/lib/places/titel-name'
import { bookingHotelSuche } from '@/lib/trips/organisieren/katalog'
import { createZieleGraph } from '@/lib/trips/create-stages'
import { reiseOrte } from '@/lib/trips/reise-orte'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import { routeModell } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import type { Ort } from '@/lib/places/domain'

function zeile(
  id: string,
  name: string,
  country_code: string,
  keywords: string,
  population: number,
): OrtZeile {
  return {
    id, source: 'geonames', source_id: id.replace('geonames:', ''), name, typ: 'city',
    country: country_code, country_code, region: null, lat: 48.2, lon: 16.37, iata: null,
    keywords, population, feature_code: 'PPLC',
  }
}

const WIEN = zeile('geonames:2761369', 'Vienna', 'AT', 'Vienna, Vienne', 1_900_000)
const VIENNA_US = zeile('geonames:4730000', 'Vienna', 'US', 'Vienna', 20_000)

function ort(teil: Partial<Ort> & Pick<Ort, 'id' | 'name' | 'countryCode'>): Ort {
  return {
    source: 'geonames',
    sourceId: teil.id.replace(/^geonames:/, ''),
    typ: 'city',
    country: teil.countryCode,
    region: null,
    lat: teil.lat ?? 48.2,
    lon: teil.lon ?? 16.37,
    iata: null,
    keywords: null,
    ...teil,
  }
}

function oderTeile(filter: string): string[] {
  const teile: string[] = []
  let tiefe = 0
  let start = 0
  let quote = false
  for (let i = 0; i < filter.length; i += 1) {
    const zeichen = filter[i]
    if (zeichen === '"') quote = !quote
    else if (!quote && zeichen === '(') tiefe += 1
    else if (!quote && zeichen === ')') tiefe -= 1
    else if (!quote && tiefe === 0 && zeichen === ',') {
      teile.push(filter.slice(start, i))
      start = i + 1
    }
  }
  teile.push(filter.slice(start))
  return teile.map((teil) => teil.trim()).filter((teil) => teil.length > 0)
}

function literale(roh: string): string {
  if (roh.startsWith('"') && roh.endsWith('"')) return JSON.parse(roh) as string
  return roh
}

function zeilePasst(zeile: OrtZeile, ausdruck: string): boolean {
  if (ausdruck.startsWith('and(') && ausdruck.endsWith(')')) {
    return oderTeile(ausdruck.slice(4, -1)).every((teil) => zeilePasst(zeile, teil))
  }
  const ilike = /^(name|keywords)\.ilike\.(.+)$/.exec(ausdruck)
  if (ilike) {
    const roh = ilike[2] ?? ''
    const muster = literale(roh).replaceAll('%', '')
    const schluessel = typeof zeile.keywords === 'string' ? zeile.keywords : Array.isArray(zeile.keywords) ? zeile.keywords.join(', ') : ''
    const feld = ilike[1] === 'name' ? zeile.name : schluessel
    if (!roh.includes('%')) return gleichGefaltet(feld, muster)
    if (roh.startsWith('%')) return gleichGefaltet(feld, muster) || feld.toLocaleLowerCase('de').includes(muster.toLocaleLowerCase('de'))
    return feld.toLocaleLowerCase('de').startsWith(muster.toLocaleLowerCase('de'))
  }
  const imatch = /^keywords\.imatch\.(.+)$/.exec(ausdruck)
  if (imatch) {
    const token = /\*\s*([^*]+?)\s*\[\[:space:\]\]/.exec(literale(imatch[1] ?? ''))?.[1] ?? ''
    const schluessel = typeof zeile.keywords === 'string' ? zeile.keywords : Array.isArray(zeile.keywords) ? zeile.keywords.join(', ') : ''
    return schluessel.split(',').some((teil) => gleichGefaltet(teil.trim(), token))
  }
  const gleich = /^(typ|country_code|iata)\.eq\.(.+)$/.exec(ausdruck)
  if (gleich) {
    const wert = literale(gleich[2] ?? '')
    if (gleich[1] === 'typ') return zeile.typ === wert
    if (gleich[1] === 'country_code') return zeile.country_code === wert
    return (zeile.iata ?? '').toUpperCase() === wert.toUpperCase()
  }
  return false
}

function filtertreu(bestand: readonly OrtZeile[]): PlacesZeilenLesen {
  return async (_art, filter, limit) => ({
    zeilen: bestand.filter((zeile) => oderTeile(filter).some((teil) => zeilePasst(zeile, teil))).slice(0, limit),
    problem: null,
  })
}

const BESTAND: OrtZeile[] = [
  WIEN,
  VIENNA_US,
  zeile('geonames:3169070', 'Rome', 'IT', 'Roma, Roma', 2_300_000),
  zeile('geonames:4219762', 'Rome', 'US', 'Rome', 36_000),
  zeile('geonames:2267057', 'Lisbon', 'PT', 'Lisboa, Lisbon', 500_000),
  zeile('geonames:2867714', 'Munich', 'DE', 'Munich, Muenchen', 1_400_000),
  zeile('geonames:2657896', 'Zurich', 'CH', 'Zürich, Zurich', 400_000),
  zeile('geonames:2660646', 'Geneva', 'CH', 'Geneve, Genève', 200_000),
  zeile('geonames:3067696', 'Prague', 'CZ', 'Praha', 1_300_000),
]

const ROM = BESTAND[2]!
const ROM_US = BESTAND[3]!
const LISSABON = BESTAND[4]!
const MUENCHEN = BESTAND[5]!

describe('de-CH-Anzeige lässt Identität und Abfragen unverändert', () => {
  test('deutsche Anzeigenamen werden vor dem Ranking als Land-Typ-Katalogzeile gelesen', async () => {
    const alias = ortAnzeigeAliasfilter('Wien')
    assert.match(alias ?? '', /typ\.eq\.city/)
    assert.match(alias ?? '', /country_code\.eq\.AT/)
    assert.match(alias ?? '', /name\.ilike\.Vienna/)
    assert.equal((alias ?? '').includes('%'), false)
    assert.equal(ortAnzeigeAliasfilter('Vienne'), null)
    assert.equal(ortNamensfilter('Wien')?.includes('country_code.eq.AT'), false)
    assert.match(ortExaktfilter('Wien') ?? '', /country_code\.eq\.AT/)
    assert.equal(ortSchluesselfilter('Wien')?.includes('name.ilike.Vienna'), false)

    const lesen = filtertreu(BESTAND)
    const deutsch = await placesSuchen('Wien', 'ziel', lesen)
    const englisch = await placesSuchen('Vienna', 'ziel', lesen)
    const lokal = await placesSuchen('Vienne', 'ziel', lesen)
    assert.equal(deutsch.problem, null)
    assert.equal(deutsch.optionen?.map((option) => option.id).join(','), WIEN.id)
    assert.equal(deutsch.optionen?.[0]?.label, 'Vienna')
    assert.equal(deutsch.optionen?.[0]?.anzeige, 'Wien')
    assert.equal(deutsch.optionen?.[0]?.id, englisch.optionen?.[0]?.id)
    assert.equal(WIEN.lat, 48.2)
    assert.equal(WIEN.lon, 16.37)
    const usa = englisch.optionen?.find((option) => option.id === VIENNA_US.id)
    assert.equal(usa?.anzeige, 'Vienna')
    assert.equal(usa?.label, 'Vienna')
    assert.equal(lokal.optionen?.[0]?.id, WIEN.id)
    assert.equal(lokal.optionen?.some((option) => option.id === VIENNA_US.id), false)

    const rom = await placesSuchen('Rom', 'ziel', lesen)
    const rome = await placesSuchen('Rome', 'ziel', lesen)
    const roma = await placesSuchen('Roma', 'ziel', lesen)
    assert.match(ortAnzeigeAliasfilter('Rom') ?? '', /country_code\.eq\.IT/)
    assert.equal((ortAnzeigeAliasfilter('Rom') ?? '').includes('country_code.eq.US'), false)
    assert.equal(rom.optionen?.[0]?.id, ROM.id)
    assert.equal(rom.optionen?.[0]?.label, 'Rome')
    assert.equal(rom.optionen?.[0]?.anzeige, 'Rom')
    assert.equal(rom.optionen?.find((option) => option.id === ROM_US.id)?.anzeige, 'Rome')
    assert.equal(rome.optionen?.[0]?.id, ROM.id)
    assert.equal(rome.optionen?.some((option) => option.id === ROM_US.id), true)
    assert.equal(roma.optionen?.map((option) => option.id).join(','), ROM.id)

    const lissabon = await placesSuchen('Lissabon', 'ziel', lesen)
    const lisbon = await placesSuchen('Lisbon', 'ziel', lesen)
    const lisboa = await placesSuchen('Lisboa', 'ziel', lesen)
    assert.equal(lissabon.optionen?.[0]?.id, LISSABON.id)
    assert.equal(lisbon.optionen?.[0]?.id, LISSABON.id)
    assert.equal(lisboa.optionen?.[0]?.id, LISSABON.id)
    assert.equal(lissabon.optionen?.[0]?.anzeige, 'Lissabon')
    assert.equal(lissabon.optionen?.[0]?.id, lisbon.optionen?.[0]?.id)

    const muenchen = await placesSuchen('München', 'ziel', lesen)
    const munich = await placesSuchen('Munich', 'ziel', lesen)
    assert.equal(muenchen.optionen?.[0]?.id, MUENCHEN.id)
    assert.equal(munich.optionen?.[0]?.id, MUENCHEN.id)
    assert.equal(muenchen.optionen?.[0]?.label, 'Munich')

    const genf = await placesSuchen('Genf', 'ziel', lesen)
    const prag = await placesSuchen('Prag', 'ziel', lesen)
    assert.equal(genf.optionen?.[0]?.label, 'Geneva')
    assert.equal(genf.optionen?.[0]?.anzeige, 'Genf')
    assert.equal(prag.optionen?.[0]?.anzeige, 'Prag')
    assert.equal(prag.optionen?.[0]?.id, 'geonames:3067696')
    const suche = readFileSync(new URL('../../components/places/OrtSuche.tsx', import.meta.url), 'utf8')
    const planer = readFileSync(new URL('../../components/trips/TripPlanner.tsx', import.meta.url), 'utf8')
    assert.match(suche, /name: option\.label/)
    assert.match(planer, /setDestination\(wert\?\.name/)
  })

  test('englischer und deutscher Suchname bleiben ein ganzer Ort', () => {
    const wien = {
      id: WIEN.id, label: 'Vienna', anzeige: 'Wien', typ: 'city' as const, countryCode: 'AT',
      description: 'Stadt · Wien, Österreich',
    }
    assert.equal(ganzerOrtGlaubwuerdig('Vienna', [wien]), true)
    assert.equal(ganzerOrtGlaubwuerdig('Wien', [wien]), true)
    assert.equal(ganzerOrtGlaubwuerdig('Wien, Österreich', [wien]), true)
  })

  test('neue Reise speichert Katalogname, Koordinaten und ID, der Titel bleibt deutsch', () => {
    const lissabon = ort({ id: 'geonames:2267057', name: 'Lisbon', countryCode: 'PT', lat: 38.71667, lon: -9.13333 })
    const graph = createZieleGraph([lissabon], { startDate: '2026-09-12', endDate: '2026-09-17' })
    assert.equal(graph.title, 'Lissabon')
    assert.equal(graph.stages[0]?.name, 'Lisbon')
    assert.equal(graph.stages[0]?.placeId, lissabon.id)
    assert.equal(graph.stages[0]?.latitude, lissabon.lat)
    assert.equal(graph.stages[0]?.longitude, lissabon.lon)
  })

  test('gespeicherte Reise zeigt de-CH, persönliche Abreise ohne Land bleibt', () => {
    assert.equal(reiseOrte({
      origin: 'Vienna',
      stages: [
        { name: 'Lisbon', position: 1, countryCode: 'PT' },
        { name: 'Vienna', position: 2, countryCode: 'US' },
        { name: 'Groß-Gerau', position: 3, countryCode: 'DE' },
      ],
    }), 'Lissabon · Vienna · Gross-Gerau · ab Vienna')
  })

  test('Reiseplan zeigt den deutschen Namen und lässt die gespeicherte Etappe stehen', () => {
    const reise = referenzReise()
    const etappe = reise.stages.find((eintrag) => eintrag.name === 'Bangkok')
    assert.ok(etappe)
    etappe.name = 'Rome'
    etappe.countryCode = 'IT'
    const modell = routeModell(reise)
    const zeile = modell.zeilen.find((eintrag) => eintrag.art === 'lauf' && eintrag.stageId === etappe.id)
    assert.equal(zeile && zeile.art === 'lauf' ? zeile.name : '', 'Rom')
    assert.equal(etappe.name, 'Rome')
    assert.equal(etappe.placeId, null)
  })

  test('Flughafenanzeige übersetzt nur die Stadt, IATA und Anbietername bleiben', () => {
    const zeile: FlughafenZeile = {
      iata: 'VIE', icao: 'LOWW', name: 'Vienna International Airport', city: 'Vienna',
      country: 'Austria', country_code: 'AT',
    }
    const option = flughafenAlsOption(zeile)
    assert.equal(option?.value, 'VIE')
    assert.equal(option?.label, 'Vienna International Airport · VIE')
    assert.match(option?.description ?? '', /Wien/)
    const usa: FlughafenZeile = { ...zeile, iata: 'VIE', city: 'Vienna', country_code: 'US', country: 'United States' }
    assert.match(flughafenAlsOption(usa)?.description ?? '', /Vienna/)
    assert.doesNotMatch(flughafenAlsOption(usa)?.description ?? '', /Wien/)
  })

  test('Hotel-Suchparameter bleibt der Katalogname', () => {
    const suche = bookingHotelSuche(
      { name: 'Lisbon', countryCode: 'PT' },
      { anreise: '2026-09-12', abreise: '2026-09-17', gaeste: 2, zimmer: 1, waehrung: 'CHF' },
      '2026-09-01',
    )
    assert.equal('ziel' in suche, true)
    if ('ziel' in suche) {
      const url = new URL(suche.ziel)
      assert.match(url.searchParams.get('ss') ?? '', /Lisbon/)
      assert.equal(url.searchParams.get('ss')?.includes('Lissabon'), false)
    }
  })

  test('KI-Etappe mit Land wird angezeigt, Freitext und fehlendes Land nicht', () => {
    assert.equal(ortAnzeigeName({ name: 'Prague', countryCode: 'CZ' }), 'Prag')
    assert.equal(ortAnzeigeName({ name: 'Ein Wochenende in Prague', countryCode: 'CZ' }), 'Ein Wochenende in Prague')
    assert.equal(ortAnzeigeName({ name: 'Prague', countryCode: null }), 'Prague')
  })
})
