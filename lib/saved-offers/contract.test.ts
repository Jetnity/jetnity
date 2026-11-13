import { test } from 'node:test'
import assert from 'node:assert/strict'
import { offerInput, safeOfferUrl, suggestedDay, type SavedOffer } from './contract'
import { savedOfferPlanValues } from './plan'

const input = { category: 'stay' as const, title: 'Hotel Paris', url: 'https://www.booking.com/hotel/fr/example.html', destination: 'Paris', starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: null, ends_at: null, start_timezone: null, end_timezone: null }
const saved: SavedOffer = { ...input, id: '00000000-0000-4000-a000-000000000001', user_id: '00000000-0000-4000-a000-000000000002', provider: 'booking.com', offer_ref: 'test', source: 'manual', expires_at: null, created_at: '2026-11-13T00:00:00Z' }

test('personal references reject executable URLs, credentials, tokens and general searches', () => {
  for (const url of ['javascript:alert(1)', 'http://booking.com/hotel/fr/x.html', 'https://me:password@booking.com/hotel/x', 'https://booking.com/', 'https://booking.com/searchresults.html?ss=Paris', 'https://booking.com/hotel/x?access_token=secret', 'https://127.0.0.1/offer/x', 'https://booking.com\\@evil.com/offer/x']) assert.equal(safeOfferUrl(url), null, url)
  assert.equal(safeOfferUrl(input.url + '#map'), input.url)
})

test('manual save rejects authority, owner, booking and price fields supplied by a client', () => {
  for (const field of ['user_id', 'source', 'booking_status', 'price', 'token']) assert.equal(offerInput.safeParse({ ...input, [field]: 'forged' }).success, false, field)
  assert.equal(offerInput.safeParse(input).success, true)
})

test('dates and times must exist; empty facts stay unknown', () => {
  assert.equal(offerInput.safeParse({ ...input, starts_on: '2026-02-30' }).success, false)
  assert.equal(offerInput.safeParse({ ...input, ends_on: input.starts_on }).success, false)
  assert.equal(offerInput.safeParse({ ...input, starts_at: '25:00' }).success, false)
  assert.equal(offerInput.safeParse({ ...input, starts_on: null, starts_at: '10:00' }).success, false)
  assert.equal(offerInput.safeParse({ ...input, start_timezone: 'Mars/Unknown' }).success, false)
  assert.equal(offerInput.parse({ ...input, starts_on: null, ends_on: null }).starts_on, null)
})

test('five hotel nights preserve checkout and cannot become confirmed booking', () => {
  const p = savedOfferPlanValues(saved, {}, '2026-11-20')
  assert.equal((Date.parse(p.ends_on!) - Date.parse(p.starts_on!)) / 86400000, 5)
  assert.equal(p.booking_status, 'unconfirmed')
  assert.equal(p.booking_source, null)
  assert.equal(p.provider, null)
  assert.equal(p.booking_url, null)
  assert.throws(() => savedOfferPlanValues({ ...saved, ends_on: null }, {}, '2026-11-20'), /Check-in und Check-out/)
  assert.throws(() => savedOfferPlanValues({ ...saved, starts_on: null }, {}, '2026-11-25'), /Check-out/)
})

test('overnight flight preserves next day arrival; unsupported dateline route stops explicitly', () => {
  const flight = { ...saved, category: 'flight', starts_at: '23:30', ends_on: '2026-11-21', ends_at: '01:00' }
  const p = savedOfferPlanValues(flight, {}, '2026-11-20')
  assert.equal(p.ends_on, '2026-11-21')
  assert.equal(p.ends_at, '01:00')
  assert.throws(() => savedOfferPlanValues({ ...flight, ends_on: '2026-11-19' }, {}, '2026-11-20'), /vollständige Flugroute/)
  assert.throws(() => savedOfferPlanValues(flight, {}, '2026-11-21'), /Abflugtag/)
})

test('day suggestion never guesses among repeated destinations or missing dates', () => {
  const stages = [{ id: 'paris', name: 'Paris' }, { id: 'berlin', name: 'Berlin' }]
  const days = [{ id: 'a', dayDate: '2026-11-20', stageId: 'paris' }, { id: 'b', dayDate: '2026-11-20', stageId: 'berlin' }]
  assert.equal(suggestedDay(saved, days, stages), 'a')
  assert.equal(suggestedDay({ ...saved, destination: null }, days, stages), '')
  assert.equal(suggestedDay(saved, [...days, { ...days[0], id: 'c' }], stages), '')
  assert.equal(suggestedDay({ ...saved, starts_on: null }, days, stages), '')
})
