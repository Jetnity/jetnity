import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { gygPlanen, type GygReise } from '@/lib/activities/getyourguide/kontext'
import {
  gygAbschluss,
  gygAnfordern,
  gygFehlertext,
  gygKontextWechseln,
  gygLaufStart,
} from '@/lib/activities/getyourguide/lebenszyklus'
import type { Ort } from '@/lib/places/domain'
import type { GygZielabbildung } from '@/lib/activities/getyourguide/widget'

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country: name,
    countryCode,
    region: null,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const bangkok = ort('geonames:1609350', 'Bangkok', 'city', 'TH')
const phuket = ort('geonames:9001151254', 'Phuket', 'city', 'TH')
const liste = [bangkok, phuket]
const abbildung: readonly GygZielabbildung[] = [
  { art: 'ort', ortId: bangkok.id, typ: 'city', kennung: 'synthetic-public:bangkok-city' },
  { art: 'ort', ortId: phuket.id, typ: 'city', kennung: 'synthetic-public:phuket-city' },
]

function reise(): GygReise {
  return {
    id: 'trip-gyg-1',
    etappen: [
      { id: 'stage-gyg-bkk', placeId: bangkok.id, countryCode: 'TH' },
      { id: 'stage-gyg-phu', placeId: phuket.id, countryCode: 'TH' },
      { id: 'stage-gyg-bkk-2', placeId: bangkok.id, countryCode: 'TH' },
    ],
    tage: [
      { id: 'day-gyg-bkk', stageId: 'stage-gyg-bkk' },
      { id: 'day-gyg-phu', stageId: 'stage-gyg-phu' },
      { id: 'day-gyg-bkk-2', stageId: 'stage-gyg-bkk-2' },
    ],
  }
}

function planFuer(tagId: string) {
  const plan = gygPlanen({
    reise: reise(),
    angeforderteTagId: tagId,
    umfang: 'tag',
    landWahl: null,
    freigabe: { status: 'bereit' },
    orteLesen: (id) => liste.find((eintrag) => eintrag.id === id) ?? null,
    abbildung,
  })
  assert.equal(plan.art, 'bereit')
  if (plan.art !== 'bereit') throw new Error('Plan nicht bereit')
  return plan
}

describe('GetYourGuide-Lebenszyklus', () => {
  test('verspätete Abschlüsse überleben keinen Kontextwechsel', () => {
    const bangkokPlan = planFuer('day-gyg-bkk')
    const phuketPlan = planFuer('day-gyg-phu')
    const zurueck = planFuer('day-gyg-bkk')
    let lauf = gygLaufStart(bangkokPlan.schluessel)
    const erster = gygAnfordern(lauf, bangkokPlan.bezug)
    assert.equal(erster.angenommen, true)
    if (!erster.angenommen) return
    lauf = erster.lauf
    const doppelt = gygAnfordern(lauf, bangkokPlan.bezug)
    assert.equal(doppelt.angenommen, false)
    lauf = gygKontextWechseln(lauf, phuketPlan.schluessel)
    assert.equal(lauf.phase, 'ruhend')
    assert.equal(lauf.bezug, null)
    const veraltet = gygAbschluss(lauf, erster, { art: 'ressource' })
    assert.equal(veraltet, lauf)
    const zweiter = gygAnfordern(lauf, phuketPlan.bezug)
    assert.equal(zweiter.angenommen, true)
    if (!zweiter.angenommen) return
    lauf = gygAbschluss(zweiter.lauf, zweiter, { art: 'ressource' })
    assert.equal(lauf.phase, 'anzeige')
    assert.equal(lauf.bezug?.oeffentlicheKennung, 'synthetic-public:phuket-city')
    assert.equal('anzahl' in lauf, false)
    lauf = gygKontextWechseln(lauf, zurueck.schluessel)
    const nochAelter = gygAbschluss(lauf, zweiter, { art: 'ressource' })
    assert.equal(nochAelter.phase, 'ruhend')
    assert.equal(nochAelter.bezug, null)
    const dritter = gygAnfordern(nochAelter, zurueck.bezug)
    assert.equal(dritter.angenommen, true)
    if (!dritter.angenommen) return
    assert.notEqual(dritter.epoche, erster.epoche)
    const sichtbar = gygAbschluss(dritter.lauf, dritter, { art: 'ressource' })
    assert.equal(sichtbar.bezug?.oeffentlicheKennung, 'synthetic-public:bangkok-city')
    const andererOrt = planFuer('day-gyg-bkk-2')
    assert.notEqual(andererOrt.schluessel, bangkokPlan.schluessel)
    const fremd = gygKontextWechseln(sichtbar, andererOrt.schluessel)
    assert.equal(gygAbschluss(fremd, dritter, { art: 'ressource' }).bezug, null)
  })

  test('ein Fehler bleibt ein Fehler und ein erneuter Versuch ist eine neue Generation', () => {
    const plan = planFuer('day-gyg-bkk')
    let lauf = gygLaufStart(plan.schluessel)
    const erster = gygAnfordern(lauf, plan.bezug)
    assert.equal(erster.angenommen, true)
    if (!erster.angenommen) return
    lauf = gygAbschluss(erster.lauf, erster, { art: 'abgelehnt', meldung: '<script>x</script>' })
    assert.equal(lauf.phase, 'fehler')
    assert.equal(lauf.fehler, 'GetYourGuide konnte gerade nicht geladen werden.')
    const klartext = gygAbschluss(erster.lauf, erster, {
      art: 'abgelehnt',
      meldung: 'Die synthetische Prüfung ist fehlgeschlagen.',
    })
    assert.equal(klartext.phase, 'fehler')
    assert.equal(klartext.fehler, 'GetYourGuide konnte gerade nicht geladen werden.')
    assert.equal(JSON.stringify(klartext).includes('synthetische Prüfung'), false)
    assert.equal(gygFehlertext('<script>x</script>'), 'GetYourGuide konnte gerade nicht geladen werden.')
    const erneut = gygAnfordern(lauf, plan.bezug)
    assert.equal(erneut.angenommen, true)
    if (!erneut.angenommen) return
    assert.notEqual(erneut.generation, erster.generation)
    const spaet = gygAbschluss(erneut.lauf, erster, { art: 'ressource' })
    assert.equal(spaet.phase, 'laeuft')
    const fertig = gygAbschluss(erneut.lauf, erneut, { art: 'ressource' })
    assert.equal(fertig.phase, 'anzeige')
    assert.equal(fertig.fehler, null)
  })

  test('dieselbe Reise mit anderem Kontext verwirft das alte Ziel', () => {
    const plan = planFuer('day-gyg-bkk')
    const lauf = gygLaufStart(plan.schluessel)
    const start = gygAnfordern(lauf, plan.bezug)
    assert.equal(start.angenommen, true)
    if (!start.angenommen) return
    const andereReise = gygKontextWechseln(start.lauf, `${plan.schluessel}:andere-reise`)
    assert.equal(andereReise.bezug, null)
    assert.equal(gygAbschluss(andereReise, start, { art: 'ressource' }).phase, 'ruhend')
  })

  test('Typwechsel und Kennungswechsel verwerfen die alte Anzeige', () => {
    const id = 'geonames:9001609348'
    const basis = {
      id,
      source: 'geonames' as const,
      sourceId: '9001609348',
      name: 'Bangkok',
      country: 'Thailand',
      countryCode: 'TH',
      region: null,
      lat: null,
      lon: null,
      iata: null,
      keywords: null,
    }
    const reiseGleich: GygReise = {
      id: 'trip-gyg-1',
      etappen: [{ id: 'stage-gyg-same', placeId: id, countryCode: 'TH' }],
      tage: [{ id: 'day-gyg-1', stageId: 'stage-gyg-same' }],
    }
    const abbildung = [
      { art: 'ort' as const, ortId: id, typ: 'city' as const, kennung: 'synthetic-public:same-city' },
      { art: 'ort' as const, ortId: id, typ: 'region' as const, kennung: 'synthetic-public:same-region' },
    ]
    const stadt = gygPlanen({
      reise: reiseGleich,
      angeforderteTagId: 'day-gyg-1',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: () => ({ ...basis, typ: 'city' }),
      abbildung,
    })
    const region = gygPlanen({
      reise: reiseGleich,
      angeforderteTagId: 'day-gyg-1',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: () => ({ ...basis, typ: 'region' }),
      abbildung,
    })
    assert.equal(stadt.art, 'bereit')
    assert.equal(region.art, 'bereit')
    if (stadt.art !== 'bereit' || region.art !== 'bereit') return
    assert.notEqual(stadt.schluessel, region.schluessel)
    let lauf = gygLaufStart(stadt.schluessel)
    const erster = gygAnfordern(lauf, stadt.bezug)
    assert.equal(erster.angenommen, true)
    if (!erster.angenommen) return
    lauf = gygKontextWechseln(erster.lauf, region.schluessel)
    assert.equal(gygAbschluss(lauf, erster, { art: 'ressource' }).phase, 'ruhend')
    assert.equal(lauf.bezug, null)

    const nurA = gygPlanen({
      reise: reise(),
      angeforderteTagId: 'day-gyg-bkk',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: (ortId) => liste.find((eintrag) => eintrag.id === ortId) ?? null,
      abbildung: [{ art: 'ort', ortId: bangkok.id, typ: 'city', kennung: 'synthetic-public:map-a' }],
    })
    const nurB = gygPlanen({
      reise: reise(),
      angeforderteTagId: 'day-gyg-bkk',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: (ortId) => liste.find((eintrag) => eintrag.id === ortId) ?? null,
      abbildung: [{ art: 'ort', ortId: bangkok.id, typ: 'city', kennung: 'synthetic-public:map-b' }],
    })
    assert.equal(nurA.art, 'bereit')
    assert.equal(nurB.art, 'bereit')
    if (nurA.art !== 'bereit' || nurB.art !== 'bereit') return
    const geladen = gygAnfordern(gygLaufStart(nurA.schluessel), nurA.bezug)
    assert.equal(geladen.angenommen, true)
    if (!geladen.angenommen) return
    const gewechselt = gygKontextWechseln(geladen.lauf, nurB.schluessel)
    assert.equal(gygAbschluss(gewechselt, geladen, { art: 'ressource' }).bezug, null)
  })
})
