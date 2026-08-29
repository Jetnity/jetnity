import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { OrtZeile } from '@/lib/places/abbildung'
import { ortAusZeile } from '@/lib/places/abbildung'
import { orteOrdnen } from '@/lib/places/suche'
import { placesSuchen, type PlacesSuchart, type PlacesZeilenLesen } from '@/lib/places/suche-lauf'

function zeile(teil: Partial<OrtZeile> & Pick<OrtZeile, 'id' | 'name' | 'typ'>): OrtZeile {
  return {
    source: 'geonames',
    source_id: String(teil.id).replace(/^geonames:/, ''),
    country: 'Unknown',
    country_code: 'XX',
    region: null,
    lat: 0,
    lon: 0,
    iata: null,
    keywords: null,
    ...teil,
  }
}

const peruLand = zeile({
  id: 'geonames:3932488',
  name: 'Republic of Peru',
  typ: 'country',
  country: 'Peru',
  country_code: 'PE',
  keywords: 'Peru, Peru, Republic of Peru, Perú, Pérou',
})

const chinaLand = zeile({
  id: 'geonames:1814991',
  name: 'People’s Republic of China',
  typ: 'country',
  country: 'China',
  country_code: 'CN',
  keywords: 'China, China, People’s Republic of China, PRC, Zhongguo',
})

const schweizLand = zeile({
  id: 'geonames:2658434',
  name: 'Switzerland',
  typ: 'country',
  country: 'Switzerland',
  country_code: 'CH',
  keywords: 'Switzerland, Schweiz, Suisse, Svizzera, Swiss Confederation',
})

const ruritanienLand = zeile({
  id: 'geonames:9000001',
  name: 'Republic of Ruritania',
  typ: 'country',
  country: 'Ruritania',
  country_code: 'RR',
  keywords: 'Ruritanien, Ruritania, Republic of Ruritania',
})

const peruStaedte: OrtZeile[] = [
  zeile({
    id: 'geonames:4901424',
    name: 'Peru',
    typ: 'city',
    country: 'United States',
    country_code: 'US',
    region: 'Illinois',
    keywords: 'Peru, Peru, Illinois',
  }),
  zeile({
    id: 'geonames:4924733',
    name: 'Peru',
    typ: 'city',
    country: 'United States',
    country_code: 'US',
    region: 'Indiana',
    keywords: 'Peru, Peru, Indiana',
  }),
  zeile({
    id: 'geonames:5132616',
    name: 'Peru',
    typ: 'city',
    country: 'United States',
    country_code: 'US',
    region: 'New York',
    keywords: 'Peru, Peru, New York',
  }),
]

const chinaStaedte: OrtZeile[] = [
  zeile({
    id: 'geonames:1864090',
    name: 'China',
    typ: 'city',
    country: 'Japan',
    country_code: 'JP',
    region: 'Kagoshima',
    keywords: 'China, China, Kagoshima',
  }),
  zeile({
    id: 'geonames:4014336',
    name: 'China',
    typ: 'city',
    country: 'Mexico',
    country_code: 'MX',
    region: 'Nuevo León',
    keywords: 'China, China, Nuevo Leon',
  }),
]

function leser(zuordnung: Partial<Record<PlacesSuchart, OrtZeile[]>>): {
  lesen: PlacesZeilenLesen
  aufrufe: PlacesSuchart[]
} {
  const aufrufe: PlacesSuchart[] = []
  return {
    aufrufe,
    lesen: async (art) => {
      aufrufe.push(art)
      return { zeilen: zuordnung[art] ?? [], problem: null }
    },
  }
}

describe('Ortssuche-Lauf / Production-Zeilenform', () => {
  test('PostgREST-Zeile -> ortAusZeile -> Ranking stellt Peru vor Gleichnam-Städte', () => {
    const orte = [peruLand, ...peruStaedte].map((eintrag) => ortAusZeile(eintrag))
    assert.ok(orte.every(Boolean))
    const optionen = orteOrdnen(orte.filter((ort) => ort !== null), 'Peru', 'ziel')
    assert.equal(optionen[0]?.id, peruLand.id)
    assert.equal(optionen[0]?.typ, 'country')
    assert.ok(optionen.some((option) => option.id === peruStaedte[0]?.id))
  })

  test('dieselbe Zeilenform gilt für China, Schweiz und ein generisches Alias', () => {
    const china = [chinaLand, ...chinaStaedte]
      .map((eintrag) => ortAusZeile(eintrag))
      .filter((ort) => ort !== null)
    assert.equal(orteOrdnen(china, 'China', 'ziel')[0]?.id, chinaLand.id)

    const schweiz = [
      schweizLand,
      zeile({
        id: 'geonames:956817',
        name: 'Schweizer-Reneke',
        typ: 'city',
        country: 'South Africa',
        country_code: 'ZA',
        region: 'North West',
        keywords: 'Schweizer-Reneke, Schweizer Reneke',
      }),
    ]
      .map((eintrag) => ortAusZeile(eintrag))
      .filter((ort) => ort !== null)
    assert.equal(orteOrdnen(schweiz, 'Schweiz', 'ziel')[0]?.id, schweizLand.id)

    const generic = [
      ruritanienLand,
      zeile({
        id: 'geonames:9000002',
        name: 'Ruritanien',
        typ: 'city',
        country: 'United States',
        country_code: 'US',
        region: 'Ohio',
        keywords: 'Ruritanien, Ruritanien, Ohio',
      }),
    ]
      .map((eintrag) => ortAusZeile(eintrag))
      .filter((ort) => ort !== null)
    assert.equal(orteOrdnen(generic, 'Ruritanien', 'ziel')[0]?.id, ruritanienLand.id)
  })

  test('Array-Keywords aus einer Zeile werden vor dem Ranking normalisiert', () => {
    const land = ortAusZeile(
      zeile({
        ...peruLand,
        keywords: ['Peru', 'Republic of Peru', 'Perú'],
      }),
    )
    const stadt = ortAusZeile(peruStaedte[0]!)
    assert.ok(land)
    assert.ok(stadt)
    const optionen = orteOrdnen([stadt, land], 'Peru', 'ziel')
    assert.equal(optionen[0]?.id, peruLand.id)
  })

  test('Namensmenge ohne Land zieht das Land nach und rangiert es zuerst', async () => {
    const { lesen, aufrufe } = leser({
      name: peruStaedte,
      land: [peruLand],
    })
    const ergebnis = await placesSuchen('Peru', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    assert.equal(ergebnis.optionen?.[0]?.id, peruLand.id)
    assert.equal(ergebnis.optionen?.[0]?.typ, 'country')
    assert.ok(ergebnis.optionen?.some((option) => option.id === peruStaedte[0]?.id))
    assert.deepEqual(aufrufe, ['name', 'land'])
  })

  test('ist das Land schon in der Namensmenge, bleibt der Nachzug aus und das Land steht vorn', async () => {
    const { lesen, aufrufe } = leser({
      name: [...peruStaedte, peruLand],
      land: [peruLand],
    })
    const ergebnis = await placesSuchen('Peru', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    assert.equal(ergebnis.optionen?.[0]?.id, peruLand.id)
    assert.deepEqual(aufrufe, ['name'])
  })

  test('China- und Schweiz-Retrieval folgen demselben Lauf', async () => {
    const china = leser({
      name: chinaStaedte,
      land: [chinaLand],
    })
    const chinaErgebnis = await placesSuchen('China', 'ziel', china.lesen)
    assert.equal(chinaErgebnis.optionen?.[0]?.id, chinaLand.id)
    assert.deepEqual(china.aufrufe, ['name', 'land'])

    const schweiz = leser({
      name: [
        zeile({
          id: 'geonames:956817',
          name: 'Schweizer-Reneke',
          typ: 'city',
          country: 'South Africa',
          country_code: 'ZA',
          region: 'North West',
          keywords: 'Schweizer-Reneke, Schweizer Reneke',
        }),
      ],
      land: [schweizLand],
    })
    const schweizErgebnis = await placesSuchen('Schweiz', 'ziel', schweiz.lesen)
    assert.equal(schweizErgebnis.optionen?.[0]?.id, schweizLand.id)
    assert.equal(schweizErgebnis.optionen?.[0]?.label, 'Switzerland')
    assert.ok(schweiz.aufrufe.includes('land'))
  })

  test('Abreise holt Flughäfen, aber kein Länder-Alias', async () => {
    const { lesen, aufrufe } = leser({
      name: [
        zeile({
          id: 'geonames:2657896',
          name: 'Zürich',
          typ: 'city',
          country: 'Switzerland',
          country_code: 'CH',
          region: 'Zürich',
          keywords: 'Zurich, Zürich',
        }),
      ],
      'abreise-flughafen': [
        zeile({
          id: 'airport:ZRH',
          source: 'ourairports',
          source_id: 'ZRH',
          name: 'Zürich Airport',
          typ: 'airport',
          country: 'Switzerland',
          country_code: 'CH',
          region: 'Zürich',
          iata: 'ZRH',
          keywords: 'Zürich, Zurich, ZRH',
        }),
      ],
      land: [schweizLand],
    })
    const ergebnis = await placesSuchen('Zürich', 'abreise', lesen)
    assert.equal(ergebnis.problem, null)
    assert.equal(ergebnis.optionen?.[0]?.id, 'geonames:2657896')
    assert.ok(ergebnis.optionen?.some((option) => option.id === 'airport:ZRH'))
    assert.equal(ergebnis.optionen?.some((option) => option.typ === 'country'), false)
    assert.equal(aufrufe.includes('land'), false)
    assert.ok(aufrufe.includes('abreise-flughafen'))
  })
})
