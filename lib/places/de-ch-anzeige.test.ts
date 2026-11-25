import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { flughafenAlsOption, type FlughafenZeile } from '@/lib/airports/suche'
import { ganzerOrtGlaubwuerdig } from '@/lib/places/route-intent'
import type { OrtZeile } from '@/lib/places/abbildung'
import { placesSuchen } from '@/lib/places/suche-lauf'
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

describe('de-CH-Anzeige lässt Identität und Abfragen unverändert', () => {
  test('Wien und Vienna treffen denselben Ort, Vienna in den USA nicht', async () => {
    const lesen = async () => ({ zeilen: [WIEN, VIENNA_US], problem: null })
    const deutsch = await placesSuchen('Wien', 'ziel', lesen)
    const englisch = await placesSuchen('Vienna', 'ziel', lesen)
    assert.equal(deutsch.problem, null)
    assert.equal(englisch.problem, null)
    assert.equal(deutsch.optionen?.[0]?.id, WIEN.id)
    assert.equal(englisch.optionen?.[0]?.id, WIEN.id)
    assert.equal(deutsch.optionen?.[0]?.label, 'Vienna')
    assert.equal(deutsch.optionen?.[0]?.anzeige, 'Wien')
    assert.match(deutsch.optionen?.[0]?.ariaLabel ?? '', /^Wien,/)
    assert.equal(deutsch.optionen?.some((option) => option.id === VIENNA_US.id), false)
    const usa = englisch.optionen?.find((option) => option.id === VIENNA_US.id)
    assert.equal(usa?.label, 'Vienna')
    assert.equal(usa?.anzeige, 'Vienna')
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
