import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import {
  OHNE_ETAPPE,
  REISETAG_OHNE_ZIEL,
  ZUORDNUNG_OFFEN,
  chronologischeLaeufe,
  reisehinweisText,
} from '@/lib/trips/n12-chronology-1/laeufe'
import { timelineAbleiten } from '@/lib/trips/timeline'
import { planTageFolgen, planTagNavigator } from '@/lib/trips/trip-plan-premium-experience-4'
import type { Trip, TripDay } from '@/types/trips'

function ids(tage: readonly { id: string }[]): string[] {
  return tage.map((tag) => tag.id)
}

test('22 Tage bleiben in der Etappenliste sekundär und in der Tagesfolge kalendarisch', () => {
  const graph = n12Reise()
  const etappen = timelineAbleiten(graph).etappen
  assert.deepEqual(
    etappen.map((etappe) => ({ name: etappe.name, tage: ids(etappe.tage) })),
    [
      { name: 'Bangkok', tage: ['day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7', 'day-8', 'day-9', 'day-10'] },
      { name: 'Chiang Mai', tage: ['day-12', 'day-13', 'day-14', 'day-15', 'day-16', 'day-17', 'day-18', 'day-19', 'day-20', 'day-21'] },
      { name: ZUORDNUNG_OFFEN, tage: ['day-1', 'day-11', 'day-22'] },
    ],
  )
  assert.deepEqual(ids(planTageFolgen(etappen)), [
    'day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7', 'day-8', 'day-9', 'day-10',
    'day-12', 'day-13', 'day-14', 'day-15', 'day-16', 'day-17', 'day-18', 'day-19', 'day-20', 'day-21',
    'day-1', 'day-11', 'day-22',
  ])

  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.deepEqual(
    sicht.laeufe.map((lauf) => ({ name: lauf.name, lesart: lauf.lesart, tage: ids(lauf.tage) })),
    [
      { name: REISETAG_OHNE_ZIEL, lesart: 'reise-ohne-ziel', tage: ['day-1'] },
      { name: 'Bangkok', lesart: 'ziel', tage: ['day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7', 'day-8', 'day-9', 'day-10'] },
      { name: REISETAG_OHNE_ZIEL, lesart: 'reise-ohne-ziel', tage: ['day-11'] },
      { name: 'Chiang Mai', lesart: 'ziel', tage: ['day-12', 'day-13', 'day-14', 'day-15', 'day-16', 'day-17', 'day-18', 'day-19', 'day-20', 'day-21'] },
      { name: REISETAG_OHNE_ZIEL, lesart: 'reise-ohne-ziel', tage: ['day-22'] },
    ],
  )
  const folge = planTageFolgen(sicht.laeufe)
  assert.deepEqual(ids(folge), graph.days.map((tag) => tag.id))
  assert.equal(planTagNavigator(folge, 'day-1')?.text, 'Tag 1 von 22')
  assert.equal(planTagNavigator(folge, 'day-1')?.vorherId, null)
  assert.equal(planTagNavigator(folge, 'day-1')?.naechsterId, 'day-2')
  assert.equal(planTagNavigator(folge, 'day-11')?.vorherId, 'day-10')
  assert.equal(planTagNavigator(folge, 'day-11')?.naechsterId, 'day-12')
  assert.equal(planTagNavigator(folge, 'day-22')?.vorherId, 'day-21')
  assert.equal(planTagNavigator(folge, 'day-22')?.naechsterId, null)
  assert.equal(planTagNavigator(folge, 'fehlt'), null)
})

test('dieselben Tagesobjekte und Punkte bleiben, auch bei umgekehrter Quelle', () => {
  const graph = n12Reise()
  const vorher = JSON.stringify(graph)
  graph.days.reverse()
  const quellfolge = ids(graph.days)
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.deepEqual(ids(graph.days), quellfolge)
  assert.deepEqual(ids(sicht.laeufe.flatMap((lauf) => lauf.tage)), Array.from({ length: 22 }, (_, index) => `day-${index + 1}`))
  for (const tag of sicht.laeufe.flatMap((lauf) => lauf.tage)) {
    assert.equal(tag, graph.days.find((eintrag) => eintrag.id === tag.id))
  }
  const tag11 = graph.days.find((tag) => tag.id === 'day-11')
  assert.deepEqual(tag11?.items.map((punkt) => punkt.id), ['transfer-11', 'stay-11'])
  const rueckflug = graph.days.find((tag) => tag.id === 'day-22')?.items[0]
  assert.equal(rueckflug?.bookingStatus, 'booked')
  assert.equal(rueckflug?.bookingSource, 'user')
  assert.equal(JSON.parse(vorher).days.find((tag: TripDay) => tag.id === 'day-22').items[0].bookingConfirmedAt, rueckflug?.bookingConfirmedAt)
  graph.days.reverse()
  assert.equal(JSON.stringify(graph), vorher)
})

test('Gast und Konto sehen dieselbe reine Folge', () => {
  const gast = chronologischeLaeufe(n12Reise())
  const konto = chronologischeLaeufe(n12Reise())
  assert.deepEqual(gast, konto)
  assert.equal(JSON.stringify(gast).includes('Hinreise'), false)
  assert.equal(JSON.stringify(gast).includes('Rückreise'), false)
})

test('ein Reisetag wird nicht aus der Position oder dem Titel gelesen', () => {
  const graph = n12Reise()
  graph.days[0].items = []
  graph.days[0].title = 'Hinreise'
  graph.days[21].items = []
  graph.days[21].title = 'Rückreise'
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.equal(sicht.laeufe[0]?.name, ZUORDNUNG_OFFEN)
  assert.equal(sicht.laeufe.at(-1)?.name, ZUORDNUNG_OFFEN)
  assert.equal(sicht.laeufe[0]?.lesart, 'zuordnung-offen')
  assert.equal(sicht.laeufe.at(-1)?.lesart, 'zuordnung-offen')
})

test('Notiz, Aufenthalt und Mietwagen öffnen keinen Reisetag', () => {
  const graph = n12Reise()
  const tag = graph.days[0]
  tag.items = [
    n12Punkt({ id: 'note-1', kind: 'note', title: 'Hinreise', dayId: tag.id }),
    n12Punkt({ id: 'stay-1', kind: 'stay', title: 'Hotel', dayId: tag.id, position: 2 }),
    n12Punkt({ id: 'car-1', kind: 'rental_car', title: 'Wagen', dayId: tag.id, position: 3 }),
  ]
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.equal(sicht.laeufe[0]?.lesart, 'zuordnung-offen')
  assert.deepEqual(sicht.laeufe[0]?.tage[0]?.items.map((punkt) => punkt.id), ['note-1', 'stay-1', 'car-1'])
})

test('fehlende Etappenkennung bleibt ohne Ziel und wiederholte Namen bleiben getrennt', () => {
  const graph = n12Reise()
  graph.stages = [
    { ...graph.stages[0], id: 'stage-a', name: 'Bangkok' },
    { ...graph.stages[1], id: 'stage-b', name: 'Bangkok' },
  ]
  for (const tag of graph.days) {
    if (tag.dayIndex >= 2 && tag.dayIndex <= 5) tag.stageId = 'stage-a'
    else if (tag.dayIndex >= 6 && tag.dayIndex <= 9) tag.stageId = 'stage-b'
    else if (tag.dayIndex === 10) tag.stageId = 'fehlt'
    else if (tag.dayIndex !== 1 && tag.dayIndex !== 11 && tag.dayIndex !== 22) tag.stageId = null
  }
  graph.days[9].items = []
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  const namen = sicht.laeufe.map((lauf) => ({ name: lauf.name, stageId: lauf.stageId, von: lauf.tage[0]?.dayIndex, bis: lauf.tage.at(-1)?.dayIndex }))
  assert.deepEqual(namen.slice(0, 4), [
    { name: REISETAG_OHNE_ZIEL, stageId: null, von: 1, bis: 1 },
    { name: 'Bangkok', stageId: 'stage-a', von: 2, bis: 5 },
    { name: 'Bangkok', stageId: 'stage-b', von: 6, bis: 9 },
    { name: ZUORDNUNG_OFFEN, stageId: null, von: 10, bis: 10 },
  ])
})

test('unbekanntes Datum bleibt unbekannt und ein einzelner Tag bleibt ein Lauf', () => {
  const graph = n12Reise()
  graph.days = [{ ...graph.days[0], dayDate: null, items: [] }]
  graph.startDate = null
  graph.endDate = null
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.equal(sicht.laeufe.length, 1)
  assert.equal(sicht.laeufe[0]?.tage[0]?.dayDate, null)
  assert.equal(sicht.hinweise.length, 0)
})

test('doppelte oder ungültige Tagesnummern und Kennungen bleiben ohne Folge', () => {
  const doppelt = n12Reise()
  doppelt.days[21] = { ...doppelt.days[21], dayIndex: 1 }
  assert.deepEqual(chronologischeLaeufe(doppelt), { gueltig: false, grund: 'tagesindex', laeufe: [], hinweise: [] })

  const bruch = n12Reise()
  bruch.days[3] = { ...bruch.days[3], dayIndex: 3.5 }
  const bruchSicht = chronologischeLaeufe(bruch)
  assert.equal(bruchSicht.gueltig, false)
  if (!bruchSicht.gueltig) assert.equal(bruchSicht.grund, 'tagesindex')

  const kennung = n12Reise()
  kennung.days[4] = { ...kennung.days[4], id: 'day-1' }
  const kennungSicht = chronologischeLaeufe(kennung)
  assert.equal(kennungSicht.gueltig, false)
  if (!kennungSicht.gueltig) assert.equal(kennungSicht.grund, 'tageskennung')
  assert.equal(JSON.stringify(n12Reise()), JSON.stringify(n12Reise()))
})

test('ein Flug über Mitternacht bleibt ein Punkt und verlängert die Reise nicht', () => {
  const graph = n12Reise()
  const sicht = chronologischeLaeufe(graph)
  assert.equal(sicht.gueltig, true)
  if (!sicht.gueltig) return
  assert.equal(graph.days.length, 22)
  assert.equal(graph.days[0]?.items.length, 1)
  assert.equal(graph.days[1]?.items.some((punkt) => punkt.id === 'flight-out'), false)
  const spanne = sicht.hinweise.filter((hinweis) => hinweis.itemId === 'flight-out' && hinweis.rolle === 'spanne')
  const fortsetzung = sicht.hinweise.filter((hinweis) => hinweis.itemId === 'flight-out' && hinweis.rolle === 'fortsetzung')
  assert.equal(spanne.length, 1)
  assert.equal(spanne[0]?.sichtbarAufTagId, 'day-1')
  assert.equal(spanne[0]?.startsAt, '22:10')
  assert.equal(spanne[0]?.endsAt, '14:40')
  assert.equal(fortsetzung.length, 1)
  assert.equal(fortsetzung[0]?.sichtbarAufTagId, 'day-2')
  assert.equal(fortsetzung[0]?.tagId, 'day-1')
  const text = reisehinweisText(fortsetzung[0]!)
  assert.match(text, /Dieselbe Kennung flight-out/)
  assert.match(text, /keine Übernachtung/)
  assert.equal(text.includes('Hinreise'), false)
  assert.equal(text.includes('Zeitzone UTC'), false)
  assert.equal(sicht.hinweise.some((hinweis) => hinweis.itemId === 'flight-back'), false)

  graph.days = [graph.days[0]]
  const allein = chronologischeLaeufe(graph)
  assert.equal(allein.gueltig, true)
  if (!allein.gueltig) return
  assert.equal(allein.laeufe.length, 1)
  assert.equal(allein.hinweise.length, 1)
  assert.equal(allein.hinweise[0]?.rolle, 'spanne')
})

test('21 Nachtgrenzen bleiben die gespeicherte Kalenderfolge und der bestehende Leser', () => {
  const graph = n12Reise()
  const davor = unterkunftAbdeckung(graph)
  const sicht = chronologischeLaeufe(graph)
  const danach = unterkunftAbdeckung(graph)
  assert.deepEqual(danach, davor)
  assert.equal(danach.bekannt, false)
  assert.equal(danach.naechteGesamt, null)
  assert.equal(danach.naechteAbgedeckt, null)
  assert.equal(danach.kalenderNaechte, 21)
  assert.equal(danach.zusammenfassung, 'Unterkunftsstand noch unklar')
  assert.equal(graph.days.length, 22)
  const geordnet = [...graph.days].sort((links, rechts) => links.dayIndex - rechts.dayIndex)
  let grenzen = 0
  for (let index = 0; index < geordnet.length - 1; index += 1) {
    const links = geordnet[index]?.dayDate
    const rechts = geordnet[index + 1]?.dayDate
    assert.equal(typeof links === 'string' && typeof rechts === 'string' && links < rechts, true)
    grenzen += 1
  }
  assert.equal(grenzen, 21)
  assert.equal('naechteGesamt' in sicht, false)
})

test('der Reiseplan geht die kalendarischen Läufe und nicht die Etappenliste', () => {
  const plan = readFileSync('components/trips/TripWorkspacePlan.tsx', 'utf8')
  assert.match(plan, /chronologischeLaeufe\(reise\)/)
  assert.match(plan, /planTageFolgen\(laeufe\)/)
  assert.match(plan, /const laeufe = chronologie\.gueltig \? chronologie\.laeufe : \[\]/)
  assert.equal(plan.includes('planTageFolgen(timeline.etappen)'), false)
  assert.equal(plan.includes('.sort('), false)
  assert.match(plan, /routeModell\(reise\)/)
  assert.equal(plan.includes('data-plan-etappen-uebersicht'), false)
  assert.equal(plan.includes('data-plan-tag-streifen'), false)
  const route = readFileSync('components/trips/TripWorkspaceRoute.tsx', 'utf8')
  assert.match(route, /data-u1c-route/)
  assert.match(route, /flex-wrap/)
  assert.equal(route.includes('overflow-x-auto'), false)
  assert.match(plan, /data-plan-chronologie=/)
  assert.match(plan, /min-h-11 min-w-11/)
})

test('Altbestand ohne Modus bleibt Ohne Etappe, ein Flug darin nicht', () => {
  const graph = n12Reise()
  delete graph.dayStageAssignmentMode
  graph.days[0].items = []
  const offen = chronologischeLaeufe(graph)
  assert.equal(offen.gueltig, true)
  if (!offen.gueltig) return
  assert.equal(offen.laeufe[0]?.name, OHNE_ETAPPE)
  graph.days[0].items = [n12Punkt({ id: 'flight-1', kind: 'flight', title: 'Flug', dayId: 'day-1' })]
  const mitFlug = chronologischeLaeufe(graph)
  assert.equal(mitFlug.gueltig, true)
  if (!mitFlug.gueltig) return
  assert.equal(mitFlug.laeufe[0]?.name, REISETAG_OHNE_ZIEL)
})

function leer(): Trip {
  const graph = n12Reise()
  graph.days = []
  return graph
}

test('eine Reise ohne Tage ist eine leere gültige Folge', () => {
  assert.deepEqual(chronologischeLaeufe(leer()), { gueltig: true, laeufe: [], hinweise: [] })
})
