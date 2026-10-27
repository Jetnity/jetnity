import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { landName } from '@/lib/country/darstellung'
import { anwendungsFreigabe, geschlosseneFreigabe, type GetYourGuideFreigabe } from '@/lib/activities/getyourguide/freigabe'
import {
  gygOrtAnfrage,
  gygPlanen,
  gygReiseAusTrip,
  type GygEtappe,
  type GygPlan,
  type GygPlanEingabe,
  type GygReise,
  type GygTag,
} from '@/lib/activities/getyourguide/kontext'
import { suchanfrageText } from '@/lib/activities/getyourguide/suche'
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

function sucheVon(plan: GygPlan) {
  assert.equal(plan.art, 'bereit')
  if (plan.art !== 'bereit') throw new Error('Plan nicht bereit')
  assert.equal('oeffentlicheKennung' in plan.suche, false)
  assert.equal(JSON.stringify(plan.suche).includes('geonames:'), false)
  assert.equal(JSON.stringify(plan.suche).includes('trip-gyg'), false)
  assert.equal(JSON.stringify(plan.suche).includes('synthetic-public'), false)
  assert.equal(plan.suche.land, landName(plan.suche.countryCode, 'de'))
  return plan.suche
}

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
  test('eine geschlossene Freigabe liest keinen Ort, die Anwendung sucht ohne Kennung', () => {
    const aufrufe: string[] = []
    const plan = gygPlanen(
      eingabe({
        freigabe: geschlosseneFreigabe(),
        orteLesen: leserFuer(katalog, aufrufe),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    assert.equal(plan.art, 'geschlossen')
    assert.deepEqual(aufrufe, [])
    if (plan.art === 'geschlossen') assert.deepEqual(plan.gruende, ['konfiguration', 'berechtigung', 'analyzer', 'manueller_widget'])
    assert.equal(anwendungsFreigabe().status, 'bereit')
    const offen = gygPlanen(
      eingabe({
        freigabe: anwendungsFreigabe(),
        orteLesen: leserFuer(katalog, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-1',
        reise: reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      }),
    )
    const suche = sucheVon(offen)
    assert.equal(suche.umfang, 'stadt')
    assert.equal(suche.name, 'Bangkok')
    assert.equal(suche.countryCode, 'TH')
    assert.equal(suchanfrageText(suche), `Bangkok ${suche.land}`)
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
    const stadtSuche = sucheVon(stadt)
    const regionSuche = sucheVon(region)
    assert.equal(stadtSuche.umfang, 'stadt')
    assert.equal(regionSuche.umfang, 'region')
    assert.equal(stadtSuche.name, 'Bangkok')
    assert.equal(regionSuche.name, 'Bangkok')
    assert.equal(suchanfrageText(stadtSuche), suchanfrageText(regionSuche))
    assert.notEqual(stadtSuche.umfang, regionSuche.umfang)
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
    const suche = sucheVon(plan)
    assert.equal(suche.umfang, 'land')
    assert.equal(suche.countryCode, 'PA')
    assert.equal(suchanfrageText(suche), suche.land)
    const text = JSON.stringify(plan)
    assert.equal(text.includes('Panama City'), false)
    assert.equal(text.includes('synthetic-public:panama-city'), false)
    assert.equal(text.includes('San Blas'), false)
    assert.equal(text.includes('abreise'), false)
    assert.deepEqual(Object.keys(plan).sort(), ['art', 'name', 'schluessel', 'suche', 'zielArt'])
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
    assert.equal(sucheVon(plan).umfang, 'land')
    assert.equal(sucheVon(plan).name, landName('PA', 'de'))
    assert.equal(JSON.stringify(plan).includes('Panama City'), false)
    assert.equal('laender' in plan, false)
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
    assert.equal(sucheVon(gewaehlt).countryCode, 'PA')
    assert.equal(sucheVon(gewaehlt).umfang, 'land')
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
    const suche = sucheVon(gewaehlt)
    assert.equal(suche.umfang, 'land')
    assert.equal(suche.countryCode, 'TH')
    assert.equal(suche.name.includes('Bangkok'), false)
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
    const inselSuche = sucheVon(typ)
    assert.equal(inselSuche.umfang, 'insel')
    assert.equal(inselSuche.name, 'Koh Samui')
    assert.equal(suchanfrageText(inselSuche), `Koh Samui ${inselSuche.land}`)
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

  test('ein ausgewählter Tag übernimmt keinen fehlenden kanonischen Landescode von der Etappe', () => {
    const ziele = [
      { typ: 'city' as const, zielArt: 'stadt' as const, id: panamaStadt.id },
      { typ: 'region' as const, zielArt: 'region' as const, id: 'geonames:9003703480' },
      { typ: 'island' as const, zielArt: 'insel' as const, id: 'geonames:9003703481' },
    ]
    const fehlend: Array<string | null> = [null, '', 'pa', 'INVALID']
    for (const ziel of ziele) {
      const planen = (countryCode: string | null, stufe: string | null) =>
        gygPlanen(
          eingabe({
            orteLesen: () =>
              synthetisch({
                id: ziel.id,
                name: 'Panama-Ziel',
                typ: ziel.typ,
                country: countryCode === 'PA' ? 'Panama' : null,
                countryCode,
              }),
            umfang: 'tag',
            angeforderteTagId: 'day-gyg-pa',
            reise: reise([etappe('stage-gyg-pa', ziel.id, stufe)], [tag('day-gyg-pa', 'stage-gyg-pa')]),
          }),
        )
      for (const countryCode of fehlend) {
        const plan = planen(countryCode, 'PA')
        assert.equal(plan.art, 'ort_unbestaetigt', `${ziel.typ}:${String(countryCode)}`)
        assert.equal('suche' in plan, false)
        assert.equal(JSON.stringify(plan).includes('synthetic-public'), false)
      }
      const positiv = planen('PA', 'PA')
      const suche = sucheVon(positiv)
      if (positiv.art !== 'bereit') continue
      assert.equal(positiv.zielArt, ziel.zielArt)
      assert.equal(suche.umfang, ziel.zielArt)
      assert.equal(suche.name, 'Panama-Ziel')
      assert.equal(suche.countryCode, 'PA')
      const ohneStufe = planen('PA', null)
      assert.equal(sucheVon(ohneStufe).name, 'Panama-Ziel')
      const widerspruch = planen('FR', 'PA')
      assert.equal(widerspruch.art, 'ort_widerspruch', ziel.typ)
      assert.equal(JSON.stringify(widerspruch).includes('synthetic-public'), false)
    }
    const land = gygPlanen(
      eingabe({
        orteLesen: () =>
          synthetisch({ id: panamaStadt.id, name: 'Panama City', typ: 'city', country: null, countryCode: null }),
        umfang: 'land',
        reise: reise([etappe('stage-gyg-pa', panamaStadt.id, 'PA')]),
      }),
    )
    assert.equal(land.art, 'ort_unbestaetigt')
    assert.equal(JSON.stringify(land).includes('synthetic-public:panama'), false)
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
    assert.deepEqual(sucheVon(hin), sucheVon(rueck))
  })

  test('dieselbe Orts-ID mit anderem Typ ist ein anderes Ziel, eine Kennungsliste nicht', () => {
    const id = 'geonames:9001609348'
    const alsStadt = synthetisch({ id, name: 'Bangkok', typ: 'city', country: 'Thailand', countryCode: 'TH' })
    const alsRegion = synthetisch({ id, name: 'Bangkok', typ: 'region', country: 'Thailand', countryCode: 'TH' })
    const planen = (ort: Ort) =>
      gygPlanen(
        eingabe({
          orteLesen: () => ort,
          umfang: 'tag',
          angeforderteTagId: 'day-gyg-1',
          reise: reise([etappe('stage-gyg-same', id, 'TH')], [tag('day-gyg-1', 'stage-gyg-same')]),
        }),
      )
    const stadt = planen(alsStadt)
    const region = planen(alsRegion)
    assert.equal(sucheVon(stadt).umfang, 'stadt')
    assert.equal(sucheVon(region).umfang, 'region')
    assert.notEqual(stadt.schluessel, region.schluessel)
    const erneut = planen(alsStadt)
    assert.equal(erneut.schluessel, stadt.schluessel)
    assert.equal(JSON.stringify(stadt).includes('synthetic-public'), false)
  })

  test('unbekannte oder widersprüchliche weitere Etappen entscheiden kein Land automatisch', () => {
    const mitUnbekannt = (landWahl: string | null) =>
      gygPlanen(
        eingabe({
          orteLesen: leserFuer(katalog, []),
          umfang: 'land',
          landWahl,
          reise: reise([etappe('stage-gyg-pa', panama.id, 'PA'), etappe('stage-gyg-alt', null, 'TH')]),
        }),
      )
    const automatisch = mitUnbekannt(null)
    assert.equal(automatisch.art, 'land_auswahl')
    if (automatisch.art !== 'land_auswahl') return
    assert.deepEqual(automatisch.laender.map((land) => land.countryCode), ['PA'])
    const gewaehlt = mitUnbekannt('PA')
    assert.equal(gewaehlt.art, 'bereit')
    if (gewaehlt.art !== 'bereit') return
    assert.equal(sucheVon(gewaehlt).countryCode, 'PA')
    assert.deepEqual(gewaehlt.laender?.map((land) => land.countryCode), ['PA'])

    const reihenfolge = (codes: readonly [string, string]) => {
      const aufrufe: string[] = []
      const plan = gygPlanen(
        eingabe({
          orteLesen: leserFuer(katalog, aufrufe),
          umfang: 'land',
          reise: reise([
            etappe('stage-gyg-1', panama.id, codes[0]),
            etappe('stage-gyg-2', panama.id, codes[1]),
          ]),
        }),
      )
      return { plan, aufrufe }
    }
    const vorwaerts = reihenfolge(['PA', 'TH'])
    const rueckwaerts = reihenfolge(['TH', 'PA'])
    assert.equal(vorwaerts.plan.art, 'land_auswahl')
    assert.equal(rueckwaerts.plan.art, 'land_auswahl')
    assert.equal(vorwaerts.plan.schluessel, rueckwaerts.plan.schluessel)
    assert.deepEqual(vorwaerts.aufrufe, [panama.id])
    assert.deepEqual(rueckwaerts.aufrufe, [panama.id])
    const explizit = gygPlanen(
      eingabe({
        orteLesen: leserFuer(katalog, []),
        umfang: 'land',
        landWahl: 'PA',
        reise: reise([etappe('stage-gyg-1', panama.id, 'TH'), etappe('stage-gyg-2', panama.id, 'PA')]),
      }),
    )
    assert.equal(explizit.art, 'bereit')
    if (explizit.art !== 'bereit') return
    assert.equal(sucheVon(explizit).countryCode, 'PA')
    assert.equal(sucheVon(explizit).umfang, 'land')
    assert.ok(explizit.laender && explizit.laender.length > 0)
  })

  test('Namensvetter und ein weiteres Land bleiben getrennte Ziele', () => {
    const lissabon = synthetisch({
      id: 'geonames:9002267057',
      name: 'Lissabon',
      typ: 'city',
      country: 'Portugal',
      countryCode: 'PT',
    })
    const sanJoseStadt = synthetisch({
      id: 'geonames:9001880250',
      name: 'San José',
      typ: 'city',
      country: 'Costa Rica',
      countryCode: 'CR',
    })
    const sanJoseRegion = synthetisch({
      id: 'geonames:9001858001',
      name: 'San José',
      typ: 'region',
      country: 'Uruguay',
      countryCode: 'UY',
    })
    const liste = [lissabon, sanJoseStadt, sanJoseRegion]
    const stadt = gygPlanen(
      eingabe({
        orteLesen: leserFuer(liste, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-cr',
        reise: reise([etappe('stage-gyg-cr', sanJoseStadt.id, 'CR')], [tag('day-gyg-cr', 'stage-gyg-cr')]),
      }),
    )
    const region = gygPlanen(
      eingabe({
        orteLesen: leserFuer(liste, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-uy',
        reise: reise([etappe('stage-gyg-uy', sanJoseRegion.id, 'UY')], [tag('day-gyg-uy', 'stage-gyg-uy')]),
      }),
    )
    assert.equal(stadt.art, 'bereit')
    assert.equal(region.art, 'bereit')
    if (stadt.art !== 'bereit' || region.art !== 'bereit') return
    assert.equal(stadt.name, 'San José')
    assert.equal(region.name, 'San José')
    assert.equal(stadt.zielArt, 'stadt')
    assert.equal(region.zielArt, 'region')
    assert.notEqual(stadt.schluessel, region.schluessel)
    assert.equal(sucheVon(stadt).countryCode, 'CR')
    assert.equal(sucheVon(region).countryCode, 'UY')
    assert.notEqual(suchanfrageText(sucheVon(stadt)), suchanfrageText(sucheVon(region)))

    const lissabonTag = gygPlanen(
      eingabe({
        orteLesen: leserFuer(liste, []),
        umfang: 'tag',
        angeforderteTagId: 'day-gyg-pt',
        reise: reise([etappe('stage-gyg-pt', lissabon.id, 'PT')], [tag('day-gyg-pt', 'stage-gyg-pt')]),
      }),
    )
    const lissabonSuche = sucheVon(lissabonTag)
    assert.equal(lissabonSuche.name, 'Lissabon')
    assert.equal(lissabonSuche.countryCode, 'PT')
    assert.equal(suchanfrageText(lissabonSuche), `Lissabon ${lissabonSuche.land}`)
    assert.equal(JSON.stringify(lissabonTag).includes('San Blas'), false)
    assert.equal(JSON.stringify(lissabonTag).includes('Panama City'), false)

    const laender = gygPlanen(
      eingabe({
        orteLesen: leserFuer(liste, []),
        umfang: 'land',
        reise: reise([
          etappe('stage-gyg-cr', sanJoseStadt.id, 'CR'),
          etappe('stage-gyg-uy', sanJoseRegion.id, 'UY'),
          etappe('stage-gyg-pt', lissabon.id, 'PT'),
        ]),
      }),
    )
    assert.equal(laender.art, 'land_auswahl')
    if (laender.art !== 'land_auswahl') return
    assert.deepEqual(
      laender.laender.map((land) => land.countryCode),
      ['CR', 'PT', 'UY'],
    )
    assert.equal(laender.laender.some((land) => land.name === 'San José'), false)
    assert.equal(laender.laender.some((land) => land.name === 'Lissabon'), false)
  })

  test('die Ortsanfrage liest nicht und fasst dieselbe ID einmal zusammen', () => {
    const ziel = reise(
      [etappe('stage-gyg-pa', panama.id, 'PA'), etappe('stage-gyg-pa-2', panama.id, 'PA')],
      [],
    )
    const land = gygOrtAnfrage(ziel, 'land', null)
    assert.deepEqual(land.ids, [panama.id])
    const tagAnfrage = gygOrtAnfrage(
      reise([etappe('stage-gyg-bkk', bangkok.id, 'TH')], [tag('day-gyg-1', 'stage-gyg-bkk')]),
      'tag',
      'day-gyg-1',
    )
    assert.deepEqual(tagAnfrage.ids, [bangkok.id])
    assert.equal(tagAnfrage.anfrage.includes('day-gyg-1'), true)
    assert.equal(tagAnfrage.anfrage.includes('stage-gyg-bkk'), true)
    assert.equal(gygOrtAnfrage(ziel, 'land', null).anfrage, land.anfrage)
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
