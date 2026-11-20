import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import { leereOperation } from '@/lib/reiseaenderung/fixtures/antworten'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { kiGraphSicherheit } from '@/lib/reiseaenderung/ki-schutz'

let counter = 0
const id = (prefix: string) => prefix + '-sicher-' + ++counter

test('#1237: Bangkok-Tag 3 mit Aktivitäten und Unterkunft darf bei Umgewichtung nicht ungeplant werden', () => {
  const original = beispielreise()
  const punkt = structuredClone(original.days[1]!.items[0]!)
  punkt.id = 'private-test-note'
  punkt.title = 'Nacht in Bangkok'
  punkt.kind = 'stay'
  punkt.dayId = original.days[2]!.id
  punkt.stageId = original.stages[0]!.id
  punkt.priceAmount = null
  punkt.provider = null
  punkt.externalRef = null
  punkt.bookingUrl = null
  original.days[2]!.items.push(punkt)
  const originalBytes = JSON.stringify(original)
  const operations = [
    leereOperation('etappe_dauer', { etappeId: original.stages[0]!.id, tageDelta: -1 }),
    leereOperation('etappe_dauer', { etappeId: original.stages[1]!.id, tageDelta: 1 }),
  ]
  const result = operationenAnwenden(original, operations, id)
  assert.equal(result.ok, true, 'Interpreter preserves detached points for manual review')
  if (!result.ok) return
  assert.equal(result.reise.ohneTag.some(x => x.id === punkt.id), true)
  const gate = kiGraphSicherheit(original, result.reise)
  assert.equal(gate.ok, false, 'AI cannot offer an unsafe but syntactically valid 7-day graph')
  if (!gate.ok) assert.match(gate.meldung, /Reise bleibt unverändert|Vorschlag|bestehende/)
  assert.equal(JSON.stringify(original), originalBytes, 'Original source trip is never mutated')
})

test('#1237: zusätzlicher leerer letzter Tag hinter bestehendem letzten Reisetag wird gestoppt', () => {
  const original = beispielreise()
  const point = structuredClone(original.days[1]!.items[0]!)
  point.id = 'return-marker'
  point.dayId = original.days.at(-1)!.id
  point.stageId = original.stages.at(-1)!.id
  point.kind = 'note'
  point.startsOn = null
  original.days.at(-1)!.items.push(point)
  const result = operationenAnwenden(original, [
    leereOperation('dauer_aendern', { tageDelta: 1 }),
  ], id)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(kiGraphSicherheit(original, result.reise).ok, false)
})

test('#1237: echte Verlängerung ohne bisherige Schlussplanpunkte bleibt erlaubt', () => {
  const original = beispielreise()
  const result = operationenAnwenden(original, [
    leereOperation('dauer_aendern', { tageDelta: 1 }),
  ], id)
  assert.equal(result.ok, true)
  if (result.ok) assert.deepEqual(kiGraphSicherheit(original, result.reise), { ok: true })
})

test('#1237: Vorschau und serverseitiges Apply prüfen beide denselben Quotenfreien Sicherheitsgate', () => {
  for (const path of ['lib/reiseaenderung/erzeugen.ts', 'lib/reiseaenderung/aktionen.ts']) {
    const source = readFileSync(path, 'utf8')
    assert.match(source, /kiGraphSicherheit\(/)
  }
})
