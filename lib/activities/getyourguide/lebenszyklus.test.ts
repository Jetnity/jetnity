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
    assert.equal(lauf.fehler, gygFehlertext('<script>x</script>'))
    assert.equal(lauf.fehler, 'GetYourGuide konnte gerade nicht geladen werden.')
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
})
