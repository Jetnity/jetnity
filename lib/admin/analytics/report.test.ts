import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TravelAnalytics from '@/components/admin/analytics/TravelAnalytics'
import { analyticsRange, parseTravelMetrics, parseTravelSeries, readTravelAnalytics } from './report'

const metrics = [{ reisen_gesamt: 20, reisen_30d: 9, konten_mit_reise_30d: 4 }]
const days = Array.from({ length: 7 }, (_, index) => ({ tag: `2026-11-${String(index + 1).padStart(2, '0')}`, anzahl: index }))
const ok = (data: unknown[]) => Promise.resolve({ data, error: null })

test('only the three explicit ranges are admitted; repeated or invalid params are identified', () => {
  for (const value of ['7', '30', '90']) assert.deepEqual(analyticsRange(value), { range: Number(value), valid: true })
  assert.deepEqual(analyticsRange(undefined), { range: 30, valid: true })
  for (const value of ['', '0', '-7', '14', '9000', '7e0', ['7', '90'], null, {}, 7]) {
    assert.deepEqual(analyticsRange(value), { range: 30, valid: false })
  }
})

test('supplied zero is a count, absent aggregates are unavailable', () => {
  assert.equal(parseTravelMetrics([]), null)
  assert.deepEqual(parseTravelMetrics([{ reisen_gesamt: '0', reisen_30d: 0, konten_mit_reise_30d: '0' }]), { total: 0, last30Days: 0, accountsWithTrip30Days: 0 })
  assert.deepEqual(parseTravelMetrics(metrics), { total: 20, last30Days: 9, accountsWithTrip30Days: 4 })
})

test('malformed, imprecise or contradictory counts never become a zero', () => {
  for (const bad of [null, undefined, -1, NaN, Infinity, 1.5, '', ' 0', '1e2', '9007199254740992', {}, true]) {
    assert.throws(() => parseTravelMetrics([{ ...metrics[0], reisen_gesamt: bad }]))
  }
  for (const rows of [null, {}, [metrics[0], metrics[0]], [{}], [{ reisen_gesamt: 1, reisen_30d: 2, konten_mit_reise_30d: 1 }], [{ reisen_gesamt: 10, reisen_30d: 2, konten_mit_reise_30d: 3 }]]) {
    assert.throws(() => parseTravelMetrics(rows))
  }
})

test('calendar series preserves supplied values and requires the entire ordered range', () => {
  assert.equal(parseTravelSeries([], 7), null)
  assert.deepEqual(parseTravelSeries(days, 7), days.map((row) => ({ date: row.tag, trips: row.anzahl })))
  for (const rows of [days.slice(1), [...days].reverse(), [days[0], ...days.slice(0, 6)], [...days.slice(0, 6), { tag: '2026-11-09', anzahl: 0 }]]) assert.throws(() => parseTravelSeries(rows, 7))
  for (const date of ['2026-02-30', '2025-02-29', '2026-11-01T00:00:00Z', '2026-1-1', 'invalid']) assert.throws(() => parseTravelSeries([{ tag: date, anzahl: 0 }, ...days.slice(1)], 7))
  const leap = Array.from({ length: 7 }, (_, index) => ({ tag: new Date(Date.UTC(2024, 1, 26 + index)).toISOString().slice(0, 10), anzahl: 0 }))
  assert.equal(parseTravelSeries(leap, 7)?.[3].date, '2024-02-29')
  assert.throws(() => parseTravelSeries(days.map((row) => ({ ...row, anzahl: Number.MAX_SAFE_INTEGER })), 7))
})

test('sources run independently, and partial failure preserves only the valid source', async () => {
  const called: string[] = []
  const report = await readTravelAnalytics({
    metrics: () => { called.push('metrics'); return Promise.resolve({ data: null, error: { code: '08006', message: 'Verbindung unterbrochen' }, status: 0 }) },
    series: (range) => { called.push(`series:${range}`); return ok(days) },
  }, 7)
  assert.deepEqual(called, ['metrics', 'series:7'])
  assert.equal(report.metrics.kind, 'error')
  assert.equal(report.series.kind, 'ready')
  if (report.metrics.kind === 'error') assert.equal(report.metrics.error.wiederholbar, true)
  const html = renderToStaticMarkup(createElement(TravelAnalytics, { report }))
  assert.match(html, /Verbindung unterbrochen/)
  assert.match(html, /21.*neue Reisen/)
  assert.doesNotMatch(html, /<dd[^>]*>0<\/dd>/)
})

test('zero-row permission response is not rendered as an empty travel business', async () => {
  const report = await readTravelAnalytics({ metrics: () => ok([]), series: () => ok([]) }, 7)
  assert.equal(report.metrics.kind, 'unavailable')
  assert.equal(report.series.kind, 'unavailable')
  const html = renderToStaticMarkup(createElement(TravelAnalytics, { report }))
  assert.match(html, /keine Betriebszahlen verfügbar/)
  assert.doesNotMatch(html, /keine neuen Reisen erfasst|<dd/)
})

test('invalid data is separate from a database failure and from an observed zero', async () => {
  const report = await readTravelAnalytics({ metrics: () => ok([{}]), series: () => ok(days.map((row) => ({ ...row, anzahl: 0 }))) }, 7)
  assert.equal(report.metrics.kind, 'error')
  assert.equal(report.series.kind, 'ready')
  const html = renderToStaticMarkup(createElement(TravelAnalytics, { report, invalidRange: true }))
  assert.match(html, /unvollständig oder ungültig/)
  assert.match(html, /keine neuen Reisen erfasst/)
  assert.match(html, /Tageswerte anzeigen/)
  assert.match(html, /Keine automatische Aktualisierung/)
  assert.match(html, /rollierende 30-Tage-Fenster/)
  assert.match(html, /aria-current="page"/)
})
