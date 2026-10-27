import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { gygPlanen, type GygReise } from '@/lib/activities/getyourguide/kontext'
import {
  gygAbschluss,
  gygAnfordern,
  gygEntfernen,
  gygFehlertext,
  gygKontextWechseln,
  gygLaufStart,
} from '@/lib/activities/getyourguide/lebenszyklus'
import type { Ort } from '@/lib/places/domain'

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
    const erster = gygAnfordern(lauf, bangkokPlan.suche)
    assert.equal(erster.angenommen, true)
    if (!erster.angenommen) return
    lauf = erster.lauf
    const doppelt = gygAnfordern(lauf, bangkokPlan.suche)
    assert.equal(doppelt.angenommen, false)
    lauf = gygKontextWechseln(lauf, phuketPlan.schluessel)
    assert.equal(lauf.phase, 'ruhend')
    assert.equal(lauf.suche, null)
    const veraltet = gygAbschluss(lauf, erster, { art: 'ressource' })
    assert.equal(veraltet, lauf)
    const zweiter = gygAnfordern(lauf, phuketPlan.suche)
    assert.equal(zweiter.angenommen, true)
    if (!zweiter.angenommen) return
    lauf = gygAbschluss(zweiter.lauf, zweiter, { art: 'ressource' })
    assert.equal(lauf.phase, 'anzeige')
    assert.equal(lauf.suche?.name, 'Phuket')
    assert.equal(lauf.suche?.countryCode, 'TH')
    assert.equal('anzahl' in lauf, false)
    lauf = gygKontextWechseln(lauf, zurueck.schluessel)
    const nochAelter = gygAbschluss(lauf, zweiter, { art: 'ressource' })
    assert.equal(nochAelter.phase, 'ruhend')
    assert.equal(nochAelter.suche, null)
    const dritter = gygAnfordern(nochAelter, zurueck.suche)
    assert.equal(dritter.angenommen, true)
    if (!dritter.angenommen) return
    assert.notEqual(dritter.epoche, erster.epoche)
    const sichtbar = gygAbschluss(dritter.lauf, dritter, { art: 'ressource' })
    assert.equal(sichtbar.suche?.name, 'Bangkok')
    assert.equal(sichtbar.suche?.umfang, 'stadt')
    const andererOrt = planFuer('day-gyg-bkk-2')
    assert.notEqual(andererOrt.schluessel, bangkokPlan.schluessel)
    const fremd = gygKontextWechseln(sichtbar, andererOrt.schluessel)
    assert.equal(gygAbschluss(fremd, dritter, { art: 'ressource' }).suche, null)
  })

  test('ein Fehler bleibt ein Fehler und ein erneuter Versuch ist eine neue Generation', () => {
    const plan = planFuer('day-gyg-bkk')
    let lauf = gygLaufStart(plan.schluessel)
    const erster = gygAnfordern(lauf, plan.suche)
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
    const erneut = gygAnfordern(lauf, plan.suche)
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
    const start = gygAnfordern(lauf, plan.suche)
    assert.equal(start.angenommen, true)
    if (!start.angenommen) return
    const andereReise = gygKontextWechseln(start.lauf, `${plan.schluessel}:andere-reise`)
    assert.equal(andereReise.suche, null)
    assert.equal(gygAbschluss(andereReise, start, { art: 'ressource' }).phase, 'ruhend')
  })

  test('Typwechsel und Entfernen verwerfen die alte Anzeige', () => {
    const id = 'geonames:9001609348'
    const basis = {
      id,
      source: 'geonames' as const,
      sourceId: '9001609348',
      name: 'Bangkok',
      country: 'Thailand',
      countryCode: 'TH',
      region: '10',
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
    const stadt = gygPlanen({
      reise: reiseGleich,
      angeforderteTagId: 'day-gyg-1',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: () => ({ ...basis, typ: 'city' }),
    })
    const region = gygPlanen({
      reise: reiseGleich,
      angeforderteTagId: 'day-gyg-1',
      umfang: 'tag',
      landWahl: null,
      freigabe: { status: 'bereit' },
      orteLesen: () => ({ ...basis, typ: 'region' }),
    })
    assert.equal(stadt.art, 'bereit')
    assert.equal(region.art, 'bereit')
    if (stadt.art !== 'bereit' || region.art !== 'bereit') return
    assert.equal(stadt.suche.name, 'Bangkok')
    assert.equal(JSON.stringify(stadt.suche).includes('10'), false)
    assert.notEqual(stadt.schluessel, region.schluessel)
    let lauf = gygLaufStart(stadt.schluessel)
    const erster = gygAnfordern(lauf, stadt.suche)
    assert.equal(erster.angenommen, true)
    if (!erster.angenommen) return
    lauf = gygKontextWechseln(erster.lauf, region.schluessel)
    assert.equal(gygAbschluss(lauf, erster, { art: 'ressource' }).phase, 'ruhend')
    assert.equal(lauf.suche, null)

    const entfernt = gygEntfernen(erster.lauf)
    assert.equal(entfernt.phase, 'ruhend')
    assert.equal(entfernt.suche, null)
    assert.notEqual(entfernt.epoche, erster.epoche)
    assert.equal(gygAbschluss(entfernt, erster, { art: 'ressource' }), entfernt)
  })
})
