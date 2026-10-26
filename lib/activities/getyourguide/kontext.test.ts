import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { anwendungsFreigabe, type GetYourGuideFreigabe } from '@/lib/activities/getyourguide/freigabe'
import {
  gygPlanen,
  gygReiseAusTrip,
  type GygEtappe,
  type GygPlanEingabe,
  type GygReise,
  type GygTag,
} from '@/lib/activities/getyourguide/kontext'
import type { GygZielabbildung } from '@/lib/activities/getyourguide/widget'
import type { Ort } from '@/lib/places/domain'
import { geoNamesTsvZeile, laenderAusCountryInfo, orteAusGeoNames } from '@/lib/places/importieren'

const OFFEN: GetYourGuideFreigabe = { status: 'bereit' }

function bestand(): Ort[] {
  const hier = dirname(fileURLToPath(import.meta.url))
  const wurzel = join(hier, '../../places/fixtures')
  const zeilen = readFileSync(join(wurzel, 'geonames.tsv'), 'utf8')
    .split(/\r?\n/)
    .map(geoNamesTsvZeile)
    .filter((zeile): zeile is NonNullable<typeof zeile> => Boolean(zeile))
  const laender = laenderAusCountryInfo(readFileSync(join(wurzel, 'countries.txt'), 'utf8'))
  return orteAusGeoNames({ zeilen, laender }).orte
}

function synthetisch(teil: Pick<Ort, 'id' | 'name' | 'typ' | 'countryCode' | 'country'>): Ort {
  return {
    id: teil.id,
    source: 'geonames',
    sourceId: teil.id.slice('geonames:'.length),
    name: teil.name,
    typ: teil.typ,
    country: teil.country,
    countryCode: teil.countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const orte = bestand()
const bangkok = orte.find((ort) => ort.id === 'geonames:1609350')
const thailand = orte.find((ort) => ort.id === 'geonames:1605651')
if (!bangkok || bangkok.typ !== 'city') throw new Error('Fixture Bangkok-Stadt fehlt')
if (!thailand || thailand.typ !== 'country') throw new Error('Fixture Thailand fehlt')

const bangkokRegion = synthetisch({
  id: 'geonames:9001609348',
  name: 'Bangkok',
  typ: 'region',
  country: 'Thailand',
  countryCode: 'TH',
})
const phuket = synthetisch({
  id: 'geonames:9001151254',
  name: 'Phuket',
  typ: 'city',
  country: 'Thailand',
  countryCode: 'TH',
})
const panama = synthetisch({
  id: 'geonames:9003703430',
  name: 'Panama',
  typ: 'country',
  country: 'Panama',
  countryCode: 'PA',
})
const panamaStadt = synthetisch({
  id: 'geonames:9003703443',
  name: 'Panama City',
  typ: 'city',
  country: 'Panama',
  countryCode: 'PA',
})
const insel = synthetisch({
  id: 'geonames:9001606376',
  name: 'Koh Samui',
  typ: 'island',
  country: 'Thailand',
  countryCode: 'TH',
})
const flughafen = synthetisch({
  id: 'airport:BKK',
  name: 'Bangkok',
  typ: 'airport',
  country: 'Thailand',
  countryCode: 'TH',
})

const katalog = [bangkok, bangkokRegion, thailand, phuket, panama, panamaStadt, insel, flughafen]

const ABBILDUNG: readonly GygZielabbildung[] = [
  { art: 'ort', ortId: bangkok.id, typ: 'city', kennung: 'synthetic-public:bangkok-city' },
  { art: 'ort', ortId: bangkokRegion.id, typ: 'region', kennung: 'synthetic-public:bangkok-region' },
  { art: 'ort', ortId: phuket.id, typ: 'city', kennung: 'synthetic-public:phuket-city' },
  { art: 'ort', ortId: panamaStadt.id, typ: 'city', kennung: 'synthetic-public:panama-city' },
  { art: 'ort', ortId: insel.id, typ: 'city', kennung: 'synthetic-public:samui-als-stadt' },
  { art: 'land', countryCode: 'TH', kennung: 'synthetic-public:thailand' },
  { art: 'land', countryCode: 'PA', kennung: 'synthetic-public:panama' },
]

function leserFuer(liste: readonly Ort[], aufrufe: string[]) {
  return (id: string) => {
    aufrufe.push(id)
    return liste.find((ort) => ort.id === id) ?? null
  }
}

function eingabe(teil: Partial<GygPlanEingabe> & Pick<GygPlanEingabe, 'reise' | 'umfang'>): GygPlanEingabe {
  return {
    angeforderteTagId: null,
    landWahl: null,
    freigabe: OFFEN,
    orteLesen: null,
    abbildung: ABBILDUNG,
    ...teil,
  }
}

function etappe(id: string, placeId: string | null, countryCode: string | null = null): GygEtappe {
  return { id, placeId, countryCode }
}

function tag(id: string, stageId: string | null): GygTag {
  return { id, stageId }
}

function reise(etappen: GygEtappe[], tage: GygTag[] = []): GygReise {
  return { id: 'trip-gyg-1', etappen, tage }
}

describe('GetYourGuide-Kontext', () => {
  test('die Anwendung liest bei geschlossener Freigabe keinen Ort', () => {
    const aufrufe: string[] = []
    const plan = gygPlanen(
      eingabe({
        freigabe: anwendungsFreigabe(),
        orteLesen: leserFuer(katalog, aufrufe),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    assert.equal(plan.art, 'geschlossen')
    assert.deepEqual(aufrufe, [])
    if (plan.art === 'geschlossen') assert.deepEqual(plan.gruende, ['konfiguration', 'berechtigung', 'analyzer', 'manueller_widget'])
  })

  test('ein ungültiger Tag fällt nicht auf den ersten Tag zurück', () => {
    const aufrufe: string[] = []
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, aufrufe),
        umfang: 'tag',
        angeforderteTagId: 'day-fehlt',
        reise: reise([etappe('stage-gyg-phu', phuket.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-phu')]),
      }),
    )
    assert.equal(plan.art, 'tag_ungueltig')
    assert.deepEqual(aufrufe, [])
    assert.equal(plan.schluessel.includes('stage-gyg-phu'), false)
    assert.equal(plan.schluessel.includes(phuket.id), false)
    assert.equal(JSON.stringify(plan).includes('synthetic-public:phuket-city'), false)
  })

  test('eine fehlende Etappe benutzt nicht die erste Etappe', () => {
    const aufrufe: string[] = []
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, aufrufe),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise(
          [etappe('stage-gyg-phu', phuket.id, 'TH')],
          [tag('day-gyg-1', 'stage-weg')],
        ),
      }),
    )
    assert.equal(plan.art, 'etappe_fehlt')
    assert.deepEqual(aufrufe, [])
    assert.equal(plan.schluessel.includes(phuket.id), false)
    assert.equal(plan.schluessel.includes('stage-gyg-phu'), false)
  })

  test('Stadt und Region Bangkok bleiben verschiedene Ziele', () => {
    const stadt = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    const region = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-2',
        reise: reise([etappe('stage-gyg-reg', bangkokRegion.id, 'TH')], [tag('day-gyg-2', 'stage-gyg-reg')]),
      }),
    )
    assert.equal(stadt.art, 'bereit')
    assert.equal(region.art, 'bereit')
    if (stadt.art !== 'bereit' || region.art !== 'bereit') return
    assert.equal(stadt.zielArt, 'stadt')
    assert.equal(region.zielArt, 'region')
    assert.equal(stadt.name, 'Bangkok')
    assert.equal(region.name, 'Bangkok')
    assert.notEqual(stadt.schluessel, region.schluessel)
    assert.equal(stadt.bezug.oeffentlicheKennung, 'synthetic-public:bangkok-city')
    assert.equal(region.bezug.oeffentlicheKennung, 'synthetic-public:bangkok-region')
    assert.deepEqual(Object.keys(stadt.bezug).sort(), ['anbieter', 'oeffentlicheKennung', 'umfang'])
    assert.equal(JSON.stringify(stadt.bezug).includes('trip-gyg-1'), false)
    assert.equal(JSON.stringify(stadt.bezug).includes('CHF'), false)
  })

  test('Thailand am Reisetag ist kein Stadtziel', () => {
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-th', thailand.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-th')]),
      }),
    )
    assert.equal(plan.art, 'kein_tagesziel')
    if (plan.art !== 'kein_tagesziel') return
    assert.equal(plan.name, 'Thailand')
    assert.equal(JSON.stringify(plan).includes('synthetic-public'), false)
  })

  test('Panama ohne Tage und ohne San Blas bleibt das Land', () => {
    const aufrufe: string[] = []
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, aufrufe),
        umfang: 'land',
        reise: reise([etappe('stage-gyg-pa', panama.id, 'PA')]),
      }),
    )
    assert.equal(plan.art, 'bereit')
    assert.deepEqual(aufrufe, [panama.id])
    if (plan.art !== 'bereit') return
    assert.equal(plan.zielArt, 'land')
    assert.equal(plan.name, 'Panama')
    assert.equal(plan.bezug.umfang, 'land')
    assert.equal(plan.bezug.oeffentlicheKennung, 'synthetic-public:panama')
    const text = JSON.stringify(plan)
    assert.equal(text.includes('Panama City'), false)
    assert.equal(text.includes('synthetic-public:panama-city'), false)
    assert.equal(text.includes('San Blas'), false)
    assert.equal(text.includes('abreise'), false)
    assert.deepEqual(Object.keys(plan).sort(), ['art', 'bezug', 'name', 'schluessel', 'zielArt'])
  })

  test('eine Stadt in Panama wird nicht zum Land und Panama City nicht erfunden', () => {
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        reise: reise([etappe('stage-gyg-pac', panamaStadt.id, 'PA'), etappe('stage-gyg-pa', panama.id, 'PA')]),
      }),
    )
    assert.equal(plan.art, 'bereit')
    if (plan.art !== 'bereit') return
    assert.equal(plan.bezug.oeffentlicheKennung, 'synthetic-public:panama')
    assert.equal(JSON.stringify(plan).includes('Panama City'), false)
  })

  test('mehrere Länder bleiben eine Auswahl', () => {
    const plan = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        reise: reise([
          etappe('stage-gyg-bkk', bangkok.id, 'TH'),
          etappe('stage-gyg-pa', panama.id, 'PA'),
        ]),
      }),
    )
    assert.equal(plan.art, 'land_auswahl')
    if (plan.art !== 'land_auswahl') return
    assert.deepEqual(
      plan.laender.map((land) => land.countryCode),
      ['PA', 'TH'],
    )
    assert.equal(plan.laender.some((land) => land.name === 'Bangkok'), false)
    const gewaehlt = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        landWahl: 'PA',
        reise: reise([
          etappe('stage-gyg-bkk', bangkok.id, 'TH'),
          etappe('stage-gyg-pa', panama.id, 'PA'),
        ]),
      }),
    )
    assert.equal(gewaehlt.art, 'bereit')
    if (gewaehlt.art !== 'bereit') return
    assert.equal(gewaehlt.bezug.oeffentlicheKennung, 'synthetic-public:panama')
  })

  test('eine Stadt wird nicht still zum Land', () => {
    const offen = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')]),
      }),
    )
    assert.equal(offen.art, 'land_auswahl')
    if (offen.art !== 'land_auswahl') return
    assert.deepEqual(offen.laender, [{ countryCode: 'TH', name: bangkok.country ?? 'TH' }])
    const gewaehlt = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        landWahl: 'TH',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')]),
      }),
    )
    assert.equal(gewaehlt.art, 'bereit')
    if (gewaehlt.art !== 'bereit') return
    assert.equal(gewaehlt.bezug.umfang, 'land')
    assert.equal(gewaehlt.bezug.oeffentlicheKennung, 'synthetic-public:thailand')
  })

  test('Name, stage-Kennung und falsche Rückgabe sind keine Zuordnung', () => {
    const ohneId = gygPlanen(
      eingabe({
        orteLesen: () => {
          throw new Error('lookup')
        },
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', null, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    assert.equal(ohneId.art, 'ort_unbestaetigt')

    const aufrufe: string[] = []
    const falscheForm = gygPlanen(
      eingabe({
        orteLesen: (id) => {
          aufrufe.push(id)
          return bangkok
        },
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-x', 'stage:bangkok', null)], [tag('day-gyg-1', 'stage-gyg-x')]),
      }),
    )
    assert.equal(falscheForm.art, 'ort_unbestaetigt')
    assert.equal(aufrufe.length, 0)

    const falsch = gygPlanen(
      eingabe({
        orteLesen: (id) => {
          aufrufe.push(id)
          return bangkok
        },
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-2',
        reise: reise([etappe('stage-gyg-pa', panama.id, 'PA')], [tag('day-gyg-2', 'stage-gyg-pa')]),
      }),
    )
    assert.equal(falsch.art, 'ort_unbestaetigt')
    assert.deepEqual(aufrufe, [panama.id])
    assert.equal(JSON.stringify(falsch).includes('synthetic-public:bangkok-city'), false)
  })

  test('widersprüchliches Land, unbekannte ID und falscher Typ bleiben offen', () => {
    const widerspruch = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'FR')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    assert.equal(widerspruch.art, 'ort_widerspruch')

    const unbekannt = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-x', 'geonames:404', null)], [tag('day-gyg-1', 'stage-gyg-x')]),
      }),
    )
    assert.equal(unbekannt.art, 'ort_unbestaetigt')

    const typ = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-sam', insel.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-sam')]),
      }),
    )
    assert.equal(typ.art, 'nicht_unterstuetzt')
    assert.equal(JSON.stringify(typ).includes('synthetic-public:samui-als-stadt'), false)

    const airport = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-air', flughafen.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-air')]),
      }),
    )
    assert.equal(airport.art, 'nicht_unterstuetzt')
  })

  test('dieselbe Stadt an zwei Etappen bleibt zwei Vorkommen', () => {
    const hin = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise(
          [etappe('stage-gyg-hin', bangkok.id, 'TH'), etappe('stage-gyg-rueck', bangkok.id, 'TH')],
          [tag('day-gyg-1', 'stage-gyg-hin'), tag('day-gyg-2', 'stage-gyg-rueck')],
        ),
      }),
    )
    const rueck = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-2',
        reise: reise(
          [etappe('stage-gyg-hin', bangkok.id, 'TH'), etappe('stage-gyg-rueck', bangkok.id, 'TH')],
          [tag('day-gyg-1', 'stage-gyg-hin'), tag('day-gyg-2', 'stage-gyg-rueck')],
        ),
      }),
    )
    assert.equal(hin.art, 'bereit')
    assert.equal(rueck.art, 'bereit')
    if (hin.art !== 'bereit' || rueck.art !== 'bereit') return
    assert.notEqual(hin.schluessel, rueck.schluessel)
    assert.deepEqual(hin.bezug, rueck.bezug)
  })

  test('die Reiseabbildung trägt keine privaten Suchfelder', () => {
    const aus = gygReiseAusTrip({
      id: 'trip-gyg-1',
      stages: [{ id: 'stage-gyg-bkk', countryCode: 'TH', placeId: bangkok.id }],
      days: [{ id: 'day-gyg-1', stageId: 'stage-gyg-bkk' }],
    })
    assert.deepEqual(Object.keys(aus).sort(), ['etappen', 'id', 'tage'])
    assert.deepEqual(Object.keys(aus.etappen[0] ?? {}).sort(), ['countryCode', 'id', 'placeId'])
    assert.equal(JSON.stringify(aus).includes('CHF'), false)
  })
})
