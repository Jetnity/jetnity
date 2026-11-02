import { test } from 'node:test'
import assert from 'node:assert/strict'
import { discoverCarsUrl, OFFER_LIFETIME_MS, offersForView, requestInput, searchInput } from './contract'
import { createRentalSearch, readOfferToken, rentalAccess, RentalSearchError } from './server'
import { discoverCarsRequest } from './route'

const KEY = 'test-only-discovercars-secret-not-a-real-key'
const station = { id: 8054, name: 'Flughafen Bangkok (BKK)', country: 'Thailand', region: 'Bangkok', type: 'airport' }
const search = searchInput.parse({ pickup: station, dropoff: null, pickupDate: '2026-11-16', pickupTime: '10:30', dropoffDate: '2026-11-23', dropoffTime: '12:15', age: 35, residence: 'CH', currency: 'CHF' })
// Synthetic contract fixture shaped after the approved live search, never customer data.
const offer = {
  offer_id: 'fixture-offer-1', car: { name: 'Toyota Yaris', category: 'small', transmission: 'automatic', seats: 5, bags: 1, image: 'https://www.discovercars.com/images/car/5/140.png' },
  price: { total: 116.8, currency: 'CHF', pay_now: 116.8, pay_later: 0 },
  supplier: { name: 'Example supplier', rating: 8.89, review_count: 175 },
  deposit: { min: 244.59, max: 244.59, currency: 'CHF' }, mileage: { unlimited: true },
  cancellation: { type: 'free', details: { hours_before_pickup: 48 } },
  pickup: { location: 'Bangkok Airport', address: 'Test address', phone: 'PRIVATE', email: 'PRIVATE' },
  url: { web: 'https://www.discovercars.com/offer/fixture-offer-1?utm_source=jetnity&a_aid=jetnity&search=%7B%22test%22%3Atrue%7D', rental_conditions: 'https://www.discovercars.com/offer/rental-conditions/fixture-offer-1' },
  private_metadata: 'DO NOT FORWARD',
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'content-type': 'application/json' } })
const mockFetch = (fn: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>) => fn as typeof fetch
const rejection = (status: number, kind: string) => (e: unknown) => e instanceof RentalSearchError && e.status === status && e.kind === kind

test('explicit gate and server secret both required', () => {
  assert.equal(rentalAccess({}), null)
  assert.equal(rentalAccess({ DISCOVERCARS_API_KEY: KEY }), null)
  assert.equal(rentalAccess({ JETNITY_DISCOVERCARS_SEARCH_ENABLED: '1', DISCOVERCARS_API_KEY: 'short' }), null)
  assert.equal(rentalAccess({ JETNITY_DISCOVERCARS_SEARCH_ENABLED: '1', DISCOVERCARS_API_KEY: KEY }), KEY)
})
test('calendar, station, driver and bounded request validation', () => {
  for (const patch of [{ pickupDate: '2026-02-30' }, { pickupTime: '25:30' }, { age: 0 }, { residence: 'ZZ' }, { currency: 'xxx' }, { dropoffDate: '2026-11-15' }, { pickup: { ...station, id: -1 } }, { customer: 'private' }]) {
    assert.equal(searchInput.safeParse({ ...search, ...patch }).success, false, JSON.stringify(patch))
  }
  assert.equal(requestInput.safeParse({ action: 'detail', offerId: 'arbitrary' }).success, false)
  assert.equal(requestInput.safeParse({ action: 'locations', term: 'x' }).success, false)
})
test('only approved provider offer/image URLs; exact affiliate URL preserved', () => {
  assert.equal(discoverCarsUrl(offer.url.web, 'offer'), offer.url.web)
  for (const url of ['javascript:alert(1)', 'http://www.discovercars.com/offer/id', 'https://discovercars.com.evil.test/offer/id', 'https://evil.test/offer/id', 'https://user@discovercars.com/offer/id', 'https://discovercars.com:444/offer/id', 'https://www.discovercars.com/v1/bookings']) assert.equal(discoverCarsUrl(url, 'offer'), null)
  assert.equal(discoverCarsUrl('https://www.discovercars.com/images/car/5/140.png', 'image'), offer.car.image)
  assert.equal(discoverCarsUrl('https://www.discovercars.com/account', 'image'), null)
})
test('search sends local times, explicit station IDs and minimum data, with Bearer only server-side', async () => {
  const calls: { url: string; init?: RequestInit }[] = []
  const api = createRentalSearch(KEY, mockFetch((url, init) => { calls.push({ url: String(url), init }); return json([offer], 201) }), () => 1000)
  const result = await api.search({ ...search, dropoff: { ...station, id: 8051 } })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://demandapi.discovercars.com/v1/offers')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { driver: { residence: 'CH', age: 35 }, currency: 'CHF', pickup_at: '2026-11-16T10:30:00', pickup_location: { location_id: 8054 }, dropoff_at: '2026-11-23T12:15:00', dropoff_location: { location_id: 8051 }, parameters: { show_extras: true } })
  assert.equal(new Headers(calls[0].init?.headers).get('Authorization'), `Bearer ${KEY}`)
  assert.equal(calls[0].init?.redirect, 'manual')
  assert.equal(result.expiresAt, 1000 + OFFER_LIFETIME_MS)
  assert.equal(result.offers[0].url.web, offer.url.web)
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false)
  assert.equal(JSON.stringify(result).includes('DO NOT FORWARD'), false)
  assert.equal(JSON.stringify(result).includes(KEY), false)
})
test('locations distinguish real empty response, invalid response and real selectable stations', async () => {
  const location = { location_id: 8054, place: station.name, country: 'Thailand', region: 'Bangkok', type: 'airport' }
  let data: unknown = [location]
  const api = createRentalSearch(KEY, mockFetch(url => { assert.match(String(url), /term=Bangkok&locale=de-DE/); return json(data) }))
  assert.deepEqual(await api.locations('Bangkok'), [station])
  data = []; assert.deepEqual(await api.locations('Bangkok'), [])
  data = [{ place: 'no confirmed ID' }]; await assert.rejects(api.locations('Bangkok'), rejection(502, 'error'))
  data = { message: 'broken' }; await assert.rejects(api.locations('Bangkok'), rejection(502, 'error'))
})
test('empty results are not conflated with malformed, wrong currency or provider errors', async () => {
  let data: unknown = []
  const api = createRentalSearch(KEY, mockFetch(() => json(data)))
  assert.equal((await api.search(search)).offers.length, 0)
  for (const invalid of [[{}], [{ ...offer, price: { ...offer.price, currency: 'EUR' } }], { offers: [] }]) {
    data = invalid; await assert.rejects(api.search(search), rejection(502, 'error'))
  }
  data = [offer, {}, offer]
  const partial = await api.search(search)
  assert.equal(partial.offers.length, 1); assert.equal(partial.omitted, 2)
  for (const status of [400, 401, 403, 404, 429, 500]) {
    let calls = 0
    const failing = createRentalSearch(KEY, mockFetch(() => { calls++; return json({ secret: KEY }, status) }))
    await assert.rejects(failing.search(search), e => e instanceof RentalSearchError && !e.message.includes(KEY))
    assert.equal(calls, 1, 'never retry authentication or amplify quota failures')
  }
  const rateLimited = createRentalSearch(KEY, mockFetch(() => json({}, 429)))
  await assert.rejects(rateLimited.search(search), rejection(429, 'rate_limited'))
})
test('signed detail capability expires, rejects tampering and never extends search lifetime', async () => {
  let time = 1000; let calls = 0; let detail = offer
  const api = createRentalSearch(KEY, mockFetch((url) => { calls++; return json(String(url).endsWith('/v1/offers') ? [offer] : detail) }), () => time)
  const result = await api.search(search); const token = result.offers[0].token
  assert.equal(readOfferToken(token, KEY, time)?.offerId, offer.offer_id)
  assert.equal(readOfferToken(token, 'different key', time), null)
  assert.equal(readOfferToken(`${token}x`, KEY, time), null)
  const valid = await api.detail(token)
  assert.equal(valid.expiresAt, result.expiresAt)
  assert.equal(valid.offer.url.web, offer.url.web)
  detail = { ...offer, offer_id: 'wrong' }
  await assert.rejects(api.detail(token), rejection(502, 'error'))
  detail = { ...offer, price: { ...offer.price, currency: 'EUR' } }
  await assert.rejects(api.detail(token), rejection(502, 'error'))
  const before = calls; time = result.expiresAt
  await assert.rejects(api.detail(token), rejection(410, 'expired'))
  assert.equal(calls, before)
})
test('filter and compare ordering preserves source offers', async () => {
  const api = createRentalSearch(KEY, mockFetch(() => json([offer, { ...offer, offer_id: 'fixture-2', car: { ...offer.car, transmission: 'manual' }, price: { ...offer.price, total: 90 }, supplier: { name: 'Second', rating: 9.5 } }])))
  const { offers } = await api.search(search)
  assert.equal(offersForView(offers, 'manual', 'small', 'price').length, 1)
  assert.equal(offersForView(offers, '', '', 'price')[0].price.total, 90)
  assert.equal(offersForView(offers, '', '', 'rating')[0].supplier?.rating, 9.5)
  assert.equal(offers[0].price.total, 116.8)
})
test('route is fail-closed, same-origin, bounded, no-store and rejects malformed inputs before fetch', async () => {
  const oldKey = process.env.DISCOVERCARS_API_KEY; const oldFlag = process.env.JETNITY_DISCOVERCARS_SEARCH_ENABLED
  const req = (body: unknown, headers: Record<string, string> = {}) => new Request('https://jetnity.com/api/rental-cars/discovercars', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  try {
    delete process.env.JETNITY_DISCOVERCARS_SEARCH_ENABLED
    assert.equal((await discoverCarsRequest(req({ action: 'locations', term: 'Bangkok' }))).status, 503)
    process.env.DISCOVERCARS_API_KEY = KEY; process.env.JETNITY_DISCOVERCARS_SEARCH_ENABLED = '1'
    const cross = await discoverCarsRequest(req({ action: 'locations', term: 'Bangkok' }, { origin: 'https://evil.test' }))
    assert.equal(cross.status, 403); assert.match(cross.headers.get('cache-control') ?? '', /no-store/)
    assert.equal((await discoverCarsRequest(req({ action: 'search', search: {} }))).status, 400)
    assert.equal((await discoverCarsRequest(req({ action: 'locations', term: 'Bangkok' }, { 'Content-Length': '999999' }))).status, 413)
    assert.equal((await discoverCarsRequest(req({ action: 'locations', term: 'Bangkok' }, { 'Content-Type': 'text/plain' }))).status, 415)
    assert.equal((await discoverCarsRequest(req({ action: 'detail', token: 'invalid-but-long-enough-token' }))).status, 410)
  } finally {
    if (oldKey == null) delete process.env.DISCOVERCARS_API_KEY; else process.env.DISCOVERCARS_API_KEY = oldKey
    if (oldFlag == null) delete process.env.JETNITY_DISCOVERCARS_SEARCH_ENABLED; else process.env.JETNITY_DISCOVERCARS_SEARCH_ENABLED = oldFlag
  }
})
