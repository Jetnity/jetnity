import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'
import * as plan from './plan'
import type * as Actions from './plan-actions'

const require = createRequire(import.meta.url)
const USER = '10000000-0000-4000-a000-000000000001'
const TRIP = '10000000-0000-4000-a000-000000000002'
const DAY = '10000000-0000-4000-a000-000000000003'
const OFFER = '10000000-0000-4000-a000-000000000004'
const input = { offerId: OFFER, tripId: TRIP, dayId: DAY, timing: { starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: null, ends_at: null } }

function fixture(options: { authenticated?: boolean; ownOffer?: boolean; readbackBroken?: boolean } = {}) {
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
          if (table === 'saved_offers') return { data: options.ownOffer === false ? null : { id: OFFER, category: 'stay', title: 'Hotel Paris', url: 'https://www.booking.com/hotel/fr/example.html', start_timezone: null, end_timezone: null, destination: 'Paris', starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: null, ends_at: null }, error: null }
          if (table === 'trip_days') return { data: { id: DAY, day_date: '2026-11-20', stage_id: null }, error: null }
          return { data: options.readbackBroken ? null : stored, error: null }
        },
      }
      return query
    },
  }
  const code = ts.transpileModule(readFileSync(new URL('./plan-actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const loaded = { exports: {} }
  const dependencies: Record<string, unknown> = { './plan': plan, '@/lib/supabase/server': { createServerActionClient: async () => db }, 'next/cache': { revalidatePath: (path: string) => refreshed.push(path) } }
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
  assert.deepEqual(first, { ok: true, value: `/reisen/${TRIP}?ansicht=reiseplan` })
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
