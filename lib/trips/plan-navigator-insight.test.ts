import assert from 'node:assert/strict'
import test from 'node:test'

import { chronologischeLaeufe } from '@/lib/trips/n12-chronology-1/laeufe'
import { planNavigatorInsights } from '@/lib/trips/plan-navigator-insight'
import {
  artenReise,
  referenzReise,
  unklareVerbindungReise,
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
