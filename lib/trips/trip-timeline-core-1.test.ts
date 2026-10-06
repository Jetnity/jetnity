import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { timelineAbleiten } from '@/lib/trips/timeline'
import { lokalePlanzeit, tagesTimelineAbleiten } from '@/lib/trips/trip-timeline-core-1'
import type { TripItem } from '@/types/trips'

function punkt(id: string, startsAt: string | null, position = 1): TripItem {
  return { ...beispielreise().days[0].items[0], id, startsAt, position, title: id }
}

function graph(items: TripItem[]) {
  const reise = beispielreise()
  reise.days[0].items = items
  return reise
}

function ids(items: readonly TripItem[]) {
  return tagesTimelineAbleiten(items).flatMap((gruppe) => gruppe.punkte.map(({ punkt }) => punkt.id))
}

function permutationen<T>(werte: T[]): T[][] {
  return werte.length === 0 ? [[]] : werte.flatMap((wert, index) =>
    permutationen(werte.filter((_, stelle) => stelle !== index)).map((rest) => [wert, ...rest]),
  )
}

function render(items: TripItem[], ohneTag: TripItem[] = []) {
  return renderToStaticMarkup(createElement(TripWorkspacePlan, {
    reise: graph(items), ohneTag, aktiverTag: 'day-1', kompakt: true,
    gewaehlterPunktId: 'frueh', onTagWechseln: () => {},
    onPunktAnlegen: async () => null, onPunktEntfernen: async () => null,
    onPunktOeffnen: () => {},
  }))
}

test('04:30, 08:30, 06:30, 20:00: jede Eingabereihenfolge ergibt dieselbe lokale Chronologie', () => {
  const items = ['04:30', '08:30', '06:30', '20:00'].map((zeit, index) => punkt(zeit, zeit, index))
  for (const permutation of permutationen(items)) {
    assert.deepEqual(ids(permutation), ['04:30', '06:30', '08:30', '20:00'])
  }
})

test('gleiche Uhrzeit: position vor stabiler ID, unabhängig von Eingabereihenfolge', () => {
  const items = [punkt('z', '08:00', 1), punkt('b', '08:00', 2), punkt('a', '08:00', 2)]
  for (const permutation of permutationen(items)) assert.deepEqual(ids(permutation), ['z', 'a', 'b'])
})

test('nur exakte gültige HH:MM: Legacy und unbekannte Werte fail-closed, ohne Normalisierung', () => {
  for (const wert of [null, undefined, '', '8:30', ' 08:30', '08:30 ', '08:30\n', '24:00',
    '23:60', '00:60', '-1:00', '08:30:00', '08:30Z', '08:30+02:00', '2026-10-06T08:30',
    '０８:３０', '08.30', 830, {}, 'NaN']) {
    assert.equal(lokalePlanzeit(wert), null, JSON.stringify(wert))
  }
  assert.equal(lokalePlanzeit('00:00'), '00:00')
  assert.equal(lokalePlanzeit('23:59'), '23:59')
})

test('jede gültige Uhrminute einschließlich aller Daypart-Grenzen ist exakt zugeordnet', () => {
  for (let minute = 0; minute < 1440; minute++) {
    const zeit = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
    const [gruppe] = tagesTimelineAbleiten([punkt('ein', zeit)])
    assert.equal(lokalePlanzeit(zeit), zeit)
    assert.equal(gruppe.id, minute <= 719 ? 'morgen' : minute <= 839 ? 'mittag' : minute <= 1079 ? 'nachmittag' : 'abend')
    assert.equal(gruppe.punkte[0].zeit, zeit)
  }
  const grenzen = ['00:00', '11:59', '12:00', '13:59', '14:00', '17:59', '18:00', '23:59']
  assert.deepEqual(tagesTimelineAbleiten(grenzen.map((zeit) => punkt(zeit, zeit))).map((g) => g.titel),
    ['Morgen', 'Mittag', 'Nachmittag', 'Abend'])
})

test('flexibel einmal am Ende: null und malformed nach position/ID hinter 23:59', () => {
  const items = [punkt('b', null, 2), punkt('a', '8:00', 2), punkt('z', '', 1), punkt('spaet', '23:59', 99)]
  for (const permutation of permutationen(items)) assert.deepEqual(ids(permutation), ['spaet', 'z', 'a', 'b'])
  const gruppen = tagesTimelineAbleiten(items)
  assert.deepEqual(gruppen.map((g) => g.id), ['abend', 'flexibel'])
  assert.ok(gruppen[1].punkte.every((p) => p.zeit === null))
})

test('leere und rein flexible Tage brauchen keine leeren Zeitgruppen', () => {
  assert.deepEqual(tagesTimelineAbleiten([]), [])
  assert.deepEqual(tagesTimelineAbleiten([punkt('a', null)]).map((g) => g.id), ['flexibel'])
  assert.deepEqual(tagesTimelineAbleiten([punkt('a', '12:00')]).map((g) => g.id), ['mittag'])
})

test('gefrorener Source-Graph bleibt unverändert; nur Präsentationsarrays entstehen', () => {
  const reise = graph([punkt('spaet', '20:00', 1), punkt('frueh', '04:30', 2)])
  const vorher = structuredClone(reise)
  function einfrieren(wert: object) {
    Object.values(wert).forEach((kind) => { if (kind && typeof kind === 'object') einfrieren(kind) })
    Object.freeze(wert)
  }
  einfrieren(reise)
  const sicht = timelineAbleiten(reise, reise.ohneTag, 'day-1')
  assert.deepEqual(reise, vorher)
  assert.equal(sicht.gewaehlterTag, reise.days[0])
  assert.equal(sicht.tagesplan[0].punkte[0].punkt, reise.days[0].items[1])
  assert.equal(sicht.tagesplan[1].punkte[0].punkt, reise.days[0].items[0])
  assert.equal(sicht.ungeplante, reise.ohneTag)
  assert.deepEqual(timelineAbleiten({ ...reise, days: [] }).tagesplan, [])
})

test('Guest/Account und geklonter Graph ergeben denselben Tagesplan ohne source/mode-Einfluss', () => {
  const reise = graph([punkt('b', '08:30'), punkt('c', null), punkt('a', '06:30')])
  const gast = timelineAbleiten(reise, reise.ohneTag, 'day-1')
  const kontoGraph = structuredClone(reise)
  kontoGraph.days[0].items.reverse()
  const konto = timelineAbleiten(kontoGraph, kontoGraph.ohneTag, 'day-1')
  assert.deepEqual(gast.tagesplan, konto.tagesplan)
})

test('echter Plan-Render: Chronologie, ausschließlich nichtleere Gruppen, flexible Zeit niemals time', () => {
  const html = render([punkt('spaet', '20:00'), punkt('frueh', '04:30'), punkt('alt', '08:30:00'), punkt('frei', null)])
  assert.ok(html.indexOf('data-plan-punkt="frueh"') < html.indexOf('data-plan-punkt="spaet"'))
  assert.ok(html.indexOf('data-plan-punkt="spaet"') < html.indexOf('data-plan-punkt="alt"'))
  assert.deepEqual([...html.matchAll(/data-plan-gruppe="([^"]+)"/g)].map((m) => m[1]), ['morgen', 'abend', 'flexibel'])
  assert.deepEqual([...html.matchAll(/<time dateTime="([^"]+)"/g)].map((m) => m[1]), ['04:30', '20:00'])
  assert.ok(!html.includes('08:30:00'))
  assert.match(html, /data-plan-punkt="frueh" data-plan-gewaehlt="ja"/)
  assert.match(html, /aria-label="frueh entfernen"/)
  assert.match(html, /aria-expanded="true"/)
})

test('echter Render: leer, nur flexibel, nur zeitlich bekannt und ungeplant bleiben getrennt', () => {
  const leer = render([])
  assert.match(leer, /Noch nichts an diesem Tag\./)
  assert.match(leer, /Punkt hinzufügen/)
  assert.ok(!leer.includes('data-plan-gruppe'))
  const flexibel = render([punkt('frei', null)])
  assert.deepEqual([...flexibel.matchAll(/data-plan-gruppe="([^"]+)"/g)].map((m) => m[1]), ['flexibel'])
  assert.ok(!flexibel.includes('<time'))
  const bekannt = render([punkt('frueh', '04:30')], [{ ...punkt('ungeplant', '7:00'), dayId: null }])
  assert.ok(!bekannt.includes('data-plan-gruppe="flexibel"'))
  assert.match(bekannt, /Noch nicht eingeplant/)
  assert.ok(!bekannt.includes('7:00'))
  assert.ok(bekannt.indexOf('Noch nicht eingeplant') < bekannt.indexOf('data-plan-punkt="ungeplant"'))
})
