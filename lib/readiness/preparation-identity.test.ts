import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import ts from 'typescript'

import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { readinessChecksAbleiten } from '@/lib/readiness/ableitung'
import { readinessItemLesen, readinessKontoEingabeSchema } from '@/lib/readiness/schema'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import type { readinessSetzen } from '@/lib/readiness/aktionen'
import type { Trip } from '@/types/trips'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
type Payload = Parameters<NonNullable<React.ComponentProps<typeof Reisevorbereitung>['onSetzen']>>[0]

// Execute the actual TS/TSX module, substituting only external runtime seams.
// No copied submit/action implementation and no live database or Next runtime.
function laden<T>(path: string, dependencies: Record<string, unknown>): T {
  const filename = resolve(root, path)
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const loaded = { exports: {} }
  const importieren = (name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name]
    return require(name.startsWith('@/') ? resolve(root, name.slice(2)) : name)
  }
  new Function('require', 'module', 'exports', code)(importieren, loaded, loaded.exports)
  return loaded.exports as T
}

type ElementProps = {
  children?: React.ReactNode
  onChange?: (event: { target: { value: string } }) => void
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>
}

function element(node: React.ReactNode, type: string): React.ReactElement<ElementProps> {
  const found: React.ReactElement<ElementProps>[] = []
  const besuchen = (children: React.ReactNode) => React.Children.forEach(children, (child) => {
    if (!React.isValidElement<ElementProps>(child)) return
    if (child.type === type) found.push(child)
    besuchen(child.props.children)
  })
  besuchen(node)
  assert.equal(found.length, 1, `exactly one ${type} in the preparation form`)
  return found[0]!
}

function formular() {
  const states: unknown[] = []
  let index = 0
  const ui = laden<{ default: typeof Reisevorbereitung }>('components/trips/Reisevorbereitung.tsx', {
    react: {
      ...React,
      useState: (initial: unknown) => {
        const slot = index++
        if (!(slot in states)) states[slot] = initial
        return [states[slot], (value: unknown) => { states[slot] = value }]
      },
    },
  })
  const payloads: Payload[] = []
  const render = () => {
    index = 0
    return ui.default({
      reise: beispielreise(),
      onSetzen: async (payload) => { payloads.push(payload); return null },
    })
  }
  return async (title: string): Promise<Payload> => {
    element(render(), 'input').props.onChange!({ target: { value: title } })
    await element(render(), 'form').props.onSubmit!({ preventDefault() {} })
    return payloads.at(-1)!
  }
}

type Row = Record<string, unknown> & { trip_id: string; client_ref: string }
const TRIP_ID = 'aaaaaaaa-0000-4000-8000-000000000099'
const TIME = '2026-10-04T20:00:00.000Z'

function kontoTest() {
  const rows: Row[] = []
  const mutations: Array<'insert' | 'update'> = []
  const reise = (): Trip => beispielreise({
    id: TRIP_ID,
    readinessItems: rows.filter(row => row.trip_id === TRIP_ID).map((row) => {
      const item = readinessItemLesen({
        id: row.id, clientRef: row.client_ref, kind: row.kind, userStatus: row.user_status,
        evidence: row.evidence, countryCode: row.country_code, tripItemId: row.trip_item_id,
        title: row.title, travellerClientRef: null, contextFingerprint: row.context_fingerprint,
        createdAt: TIME, updatedAt: TIME,
      })
      assert.ok(item)
      return item
    }),
  })
  const supabase = {
    from(table: string) {
      assert.equal(table, 'trip_readiness_items')
      return {
        async insert(row: Row) {
          assert.ok(!rows.some(existing => existing.trip_id === row.trip_id && existing.client_ref === row.client_ref))
          mutations.push('insert')
          rows.push({ ...row, id: `row-${rows.length + 1}` })
          return { error: null, status: 201 }
        },
        update(changes: Record<string, unknown>) {
          return {
            eq(tripKey: string, tripId: string) {
              assert.equal(tripKey, 'trip_id')
              return {
                async eq(refKey: string, ref: string) {
                  assert.equal(refKey, 'client_ref')
                  mutations.push('update')
                  for (const row of rows) {
                    if (row.trip_id === tripId && row.client_ref === ref) Object.assign(row, changes)
                  }
                  return { error: null, status: 200 }
                },
              }
            },
          }
        },
      }
    },
  }
  const action = laden<{ readinessSetzen: typeof readinessSetzen }>('lib/readiness/aktionen.ts', {
    'next/cache': { revalidatePath(path: string) { assert.equal(path, `/reisen/${TRIP_ID}`) } },
    '@/lib/trips/anlegen': { konto: async () => ({ benutzerId: 'test-owner', supabase }) },
    '@/lib/trips/daten': { reiseLaden: async () => ({ problem: null, zeilen: [reise()] }) },
  })
  return { rows, mutations, setzen: (payload: Payload) => action.readinessSetzen({ ...payload, tripId: TRIP_ID }) }
}

const titlePairs = [
  ['B02', 'Versicherung für den Urlaub rechtzeitig prüfen: Person A', 'Versicherung für den Urlaub rechtzeitig prüfen: Person B'],
  ['identischer Titel', 'Reiseadapter einpacken', 'Reiseadapter einpacken'],
  ['80 Zeichen', `${'a'.repeat(79)}A`, `${'a'.repeat(79)}B`],
  ['Case/Whitespace', '  Reiseadapter einpacken  ', 'reiseadapter EINPACKEN'],
  ['Whitespace', ' Reiseadapter einpacken ', 'Reiseadapter einpacken'],
] as const

describe('Preparation identity — real form submissions and account action', () => {
  for (const [name, a, b] of titlePairs) {
    test(`${name}: separate submissions remain separate account rows; exact retry/update preserves sibling`, async () => {
      const submit = formular()
      const account = kontoTest()
      const payloadA = await submit(a)
      const payloadB = await submit(b)
      assert.notEqual(payloadA.clientRef, payloadB.clientRef)
      assert.equal(payloadA.title, a)
      assert.equal(payloadB.title, b)
      for (const payload of [payloadA, payloadB]) {
        assert.ok(payload.clientRef.length <= READINESS_GRENZEN.clientRef)
        assert.ok(readinessKontoEingabeSchema.safeParse({ ...payload, tripId: TRIP_ID }).success)
      }
      assert.equal((await account.setzen(payloadA)).ok, true)
      assert.equal((await account.setzen({ ...payloadA, userStatus: 'done' })).ok, true)
      const sibling = JSON.stringify(account.rows[0])
      assert.equal((await account.setzen(payloadB)).ok, true)
      assert.equal(account.rows.length, 2)
      assert.equal(JSON.stringify(account.rows[0]), sibling)
      assert.equal((await account.setzen(payloadB)).ok, true)
      assert.equal(account.rows.length, 2)
      assert.equal(JSON.stringify(account.rows[0]), sibling)
      assert.equal((await account.setzen({ ...payloadB, title: a, userStatus: 'skipped' })).ok, true)
      assert.equal(account.rows.length, 2)
      assert.equal(JSON.stringify(account.rows[0]), sibling)
      assert.equal(account.rows[1]?.title, a.trim())
      assert.equal(account.rows[1]?.user_status, 'skipped')
      assert.deepEqual(account.mutations, ['insert', 'update', 'insert', 'update', 'update'])
    })
  }

  test('account rejects missing identity, invalid titles and oversize refs before transport', async () => {
    const submit = formular()
    const account = kontoTest()
    const payload = await submit('Reiseadapter einpacken')
    for (const title of ['', 'a'.repeat(81), 'Passnummer 1234567', 'https://example.test', '<b>Text</b>']) {
      assert.equal((await account.setzen({ ...payload, title })).ok, false)
    }
    assert.equal((await account.setzen({ ...payload, clientRef: 'x'.repeat(65) })).ok, false)
    assert.equal(readinessKontoEingabeSchema.safeParse({ ...payload, clientRef: undefined, tripId: TRIP_ID }).success, false)
    assert.equal(account.mutations.length, 0)
  })

  test('account limit still rejects a new point and allows exact-id updates; evidence remains user', async () => {
    const submit = formular()
    const account = kontoTest()
    const payload = await submit('Reiseadapter einpacken')
    for (let i = 0; i < READINESS_GRENZEN.itemsJeReise; i++) {
      assert.equal((await account.setzen({ ...payload, clientRef: `existing-${i}` })).ok, true)
    }
    assert.equal((await account.setzen(await submit('Reiseadapter einpacken'))).ok, false)
    const forged = { ...payload, clientRef: 'existing-0', userStatus: 'done' as const, evidence: 'official' }
    assert.equal((await account.setzen(forged)).ok, true)
    assert.equal(account.rows.length, READINESS_GRENZEN.itemsJeReise)
    assert.equal(account.rows[0]?.evidence, 'user')
  })

  test('derived identities keep their exact deterministic format', () => {
    const trip = beispielreise({ travellers: 1, party: [] })
    const refs = readinessChecksAbleiten(trip).map(item => item.clientRef)
    assert.deepEqual(refs, [
      'entry_check:IT:traveller:1', 'visa_check:IT:traveller:1',
      'travel_document_check:IT:traveller:1', 'insurance_check:trip',
    ])
    assert.deepEqual(readinessChecksAbleiten(trip).map(item => item.clientRef), refs)
  })
})
