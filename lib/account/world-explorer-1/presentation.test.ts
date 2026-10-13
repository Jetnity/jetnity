import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Besuch } from '@/lib/account/besuche'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { TripSummary } from '@/types/trips'
import { countryTrips, explorerRecords, filterRecords, positionText, suchText } from './presentation'
import { clampViewport, RESET_VIEWPORT, viewportMarkers, viewportPoint, zoomViewport } from './viewport'

const trip = (id: string, countryCode: string | null, name = 'São Paulo'): TripSummary => ({
  id, title: 'Gleicher Titel', origin: null, startDate: null, endDate: null, travellers: 1, currency: 'CHF', budgetAmount: null,
  status: 'planned', updatedAt: '2026-01-01', stages: [{ name, countryCode, position: 1, placeId: `place:${id}`, latitude: 40, longitude: -8 }], stageCount: 1, dayCount: 0, itemCount: 0,
})
const visit = (id: string, code: string | null = 'PT', placeLabel = 'São Paulo'): Besuch => ({
  id, countryCode: code, placeId: `visit-place:${id}`, placeLabel, latitude: null, longitude: null,
  jahr: 2004, monat: null, tag: null, erstelltAm: '2026-01-01',
})
function fixture() {
  const welt = worldMapAbleiten({ reisen: [trip('a', 'PT'), trip('b', 'PT'), trip('c', 'JP'), trip('d', null, 'Porto')], problem: null })
  const besucht = weltBesuchtAbleiten({ besuche: [visit('1'), visit('2'), visit('3', 'IT'), visit('4', null, 'Porto'), visit('5', 'ZZ', 'Unbekannter Ort')], problem: null })
  const laender = weltLaenderAbleiten({ besucht: besucht.laenderCodes, geplant: welt.laenderCodes, geometrie: { PT: { pfade: ['M0 0'], punkt: null }, IT: { pfade: ['M1 1'], punkt: null }, JP: { pfade: ['M2 2'], punkt: null } } })
  return { welt, besucht, laender, records: explorerRecords(welt, besucht, laender) }
}
test('search is bounded, case/diacritic insensitive and does not create identities', () => {
  const { records } = fixture()
  assert.equal(suchText(' SÃO STRAẞE '), 'sao strasse')
  assert.deepEqual(filterRecords(records, `${' '.repeat(120)}Atlantis`, 'alle'), records)
  const found = filterRecords(records, 'sao', 'alle')
  assert.equal(found.filter((r) => r.art === 'ort').length, 3)
  assert.deepEqual(new Set(found.filter((r) => r.art === 'land').map((r) => r.code)), new Set(['PT', 'IT', 'JP']))
  assert.equal(new Set(found.map((r) => r.id)).size, found.length)
  assert.equal(filterRecords(records, 'Atlantis', 'alle').length, 0)
  assert.deepEqual(filterRecords(records, '', 'alle'), records)
})
test('country label/code search includes its own records only; text cannot assign no-country records', () => {
  const { records } = fixture()
  assert.equal(filterRecords(records, 'portugal', 'alle').length, 5)
  assert.deepEqual(filterRecords(records, 'PT', 'alle').map((r) => r.id), filterRecords(records, 'Portugal', 'alle').map((r) => r.id))
  const unknown = filterRecords(records, 'Porto', 'alle')
  assert.equal(unknown.every((r) => r.code === null), true)
  assert.equal(unknown.length, 2)
})
test('country filters preserve both-state and include evidenced intersection, not place-name intersections', () => {
  const { records } = fixture()
  for (const filter of ['besucht', 'geplant', 'beides'] as const) {
    const result = filterRecords(records, '', filter)
    assert.equal(result.find((r) => r.id === 'land:PT')?.zustand, 'beides')
    if (filter !== 'beides') assert.ok(result.filter((r) => r.art !== 'land').every((r) => r.zustand === filter))
  }
  assert.ok(filterRecords(records, '', 'beides').every((r) => r.code === 'PT'))
})
test('either source failure cannot imply a both-country or fabricate empty history', () => {
  const { welt, besucht, laender } = fixture()
  const visitError = { ...besucht, lage: 'fehler' as const }
  const planError = { ...welt, lage: 'fehler' as const }
  const a = explorerRecords(welt, visitError, laender)
  const b = explorerRecords(planError, besucht, laender)
  assert.ok(a.every((r) => r.zustand === 'geplant'))
  assert.ok(b.every((r) => r.zustand === 'besucht'))
  assert.equal(filterRecords(a, '', 'beides').length, 0)
  assert.equal(filterRecords(b, '', 'beides').length, 0)
  assert.equal(explorerRecords(planError, visitError, laender).length, 0)
})
test('missing geometry/coordinates remain in results; no-country identity and partial dates remain intact', () => {
  const { records } = fixture()
  const country = records.find((r) => r.id === 'land:ZZ')!
  assert.equal(positionText(country), 'Keine Kartenposition verfügbar.')
  const event = records.find((r) => r.id === 'besuch:1')!
  assert.equal(event.punkt, null)
  assert.equal(event.besuch?.zeitText, '2004')
  assert.equal(event.besuch?.zeitGenauigkeit, 'jahr')
  assert.equal(records.find((r) => r.id === 'besuch:4')?.code, null)
})
test('trip links deduplicate by real ID within stored country, never by title or visits', () => {
  const { welt } = fixture()
  const places = [...welt.orte, ...welt.orte]
  assert.deepEqual(countryTrips(places, 'PT').map((r) => r.tripId), ['a', 'b'])
  assert.equal(countryTrips(places, 'IT').length, 0)
  assert.equal(countryTrips(places, 'PT').every((r) => r.startDate === null), true)
})
test('repeated visit IDs remain separate and removed records disappear when props change', () => {
  const { welt, besucht, laender, records } = fixture()
  const previous = records.find((r) => r.id === 'besuch:1')!
  const next = explorerRecords(welt, { ...besucht, eintraege: besucht.eintraege.filter((r) => r.id !== '1') }, laender)
  assert.equal(next.some((r) => r.id === previous.id), false)
  assert.ok(next.some((r) => r.id === 'besuch:2'))
  assert.ok(next.some((r) => r.id === 'land:PT'))
})
test('presentation and navigation do not mutate frozen source records', () => {
  const { welt, besucht, laender } = fixture()
  function freeze(object: object) { Object.freeze(object); for (const v of Object.values(object)) if (v && typeof v === 'object') freeze(v) }
  const before = JSON.stringify({ welt, besucht, laender })
  freeze(welt); freeze(besucht); freeze(laender)
  const records = explorerRecords(welt, besucht, laender)
  filterRecords(records, 'Portugal', 'besucht'); countryTrips(welt.orte, 'PT')
  viewportMarkers(records, RESET_VIEWPORT, 390, 150)
  assert.equal(JSON.stringify({ welt, besucht, laender }), before)
})
test('viewport is finite, bounded at 1x–4x and resets deterministically', () => {
  assert.deepEqual(clampViewport({ scale: Infinity, x: NaN, y: Infinity }), RESET_VIEWPORT)
  assert.deepEqual(clampViewport({ scale: 6, x: -99, y: 99 }), { scale: 4, x: -3, y: 0 })
  const zoomed = zoomViewport(RESET_VIEWPORT, 4)
  assert.deepEqual(zoomed, { scale: 4, x: -1.5, y: -1.5 })
  assert.deepEqual(zoomViewport(zoomed, 1), RESET_VIEWPORT)
  assert.deepEqual(viewportPoint({ links: 50, oben: 50 }, zoomed), { links: 50, oben: 50 })
})
test('marker groups use screen hit targets, recompute at zoom/resize, preserve IDs and stored anchor', () => {
  const { records } = fixture()
  const a = { ...records[0], id: 'a', punkt: { links: 50, oben: 50 } }
  const b = { ...a, id: 'b', punkt: { links: 55, oben: 50 } }
  const c = { ...a, id: 'c', punkt: null }
  const small = viewportMarkers([a, b, c], RESET_VIEWPORT, 390, 154)
  assert.equal(small.length, 1)
  assert.deepEqual(small[0].records.map((r) => r.id), ['a', 'b'])
  assert.equal(small[0].links, 50)
  assert.equal(viewportMarkers([a, b], RESET_VIEWPORT, 1280, 505).length, 2)
  assert.equal(viewportMarkers([a, b], zoomViewport(RESET_VIEWPORT, 4), 390, 154).length, 2)
  assert.equal(viewportMarkers([a], { scale: 4, x: 0, y: 0 }, 390, 154).length, 0)
})
