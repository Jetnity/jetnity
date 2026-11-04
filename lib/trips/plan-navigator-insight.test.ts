import assert from 'node:assert/strict'
import test from 'node:test'

import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import { planNavigatorInsights } from '@/lib/trips/plan-navigator-insight'
import {
  artenReise,
  referenzReise,
  unklareVerbindungReise,
  wiederholteEtappenReise,
  wiederholterNameReise,
} from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'

test('navigator insights summarize item kinds and provide next actions', () => {
  const reise = artenReise()
  const insights = planNavigatorInsights(reise)
  const eintrag = Object.values(insights)[0]
  assert.ok(eintrag)
  assert.match(eintrag.status, /1 Unterkunft/)
  assert.match(eintrag.status, /1 Aktivität/)
  assert.match(eintrag.status, /1 Transfer/)
  assert.equal(eintrag.transferHinweis, null)
  assert.equal(eintrag.nextAction, 'Tagesdetails prüfen')
})

test('missing and unresolved transfer states are flagged, never as confirmed', () => {
  const fehlendeVerbindungReise = referenzReise()
  const koChang = fehlendeVerbindungReise.stages.find((stage) => stage.id === 'stage-kc')
  const phuket = fehlendeVerbindungReise.stages.find((stage) => stage.id === 'stage-hkt')
  if (koChang) koChang.arrivalDate = '2026-11-23'
  if (phuket) phuket.arrivalDate = '2026-11-30'

  const fehlend = Object.values(planNavigatorInsights(fehlendeVerbindungReise))
  assert.ok(fehlend.some((eintrag) => eintrag.transferHinweis === 'Verbindung fehlt noch'))

  const unklar = Object.values(planNavigatorInsights(unklareVerbindungReise()))
  assert.ok(unklar.some((eintrag) => eintrag.transferHinweis === 'Verbindung ist noch ungeklärt'))
})

test('repeated same-name stays remain separate navigator entries', () => {
  const reise = wiederholterNameReise()
  const insights = planNavigatorInsights(reise)
  const laeufe = chronologischeLaeufe(reise)
  assert.ok(laeufe.gueltig)
  assert.equal(Object.keys(insights).length, laeufe.laeufe.length)
})

test('legitimate travel days without a stay do not force assignment actions', () => {
  const reise = n12Reise()
  const laeufe = chronologischeLaeufe(reise)
  assert.ok(laeufe.gueltig)
  const reiseLauf = laeufe.laeufe.find((lauf) => lauf.lesart === 'reise-ohne-ziel')
  assert.ok(reiseLauf)
  const insights = planNavigatorInsights(reise)
  const eintrag = insights[reiseLauf.schluessel]
  assert.ok(eintrag)
  assert.equal(eintrag.nextAction, 'Anreise- oder Transferdetails prüfen')
  assert.notEqual(eintrag.nextAction, 'Passenden Aufenthalt zuordnen')
})

test('unplanned stays are recognized per exact stage identity and not merged by city name', () => {
  const reise = wiederholterNameReise()
  reise.ohneTag.push(n12Punkt({
    id: 'stay-bkk-unplanned',
    kind: 'stay',
    title: 'Bangkok ungeplant',
    stageId: 'stage-bkk-1',
    dayId: null,
  }))

  const laeufe = chronologischeLaeufe(reise)
  assert.ok(laeufe.gueltig)
  const ersterBangkok = laeufe.laeufe.find((lauf) => lauf.stageId === 'stage-bkk-1')
  const zweiterBangkok = laeufe.laeufe.find((lauf) => lauf.stageId === 'stage-bkk-2')
  assert.ok(ersterBangkok)
  assert.ok(zweiterBangkok)

  const insights = planNavigatorInsights(reise)
  const ersterEintrag = insights[ersterBangkok.schluessel]
  const zweiterEintrag = insights[zweiterBangkok.schluessel]
  assert.ok(ersterEintrag)
  assert.ok(zweiterEintrag)
  assert.equal(ersterEintrag.nextAction, 'Unterkunft einem Reisetag zuordnen')
  assert.match(ersterEintrag.status, /Unterkunft ohne Tag/)
  assert.equal(zweiterEintrag.nextAction, 'Unterkunft ergänzen')
})

test('same-stage repeated runs keep unplanned stays ambiguous instead of duplicating visit-level attribution', () => {
  const reise = wiederholteEtappenReise()
  reise.ohneTag.push(n12Punkt({
    id: 'stay-stage-a-unplanned',
    kind: 'stay',
    title: 'A ungeplant',
    stageId: 'stage-a',
    dayId: null,
  }))

  const laeufe = chronologischeLaeufe(reise)
  assert.ok(laeufe.gueltig)
  const aLaeufe = laeufe.laeufe.filter((lauf) => lauf.stageId === 'stage-a')
  assert.equal(aLaeufe.length, 2)

  const insights = planNavigatorInsights(reise)
  for (const lauf of aLaeufe) {
    const eintrag = insights[lauf.schluessel]
    assert.ok(eintrag)
    assert.equal(eintrag.nextAction, 'Ungeplante Unterkunft prüfen (mehrfacher Aufenthalt)')
    assert.equal(eintrag.status.includes('Unterkunft ohne Tag'), false)
    assert.match(eintrag.status, /Ungeplante Unterkunft vorhanden, keinem Aufenthalt eindeutig zugeordnet/)
  }
})
