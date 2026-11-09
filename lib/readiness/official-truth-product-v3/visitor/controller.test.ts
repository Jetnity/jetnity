import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { Ladung } from '@/lib/admin/ladezustand'
import type { V3VisitorInput } from '../contract'
import { createV3VisitorController, unboundV3VisitorLoad, type V3VisitorUiState } from './controller'
import type { V3VisitorView } from './presentation'

const FIRST: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
const SECOND: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['RS'] }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}
async function view(input = FIRST): Promise<Ladung<V3VisitorView>> { return unboundV3VisitorLoad(input, new AbortController().signal) }

describe('U1 UI request ordering and honest load state', () => {
  test('latest selection wins even when an older transport ignores cancellation', async () => {
    const old = deferred<Ladung<V3VisitorView>>(), next = deferred<Ladung<V3VisitorView>>()
    const changes: V3VisitorUiState[] = [], signals: AbortSignal[] = []
    const controller = createV3VisitorController((input, signal) => {
      signals.push(signal); return input.citizenshipCountryCodes[0] === 'CH' ? old.promise : next.promise
    }, (state) => changes.push(state))
    const first = controller.submit(FIRST)
    controller.invalidate()
    const second = controller.submit(SECOND)
    assert.equal(signals[0].aborted, true)
    next.resolve(await view(SECOND)); await second
    old.resolve(await view(FIRST)); await first
    const last = changes.at(-1)
    assert.equal(last?.phase, 'ready')
    if (last?.phase !== 'ready') assert.fail('expected last answer')
    assert.deepEqual(last.view.input, SECOND)
    assert.equal(changes.filter((state) => state.phase === 'ready').length, 1)
    controller.dispose()
  })
  test('editing clears the old answer immediately and blocks a later stale error', async () => {
    const pending = deferred<Ladung<V3VisitorView>>(), changes: V3VisitorUiState[] = []
    const controller = createV3VisitorController(() => pending.promise, (state) => changes.push(state))
    const running = controller.submit(FIRST)
    assert.equal(changes.at(-1)?.phase, 'loading')
    controller.invalidate()
    assert.deepEqual(changes.at(-1), { phase: 'idle', view: null, message: null })
    pending.reject(new Error('PRIVATE payload'))
    await running
    assert.equal(changes.at(-1)?.phase, 'idle')
    controller.dispose()
  })
  test('unmount cancels a pending request and produces no further state emission', async () => {
    const pending = deferred<Ladung<V3VisitorView>>(), changes: V3VisitorUiState[] = []
    let signal: AbortSignal | undefined
    const controller = createV3VisitorController((_input, current) => { signal = current; return pending.promise }, (state) => changes.push(state))
    const running = controller.submit(FIRST)
    controller.dispose()
    const length = changes.length
    assert.equal(signal?.aborted, true)
    pending.resolve(await view()); await running
    assert.equal(changes.length, length)
  })
  test('wrong-cell response and raw backend errors cannot become a visible rule', async () => {
    for (const response of [await view(SECOND), { daten: null, fehler: { meldung: 'PRIVATE sql error', wiederholbar: true } }]) {
      const changes: V3VisitorUiState[] = []
      const controller = createV3VisitorController(async () => response, (state) => changes.push(state))
      await controller.submit(FIRST)
      assert.equal(changes.at(-1)?.phase, 'error')
      assert.equal(JSON.stringify(changes).includes('PRIVATE'), false)
      controller.dispose()
    }
  })
  test('input snapshot cannot be changed by caller mutation while awaiting a response', async () => {
    const input: V3VisitorInput = { ...FIRST, citizenshipCountryCodes: ['CH'] }
    const pending = deferred<Ladung<V3VisitorView>>()
    let observed: V3VisitorInput | null = null
    const changes: V3VisitorUiState[] = []
    const controller = createV3VisitorController((snapshot) => { observed = snapshot; return pending.promise }, (state) => changes.push(state))
    const running = controller.submit(input)
    input.citizenshipCountryCodes[0] = 'RS'
    assert.deepEqual(observed, FIRST)
    assert.ok(Object.isFrozen(observed))
    pending.resolve(await view(FIRST)); await running
    assert.equal(changes.at(-1)?.phase, 'ready')
    controller.dispose()
  })
  test('closed client transport returns unavailable without any fetch or pending label', async () => {
    const loaded = await view()
    assert.equal(loaded.fehler, null)
    assert.ok(loaded.daten)
    assert.equal(loaded.daten.cells[0].results[0].status, 'unavailable')
  })
})
