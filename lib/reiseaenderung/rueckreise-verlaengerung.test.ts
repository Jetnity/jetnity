// Regression for the real Production request "einen Tag länger bleiben":
// an existing return must remain last, not become the penultimate day.
// All fixtures exercise the normal pure interpreter/safety/model pipeline;
// no paid calls, credentials, database writes or real trips.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import { reiseDiff } from '@/lib/reiseaenderung/diff'
import { reiseaenderungErzeugen, type Aenderungswerkzeuge } from '@/lib/reiseaenderung/erzeugen'
import { aenderungAntwort, leereOperation } from '@/lib/reiseaenderung/fixtures/antworten'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { kiGraphSicherheit } from '@/lib/reiseaenderung/ki-schutz'
import { rohergebnisAus } from '@/lib/modell/antwort'
import { vorschlagAlsReise } from '@/lib/reisevorschlag/abbildung'
import { antwortMit, VORSCHLAG_MIT_DATUM } from '@/lib/reisevorschlag/fixtures/antworten'
import type { Reisegraph } from '@/types/trips'

let seq = 0
const kennung = (prefix: string) => prefix + '-extension-' + ++seq
const laenger = () => leereOperation('dauer_aendern', { tageDelta: 1 })

function reiseMitRueckflug(): Reisegraph {
  const reise = beispielreise()
  const letzter = reise.days.at(-1)!
  letzter.title = 'Rückreise'
  const rueckflug = structuredClone(reise.days[1]!.items[0]!)
  rueckflug.id = 'rueckflug-1'
  rueckflug.kind = 'flight'
  rueckflug.title = 'Rückflug nach Zürich'
  rueckflug.dayId = letzter.id
  rueckflug.stageId = letzter.stageId
  rueckflug.startsOn = letzter.dayDate
  rueckflug.startsAt = '18:00'
  rueckflug.endsOn = null
  rueckflug.endsAt = null
  letzter.items.push(rueckflug)
  return reise
}

test('KI: ein Tag länger fügt vor die Rückreise ein und erhält Rückflug, IDs und Tagesverteilung', () => {
  const original = reiseMitRueckflug()
  const vorher = structuredClone(original)
  const result = operationenAnwenden(original, [laenger()], kennung)
  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.reise.days.length, 6)
  assert.equal(result.reise.endDate, '2026-09-17')
  assert.deepEqual(result.reise.days.map(tag => tag.dayIndex), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(result.reise.days.map(tag => tag.dayDate),
    ['2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'])
  assert.equal(result.reise.days[4]?.stageId, original.stages[1]?.id,
    'new stay day belongs to the previous stage')
  assert.equal(result.reise.days[4]?.items.length, 0)
  const rueck = result.reise.days.at(-1)!
  assert.equal(rueck.id, original.days.at(-1)?.id)
  assert.equal(rueck.title, 'Rückreise')
  assert.equal(rueck.stageId, original.days.at(-1)?.stageId)
  assert.deepEqual(rueck.items.map(p => p.id), ['rueckflug-1'])
  assert.equal(rueck.items[0]?.startsOn, '2026-09-17')
  assert.equal(rueck.items[0]?.startsAt, '18:00')
  assert.equal(result.reise.stages[1]?.departureDate, '2026-09-17')
  assert.deepEqual(kiGraphSicherheit(original, result.reise), { ok: true })
  const diff = reiseDiff(original, result.reise)
  assert.ok(diff.some(e => e.text.includes('Dauer: 5 → 6')))
  assert.ok(diff.some(e => e.text.includes('Rückreise: 2026-09-16 → 2026-09-17 (geplant, nicht gebucht)')))
  assert.deepEqual(original, vorher, 'the accepted source graph remains unchanged')
})

test('KI: selbst ohne Rückreise-Tagtitel wird ein echter geplanter Rückflug erkannt', () => {
  let i = 0
  const reise = vorschlagAlsReise({ ...VORSCHLAG_MIT_DATUM, fassung: 1 as const, reisewunsch: null }, 'test-three-days',
    prefix => prefix + '-return-' + ++i, '2026-11-22T08:00:00.000Z')
  const alterRueckTag = reise.days.at(-1)!
  assert.equal(alterRueckTag.title, null)
  assert.match(alterRueckTag.items[0]?.title ?? '', /Rückflug/)
  const result = operationenAnwenden(reise, [laenger()], kennung)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.reise.days.length, 4)
  assert.equal(result.reise.endDate, '2027-06-04')
  assert.equal(result.reise.days.at(-1)?.id, alterRueckTag.id)
  assert.equal(result.reise.days.at(-1)?.items[0]?.id, alterRueckTag.items[0]?.id)
  assert.equal(result.reise.days.at(-1)?.items[0]?.startsOn, '2027-06-04')
  assert.equal(result.reise.days[2]?.stageId, reise.days[1]?.stageId)
  assert.deepEqual(kiGraphSicherheit(reise, result.reise), { ok: true })
})

test('KI: letzte Etappe verlängern verschiebt Rückreise statt sie vorletzten Tag werden zu lassen', () => {
  const reise = reiseMitRueckflug()
  const result = operationenAnwenden(reise, [
    leereOperation('etappe_dauer', { etappeId: reise.stages.at(-1)!.id, tageDelta: 1 }),
  ], kennung)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.reise.days.length, 6)
  assert.equal(result.reise.days.at(-1)?.id, reise.days.at(-1)?.id)
  assert.equal(result.reise.days.at(-1)?.items[0]?.startsOn, '2026-09-17')
  assert.deepEqual(kiGraphSicherheit(reise, result.reise), { ok: true })
})

test('KI: gebuchter Rückflug bleibt unverändert, Änderung wird sicher verweigert', () => {
  const reise = reiseMitRueckflug()
  const rueck = reise.days.at(-1)!.items[0]!
  rueck.bookingStatus = 'booked'
  rueck.bookingSource = 'user'
  rueck.bookingConfirmedAt = '2026-09-01T00:00:00.000Z'
  const vorher = structuredClone(reise)
  const result = operationenAnwenden(reise, [laenger()], kennung)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.fehler.meldung, /Rückreise.*Buchung|Buchung.*Rückreise/)
  assert.deepEqual(reise, vorher)
})

test('KI: fester Fremdtermin und strukturierte Verbindung werden nicht automatisch verschoben', () => {
  for (const mutate of [
    (r: Reisegraph) => { r.days.at(-1)!.items[0]!.startsOn = '2026-09-18' },
    (r: Reisegraph) => { r.days.at(-1)!.items[0]!.connectionRef = 'FLIGHT-999' },
    (r: Reisegraph) => { r.days.at(-1)!.items[0]!.provider = 'airline' },
  ]) {
    const reise = reiseMitRueckflug()
    mutate(reise)
    const vorher = structuredClone(reise)
    const result = operationenAnwenden(reise, [laenger()], kennung)
    assert.equal(result.ok, false)
    assert.deepEqual(reise, vorher)
  }
})

test('KI: letzter Tagespunkt ohne Rückreisebeleg wird nicht als Rückflug umgedeutet', () => {
  const reise = beispielreise()
  reise.days.at(-1)!.items.push({
    ...structuredClone(reise.days[1]!.items[0]!),
    id: 'abschluss-aktivitaet',
    dayId: reise.days.at(-1)!.id,
    stageId: reise.days.at(-1)!.stageId,
    title: 'Abschluss im Museum',
    startsOn: reise.days.at(-1)!.dayDate,
  })
  const result = operationenAnwenden(reise, [laenger()], kennung)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(kiGraphSicherheit(reise, result.reise).ok, false,
    'unrelated final activities still trigger the existing no-empty-return safety gate')
})

test('KI-Erzeugung: echter Änderungs-Pipelinepfad liefert eine sichere Vorschau bei nur einer Reservierung', async () => {
  const original = reiseMitRueckflug()
  const vorher = structuredClone(original)
  let kostenReservierungen = 0
  let modellaufrufe = 0
  const werkzeuge: Aenderungswerkzeuge = {
    zustand: { aktiv: true, modell: 'gpt-5.6-terra', aufwand: 'low' },
    beanspruchen: async () => {
      kostenReservierungen += 1
      return { ok: true as const, id: 'mock-reservation-1' }
    },
    abschliessen: async () => {},
    aufrufen: async () => {
      modellaufrufe += 1
      return { ...rohergebnisAus(200, antwortMit(aenderungAntwort([laenger()]))), laufzeitMs: 10 }
    },
    heute: '2026-11-22',
    kennung,
    mutationId: 'test-mutation',
  }
  const ergebnis = await reiseaenderungErzeugen('Einen Tag länger bleiben.', original, werkzeuge)
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) return
  assert.equal(ergebnis.vorschau.nachher.days.length, 6)
  assert.equal(ergebnis.vorschau.nachher.days.at(-1)?.id, original.days.at(-1)?.id)
  assert.equal(kostenReservierungen, 1)
  assert.equal(modellaufrufe, 1)
  assert.deepEqual(original, vorher)
})
