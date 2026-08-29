import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { OrtZeile } from '@/lib/places/abbildung'
import { ortAusZeile } from '@/lib/places/abbildung'
import { ORT_LAND_UNIVERSUM, ortIstExaktesLandAlias, orteOrdnen } from '@/lib/places/suche'
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
  limits: Partial<Record<PlacesSuchart, number>>
} {
  const aufrufe: PlacesSuchart[] = []
  const limits: Partial<Record<PlacesSuchart, number>> = {}
  return {
    aufrufe,
    limits,
    lesen: async (art, _filter, limit) => {
      aufrufe.push(art)
      limits[art] = limit
      return { zeilen: (zuordnung[art] ?? []).slice(0, limit), problem: null }
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

  test('ist das Land schon in der Namensmenge, bleibt der selektive Nachzug vollständig und das Land steht vorn', async () => {
    const { lesen, aufrufe, limits } = leser({
      name: [...peruStaedte, peruLand],
      land: [peruLand],
    })
    const ergebnis = await placesSuchen('Peru', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    assert.equal(ergebnis.optionen?.[0]?.id, peruLand.id)
    assert.deepEqual(aufrufe, ['name', 'land'])
    assert.equal(limits.land, ORT_LAND_UNIVERSUM)
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
    assert.equal(schweizErgebnis.optionen?.[0]?.label, 'Schweiz')
    assert.equal(schweizErgebnis.optionen?.[0]?.description, 'Land')
    assert.ok(schweiz.aufrufe.includes('land'))
  })

  test('zwei Länder mit demselben Alias bleiben im Retrieval-Lauf unterscheidbar', async () => {
    const norden = zeile({
      id: 'geonames:9100001',
      name: 'Northern Sylvani Federation',
      typ: 'country',
      country: 'Northern Sylvani Federation',
      country_code: 'NS',
      keywords: 'Sylvani, Northern Sylvani Federation',
    })
    const sueden = zeile({
      id: 'geonames:9100002',
      name: 'Southern Sylvani Republic',
      typ: 'country',
      country: 'Southern Sylvani Republic',
      country_code: 'SS',
      keywords: 'Sylvani, Southern Sylvani Republic',
    })
    const { lesen } = leser({
      name: [
        zeile({
          id: 'geonames:9100003',
          name: 'Sylvani',
          typ: 'city',
          country: 'United States',
          country_code: 'US',
          region: 'Iowa',
          keywords: 'Sylvani, Sylvani, Iowa',
        }),
      ],
      land: [norden, sueden],
    })
    const ergebnis = await placesSuchen('Sylvani', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    const laender = ergebnis.optionen?.filter((option) => option.typ === 'country') ?? []
    assert.equal(laender.length, 2)
    assert.ok(laender.every((option) => option.label === 'Sylvani'))
    assert.notEqual(laender[0]?.description, laender[1]?.description)
    assert.ok(laender.every((option) => (option.ariaLabel ?? '').includes('Land ·')))
    assert.ok(ergebnis.optionen?.some((option) => option.id === 'geonames:9100003'))
  })

  test('kurzes exaktes Länder-Alias überlebt Substring-Lärm über dem alten Limit 12', async () => {
    const laerm = Array.from({ length: 15 }, (_, index) =>
      zeile({
        id: `geonames:${9300000 + index}`,
        name: `Zxyland Province ${index + 1}`,
        typ: 'country',
        country: `Zxyland ${index + 1}`,
        country_code: `X${index}`,
        keywords: `Zxyland, Noise ${index + 1}`,
      }),
    )
    const norden = zeile({
      id: 'geonames:9300100',
      name: 'Northern Zaxony Federation',
      typ: 'country',
      country: 'Northern Zaxony Federation',
      country_code: 'QZ',
      keywords: 'ZX, Northern Zaxony Federation',
    })
    const sueden = zeile({
      id: 'geonames:9300101',
      name: 'Southern Zaxony Republic',
      typ: 'country',
      country: 'Southern Zaxony Republic',
      country_code: 'QY',
      keywords: 'ZX, Southern Zaxony Republic',
    })
    const stadt = zeile({
      id: 'geonames:9300102',
      name: 'Zxyland City',
      typ: 'city',
      country: 'United States',
      country_code: 'US',
      region: 'Iowa',
      keywords: 'Zxyland, ZX',
    })
    let landLimit = 0
    let landFilter = 'unset'
    const lesen: PlacesZeilenLesen = async (art, filter, limit) => {
      if (art === 'name') return { zeilen: [stadt], problem: null }
      if (art === 'land') {
        landLimit = limit
        landFilter = filter
        const pool = [...laerm, norden, sueden]
        const substring = pool.filter((eintrag) => {
          const text = `${eintrag.name} ${eintrag.keywords ?? ''}`
          return text.toLowerCase().includes('zx')
        })
        const exakt = pool.filter((eintrag) => {
          const ort = ortAusZeile(eintrag)
          return Boolean(ort && ortIstExaktesLandAlias(ort, 'ZX'))
        })
        const quelle = filter === ''
          ? pool
          : filter.includes('keywords.ilike.%')
            ? substring
            : exakt
        return { zeilen: quelle.slice(0, limit), problem: null }
      }
      return { zeilen: [], problem: null }
    }
    const ergebnis = await placesSuchen('ZX', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    assert.notEqual(landFilter, '')
    assert.equal(landFilter.includes('keywords.ilike.%'), false)
    assert.ok(landLimit > 12)
    assert.equal(landLimit, ORT_LAND_UNIVERSUM)
    const laender = ergebnis.optionen?.filter((option) => option.typ === 'country') ?? []
    const exakt = laender.filter((option) => option.id === norden.id || option.id === sueden.id)
    assert.equal(exakt.length, 2)
    assert.ok(exakt.every((option) => option.label === 'ZX'))
    assert.notEqual(exakt[0]?.description, exakt[1]?.description)
    assert.equal(ergebnis.optionen?.[0]?.typ, 'country')
    assert.equal(ergebnis.optionen?.[1]?.typ, 'country')
    assert.ok(ergebnis.optionen?.some((option) => option.id === stadt.id))
    const stadtIndex = ergebnis.optionen?.findIndex((option) => option.id === stadt.id) ?? -1
    const letzterExakt = Math.max(
      ergebnis.optionen?.findIndex((option) => option.id === norden.id) ?? -1,
      ergebnis.optionen?.findIndex((option) => option.id === sueden.id) ?? -1,
    )
    assert.ok(stadtIndex > letzterExakt)
  })

  test('eine normale Stadt-Query überträgt nicht das ganze Länder-Universum', async () => {
    const stadt = zeile({
      id: 'geonames:2988507',
      name: 'Paris',
      typ: 'city',
      country: 'France',
      country_code: 'FR',
      region: 'Île-de-France',
      keywords: 'Paris, Ville de Paris',
    })
    const universum = Array.from({ length: 240 }, (_, index) =>
      zeile({
        id: `geonames:${9400000 + index}`,
        name: `Country ${index + 1}`,
        typ: 'country',
        country: `Country ${index + 1}`,
        country_code: 'ZZ',
        keywords: `Country ${index + 1}, Nation ${index + 1}`,
      }),
    )
    let landFilter = 'unset'
    let uebertragen = -1
    const lesen: PlacesZeilenLesen = async (art, filter, limit) => {
      if (art === 'name') return { zeilen: [stadt], problem: null }
      if (art === 'land') {
        landFilter = filter
        const quelle = filter === ''
          ? universum
          : universum.filter((eintrag) => {
              const ort = ortAusZeile(eintrag)
              return Boolean(ort && ortIstExaktesLandAlias(ort, 'Paris'))
            })
        const zeilen = quelle.slice(0, limit)
        uebertragen = zeilen.length
        return { zeilen, problem: null }
      }
      return { zeilen: [], problem: null }
    }
    const ergebnis = await placesSuchen('Paris', 'ziel', lesen)
    assert.equal(ergebnis.problem, null)
    assert.notEqual(landFilter, '')
    assert.equal(landFilter.includes('keywords.ilike.%'), false)
    assert.equal(uebertragen, 0)
    assert.equal(ergebnis.optionen?.[0]?.id, stadt.id)
    assert.equal(ergebnis.optionen?.some((option) => option.typ === 'country'), false)
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
