import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'
import * as plan from './plan'
import type * as Actions from './plan-actions'
import { modusAusQuery } from '../trips/workspace-mode'
import * as flight from '../trips/flug-manuell'
import { flugRouteManuellSchema } from '../trips/schema'
import { TEST_FLUGHAFEN_REFS } from '../route/fixtures'

const require = createRequire(import.meta.url)
const USER = '10000000-0000-4000-a000-000000000001'
const TRIP = '10000000-0000-4000-a000-000000000002'
const DAY = '10000000-0000-4000-a000-000000000003'
const OFFER = '10000000-0000-4000-a000-000000000004'
const input = { offerId: OFFER, tripId: TRIP, dayId: DAY, timing: { starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: null, ends_at: null } }

function fixture(options: { authenticated?: boolean; ownOffer?: boolean; readbackBroken?: boolean; category?: string; unknownAirport?: boolean; routeReadbackBroken?: boolean } = {}) {
  const refreshed: string[] = []
  const queries: { table: string; filters: [string, unknown][] }[] = []
  let stored: Record<string, unknown> | null = null
  const db = {
    auth: { getUser: async () => ({ data: { user: options.authenticated === false ? null : { id: USER } }, error: null }) },
    from(table: string) {
      const op = { table, filters: [] as [string, unknown][] }
      queries.push(op)
      let payload: Record<string, unknown> | null = null
      const query = {
        select() { return query },
        eq(key: string, value: unknown) { op.filters.push([key, value]); return query },
        order() { return query },
        async limit() { return { data: [], error: null } },
        insert(value: Record<string, unknown>) { payload = value; return query },
        async single() {
          if (stored) return { data: null, error: { code: '23505' } }
          stored = payload
          return { data: stored, error: null }
        },
        async maybeSingle() {
          assert.ok(op.filters.some(([key, value]) => key === 'user_id' && value === USER))
          if (table === 'saved_offers') return { data: options.ownOffer === false ? null : { id: OFFER, category: options.category ?? 'stay', title: 'Hotel Paris', url: 'https://www.booking.com/hotel/fr/example.html', start_timezone: null, end_timezone: null, destination: 'Paris', starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: null, ends_at: null }, error: null }
          if (table === 'trip_days') return { data: { id: DAY, day_date: '2026-11-20', stage_id: null }, error: null }
          return { data: options.readbackBroken ? null : options.routeReadbackBroken ? { ...stored, metadata: {} } : stored, error: null }
        },
      }
      return query
    },
  }
  const code = ts.transpileModule(readFileSync(new URL('./plan-actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const loaded = { exports: {} }
  const dependencies: Record<string, unknown> = { './plan': plan, '@/lib/trips/flug-manuell': flight, '@/lib/trips/schema': { flugRouteManuellSchema }, '@/lib/route/flughafen-lesen': { flughafenReferenzLesen: async () => options.unknownAirport ? {} : TEST_FLUGHAFEN_REFS }, '@/lib/supabase/server': { createServerActionClient: async () => db }, 'next/cache': { revalidatePath: (path: string) => refreshed.push(path) } }
  new Function('require', 'module', 'exports', code)((name: string) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), loaded, loaded.exports)
  return { actions: loaded.exports as typeof Actions, refreshed, queries, row: () => stored }
}

test('saved-offer plan actions reject unsigned and foreign-offer writes before insertion', async () => {
  const guest = fixture({ authenticated: false })
  assert.equal((await guest.actions.savedOfferToPlan(input)).ok, false)
  assert.equal(guest.queries.length, 0)
  const foreign = fixture({ ownOffer: false })
  assert.equal((await foreign.actions.savedOfferToPlan(input)).ok, false)
  assert.equal(foreign.row(), null)
  assert.deepEqual(foreign.refreshed, [])
})

test('verified hotel write refreshes visited routes, opens the plan and safely retries', async () => {
  const f = fixture()
  const first = await f.actions.savedOfferToPlan(input)
  assert.equal(first.ok, true)
  const destination = new URL(first.value, 'https://jetnity.test')
  assert.equal(destination.pathname, `/reisen/${TRIP}`)
  assert.equal(modusAusQuery(destination.searchParams).ansicht, 'plan')
  assert.deepEqual(f.refreshed, [`/reisen/${TRIP}`, '/reisen'])
  const row = { ...f.row() }
  assert.equal(row.ends_on, '2026-11-25')
  assert.equal(row.booking_status, 'unconfirmed')
  assert.equal(row.booking_confirmed_at, null)
  assert.deepEqual(await f.actions.savedOfferToPlan(input), first)
  assert.deepEqual(f.row(), row)
})

test('missing readback never presents an unverified write as success', async () => {
  const f = fixture({ readbackBroken: true })
  assert.equal((await f.actions.savedOfferToPlan(input)).ok, false)
  assert.ok(f.row(), 'write took place before uncertain readback')
  assert.deepEqual(f.refreshed, [])
})

test('flight route preserves a previous local arrival date without inventing negative duration or booking', async () => {
  const f = fixture({ category: 'flight' })
  const request = { ...input, timing: { starts_on: '2026-11-20', starts_at: '01:00', ends_on: '2026-11-19', ends_at: '23:00' }, directFlight: { origin: 'BKK', destination: 'ZRH', confirmed: true } }
  const result = await f.actions.savedOfferToPlan(request)
  assert.equal(result.ok, true, JSON.stringify(result))
  const row = f.row()!
  assert.equal(row.ends_on, null, 'legacy summary must not claim comparable local dates')
  const segment = (row.metadata as { routeItinerary: { legs: { segments: { arrivalDate: string; arrivalTime: string; origin: { countryCode: string } }[] }[] } }).routeItinerary.legs[0].segments[0]
  assert.equal(segment.arrivalDate, '2026-11-19')
  assert.equal(segment.arrivalTime, '23:00')
  assert.equal(segment.origin.countryCode, 'TH')
  assert.equal(row.booking_status, 'unconfirmed')
  assert.equal(row.provider, null)
  assert.deepEqual(await f.actions.savedOfferToPlan(request), result)
  assert.equal((await f.actions.savedOfferToPlan({ ...request, directFlight: { ...request.directFlight, destination: 'CDG' } })).ok, false)
})

test('route requires confirmed flight category, server airport references and verified readback', async () => {
  const request = { ...input, directFlight: { origin: 'ZRH', destination: 'CDG', confirmed: true } }
  for (const options of [{}, { category: 'flight', unknownAirport: true }]) {
    const f = fixture(options)
    assert.equal((await f.actions.savedOfferToPlan(request)).ok, false)
    assert.equal(f.row(), null)
  }
  const incomplete = fixture({ category: 'flight', routeReadbackBroken: true })
  assert.equal((await incomplete.actions.savedOfferToPlan(request)).ok, false)
  assert.deepEqual(incomplete.refreshed, [])
  const forged = fixture({ category: 'flight' })
  assert.equal((await forged.actions.savedOfferToPlan({ ...request, directFlight: { ...request.directFlight, countryCode: 'CH' } })).ok, false)
  assert.equal((await forged.actions.savedOfferToPlan({ ...request, directFlight: { ...request.directFlight, confirmed: false } })).ok, false)
  assert.equal(forged.row(), null)
})
