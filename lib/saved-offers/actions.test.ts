import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'
import * as contract from './contract'
import * as reference from './reference'
import type * as Actions from './actions'

const require = createRequire(import.meta.url)
const timing = { starts_on: '2026-11-20', ends_on: '2026-11-25', starts_at: '10:00', ends_at: '10:00' }

function fixture({ authenticated = true, failed = false } = {}) {
  const reads: [string, unknown][] = []
  const db = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'owner' } : null }, error: null }) },
    from(table: string) {
      reads.push(['table', table])
      const query = {
        select: (fields: string) => { reads.push(['select', fields]); return query },
        eq: (key: string, value: unknown) => { reads.push([key, value]); return query },
        limit: async (limit: number) => {
          assert.equal(limit, 501)
          return { data: failed ? null : [{ id: 'saved-one', offer_ref: reference.offerReference('discovercars', 'car-one', timing) }, { id: 'unrelated', offer_ref: reference.offerReference('discovercars', 'car-two', { ...timing, starts_at: '12:00' }) }], error: failed ? { message: 'database failed' } : null }
        },
      }
      return query
    },
  }
  const code = ts.transpileModule(readFileSync(new URL('./actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const loaded = { exports: {} }
  const dependencies: Record<string, unknown> = { './contract': contract, './reference': reference, '@/lib/supabase/server': { createServerActionClient: async () => db }, 'next/cache': {}, '@/lib/providers/discovercars/search/server': {} }
  new Function('require', 'module', 'exports', code)((name: string) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name), loaded, loaded.exports)
  return { actions: loaded.exports as typeof Actions, reads }
}

test('rental heart readback uses exactly the saved provider reference and times, scoped to the signed-in owner', async () => {
  const f = fixture()
  const result = await f.actions.savedRentalOfferStates({ offers: ['car-one', 'car-two'], timing })
  assert.deepEqual(result, { ok: true, value: { 'car-one': 'saved-one' } })
  assert.deepEqual(f.reads, [['table', 'saved_offers'], ['select', 'id,offer_ref'], ['user_id', 'owner'], ['source', 'discovercars']])
})

test('guest, invalid input and failed read never claim an empty merkliste', async () => {
  const guest = fixture({ authenticated: false })
  assert.equal((await guest.actions.savedRentalOfferStates({ offers: ['car-one'], timing })).ok, false)
  assert.deepEqual(guest.reads, [])
  const f = fixture()
  for (const input of [{ offers: ['car-one'], timing, user_id: 'other' }, { offers: ['car-one'], timing: { ...timing, starts_at: '25:00' } }, { offers: Array(2001).fill('car'), timing }]) {
    assert.equal((await f.actions.savedRentalOfferStates(input)).ok, false)
  }
  assert.deepEqual(f.reads, [])
  const broken = fixture({ failed: true })
  assert.equal((await broken.actions.savedRentalOfferStates({ offers: ['car-one'], timing })).ok, false)
})
