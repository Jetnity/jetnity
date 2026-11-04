import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { kayakSearchSchema, normalizePreview, safeHotelImage, validSearchDates, type KayakSearch } from './contract'
import { buildSearch, KayakFailure, searchKayak } from './server'
import { kayakPreviewRequest } from './route'

const hotel: KayakSearch = { kind: 'hotels', adults: 3, rooms: 2, latitude: 13.75, longitude: 100.5, checkIn: '2026-12-10', checkOut: '2026-12-12' }
const flight: KayakSearch = { kind: 'flights', adults: 1, origin: 'ZRH', destination: 'BKK', departure: '2026-12-10', returnDate: '2026-12-20', cabin: 'economy' }
const options = { key: 'test-secret', clientIp: '192.0.2.10', userTrackId: 'e00b275a-6222-40b5-aa33-5d45de64e551', allowRequest: async () => true, pause: async () => {} }
const sample = () => ({ status: 'complete', currency: 'USD', priceMode: 'perPerson', results: [{ legs: [{ id: 'out' }, { id: 'in' }], bookingOptions: [{ displayPrice: { price: 200 }, url: 'https://example.com/?apiKey=test-secret' }] }], legs: { out: { departureTime: '2026-12-10T22:00', arrivalTime: '2026-12-11T14:00', duration: 600, segments: [{ id: 's1' }] }, in: { departureTime: '2026-12-20T22:00', arrivalTime: '2026-12-21T06:00', duration: 600, segments: [{ id: 's2' }] } }, segments: { s1: { origin: 'ZRH', destination: 'BKK', airline: 'LX' }, s2: { origin: 'BKK', destination: 'ZRH', airline: 'LX' } }, airlines: { LX: { displayName: 'SWISS' } } })

test('rejects invalid dates, unknown fields, identical airports and impossible occupancy', () => {
  assert.equal(kayakSearchSchema.safeParse({ ...hotel, checkIn: '2026-02-30' }).success, false)
  assert.equal(kayakSearchSchema.safeParse({ ...flight, providerUrl: 'https://attacker.example' }).success, false)
  const now = new Date('2026-11-04T00:00Z')
  assert.equal(validSearchDates(hotel, now), true)
  assert.equal(validSearchDates({ ...hotel, rooms: 4 }, now), false)
  assert.equal(validSearchDates({ ...hotel, checkOut: '2027-02-01' }, now), false)
  assert.equal(validSearchDates({ ...flight, destination: 'ZRH' }, now), false)
  assert.equal(validSearchDates({ ...flight, returnDate: '2026-12-01' }, now), false)
})

test('builds genuine hotel coordinates, room occupancy and roundtrip airport legs', () => {
  const hotels = buildSearch(hotel)
  assert.equal(hotels.query.destination, 'klatlon:13.75,100.5')
  assert.equal(hotels.query.rooms, '2|1')
  const flights = buildSearch(flight).body as { searchStartParameters: { legs: unknown[] } }
  assert.equal(flights.searchStartParameters.legs.length, 2)
})

test('projects safe examples without provider credentials or booking links', () => {
  const normalized = normalizePreview('flights', sample())
  assert.equal(normalized.flights[0].legs.length, 2)
  assert.equal(normalized.flights[0].priceMode, 'perPerson')
  assert.equal(JSON.stringify(normalized).includes('test-secret'), false)
  assert.equal(normalized.mode, 'sandbox')
  assert.equal(safeHotelImage('https://www.kayak.com/h/run/api/image?url=%2Fhimg%2Fabc.jpg&maxwidth=400') !== null, true)
  assert.equal(safeHotelImage('https://www.kayak.com/h/run/api/image?apiKey=test-secret'), null)
  assert.equal(safeHotelImage('https://www.kayak.com/h/run/api/image?url=https://attacker.example/'), null)
  assert.equal(safeHotelImage('https://attacker.example/img/a.jpg'), null)
})

test('malformed or incomplete flight references cannot become a partial roundtrip', () => {
  const raw = sample()
  raw.results[0].legs.push({ id: 'missing' })
  assert.throws(() => normalizePreview('flights', raw), /invalid_response/)
  assert.throws(() => normalizePreview('hotels', { isComplete: true }), /invalid_response/)
  assert.throws(() => normalizePreview('hotels', { isComplete: true, results: [null] }), /invalid_response/)
  assert.deepEqual(normalizePreview('hotels', { isComplete: true, results: [] }).hotels, [])
})

test('flight polling preserves cookies and search ID while projecting only safe fields', async () => {
  const calls: { url: URL; init: RequestInit }[] = []
  const result = await searchKayak(flight, { ...options, fetcher: async (url, init) => {
    calls.push({ url: new URL(String(url)), init: init! })
    return calls.length === 1 ? Response.json({ status: 'first-phase', searchId: 'search_123', cluster: 4 }, { headers: { 'set-cookie': 'search-cookie=value; Secure; HttpOnly' } }) : Response.json(sample())
  } })
  assert.equal(result.complete, true)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].url.origin, 'https://sandbox-en-us.kayakaffiliates.com')
  assert.deepEqual(JSON.parse(calls[1].init.body as string), { searchId: 'search_123' })
  assert.equal(new Headers(calls[1].init.headers).get('cookie'), 'search-cookie=value')
  assert.equal(calls[1].init.redirect, 'manual')
  assert.equal(JSON.stringify(result).includes('search-cookie'), false)
})

test('caps incomplete searches at three upstream calls and respects quota refusal', async () => {
  let count = 0
  const result = await searchKayak(hotel, { ...options, fetcher: async () => { count++; return Response.json({ isComplete: false, results: [] }) } })
  assert.equal(count, 3)
  assert.equal(result.complete, false)
  await assert.rejects(searchKayak(hotel, { ...options, allowRequest: async () => false, fetcher: async () => { throw new Error('must not call') } }), (error: unknown) => error instanceof KayakFailure && error.status === 429)
})

test('blocks redirects, oversized content and malformed provider bodies without leaking payloads', async () => {
  for (const response of [new Response(null, { status: 302, headers: { location: 'https://attacker.example/' } }), new Response('secret', { headers: { 'content-length': String(9 * 1024 * 1024) } }), new Response('test-secret')]) {
    await assert.rejects(searchKayak(hotel, { ...options, fetcher: async () => response }), (error: unknown) => error instanceof KayakFailure && error.status === 502 && !error.message.includes('test-secret'))
  }
})

test('HTTP boundary rejects cross-site, oversized and invalid searches; success stays private', async () => {
  const saved = { enabled: process.env.KAYAK_SANDBOX_ENABLED, key: process.env.KAYAK_SANDBOX_API_KEY, ip: process.env.KAYAK_LOCAL_TEST_IP, vercel: process.env.VERCEL, fetch: globalThis.fetch }
  process.env.KAYAK_SANDBOX_ENABLED = 'true'; process.env.KAYAK_SANDBOX_API_KEY = options.key; process.env.KAYAK_LOCAL_TEST_IP = options.clientIp; delete process.env.VERCEL
  const request = (body: unknown, headers: Record<string, string> = {}) => new NextRequest('http://localhost/api/kayak/preview', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  try {
    globalThis.fetch = async () => Response.json({ isComplete: true, results: [], currencyCode: 'USD' })
    assert.equal((await kayakPreviewRequest(request(hotel, { origin: 'https://attacker.example' }))).status, 403)
    assert.equal((await kayakPreviewRequest(request(hotel, { 'content-length': '5000' }))).status, 413)
    assert.equal((await kayakPreviewRequest(request({ ...hotel, privateTripId: 'unexpected' }))).status, 400)
    const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
    const checkout = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10)
    const success = await kayakPreviewRequest(request({ ...hotel, checkIn: future, checkOut: checkout }))
    assert.equal(success.status, 200)
    assert.match(success.headers.get('cache-control')!, /no-store/)
    assert.match(success.headers.get('set-cookie')!, /HttpOnly/i)
    assert.equal((await success.json()).mode, 'sandbox')
    process.env.KAYAK_SANDBOX_ENABLED = 'false'
    assert.equal((await kayakPreviewRequest(request(hotel))).status, 503)
  } finally {
    for (const [name, value] of Object.entries({ KAYAK_SANDBOX_ENABLED: saved.enabled, KAYAK_SANDBOX_API_KEY: saved.key, KAYAK_LOCAL_TEST_IP: saved.ip, VERCEL: saved.vercel })) { if (value === undefined) delete process.env[name]; else process.env[name] = value }
    globalThis.fetch = saved.fetch
  }
})
