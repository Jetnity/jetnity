import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseTimetable } from './parser'
import { timetableAnfrageSchema, timetableLink, type TimetableAnfrage } from './schema'
import { createTimetableService, timetableAktiv, timetableQuelle } from './service'
import { createTimetableHandler } from './http'

const html = readFileSync(new URL('./fixtures/bangkok-koh-chang-2026-11-01.html', import.meta.url), 'utf8')
const request: TimetableAnfrage = { country: 'TH', from: 'Bangkok', to: 'Ko Chang', fromPlaceId: 'geonames:1609350', toPlaceId: 'geonames:1611309' }
const now = '2026-11-01T15:00:00.000Z'
const result = () => parseTimetable(html, request, now)
const response = () => new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8' } })

test('official response: exact route only, CHF, four modes, departures, unmodified partner URLs', () => {
  const data = result()
  assert.equal(data.status, 'ready')
  assert.equal(data.routeLabel, 'Bangkok → Koh Chang')
  assert.deepEqual(data.options.map((o) => o.mode), ['bus', 'charter', 'ferry', 'van'])
  assert.equal(data.options[0]!.price, 'Fr. 18.32–20.77')
  assert.equal(data.options[0]!.duration, '6h – 10h')
  assert.equal(data.options[0]!.departures[0]!.times, '05:30, 07:00, 09:00, 11:00')
  assert.equal(data.href, 'https://12go.asia/de/travel/bangkok/koh-chang?z=17323861&curr=CHF')
  assert.doesNotMatch(JSON.stringify(data), /Trat|Suvarnabhumi|Don Mueang|<style|<script|date=|sub_id=/)
})

test('known other routes are unmatched; missing or ambiguous structure is an error', () => {
  assert.equal(parseTimetable(html, { ...request, to: 'Phuket', toPlaceId: 'geonames:1151254' }, now).status, 'unmatched')
  assert.throws(() => parseTimetable('<h1>Human verification</h1>', request, now))
  assert.throws(() => parseTimetable(html + html, request, now), /Ambiguous/)
})

test('malformed/mismatched affiliate URLs or non-CHF prices never become empty or clickable results', () => {
  for (const bad of ['https://evil.test/de/travel/bangkok/koh-chang?z=17323861&curr=CHF', 'javascript:alert(1)', 'https://12go.asia/de/travel/bangkok/koh-chang?z=999&curr=CHF']) {
    assert.throws(() => parseTimetable(html.replaceAll('https://12go.asia/de/travel/bangkok/koh-chang?z=17323861&curr=CHF', bad), request, now))
  }
  assert.throws(() => parseTimetable(html.replace('Fr. 18.32', '$18.32'), request, now))
  assert.throws(() => parseTimetable(html.replace('05:30', '29:30'), request, now), /Invalid departure/)
  assert.throws(() => parseTimetable(html.replace('/de/bus/bangkok/koh-chang?', '/de/bus/bangkok/trat?'), request, now))
  for (const url of ['https://12go.asia.evil.test/de/travel/bangkok/koh-chang?z=17323861&curr=CHF', 'https://user@12go.asia/de/travel/bangkok/koh-chang?z=17323861&curr=CHF', 'https://12go.asia/de/travel/bangkok/koh-chang?z=17323861&curr=CHF&z=7', 'https://12go.asia/de/travel/bangkok/koh-chang?z=17323861&curr=CHF#evil']) assert.equal(timetableLink(url), null)
})

test('scripts and styles never reach native output; reverse direction is excluded', () => {
  const altered = html.replace('Minibus + ferry</span>', 'Minibus + ferry<script>window.secret()</script></span>')
  assert.doesNotMatch(JSON.stringify(parseTimetable(altered, request, now)), /window.secret|<script/)
  assert.equal(parseTimetable(html, { ...request, from: 'Koh Chang', to: 'Bangkok', fromPlaceId: request.toPlaceId, toPlaceId: request.fromPlaceId }, now).status, 'unmatched')
})

test('URL construction is fixed-host and rejects arbitrary input, same place and extra personal fields', () => {
  assert.equal(timetableQuelle(request), 'https://12go.asia/de/timetable/TH/bangkok/koh-chang?embedded&css=yes&z=17323861&noreturn&lang=de&currency=CHF')
  for (const value of [{ ...request, from: '../../admin' }, { ...request, country: 'XX' }, { ...request, from: 'Ko Chang', to: 'Koh Chang' }, { ...request, email: 'person@example.test' }, { ...request, date: '2026-11-15' }]) assert.equal(timetableAnfrageSchema.safeParse(value).success, false)
})

test('Production is always closed, preview requires explicit flag', () => {
  assert.equal(timetableAktiv({ NODE_ENV: 'production', VERCEL_ENV: 'production', TWELVE_GO_TIMETABLE_ENABLED: 'true' }), false)
  assert.equal(timetableAktiv({ NODE_ENV: 'production', VERCEL_ENV: 'preview', TWELVE_GO_TIMETABLE_ENABLED: 'true' }), true)
  assert.equal(timetableAktiv({ NODE_ENV: 'test' }), false)
})

test('verified region identity: same-named island in Ranong, unknown IDs and wrong countries cannot use Trat data', () => {
  for (const bad of [
    { ...request, toPlaceId: 'geonames:1153735' }, // Real Ko Chang in Ranong, not Trat.
    { ...request, toPlaceId: 'geonames:9999999' },
    { ...request, country: 'MY' as const },
    { ...request, fromPlaceId: request.toPlaceId },
    { ...request, from: 'Phuket' },
  ]) {
    assert.equal(timetableAnfrageSchema.safeParse(bad).success, false)
    assert.throws(() => parseTimetable(html, bad, now))
    assert.throws(() => timetableQuelle(bad))
  }
})

test('server deduplicates simultaneous requests, caches for one hour and refreshes after expiry', async () => {
  let calls = 0, clock = Date.parse(now)
  const load = createTimetableService(async (_url, init) => {
    calls++
    assert.equal(init?.redirect, 'error')
    assert.equal(init?.cache, 'no-store')
    assert.ok(init?.signal)
    return response()
  }, () => clock)
  const results = await Promise.all([load(request), load(request), load(request)])
  assert.equal(calls, 1)
  assert.equal(results[0]!.fetchedAt, now)
  await load(request)
  assert.equal(calls, 1)
  clock += 3600001
  await load(request)
  assert.equal(calls, 2)
})

test('bad provider responses are never cached as no connections', async () => {
  for (const bad of [() => new Response('no', { status: 403 }), () => new Response('oops', { headers: { 'content-type': 'text/html' } }), () => new Response(html, { headers: { 'content-type': 'text/plain' } }), () => new Response('a'.repeat(262145), { headers: { 'content-type': 'text/html' } }), () => new Response(html, { headers: { 'content-type': 'text/html', 'content-length': '999999' } })]) {
    let calls = 0
    const load = createTimetableService(async () => { calls++; return bad() })
    await assert.rejects(load(request))
    await assert.rejects(load(request))
    assert.equal(calls, 2)
  }
})

test('provider timeout aborts the real fetch signal', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let aborted = false
  const load = createTimetableService(async (_url, init) => new Promise<Response>((_resolve, reject) => {
    init!.signal!.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) })
  }))
  const pending = assert.rejects(load(request))
  t.mock.timers.tick(8000)
  await pending
  assert.equal(aborted, true)
})

function req(body: unknown = request, headers: Record<string, string> = {}) {
  return new Request('https://preview.example/api/mobility/twelve-go-timetable', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
}
test('HTTP guard: closed, cross-site, oversized, malformed, provider failure, rate limit and no-store', async () => {
  let calls = 0
  const load = async () => { calls++; return result() }
  const off = createTimetableHandler(load, () => false)
  assert.equal((await off(req())).status, 503)
  assert.equal(calls, 0)
  const on = createTimetableHandler(load, () => true)
  assert.equal((await on(req(request, { origin: 'https://other.example' }))).status, 403)
  assert.equal((await on(req(request, { 'content-type': 'text/plain' }))).status, 415)
  assert.equal((await on(req('x'.repeat(1025)))).status, 413)
  assert.equal((await on(req({ ...request, to: null }))).status, 400)
  assert.equal((await on(req({ ...request, toPlaceId: 'geonames:1153735' }))).status, 400)
  assert.equal((await on(req({ ...request, country: 'MY' }))).status, 400)
  assert.equal(calls, 0)
  const ok = await on(req())
  assert.equal(ok.status, 200)
  assert.equal(ok.headers.get('cache-control'), 'private, no-store')
  assert.equal((await ok.json()).status, 'ready')
  const failure = createTimetableHandler(async () => { throw new Error('private raw error') }, () => true)
  const failed = await failure(req())
  assert.equal(failed.status, 503)
  assert.doesNotMatch(await failed.text(), /private raw/)
  const limited = createTimetableHandler(load, () => true)
  for (let i = 0; i < 12; i++) assert.equal((await limited(req())).status, 200)
  assert.equal((await limited(req())).status, 429)
})
